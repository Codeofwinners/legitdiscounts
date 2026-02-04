import { NextResponse } from "next/server";

type CompareProductInput = {
  index?: number;
  title?: string;
  price?: number | string;
  condition?: string;
};

type WebResult = {
  title: string;
  url: string;
  description: string;
  site: string;
};

type ProductResult = {
  index: number;
  originalTitle: string;
  searchQuery: string;
  refurbPrice: number | string;
  condition: string;
  webResults: WebResult[];
};

const MAX_ITEM_COUNT = 5;
const BRAVE_TIMEOUT_MS = 10_000;
const GPT_TIMEOUT_MS = 45_000;

function cleanForSearch(title: string) {
  const remove = [
    "Refurbished",
    "Excellent",
    "Very Good",
    "Good",
    "Certified",
    "Like New",
    "Open Box",
    "PRD",
    "OEM",
    "Genuine",
    "Original",
    "Grade A",
    "Grade B",
  ];
  let clean = title;
  for (const word of remove) {
    const regex = new RegExp(word, "gi");
    clean = clean.replace(regex, "");
  }
  clean = clean.replace(/[^\w\s\-\.]/gu, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  return words.slice(0, 7).join(" ");
}

async function searchBrave(query: string, apiKey: string) {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", `${query} buy new price`);
  url.searchParams.set("count", "8");
  url.searchParams.set("search_lang", "en");
  url.searchParams.set("country", "us");
  url.searchParams.set("result_filter", "web");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BRAVE_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI(payload: Record<string, unknown>, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GPT_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { error: `OpenAI API error: ${response.status}` };
    }

    return { data: await response.json() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: message };
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonFromText(text: string) {
  let jsonText = text;
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match?.[1]) {
    jsonText = match[1].trim();
  }
  return JSON.parse(jsonText);
}

export async function POST(request: Request) {
  const braveKey = process.env.BRAVE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!braveKey || !openaiKey) {
    return NextResponse.json(
      { success: false, error: "Missing BRAVE_API_KEY or OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  let body: { products?: CompareProductInput[]; query?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const products = Array.isArray(body.products) ? body.products : [];

  if (!products.length) {
    return NextResponse.json({ success: false, error: "No products provided" }, { status: 400 });
  }

  const productResults: ProductResult[] = [];
  const allSearchData: string[] = [];

  const limitedProducts = products.slice(0, MAX_ITEM_COUNT);

  for (const [i, product] of limitedProducts.entries()) {
    const title = product.title || "Unknown";
    const price = product.price ?? "N/A";
    const cleanTitle = cleanForSearch(title);

    const searchResults = await searchBrave(cleanTitle, braveKey);
    const webResults: WebResult[] = [];
    const rawResults = searchResults?.web?.results || [];

    for (const result of rawResults.slice(0, 5)) {
      const url = result?.url || "";
      const site = (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return "";
        }
      })();
      webResults.push({
        title: result?.title || "",
        url,
        description: result?.description || "",
        site,
      });
    }

    const productEntry: ProductResult = {
      index: product.index ?? i + 1,
      originalTitle: title.slice(0, 120),
      searchQuery: cleanTitle,
      refurbPrice: price,
      condition: product.condition || "Refurbished",
      webResults,
    };

    productResults.push(productEntry);

    const searchDataText =
      `PRODUCT #${productEntry.index}: "${productEntry.searchQuery}"\n` +
      `Refurbished Price: $${price}\n` +
      "Web Search Results:\n" +
      webResults
        .map((result) => `- [${result.site}] ${result.title}: ${result.description} (${result.url})`)
        .join("\n");

    allSearchData.push(searchDataText);
  }

  const searchDataText = allSearchData.join("\n\n");

  const prompt = `I searched for new retail prices for these refurbished products. Analyze the ACTUAL search results and extract ALL prices from ALL retailers.

${searchDataText}

INSTRUCTIONS:
1. From the search results, find ALL new retail prices from EVERY retailer (Amazon, Best Buy, Walmart, Target, etc.)
2. Extract the actual price number from titles/descriptions like "$79", "79.99", "$79.99"
3. Return ALL retailer prices found, not just the best one
4. Include the actual URL for each retailer

Return ONLY valid JSON:
{
  "analysis": [
    {
      "index": 1,
      "productName": "Short clear name",
      "refurbPrice": 59,
      "retailerPrices": [
        {"retailer": "Amazon", "price": 79, "url": "https://amazon.com/..."},
        {"retailer": "Best Buy", "price": 85, "url": "https://bestbuy.com/..."},
        {"retailer": "Walmart", "price": 82, "url": "https://walmart.com/..."}
      ],
      "lowestNewPrice": 79,
      "lowestRetailer": "Amazon",
      "savings": 20,
      "savingsPercent": 25,
      "verdict": "Great deal"
    }
  ],
  "topPick": {
    "index": 1,
    "reason": "Best savings at 25% off vs new"
  }
}

IMPORTANT: Include ALL retailers with prices found in search results, not just one!

VERDICT RULES:
- Great deal = 20%+ savings
- Good deal = 10-19% savings
- Fair deal = 5-9% savings
- Not worth it = <5% savings`;

  const requestBody = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You analyze web search results to find real product prices. Extract actual prices from the search result titles and descriptions. Always provide real URLs from the search results. Respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 2500,
  };

  const gptResponse = await callOpenAI(requestBody, openaiKey);

  if (gptResponse.error || !gptResponse.data) {
    return NextResponse.json({
      success: true,
      analysis: productResults.map((product) => ({
        index: product.index,
        productName: product.searchQuery,
        refurbPrice: product.refurbPrice,
        webResults: product.webResults,
        verdict: "Check links",
        priceNote: "AI unavailable - check search results below",
      })),
      products: productResults,
      fallback: true,
    });
  }

  const text = gptResponse.data.choices?.[0]?.message?.content || "";

  let result: any = null;
  try {
    result = parseJsonFromText(text);
  } catch {
    result = null;
  }

  if (!result || !Array.isArray(result.analysis)) {
    return NextResponse.json({
      success: true,
      analysis: productResults.map((product) => {
        const firstResult = product.webResults[0] || null;
        return {
          index: product.index,
          productName: product.searchQuery,
          refurbPrice: product.refurbPrice,
          retailerUrl: firstResult?.url || null,
          retailer: firstResult?.site || "Search",
          webResults: product.webResults,
          verdict: "Check links",
          priceNote: "Click to compare prices",
        };
      }),
      products: productResults,
      rawSearch: true,
    });
  }

  for (const item of result.analysis) {
    const idx = productResults.findIndex((product) => product.index === item.index);
    if (idx !== -1) {
      item.webResults = productResults[idx].webResults;
      item.originalTitle = productResults[idx].originalTitle;
    }
  }

  return NextResponse.json({
    success: true,
    analysis: result.analysis,
    topPick: result.topPick ?? null,
    summary: result.summary ?? "",
    products: productResults,
    source: "brave+gpt4",
  });
}

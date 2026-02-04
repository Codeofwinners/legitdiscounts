import { NextResponse } from "next/server";

type TokenCache = {
  token: string | null;
  expiresAt: number;
};

const tokenCache: TokenCache = {
  token: null,
  expiresAt: 0,
};

const POPULAR_BRANDS: Record<string, string> = {
  apple: "Apple",
  samsung: "Samsung",
  sony: "Sony",
  microsoft: "Microsoft",
  hp: "HP",
  dell: "Dell",
  lenovo: "Lenovo",
  canon: "Canon",
  nikon: "Nikon",
  nintendo: "Nintendo",
  bose: "Bose",
  dyson: "Dyson",
};

const REFURBISHED_MARKETPLACES = new Set(["EBAY_US", "EBAY_AU"]);

const MARKETPLACE_CURRENCY: Record<string, string> = {
  EBAY_US: "USD",
  EBAY_CA: "CAD",
  EBAY_GB: "GBP",
  EBAY_DE: "EUR",
  EBAY_FR: "EUR",
  EBAY_IT: "EUR",
  EBAY_ES: "EUR",
  EBAY_NL: "EUR",
  EBAY_BE: "EUR",
  EBAY_AT: "EUR",
  EBAY_CH: "CHF",
  EBAY_IE: "EUR",
  EBAY_PL: "PLN",
  EBAY_AU: "AUD",
  EBAY_HK: "HKD",
  EBAY_SG: "SGD",
  EBAY_MY: "MYR",
  EBAY_PH: "PHP",
  EBAY_TW: "TWD",
  EBAY_MOTORS_US: "USD",
};

function getSupportsRefurbishedProgram(marketplace: string) {
  return REFURBISHED_MARKETPLACES.has(marketplace);
}

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  const clientId = process.env.EBAY_APP_ID || process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CERT_ID || process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing eBay credentials. Set EBAY_APP_ID/EBAY_CERT_ID (or EBAY_CLIENT_ID/EBAY_CLIENT_SECRET).");
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`eBay auth failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const expiresIn = Number(data.expires_in) || 0;

  tokenCache.token = data.access_token;
  tokenCache.expiresAt = now + Math.max(expiresIn - 60, 0) * 1000;

  return tokenCache.token;
}

function buildFilters(options: {
  conditions: string;
  supportsRefurbished: boolean;
  min?: string | null;
  max?: string | null;
  buyingOptions: string;
  freeShipping: boolean;
  currency: string;
}) {
  const filters: string[] = [];

  const { conditions, supportsRefurbished, min, max, buyingOptions, freeShipping, currency } = options;

  if (conditions === "refurbished" || conditions === "deals") {
    if (supportsRefurbished) {
      filters.push("conditionIds:{2000|2010|2020|2030|2500}");
    } else {
      filters.push("conditionIds:{2500}");
    }
  } else if (conditions === "certified_refurbished") {
    filters.push(supportsRefurbished ? "conditionIds:{2000}" : "conditionIds:{2500}");
  } else if (conditions === "excellent_refurbished") {
    filters.push("conditionIds:{2010}");
  } else if (conditions === "very_good_refurbished") {
    filters.push("conditionIds:{2020}");
  } else if (conditions === "good_refurbished") {
    filters.push("conditionIds:{2030}");
  } else if (conditions === "new") {
    filters.push("conditionIds:{1000}");
  } else if (conditions === "new_plus_open_box") {
    filters.push("conditionIds:{1000|1500}");
  } else if (conditions === "used") {
    filters.push("conditionIds:{3000|4000|5000|6000}");
  } else if (conditions === "open_box") {
    filters.push("conditionIds:{1500}");
  }

  if (min || max) {
    filters.push(`price:[${min || 0}..${max || ""}]`);
    if (currency) {
      filters.push(`priceCurrency:${currency}`);
    }
  }

  if (buyingOptions === "FIXED_PRICE") {
    filters.push("buyingOptions:{FIXED_PRICE}");
  } else if (buyingOptions === "AUCTION") {
    filters.push("buyingOptions:{AUCTION}");
  } else if (buyingOptions === "BEST_OFFER") {
    filters.push("buyingOptions:{BEST_OFFER}");
  }

  if (freeShipping) {
    filters.push("maxDeliveryCost:0");
  }

  return filters.filter(Boolean).join(",");
}

async function fetchWithToken(url: string, marketplace: string) {
  const token = await getAccessToken();
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") || "";
  const min = searchParams.get("min");
  const max = searchParams.get("max");
  const offset = Number(searchParams.get("offset") || 0);
  const limit = Math.min(Number(searchParams.get("limit") || 40), 200);
  const conditions = searchParams.get("conditions") || "refurbished";
  const brands = searchParams.get("brands") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const freeShipping = searchParams.get("freeShipping") === "true";
  const buyingOptions = searchParams.get("buyingOptions") || "FIXED_PRICE";
  const sortOrder = searchParams.get("sort") || "";
  const marketplace = searchParams.get("marketplace") || "EBAY_US";
  const deals = searchParams.get("deals") === "true";

  const supportsRefurbished = getSupportsRefurbishedProgram(marketplace);
  const currency = MARKETPLACE_CURRENCY[marketplace] || "USD";

  const filters = buildFilters({
    conditions,
    supportsRefurbished,
    min,
    max,
    buyingOptions,
    freeShipping,
    currency,
  });

  let aspectFilter = "";
  if (brands && categoryId) {
    const brandList = brands
      .split(",")
      .map((brand) => POPULAR_BRANDS[brand.toLowerCase()] || brand)
      .join("|");
    aspectFilter = `categoryId:${categoryId},Brand:{${brandList}}`;
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    fieldgroups: "ASPECT_REFINEMENTS,EXTENDED",
  });

  if (filters) {
    params.set("filter", filters);
  }

  if (deals) {
    params.set("category_ids", categoryId || "293");
    params.set("sort", "newlyListed");
  } else if (q) {
    params.set("q", q);
  }

  if (sortOrder && !deals) {
    params.set("sort", sortOrder);
  }

  if (aspectFilter) {
    params.set("aspect_filter", aspectFilter);
  }

  if (categoryId && !deals) {
    params.set("category_ids", categoryId);
  }

  const endpoint = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`;

  try {
    let response = await fetchWithToken(endpoint, marketplace);

    if (response.status === 401) {
      tokenCache.token = null;
      tokenCache.expiresAt = 0;
      response = await fetchWithToken(endpoint, marketplace);
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `eBay search failed: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Filter results: keywords must appear in sequence in title
    const queryWords = q.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const filteredSummaries = (data.itemSummaries || []).filter((item: any) => {
      if (!q || queryWords.length === 0) return true;
      const title = (item.title || "").toLowerCase();

      // Check if all query words appear in sequence
      let lastIndex = -1;
      for (const word of queryWords) {
        const idx = title.indexOf(word, lastIndex + 1);
        if (idx === -1 || idx <= lastIndex) return false;
        lastIndex = idx;
      }
      return true;
    });

    const items = filteredSummaries.map((item: any) => {
      const priceValue = Number(item.price?.value || 0);
      const originalValue = Number(item.marketingPrice?.originalPrice?.value || 0);
      const savings = originalValue && priceValue ? Math.max(originalValue - priceValue, 0) : undefined;

      return {
        id: item.itemId || item.legacyItemId || crypto.randomUUID(),
        title: item.title || "",
        price: priceValue,
        originalPrice: originalValue || undefined,
        imageUrl:
          item.image?.imageUrl ||
          item.thumbnailImages?.[0]?.imageUrl ||
          "https://picsum.photos/400/400",
        itemUrl: item.itemWebUrl || item.itemAffiliateWebUrl || "",
        condition: item.condition || "",
        savings: savings && savings > 0 ? savings : undefined,
      };
    });

    return NextResponse.json({
      items,
      total: data.total || 0,
      popularBrands: POPULAR_BRANDS,
      marketplace,
      supportsRefurbished,
      appliedFilters: {
        conditions,
        brands: brands ? brands.split(",") : [],
        categoryId,
        freeShipping,
        buyingOptions,
        priceRange: { min, max },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

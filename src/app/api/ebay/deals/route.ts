import { NextResponse } from "next/server";

const AFFILIATE_CAMPID = "5339117469";
const AFFILIATE_MKRID = "711-53200-19255-0";

const DEAL_PAGES = [
  "https://www.ebay.com/deals",
  "https://www.ebay.com/deals/tech",
  "https://www.ebay.com/deals/home-garden",
  "https://www.ebay.com/deals/fashion",
];

function buildAffiliateUrl(itemId: string): string {
  return `https://www.ebay.com/itm/${itemId}?mkcid=1&mkrid=${AFFILIATE_MKRID}&campid=${AFFILIATE_CAMPID}&toolid=10001&mkevt=1`;
}

function extractNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/[\d,]+\.?\d*/);
  return match ? match[0].replace(/,/g, "") : null;
}

function parseDealsFromHtml(html: string) {
  const dealItems: Array<{
    itemId: string;
    title: string;
    image: string;
    price: string;
    originalPrice: string | null;
    discountPct: number | null;
    itemUrl: string;
  }> = [];

  const tileRegex = /data-listing-id[=\s]*["']?(\d+).*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gs;
  const tiles = [...html.matchAll(tileRegex)];

  for (const tile of tiles) {
    const tileHtml = tile[0];
    const itemId = tile[1];

    const urlMatch = tileHtml.match(/href=["']?(https:\/\/www\.ebay\.com\/itm\/\d+[^"'>\s]*)/s);
    let itemUrl = urlMatch ? urlMatch[1] : "";
    if (itemUrl) {
      itemUrl = itemUrl.replace(/&amp;/g, "&");
      try {
        itemUrl = decodeURIComponent(itemUrl);
      } catch {
        // Leave as-is if decoding fails.
      }
    }

    const imgMatch = tileHtml.match(/src=["']?(https:\/\/i\.ebayimg\.com[^"'>\s]+)/s);
    const rawImage = imgMatch ? imgMatch[1] : "";
    const image = rawImage ? rawImage.replace(/s-l\d+\./, "s-l500.") : "";

    let title = "";
    const titleMatch = tileHtml.match(/dne-itemtile-title[^>]*title=["']?([^"']+)/s);
    if (titleMatch?.[1]) {
      title = titleMatch[1].trim();
    } else {
      const fallbackTitleMatch = tileHtml.match(/ebayui-ellipsis[^>]*>([^<]+)/s);
      title = fallbackTitleMatch?.[1]?.trim() || "";
    }

    const priceMatch = tileHtml.match(/itemprop=["']?price["']?[^>]*>\$?([\d,]+\.?\d*)/s);
    const price = priceMatch ? extractNumber(priceMatch[1]) : null;

    const originalMatch = tileHtml.match(/itemtile-price-strikethrough[^>]*>\$?([\d,]+\.?\d*)/s);
    const originalPrice = originalMatch ? extractNumber(originalMatch[1]) : null;

    let discountPct: number | null = null;
    const discountMatch = tileHtml.match(/(\d+)%\s*off/i);
    if (discountMatch?.[1]) {
      discountPct = Number(discountMatch[1]);
    } else if (originalPrice && price) {
      const originalValue = Number(originalPrice);
      const priceValue = Number(price);
      if (originalValue > 0) {
        discountPct = Math.round(((originalValue - priceValue) / originalValue) * 100);
      }
    }

    if (title && itemUrl && price && Number(price) > 0) {
      dealItems.push({
        itemId,
        title,
        image,
        price,
        originalPrice,
        discountPct,
        itemUrl,
      });
    }
  }

  return dealItems;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace") || "EBAY_US";
  const limit = Math.min(Number(searchParams.get("limit") || 200), 300);

  try {
    console.log("🔥 Scraping eBay Deals pages...");
    const allDeals: any[] = [];
    const seen = new Set<string>();

    for (const pageUrl of DEAL_PAGES) {
      const response = await fetch(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (!response.ok) {
        console.error(`Deals page failed: ${pageUrl} (${response.status})`);
        continue;
      }

      const html = await response.text();
      const pageDeals = parseDealsFromHtml(html);

      for (const deal of pageDeals) {
        if (!deal.discountPct || deal.discountPct < 5) continue;
        if (seen.has(deal.itemId)) continue;
        seen.add(deal.itemId);

        const affiliateUrl = buildAffiliateUrl(deal.itemId);
        const originalValue = deal.originalPrice ? Number(deal.originalPrice) : 0;
        const priceValue = Number(deal.price);

        allDeals.push({
          itemId: `v1|${deal.itemId}|0`,
          title: deal.title,
          image: { imageUrl: deal.image || "https://ir.ebaystatic.com/cr/v/c1/s_1x2.png" },
          price: { value: deal.price, currency: "USD" },
          itemWebUrl: affiliateUrl,
          itemAffiliateWebUrl: affiliateUrl,
          condition: "Deal",
          seller: { username: "eBay Deals", feedbackPercentage: "100" },
          shippingOptions: [{ shippingCost: { value: "0.00", currency: "USD" } }],
          marketingPrice: {
            originalPrice: deal.originalPrice ? { value: deal.originalPrice, currency: "USD" } : null,
            discountPercentage: String(deal.discountPct),
            discountAmount: {
              value: String(Math.max(originalValue - priceValue, 0)),
              currency: "USD",
            },
          },
        });

        if (allDeals.length >= limit) break;
      }

      if (allDeals.length >= limit) break;
    }

    return NextResponse.json({
      itemSummaries: allDeals.slice(0, limit),
      total: allDeals.length,
      marketplace,
      isDeals: true,
      isRealDeals: true,
      source: "eBay Deals Page",
      hasAffiliateLinks: true,
      campaignId: AFFILIATE_CAMPID,
    });
  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: "Failed to scrape authentic deals", itemSummaries: [] }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import { scrapeEbayDeals } from "@/lib/ebayDealsScraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 200), 300);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  try {
    console.log("🔥 Scraping eBay Deals pages...");
    const data = await scrapeEbayDeals({ limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: "Failed to scrape authentic deals", itemSummaries: [] }, { status: 500 });
  }
}

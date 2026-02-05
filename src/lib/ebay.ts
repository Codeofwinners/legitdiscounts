export interface eBayItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  itemUrl: string;
  condition: string;
  savings?: number;
}

type DealApiItem = {
  itemId?: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: { value?: string | number };
  marketingPrice?: { originalPrice?: { value?: string | number } };
  itemWebUrl?: string;
  itemAffiliateWebUrl?: string;
  condition?: string;
};

function mapDealApiItem(item: DealApiItem): eBayItem {
  const priceValue = Number(item.price?.value || 0);
  const originalValue = Number(item.marketingPrice?.originalPrice?.value || 0);
  const savings = originalValue && priceValue ? Math.max(originalValue - priceValue, 0) : undefined;

  return {
    id: item.itemId || crypto.randomUUID(),
    title: item.title || "",
    price: priceValue,
    originalPrice: originalValue || undefined,
    imageUrl: item.image?.imageUrl || "https://ir.ebaystatic.com/cr/v/c1/s_1x2.png",
    itemUrl: item.itemWebUrl || item.itemAffiliateWebUrl || "",
    condition: item.condition || "Deal",
    savings: savings && savings > 0 ? savings : undefined,
  };
}

export async function fetcheBayDeals(query: string = ""): Promise<eBayItem[]> {
  // Use the search API for all requests; deals flag pulls from the scraper on the backend
  const endpoint = query.trim()
    ? `/api/ebay/search?q=${encodeURIComponent(query.trim())}&limit=50`
    : `/api/ebay/search?deals=true&limit=200`;

  const response = await fetch(endpoint, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch eBay deals: ${response.status}`);
  }

  const data = await response.json();
  return data.items || (data.itemSummaries || []).map(mapDealApiItem);
}

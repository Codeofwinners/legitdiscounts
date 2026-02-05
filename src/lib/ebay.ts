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
  // Use absolute URLs for production to ensure they hit the PHP backend
  const baseUrl = 'https://www.legit.discount';
  const endpoint = query.trim()
    ? `${baseUrl}/api/ebay/search?q=${encodeURIComponent(query.trim())}&limit=50`
    : `${baseUrl}/api/ebay/search?deals=true?limit=200`;

  const response = await fetch(endpoint, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch eBay deals: ${response.status}`);
  }

  const data = await response.json();
  
  // The PHP deals.php returns { items: [...] }
  if (data.items) {
    return data.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.originalPrice,
        imageUrl: item.imageUrl,
        itemUrl: item.itemUrl,
        condition: item.condition,
        savings: item.savings
    }));
  }

  return (data.itemSummaries || []).map(mapDealApiItem);
}

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

export async function fetcheBayDeals(query: string = ""): Promise<eBayItem[]> {
  // Always use Browse API - search with query or trending without
  const endpoint = query.trim()
    ? `/api/ebay/search?q=${encodeURIComponent(query.trim())}&limit=50`
    : `/api/ebay/search?deals=true&limit=50`;

  const response = await fetch(endpoint, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch eBay deals: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

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
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }

  const response = await fetch(`/api/ebay/search?${params.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch eBay deals: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

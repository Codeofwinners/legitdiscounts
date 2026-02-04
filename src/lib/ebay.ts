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
  const searchTerm = query || "refurbished iphone";
  
  // Real eBay integration point
  // In the final version, this will call the eBay Finding API.
  // For now, we are providing high-fidelity data that matches the eBay marketplace structure
  // to ensure the UI is perfectly calibrated for the real API response.
  
  const allDeals: eBayItem[] = [
    {
      id: "1",
      title: "iPhone 15 Pro - 128GB - Natural Titanium (Excellent)",
      price: 679.99,
      originalPrice: 999.00,
      imageUrl: "https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400&h=400&fit=crop",
      itemUrl: "https://ebay.com",
      condition: "Excellent - Refurbished",
      savings: 319.01
    },
    {
      id: "2",
      title: "MacBook Air M2 - 13.6\" - 8GB RAM - 256GB SSD - Space Gray",
      price: 749.00,
      originalPrice: 1099.00,
      imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ec696e5239?q=80&w=400&h=400&fit=crop",
      itemUrl: "https://ebay.com",
      condition: "Certified Refurbished",
      savings: 350.00
    },
    {
      id: "3",
      title: "iPad Pro 11\" (4th Gen) - Wi-Fi - 128GB - Silver",
      price: 589.99,
      originalPrice: 799.00,
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400&h=400&fit=crop",
      itemUrl: "https://ebay.com",
      condition: "Very Good - Refurbished",
      savings: 209.01
    },
    {
        id: "4",
        title: "Apple Watch Series 9 - 45mm - GPS - Midnight Aluminum",
        price: 289.00,
        originalPrice: 429.00,
        imageUrl: "https://images.unsplash.com/photo-1434493907317-a46b5bc78344?q=80&w=400&h=400&fit=crop",
        itemUrl: "https://ebay.com",
        condition: "Excellent - Refurbished",
        savings: 140.00
      },
      {
        id: "5",
        title: "iPhone 14 - 128GB - Blue (Good)",
        price: 399.00,
        originalPrice: 699.00,
        imageUrl: "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?q=80&w=400&h=400&fit=crop",
        itemUrl: "https://ebay.com",
        condition: "Good - Refurbished",
        savings: 300.00
      },
      {
        id: "6",
        title: "AirPods Pro (2nd Gen) with MagSafe Case",
        price: 169.00,
        originalPrice: 249.00,
        imageUrl: "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?q=80&w=400&h=400&fit=crop",
        itemUrl: "https://ebay.com",
        condition: "Certified Refurbished",
        savings: 80.00
      }
  ];

  if (!query) return allDeals;

  return allDeals.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase().replace("refurbished ", ""))
  );
}

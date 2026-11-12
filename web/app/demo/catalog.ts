/* Demo catalog, framed the Bidazk way: each entry is a buyer's Wanted Post
   with the bid that won it. The id is what goes on-chain, so the buyer's and
   the seller's phones show the same item from the ledger alone.

   Prices are in naira, at illustrative Nigerian street prices for the item
   and condition described. Testnet cannot hold naira, so each deal locks
   test XLM at a fixed demo rate (NAIRA_PER_TEST_XLM). That rate is a
   stand-in, not a market price; production holds NGNC, which is 1:1 naira.

   Photos are CC0 (StockSnap and Wikimedia Commons, found via Openverse),
   cropped to 4:3 and served from /public so no third party sits in the
   render path. Replace with owned photography before any real launch. */

export const NAIRA_PER_TEST_XLM = 1_000;

export type CatalogItem = {
  id: number;
  name: string;
  wanted: string;
  category: string;
  image: string;
  /* Naira price of the winning bid. */
  naira: number;
  /* What actually locks on testnet: naira / NAIRA_PER_TEST_XLM. */
  price: number;
  bidNote: string;
  /* Words a buyer might type. Keyword matching stands in for the AI matcher
     of the full product. */
  keywords: string[];
};

export const CATALOG: readonly CatalogItem[] = [
  {
    id: 1,
    name: "iPhone 8 Plus, 64GB",
    wanted: "Clean iPhone 8 Plus, gold or silver, battery above 85%. No Face ID issues.",
    category: "Phones",
    image: "/demo/products/iphone-8-plus.jpg",
    naira: 230000,
    price: 230,
    bidNote: "UK used, battery 89%, comes with charger.",
    keywords: ["iphone", "iphone 8", "8 plus", "apple", "phone", "smartphone", "ios"],
  },
  {
    id: 2,
    name: "iPhone X, 256GB",
    wanted: "iPhone X 256GB, silver. Screen must be original, no cracks.",
    category: "Phones",
    image: "/demo/products/iphone-x.jpg",
    naira: 310000,
    price: 310,
    bidNote: "Original screen, true tone on. Free screen guard.",
    keywords: ["iphone", "iphone x", "apple", "phone", "smartphone", "ios"],
  },
  {
    id: 3,
    name: "Android phone, 128GB",
    wanted: "Any solid Android with 128GB and a good camera, under budget.",
    category: "Phones",
    image: "/demo/products/android-phone.jpg",
    naira: 185000,
    price: 185,
    bidNote: "Brand new in box, 8GB RAM, 1-year warranty.",
    keywords: ["android", "phone", "smartphone", "samsung", "tecno", "infinix", "mobile"],
  },
  {
    id: 4,
    name: "DJI Phantom 4 drone",
    wanted: "Camera drone for event shoots. 4K video, at least 2 batteries.",
    category: "Drones",
    image: "/demo/products/drone.jpg",
    naira: 1200000,
    price: 1200,
    bidNote: "3 batteries, carry case, 2 spare propeller sets.",
    keywords: ["drone", "dji", "phantom", "camera drone", "quadcopter", "aerial"],
  },
  {
    id: 5,
    name: "AirPods Pro",
    wanted: "Genuine AirPods Pro with noise cancelling. No copies.",
    category: "Audio",
    image: "/demo/products/airpods-pro.jpg",
    naira: 250000,
    price: 250,
    bidNote: "Sealed, serial verifiable on Apple's site.",
    keywords: ["airpods", "earbuds", "earphones", "headphones", "apple", "audio", "noise cancelling"],
  },
  {
    id: 6,
    name: "JBL Charge 4 speaker",
    wanted: "Loud waterproof Bluetooth speaker that can also charge my phone.",
    category: "Audio",
    image: "/demo/products/jbl-speaker.jpg",
    naira: 150000,
    price: 150,
    bidNote: "20-hour battery, IPX7 waterproof.",
    keywords: ["speaker", "jbl", "bluetooth speaker", "audio", "music", "sound"],
  },
  {
    id: 7,
    name: "GPS smartwatch",
    wanted: "Rugged GPS watch for running, heart-rate tracking, long battery.",
    category: "Wearables",
    image: "/demo/products/smartwatch.jpg",
    naira: 350000,
    price: 350,
    bidNote: "Two weeks battery, scratch-resistant glass.",
    keywords: ["watch", "smartwatch", "gps watch", "fitness", "garmin", "wearable"],
  },
  {
    id: 8,
    name: "MacBook Air, 256GB",
    wanted: "MacBook Air for work, 256GB SSD, battery cycle count under 300.",
    category: "Laptops",
    image: "/demo/products/macbook.jpg",
    naira: 900000,
    price: 900,
    bidNote: "Cycle count 142, no dents, original charger.",
    keywords: ["laptop", "macbook", "mac", "apple", "computer", "notebook"],
  },
];

/* Every word the buyer typed must appear in the item's name, category or
   keywords. "iphone 8" narrows; "phone" widens. */
export function searchCatalog(query: string): CatalogItem[] {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (words.length === 0) return [];
  return CATALOG.filter((item) => {
    const hay = [item.name, item.category, ...item.keywords].join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function catalogItem(id: number): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

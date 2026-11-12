/* Shops for the demo search.

   The live shop is a real testnet wallet: the one whose QR code was scanned,
   or this phone's own shop. It is always named Stellar Shop and always bids
   the catalog price, so it is the best offer and the only one that can be
   paid and delivered.

   The other shops are display-only listings, there to show what a buyer sees
   when several shops bid on one request. They have no wallet, so they can
   never be paid; their bids are the catalog price plus a fixed markup. */

import type { CatalogItem } from "./catalog";

export const LIVE_SHOP_NAME = "Stellar Shop";

type DemoShop = { name: string; area: string; rating: number };

const DEMO_SHOPS: readonly DemoShop[] = [
  { name: "Kunle Phones", area: "Ikot Ekpene Road", rating: 4.6 },
  { name: "Uyo Tech Hub", area: "Itam", rating: 4.8 },
  { name: "Akpan & Sons Electronics", area: "Oron Road", rating: 4.5 },
  { name: "Ibom Gadget Plaza", area: "Aka Road", rating: 4.7 },
];

export type Bid = {
  shop: string;
  area: string;
  rating: number;
  km: number;
  naira: number;
  live: boolean;
};

/* Stable per (item, shop), so a bid never changes between renders. */
function seed(a: number, b: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/* Live shop first at the catalog price, then two or three demo shops
   between 3% and 12% dearer, cheapest first. */
export function bidsFor(item: CatalogItem): Bid[] {
  const others = DEMO_SHOPS.map((s, i) => ({ s, r: seed(item.id, i + 1) }))
    .filter(({ r }, i) => r > 0.3 || i === item.id % DEMO_SHOPS.length)
    .slice(0, 3)
    .map(({ s, r }) => ({
      shop: s.name,
      area: s.area,
      rating: s.rating,
      km: Math.round((2 + r * 7) * 10) / 10,
      naira: Math.round((item.naira * (1.03 + r * 0.09)) / 500) * 500,
      live: false,
    }))
    .sort((a, b) => a.naira - b.naira);

  return [
    { shop: LIVE_SHOP_NAME, area: "Uyo", rating: 4.9, km: 1.2, naira: item.naira, live: true },
    ...others,
  ];
}

export const DEMO_SHOP_COUNT = DEMO_SHOPS.length + 1;

import type { Metadata } from "next";
import { Fraunces, Archivo, IBM_Plex_Mono } from "next/font/google";
import { MotionProvider } from "./motion";
import "./globals.css";

/* Three roles, each earning its place.
   Fraunces carries the marketing voice. It is a variable serif with warmth and a
   slight vintage-signage wonk. Every competitor in this category is all-sans,
   so a serif display is differentiation that costs no color.
   Archivo runs the product UI. Plex Mono carries every figure, because in
   this product the numbers are the content. */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bidazk",
  description:
    "Buyers say what they want. Shops bid to supply it. Free tools for merchants, escrow for everyone.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable}`}
    >
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

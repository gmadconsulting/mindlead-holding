import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { seo } from "@/content/it";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mindleadholding.com"),
  title: {
    default: seo.home.title,
    template: "%s",
  },
  description: seo.home.description,
  openGraph: {
    title: seo.home.title,
    description: seo.home.description,
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-clip bg-bg text-ink">
        <a href="#contenuto" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <Header />
          <main id="contenuto">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}

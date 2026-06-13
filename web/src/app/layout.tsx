import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | GoldSight",
    default: "GoldSight — Gold Return Prediction Dashboard",
  },
  description:
    "Interactive dashboard comparing ARIMAX, XGBoost, and LSTM models for 5-day cumulative gold return prediction. Academic research visualization tool.",
  keywords: [
    "gold prediction",
    "ARIMAX",
    "XGBoost",
    "LSTM",
    "machine learning",
    "time series forecasting",
    "thesis",
    "GLD",
  ],
  authors: [{ name: "Ji" }],
  openGraph: {
    title: "GoldSight — Gold Return Prediction Dashboard",
    description:
      "Comparing ARIMAX, XGBoost, and LSTM for 5-day gold return forecasting",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

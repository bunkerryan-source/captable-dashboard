import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { DashboardProvider } from "@/context/DashboardContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ABP Capital \u2014 Cap Table Dashboard",
  description: "Equity ownership tracking for ABP Capital entities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}

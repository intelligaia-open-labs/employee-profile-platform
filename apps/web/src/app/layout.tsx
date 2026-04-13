import type { Metadata } from "next";
import { Bricolage_Grotesque, Literata } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Literata({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Business Profile",
  description: "Digital Employee Profile System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-surface text-ink font-display antialiased">
        {children}
      </body>
    </html>
  );
}

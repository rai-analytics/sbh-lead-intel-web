import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I am ready to hunt.",
  description: "Lead Intelligence Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

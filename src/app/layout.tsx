import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stein 1.0",
  description: "Ready to Hunt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Manual test: change 'light' to 'dark' here to toggle theme
  const currentTheme = 'dark'; 

  return (
    <html lang="en" className={currentTheme}>
      <body>{children}</body>
    </html>
  );
}

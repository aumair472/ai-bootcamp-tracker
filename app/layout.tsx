import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AtomCamp Tracker",
  description: "Daily Routine & Study Tracker for AI/ML Bootcamp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import ScreenLoader from "@/components/ScreenLoader";

export const metadata: Metadata = {
  title: "Tablewise | Restaurant reservations",
  description: "Reservations and waitlist management for modern restaurants",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll />
        <ScreenLoader />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNavigation } from "@/components/BottomNavigation";

export const metadata: Metadata = {
  title: "Questy",
  description: "Earn rewards by completing quests and surveys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen">{children}</div>
          <BottomNavigation />
        </Providers>
      </body>
    </html>
  );
}

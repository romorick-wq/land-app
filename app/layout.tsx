import type { Metadata } from "next";
import { CampaignProvider } from "@/components/CampaignProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LandData",
  description: "LandData for the Stockyards campaign in White Pine County, Nevada.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CampaignProvider>{children}</CampaignProvider>
      </body>
    </html>
  );
}

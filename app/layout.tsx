import type { Metadata } from "next";
import { CampaignProvider } from "@/components/CampaignProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Land Campaign",
  description: "Draw an area, track landowners, and follow a land campaign from first contact to close.",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Villa Corazon Events Place | Gather beautifully",
  description:
    "Discover a warm and welcoming event venue for your celebrations at Villa Corazon Events Place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

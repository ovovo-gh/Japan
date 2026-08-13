import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const publicBasePath =
  process.env.GITHUB_PAGES === "true"
    ? (process.env.GITHUB_PAGES_ASSET_PREFIX ?? "/Japan").replace(/\/$/, "")
    : "";

export const metadata: Metadata = {
  title: "日本，慢慢走｜东京·富士·大阪 5 日旅行地图",
  description: "东京、河口湖富士山与大阪 5 日旅行地图，包含小时级行程、住宿预算、美食清单和地点管理。",
  icons: {
    icon: `${publicBasePath}/favicon.svg`,
    shortcut: `${publicBasePath}/favicon.svg`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

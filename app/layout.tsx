import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const publicBasePath =
  process.env.GITHUB_PAGES === "true"
    ? (process.env.GITHUB_PAGES_ASSET_PREFIX ?? "/Japan").replace(/\/$/, "")
    : "";

export const metadata: Metadata = {
  title: "东京，慢慢走｜两个人的日本旅行地图",
  description: "东京与箱根 5 日旅行地图、地点管理和每日线路规划。",
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

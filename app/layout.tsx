import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const publicBasePath =
  process.env.GITHUB_PAGES === "true"
    ? (process.env.GITHUB_PAGES_ASSET_PREFIX ?? "/Japan").replace(/\/$/, "")
    : "";

export const metadata: Metadata = {
  title: "日本，慢慢走｜东京·富士·京都·奈良·大阪 7 天旅行地图",
  description: "2026 年 8 月 30 日至 9 月 5 日上海浦东进、关西出，包含东京、富士山、京都、奈良与大阪的小时级行程、住宿入住退房提示、美食清单和地点管理。",
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

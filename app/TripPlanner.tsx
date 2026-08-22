"use client";

import dynamic from "next/dynamic";
import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DayId, DayPlan, NearbyCandidate, NearbyRegion, PersonalDayMemo, PersonalExpense, PersonalTask, Place, PlaceCategory, StayPlan, TripState, XiaohongshuShare } from "./types";

const MapView = dynamic(() => import("./LeafletMap"), {
  loading: () => <div className="map-frame map-placeholder">地图正在准备…</div>,
});

const DAYS: DayPlan[] = [
  { id: 1, label: "DAY 01 · 08/30 周日", title: "凌晨抵达东京 · 浅草入门", focus: "浦东 → 羽田 · 行李寄存 · 浅草", color: "#df6b5f" },
  { id: 2, label: "DAY 02 · 08/31 周一", title: "东京站 · 筑地 · 银座 · 秋叶原", focus: "Chiikawa · 女友生鱼 · 购物", color: "#e29b42" },
  { id: 3, label: "DAY 03 · 09/01 周二", title: "富士山 · 河口湖日归", focus: "河口湖 · 忠灵塔 / 大石公园", color: "#6e936a" },
  { id: 4, label: "DAY 04 · 09/02 周三", title: "东京 → 京都 · 祇园夜色", focus: "退房换城 · 锦市场 · 祇园", color: "#b66c85" },
  { id: 5, label: "DAY 05 · 09/03 周四", title: "京都东山 · 清水寺与鴨川", focus: "伏见稻荷 · 清水寺 · 祇园", color: "#5488a0" },
  { id: 6, label: "DAY 06 · 09/04 周五", title: "京都 → 奈良 → 大阪", focus: "退房 · 奈良鹿 · 难波入住", color: "#6f8f62" },
  { id: 7, label: "DAY 07 · 09/05 周六", title: "大阪整日 · 19:30 KIX 返沪", focus: "大阪城 · 黑门 · 难波 · KIX", color: "#806d9c" },
];

const PAGE_MODULES = [
  { href: "#map", label: "路线地图" },
  { href: "#nearby", label: "周边候选" },
  { href: "#personal-plan", label: "我的行程清单" },
  { href: "#stays", label: "住宿" },
  { href: "#food", label: "美食" },
  { href: "#checklist", label: "出发清单" },
  { href: "#language", label: "现金与日语" },
  { href: "#sources", label: "来源" },
  { href: "#hourly", label: "小时攻略" },
  { href: "#xhs-board", label: "小红书分享" },
];

const LEGACY_PLACES: Place[] = [
  {
    id: "sensoji",
    title: "浅草寺 / 雷门",
    area: "浅草",
    category: "play",
    day: 1,
    routeOrder: 2,
    lat: 35.7148,
    lng: 139.7967,
    note: "第一次到东京的文化开场；早上或傍晚更舒服。",
    link: "https://www.senso-ji.jp/english/",
  },
  {
    id: "kappabashi",
    title: "合羽桥道具街",
    area: "浅草西侧",
    category: "shop",
    day: 1,
    routeOrder: 3,
    lat: 35.7125,
    lng: 139.7889,
    note: "厨房用品、食品模型和有趣伴手礼；和浅草寺步行串联。",
    link: "https://www.gotokyo.org/en/spot/31/index.html",
  },
  {
    id: "ameyoko",
    title: "阿美横丁",
    area: "上野",
    category: "food",
    day: 1,
    routeOrder: 1,
    lat: 35.7074,
    lng: 139.7746,
    note: "街头小吃和折扣店集中；你可优先选烤肉、鸡肉、拉面等熟食。",
    link: "https://www.gotokyo.org/en/spot/24/index.html",
    price: "¥800–1,800 / 人",
    meal: "晚餐候选",
    foodNote: "熟食优先；拉面汤底、酱汁和鱼介成分仍要现场确认。",
    checked: false,
  },
  {
    id: "asakusa-tempura",
    title: "浅草熟食：天妇罗 / 鳗鱼",
    area: "浅草 · 传法院通",
    category: "food",
    day: 1,
    lat: 35.7127,
    lng: 139.7946,
    note: "第一顿安排热食，和浅草寺、仲见世一起慢慢逛；不用为了打卡硬吃刺身。",
    link: "https://www.gotokyo.org/en/see-and-do/drinking-and-dining/tokyo-local-food/index.html",
    price: "¥1,500–3,500 / 人",
    meal: "午餐",
    foodNote: "热食候选；确认酱汁、汤底与鱼类成分。",
    checked: false,
  },
  {
    id: "asakusa-kissaten",
    title: "浅草喫茶 / 和甜点",
    area: "浅草",
    category: "drink",
    day: 1,
    routeOrder: 4,
    lat: 35.7137,
    lng: 139.7952,
    note: "走累时的低强度停靠点：咖啡、茶和和菓子，给第一天留一点余量。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
    price: "¥800–1,500 / 人",
    meal: "下午茶",
    foodNote: "优先看成分标示；不确定时选择包装明确的甜点或饮品。",
    checked: false,
  },
  {
    id: "tokyo-chiikawa",
    title: "ちいかわらんど TOKYO Station",
    area: "东京站 Character Street",
    category: "shop",
    day: 2,
    lat: 35.6812,
    lng: 139.7671,
    note: "优先买东京限定、毛绒和小挂件；入场方式、库存以当天官方信息为准。",
    link: "https://www.tokyoeki-1bangai.co.jp/shop/detail/?cd=000198",
  },
  {
    id: "ginza",
    title: "银座中央通",
    area: "银座",
    category: "shop",
    day: 2,
    lat: 35.6717,
    lng: 139.765,
    note: "百货、药妆、甜点和品牌集中；把预算留给真正想买的东西。",
    link: "https://www.gotokyo.org/en/destinations/central-tokyo/ginza/index.html",
  },
  {
    id: "tsukiji",
    title: "筑地场外市场",
    area: "筑地",
    category: "food",
    day: 2,
    lat: 35.6655,
    lng: 139.7708,
    note: "女朋友可以安排寿司；你提前出示过敏卡并只点确认过的熟食。",
    link: "https://www.tsukiji.or.jp/english/",
    price: "¥2,000–5,000 / 人",
    meal: "早餐 / 午餐",
    foodNote: "女友的生食候选；你改选玉子烧或明确的熟食，并确认交叉污染。",
    checked: false,
  },
  {
    id: "ginza-dessert",
    title: "银座喫茶 / 甜点",
    area: "银座",
    category: "drink",
    day: 2,
    lat: 35.6722,
    lng: 139.7657,
    note: "把购物拆成两段，中间坐下来喝茶；比连续逛百货更不累。",
    link: "https://www.gotokyo.org/en/see-and-do/drinking-and-dining/index.html",
    price: "¥900–2,000 / 人",
    meal: "下午茶",
    foodNote: "咖啡、茶和甜点；过敏原以店内标示为准。",
    checked: false,
  },
  {
    id: "tokyo-yakitori",
    title: "东京站熟食晚餐",
    area: "东京站八重洲",
    category: "food",
    day: 2,
    lat: 35.6806,
    lng: 139.7671,
    note: "如果筑地更偏女友的海鲜体验，晚餐就回到鸡肉、烤物或明确标注的熟食。",
    link: "https://www.gotokyo.org/en/see-and-do/drinking-and-dining/index.html",
    price: "¥1,500–3,000 / 人",
    meal: "晚餐候选",
    foodNote: "点单前确认是否刷鱼介酱汁；熟食也不要默认无鲑鱼成分。",
    checked: false,
  },
  {
    id: "meiji",
    title: "明治神宫",
    area: "原宿",
    category: "play",
    day: 3,
    lat: 35.6764,
    lng: 139.6993,
    note: "林荫步道很适合避开城市喧闹；穿舒适鞋。",
    link: "https://www.meijijingu.or.jp/en/",
  },
  {
    id: "harajuku",
    title: "原宿 · 表参道",
    area: "原宿",
    category: "shop",
    day: 3,
    lat: 35.669,
    lng: 139.707,
    note: "街头服饰、甜品和小店；Chiikawa 周边可顺路看官方店/期间限定店。",
    link: "https://www.gotokyo.org/en/destinations/western-tokyo/harajuku/index.html",
  },
  {
    id: "shibuya-sky",
    title: "SHIBUYA SKY",
    area: "涩谷",
    category: "play",
    day: 3,
    lat: 35.6584,
    lng: 139.702,
    note: "日落时段很抢手；天气好再订，雨天保留室内备选。",
    link: "https://www.gotokyo.org/en/spot/1749/index.html",
  },
  {
    id: "harajuku-crepe",
    title: "原宿可丽饼 / 甜品",
    area: "原宿 · 竹下通",
    category: "food",
    day: 3,
    lat: 35.6702,
    lng: 139.7058,
    note: "明治神宫后的轻量补给；把它当甜点，不和晚餐排成连续长距离。",
    link: "https://www.gotokyo.org/en/destinations/western-tokyo/harajuku/index.html",
    price: "¥700–1,500 / 人",
    meal: "下午茶",
    foodNote: "看奶油、酱料和装饰物成分；选择能确认原料的款式。",
    checked: false,
  },
  {
    id: "shibuya-yakiniku",
    title: "涩谷熟肉晚餐",
    area: "涩谷",
    category: "food",
    day: 3,
    lat: 35.6595,
    lng: 139.7005,
    note: "夜景前后安排坐下来的晚餐；用熟肉、米饭和蔬菜把这天收住。",
    link: "https://www.gotokyo.org/en/spot/1749/index.html",
    price: "¥3,000–6,000 / 人",
    meal: "晚餐",
    foodNote: "确认酱汁与共用烤网；女友的海鲜选择不要和你的餐具混用。",
    checked: false,
  },
  {
    id: "tokyo-base-stay",
    title: "东京基地：上野 / 浅草酒店",
    area: "上野 · 浅草之间",
    category: "stay",
    day: 1,
    lat: 35.7114,
    lng: 139.777,
    note: "主方案建议 4 晚不换酒店；靠近地铁或 JR 站，拖箱和早班机都更轻松。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
    price: "¥14,000–28,000 / 晚 / 双人房",
  },
  {
    id: "hakone-yumoto",
    title: "箱根汤本",
    area: "箱根",
    category: "stay",
    day: 4,
    lat: 35.2324,
    lng: 139.1069,
    note: "从东京一日往返的换乘节点；可安排日归温泉和温泉街。",
    link: "https://www.japan.travel/en/destinations/kanto/kanagawa/hakone-and-around/",
    price: "日归；住宿主方案仍住东京",
  },
  {
    id: "hakone-open-air",
    title: "箱根雕刻之森美术馆",
    area: "箱根",
    category: "play",
    day: 4,
    lat: 35.2466,
    lng: 139.0493,
    note: "户外艺术与自然结合；下雨时准备替换为室内馆。",
    link: "https://www.hakone-oam.or.jp/en/",
  },
  {
    id: "owakudani",
    title: "大涌谷",
    area: "箱根",
    category: "play",
    day: 4,
    lat: 35.2428,
    lng: 139.0206,
    note: "火山景观和黑鸡蛋；索道是否开放看风雨与运营公告。",
    link: "https://www.hakonenavi.jp/international/en/spot/223",
  },
  {
    id: "lake-ashi",
    title: "芦之湖 · 箱根神社",
    area: "元箱根",
    category: "play",
    day: 4,
    lat: 35.2048,
    lng: 139.0256,
    note: "天气好时再走这一段；时间不够时在雕刻之森和芦之湖之间二选一。",
    link: "https://www.hakonenavi.jp/international/en/",
  },
  {
    id: "hakone-soba",
    title: "箱根温泉街荞麦 / 熟食",
    area: "箱根汤本",
    category: "food",
    day: 4,
    lat: 35.2321,
    lng: 139.1064,
    note: "箱根午餐优先选热的荞麦、定食或烤物；不把温泉日变成赶场日。",
    link: "https://www.japan.travel/en/itineraries/outdoor-art-hot-spring-resorts-and-fuji-views-in-hakone/",
    price: "¥1,000–2,000 / 人",
    meal: "午餐",
    foodNote: "荞麦汤底也要问是否含鱼介；需要时选择成分更清楚的定食。",
    checked: false,
  },
  {
    id: "hakone-black-egg",
    title: "大涌谷黑鸡蛋 / 温泉街小食",
    area: "大涌谷",
    category: "food",
    day: 4,
    lat: 35.2428,
    lng: 139.0206,
    note: "和火山景观一起安排的小份体验；遇到风雨时直接删掉，不影响主线。",
    link: "https://www.hakonenavi.jp/international/en/spot/223",
    price: "¥500–1,500 / 人",
    meal: "小食",
    foodNote: "现场确认配料与售卖方式；不确定的调味品就不尝。",
    checked: false,
  },
  {
    id: "toyosu",
    title: "丰洲市场",
    area: "丰洲",
    category: "food",
    day: 5,
    lat: 35.6457,
    lng: 139.7878,
    note: "只适合晚班机版本；海鲜选择多，你需要再次确认熟食与交叉污染。",
    link: "https://www.toyosu-market.or.jp/en/",
    price: "¥2,000–5,000 / 人",
    meal: "早餐候选",
    foodNote: "女友可安排海鲜；你只选确认过的熟食，确认营业日和离场交通。",
    checked: false,
  },
  {
    id: "chiikawa-solamachi",
    title: "Chiikawa Land Tokyo Solamachi",
    area: "东京晴空塔",
    category: "shop",
    day: 5,
    lat: 35.7101,
    lng: 139.8107,
    note: "可以和晴空塔、浅草东侧一起安排；营业时间与进店规则先确认。",
    link: "https://en.www.tokyo-solamachi.jp/shop/1607/",
  },
];

const PLACES: Place[] = [
  {
    id: "sensoji",
    title: "浅草寺 / 雷门",
    area: "浅草",
    category: "play",
    day: 1,
    routeOrder: 2,
    lat: 35.7148,
    lng: 139.7967,
    note: "第一次到东京的文化开场；早上或傍晚更舒服，雷门到本堂约 40–60 分钟。",
    link: "https://www.senso-ji.jp/english/",
  },
  {
    id: "kappabashi",
    title: "合羽桥道具街",
    area: "浅草西侧",
    category: "shop",
    day: 1,
    routeOrder: 3,
    lat: 35.7125,
    lng: 139.7889,
    note: "厨房用品、食品模型和有趣伴手礼；和浅草寺步行串联，店铺多在傍晚前结束营业。",
    link: "https://www.gotokyo.org/en/spot/31/index.html",
  },
  {
    id: "asakusa-tempura",
    title: "浅草熟食：天妇罗 / 鳗鱼",
    area: "浅草 · 传法院通",
    category: "food",
    day: 1,
    routeOrder: 1,
    lat: 35.7127,
    lng: 139.7946,
    note: "第一顿安排热食，和浅草寺、仲见世一起慢慢逛；不用为了打卡硬吃刺身。",
    link: "https://www.gotokyo.org/en/see-and-do/drinking-and-dining/tokyo-local-food/index.html",
    price: "¥1,500–3,500 / 人",
    meal: "午餐",
    foodNote: "热食候选；确认酱汁、汤底与鱼类成分，必要时出示日语过敏卡。",
    checked: false,
  },
  {
    id: "asakusa-kissaten",
    title: "浅草喫茶 / 和甜点",
    area: "浅草",
    category: "drink",
    day: 1,
    routeOrder: 4,
    lat: 35.7137,
    lng: 139.7952,
    note: "走累时的低强度停靠点：咖啡、茶和和菓子，给第一天留一点余量。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
    price: "¥800–1,500 / 人",
    meal: "下午茶",
    foodNote: "优先看成分标示；不确定时选择包装明确的甜点或饮品。",
    checked: false,
  },
  {
    id: "ameyoko",
    title: "阿美横丁",
    area: "上野",
    category: "food",
    day: 1,
    routeOrder: 5,
    lat: 35.7074,
    lng: 139.7746,
    note: "街头小吃和折扣店集中；把晚餐控制在一条街内，减少第一天的步数。",
    link: "https://www.gotokyo.org/en/spot/24/index.html",
    price: "¥800–1,800 / 人",
    meal: "晚餐候选",
    foodNote: "熟食优先；拉面汤底、酱汁和鱼介成分仍要现场确认。",
    checked: false,
  },
  {
    id: "tokyo-base-stay",
    title: "东京基地：上野 / 浅草酒店",
    area: "上野 · 浅草之间",
    category: "stay",
    day: 1,
    routeOrder: 6,
    lat: 35.7114,
    lng: 139.777,
    note: "主方案住东京 3 晚；靠近地铁或 JR 站，拖箱、河口湖晚起往返和换城都更轻松。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
    price: "¥14,000–28,000 / 晚 / 双人房",
  },
  {
    id: "fuji-kawaguchiko",
    title: "河口湖站 · 富士山一日线",
    area: "河口湖",
    category: "play",
    day: 2,
    routeOrder: 1,
    lat: 35.4994,
    lng: 138.7689,
    note: "从新宿高速巴士往返的主节点；晚起版先确认回程班次，能见度优先于打卡数量。",
    link: "https://highway-buses.jp/course/kawaguchiko.php",
  },
  {
    id: "fuji-lawson",
    title: "河口湖站前便利店取景点",
    area: "河口湖站周边",
    category: "play",
    day: 2,
    routeOrder: 6,
    lat: 35.4992,
    lng: 138.7681,
    note: "只停留 20–30 分钟拍照和买水，不把网红机位当作整段行程。注意站前道路安全。",
  },
  {
    id: "chureito",
    title: "新仓山浅间公园 / 忠灵塔",
    area: "下吉田",
    category: "play",
    day: 2,
    routeOrder: 4,
    lat: 35.4958,
    lng: 138.8014,
    note: "经典富士山视角；台阶约 400 级，按 60–90 分钟预留，雨雾天及时降低期待。",
    link: "https://www.japan.travel/en/spot/1571/",
  },
  {
    id: "fuji-hoto",
    title: "ほうとう 炖面",
    area: "河口湖",
    category: "food",
    day: 2,
    routeOrder: 2,
    lat: 35.4975,
    lng: 138.7683,
    note: "富士五湖代表性热食；午餐排队时优先保留 60 分钟，不为一家店打乱回程巴士。",
    price: "¥1,500–2,500 / 人",
    meal: "午餐",
    foodNote: "点单时确认汤底、鱼介和鲑鱼成分；可优先选蔬菜或肉类炖面。",
    checked: false,
  },
  {
    id: "fuji-tenjo",
    title: "天上山公园缆车",
    area: "河口湖畔",
    category: "play",
    day: 2,
    routeOrder: 3,
    lat: 35.5069,
    lng: 138.7801,
    note: "天气好时看富士山和湖面；排队超过 30 分钟就改为湖畔散步，把时间留给回程。",
    link: "https://www.mtfujiropeway.jp/",
  },
  {
    id: "oishi-park",
    title: "大石公园",
    area: "河口湖北岸",
    category: "play",
    day: 2,
    routeOrder: 5,
    lat: 35.5263,
    lng: 138.7548,
    note: "湖畔、花田和富士山的天气备选；适合把节奏放慢 45–60 分钟。",
    link: "https://fujisan.ne.jp/en/",
  },
  {
    id: "tokyo-chiikawa",
    title: "ちいかわらんど TOKYO Station",
    area: "东京站 Character Street",
    category: "shop",
    day: 3,
    routeOrder: 1,
    lat: 35.6812,
    lng: 139.7671,
    note: "Chiikawa 采购主任务：东京限定、毛绒和小挂件优先；入场方式、库存以当天官方信息为准。",
    link: "https://www.tokyoeki-1bangai.co.jp/shop/detail/?cd=000198",
  },
  {
    id: "marunouchi",
    title: "东京站丸之内站舍",
    area: "丸之内",
    category: "play",
    day: 3,
    routeOrder: 2,
    lat: 35.6814,
    lng: 139.7658,
    note: "从 Character Street 上到地面拍红砖站舍；不额外塞远景点，给购物留弹性。",
    link: "https://www.gotokyo.org/en/spot/1750/index.html",
  },
  {
    id: "ginza",
    title: "银座中央通",
    area: "银座",
    category: "shop",
    day: 3,
    routeOrder: 3,
    lat: 35.6717,
    lng: 139.765,
    note: "百货、药妆、甜点和品牌集中；把预算留给真正想买的东西，下午再逛更从容。",
    link: "https://www.gotokyo.org/en/destinations/central-tokyo/ginza/index.html",
  },
  {
    id: "ginza-dessert",
    title: "银座喫茶 / 甜点",
    area: "银座",
    category: "drink",
    day: 3,
    routeOrder: 4,
    lat: 35.6722,
    lng: 139.7657,
    note: "把购物拆成两段，中间坐下来喝茶；比连续逛百货更不累。",
    price: "¥900–2,000 / 人",
    meal: "下午茶",
    foodNote: "咖啡、茶和甜点；过敏原以店内标示为准。",
    checked: false,
  },
  {
    id: "akihabara",
    title: "秋叶原电气街",
    area: "秋叶原",
    category: "shop",
    day: 3,
    routeOrder: 5,
    lat: 35.6984,
    lng: 139.7731,
    note: "把秋叶原安排在傍晚：Radio Kaikan、扭蛋、二手店集中，喜欢的动漫只看 Chiikawa 相关即可。",
    link: "https://www.gotokyo.org/en/destinations/central-tokyo/akihabara/index.html",
  },
  {
    id: "radio-kaikan",
    title: "秋叶原 Radio Kaikan",
    area: "秋叶原站电气街口",
    category: "shop",
    day: 3,
    routeOrder: 6,
    lat: 35.6981,
    lng: 139.7717,
    note: "适合集中比较周边价格；二手商品检查盒况、配件和是否为正版。",
    link: "https://akihabara-radiokaikan.co.jp/",
  },
  {
    id: "kanda-myojin",
    title: "神田明神",
    area: "御茶之水 · 秋叶原",
    category: "play",
    day: 3,
    routeOrder: 7,
    lat: 35.702,
    lng: 139.7673,
    note: "秋叶原购物后的 30–45 分钟文化收尾；天黑后注意返回车站的路线。",
    link: "https://www.kandamyoujin.or.jp/",
  },
  {
    id: "tokyo-yakitori",
    title: "秋叶原 / 东京站熟食晚餐",
    area: "秋叶原或东京站",
    category: "food",
    day: 3,
    routeOrder: 8,
    lat: 35.6988,
    lng: 139.773,
    note: "用鸡肉、烤物、米饭把购物日收住；晚餐不要再跑去很远的店。",
    price: "¥1,500–3,000 / 人",
    meal: "晚餐",
    foodNote: "点单前确认是否刷鱼介酱汁；熟食也不要默认无鲑鱼成分。",
    checked: false,
  },
  {
    id: "osaka-namba-stay",
    title: "大阪住宿：难波 / 心斋桥",
    area: "难波站步行圈",
    category: "stay",
    day: 4,
    routeOrder: 7,
    lat: 34.6687,
    lng: 135.5013,
    note: "大阪只住 1 晚，优先选难波或心斋桥：晚餐、购物和第二天去关西机场都顺。",
    price: "¥12,000–25,000 / 晚 / 双人房",
  },
  {
    id: "osaka-castle",
    title: "大阪城天守阁",
    area: "大阪城公园",
    category: "play",
    day: 4,
    routeOrder: 1,
    lat: 34.6873,
    lng: 135.5262,
    note: "建议开馆后不久到；天守阁官方开放 9:00–18:00，馆内约 60 分钟，公园步行另留时间。",
    link: "https://www.osakacastle.net/english/",
  },
  {
    id: "shinsaibashi",
    title: "心斋桥筋商店街",
    area: "心斋桥",
    category: "shop",
    day: 4,
    routeOrder: 2,
    lat: 34.6721,
    lng: 135.5005,
    note: "从大阪城向难波移动时顺路购物；药妆和伴手礼尽量集中买，别把行李拖散。",
    link: "https://osaka-info.jp/en/spot/shinsaibashi-suji/",
  },
  {
    id: "dotonbori",
    title: "道顿堀 · 戎桥",
    area: "难波",
    category: "play",
    day: 4,
    routeOrder: 3,
    lat: 34.6687,
    lng: 135.5013,
    note: "夜间看霓虹、格力高跑男和河道；晚餐就在附近解决，避免景点与餐厅来回折返。",
    link: "https://osaka-info.jp/en/spot/dotonbori/",
  },
  {
    id: "osaka-okonomiyaki",
    title: "大阪烧",
    area: "道顿堀 / 心斋桥",
    category: "food",
    day: 4,
    routeOrder: 4,
    lat: 34.6694,
    lng: 135.5022,
    note: "大阪代表性热食；可点猪肉、牛肉或蔬菜款，把海鲜和柴鱼片单独排除。",
    price: "¥1,200–2,500 / 人",
    meal: "晚餐",
    foodNote: "明确说不要鲑鱼和海鲜，确认柴鱼片、鱼粉、酱汁与共用铁板。",
    checked: false,
  },
  {
    id: "osaka-takoyaki",
    title: "章鱼烧",
    area: "道顿堀小吃街",
    category: "food",
    day: 4,
    routeOrder: 5,
    lat: 34.6681,
    lng: 135.5032,
    note: "只作为女友的小吃体验；你若对其他海鲜也敏感就跳过，改吃肉类或甜点。",
    price: "¥600–1,200 / 份",
    meal: "小食",
    foodNote: "含章鱼、鱼粉或柴鱼片；你不要因为“熟了”就默认安全。",
    checked: false,
  },
  {
    id: "osaka-kushikatsu",
    title: "新世界串炸",
    area: "通天阁 / 新世界",
    category: "food",
    day: 4,
    routeOrder: 6,
    lat: 34.6525,
    lng: 135.5063,
    note: "如果体力和时间允许再加；从道顿堀过去约 15–20 分钟，和大阪烧二选一更舒服。",
    price: "¥1,500–3,000 / 人",
    meal: "晚餐备选",
    foodNote: "优先肉类和蔬菜串，确认面糊、蘸酱与共用炸锅的交叉污染。",
    checked: false,
  },
  {
    id: "kuromon",
    title: "黑门市场",
    area: "日本桥 · 难波",
    category: "food",
    day: 5,
    routeOrder: 1,
    lat: 34.6657,
    lng: 135.5063,
    note: "返程日早餐 / 早午餐；店铺营业时间差异大，晚班机版本才安排，早班机直接删掉。",
    link: "https://kuromon.com/en/",
    price: "¥1,000–3,000 / 人",
    meal: "早餐 / 早午餐",
    foodNote: "女友可选海鲜，你选择确认过的烤物、玉子烧或其他熟食，并避免共用餐具。",
    checked: false,
  },
  {
    id: "namba-yasaka",
    title: "难波八阪神社",
    area: "难波",
    category: "play",
    day: 5,
    routeOrder: 2,
    lat: 34.6621,
    lng: 135.4959,
    note: "巨大狮子头适合安排 30–45 分钟；离难波近，适合放在取行李前。",
    link: "https://osaka-info.jp/en/spot/nambayasaka-jinja/",
  },
  {
    id: "osaka-coffee",
    title: "难波咖啡 / 返程补给",
    area: "难波",
    category: "drink",
    day: 5,
    routeOrder: 3,
    lat: 34.6674,
    lng: 135.5011,
    note: "把最后一小时留给坐下、整理购物袋和确认机场交通，不要把返程日排满。",
    price: "¥700–1,500 / 人",
    meal: "咖啡 / 甜点",
    foodNote: "看成分标示；优先选原料清楚的饮品和包装甜点。",
    checked: false,
  },
];

// The first version of the site shipped with a 5-day sample. Keep that literal
// above so old exports can still be migrated, then replace the visible defaults
// with the 8-day plan below.
const UPDATED_PLACES: Place[] = [
  {
    id: "asakusa-tempura",
    title: "浅草熟食：天妇罗 / 鳗鱼",
    area: "浅草 · 传法院通",
    category: "food",
    day: 1,
    routeOrder: 1,
    lat: 35.7127,
    lng: 139.7946,
    note: "落地后的第一顿安排热食；不用为了‘第一次’硬吃刺身，先把过敏风险降下来。",
    link: "https://www.gotokyo.org/en/see-and-do/drinking-and-dining/tokyo-local-food/index.html",
    price: "¥1,500–3,500 / 人",
    meal: "午餐 / 早晚餐",
    foodNote: "确认酱汁、汤底、鱼类成分与共用餐具；不确定就换成成分清楚的肉类定食。",
    checked: false,
  },
  {
    id: "sensoji",
    title: "浅草寺 / 雷门",
    area: "浅草",
    category: "play",
    day: 1,
    routeOrder: 2,
    lat: 35.7148,
    lng: 139.7967,
    note: "第一次到东京的文化开场；雷门、仲见世、本堂约 60–90 分钟，傍晚比正午舒服。",
    link: "https://www.senso-ji.jp/english/",
  },
  {
    id: "kappabashi",
    title: "合羽桥道具街",
    area: "浅草西侧",
    category: "shop",
    day: 1,
    routeOrder: 3,
    lat: 35.7125,
    lng: 139.7889,
    note: "食品模型、厨具和伴手礼集中；店铺多在傍晚前结束营业，体力不足可直接删。",
    link: "https://www.gotokyo.org/en/spot/31/index.html",
  },
  {
    id: "asakusa-kissaten",
    title: "浅草喫茶 / 和甜点",
    area: "浅草",
    category: "drink",
    day: 1,
    routeOrder: 4,
    lat: 35.7137,
    lng: 139.7952,
    note: "第一天的低强度停靠点：咖啡、茶和和菓子，给入境和拖箱留余量。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
    price: "¥800–1,500 / 人",
    meal: "下午茶",
    foodNote: "优先看成分标示；不确定时选择包装明确的饮品或甜点。",
    checked: false,
  },
  {
    id: "ameyoko",
    title: "阿美横丁",
    area: "上野",
    category: "food",
    day: 1,
    routeOrder: 5,
    lat: 35.7074,
    lng: 139.7746,
    note: "街头小吃、药妆和折扣店集中；晚餐控制在一条街内，减少第一天的步数。",
    link: "https://www.gotokyo.org/en/spot/24/index.html",
    price: "¥800–1,800 / 人",
    meal: "晚餐候选",
    foodNote: "熟食优先；拉面汤底、酱汁和鱼介成分仍要现场确认。",
    checked: false,
  },
  {
    id: "tokyo-base-stay",
    title: "东京基地：上野 / 浅草酒店",
    area: "上野 · 浅草之间",
    category: "stay",
    day: 1,
    routeOrder: 6,
    lat: 35.7114,
    lng: 139.777,
    note: "东京连续住 3 晚；优先地铁或 JR 站步行圈，方便河口湖与后续换城。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
    price: "¥14,000–28,000 / 晚 / 双人房",
  },
  {
    id: "tokyo-chiikawa",
    title: "ちいかわらんど TOKYO Station",
    area: "东京站 Character Street",
    category: "shop",
    day: 2,
    routeOrder: 1,
    lat: 35.6812,
    lng: 139.7671,
    note: "Chiikawa 采购主任务：东京限定、毛绒和小挂件优先；库存、限购和入场以当天官方公告为准。",
    link: "https://www.tokyoeki-1bangai.co.jp/shop/detail/?cd=000198",
  },
  {
    id: "ginza",
    title: "银座中央通",
    area: "银座",
    category: "shop",
    day: 2,
    routeOrder: 3,
    lat: 35.6717,
    lng: 139.765,
    note: "百货、药妆、甜点和品牌集中；大件集中装袋，别带着战利品逛到深夜。",
    link: "https://www.gotokyo.org/en/destinations/central-tokyo/ginza/index.html",
  },
  {
    id: "ginza-dessert",
    title: "银座喫茶 / 甜点",
    area: "银座",
    category: "drink",
    day: 2,
    routeOrder: 4,
    lat: 35.6722,
    lng: 139.7657,
    note: "把购物拆成两段，中间坐下来喝茶；这是当天的体力缓冲，不建议跳过。",
    price: "¥900–2,000 / 人",
    meal: "下午茶",
    foodNote: "咖啡、茶和甜点；过敏原以店内标示为准。",
    checked: false,
  },
  {
    id: "tsukiji",
    title: "筑地场外市场（女友生鱼体验）",
    area: "筑地",
    category: "food",
    day: 2,
    routeOrder: 2,
    lat: 35.6655,
    lng: 139.7708,
    note: "从东京站南下先到筑地，之后向北进入银座；女友可单独安排寿司 / 刺身，你改选玉子烧、烤物等确认过的熟食。",
    link: "https://www.tsukiji.or.jp/english/",
    price: "¥2,000–5,000 / 人",
    meal: "早午餐 / 小食",
    foodNote: "你必须说明鲑鱼过敏并确认交叉污染；不要共用餐具、酱油碟或不明汤底。",
    checked: false,
  },
  {
    id: "akihabara",
    title: "秋叶原电气街",
    area: "秋叶原",
    category: "shop",
    day: 2,
    routeOrder: 5,
    lat: 35.6984,
    lng: 139.7731,
    note: "下午到晚上逛 Radio Kaikan、扭蛋和二手店；动漫只看你们真正喜欢的 Chiikawa 相关。",
    link: "https://www.gotokyo.org/en/destinations/central-tokyo/akihabara/index.html",
  },
  {
    id: "radio-kaikan",
    title: "秋叶原 Radio Kaikan",
    area: "秋叶原站电气街口",
    category: "shop",
    day: 2,
    routeOrder: 6,
    lat: 35.6981,
    lng: 139.7717,
    note: "集中比较周边价格；二手商品检查盒况、配件、价格牌和是否为正版。",
    link: "https://akihabara-radiokaikan.co.jp/",
  },
  {
    id: "kanda-myojin",
    title: "神田明神",
    area: "御茶之水 · 秋叶原",
    category: "play",
    day: 2,
    routeOrder: 7,
    lat: 35.702,
    lng: 139.7673,
    note: "购物后的 30–45 分钟文化收尾；排队或购物超时就删掉，不影响主线。",
    link: "https://www.kandamyoujin.or.jp/",
  },
  {
    id: "tokyo-yakitori",
    title: "秋叶原熟食晚餐",
    area: "秋叶原",
    category: "food",
    day: 2,
    routeOrder: 8,
    lat: 35.6988,
    lng: 139.773,
    note: "用鸡肉、烤物、米饭把购物日收住；晚餐不再跑去很远的店。",
    price: "¥1,500–3,000 / 人",
    meal: "晚餐",
    foodNote: "点单前确认是否刷鱼介酱汁；熟食也不要默认没有鲑鱼成分。",
    checked: false,
  },
  {
    id: "fuji-kawaguchiko",
    title: "河口湖站 · 富士山一日线",
    area: "河口湖",
    category: "play",
    day: 3,
    routeOrder: 1,
    lat: 35.4994,
    lng: 138.7689,
    note: "从新宿高速巴士往返的主节点；晚起版只做湖畔 + 一个高匹配机位，能见度优先于打卡数量。",
    link: "https://highway-buses.jp/course/kawaguchiko.php",
  },
  {
    id: "fuji-hoto",
    title: "ほうとう 炖面",
    area: "河口湖",
    category: "food",
    day: 3,
    routeOrder: 2,
    lat: 35.4975,
    lng: 138.7683,
    note: "富士五湖代表性热食；排队超过 30 分钟就换店，不为一家店错过回程车。",
    price: "¥1,500–2,500 / 人",
    meal: "午餐",
    foodNote: "确认汤底、鱼介和鲑鱼成分；优先选蔬菜或肉类炖面。",
    checked: false,
  },
  {
    id: "fuji-tenjo",
    title: "天上山公园缆车",
    area: "河口湖畔",
    category: "play",
    day: 3,
    routeOrder: 3,
    lat: 35.5069,
    lng: 138.7801,
    note: "天气好时看富士山和湖面；排队超过 30 分钟就改湖畔散步。",
    link: "https://www.mtfujiropeway.jp/",
  },
  {
    id: "oishi-park",
    title: "大石公园（二选一）",
    area: "河口湖北岸",
    category: "play",
    day: 3,
    routeOrder: 4,
    lat: 35.5263,
    lng: 138.7548,
    note: "湖畔、花田与富士山的天气备选；想少爬台阶时选这里，慢慢走 45–60 分钟。",
    link: "https://fujisan.ne.jp/en/",
  },
  {
    id: "chureito",
    title: "新仓山浅间公园 / 忠灵塔（二选一）",
    area: "下吉田",
    category: "play",
    day: 3,
    routeOrder: 5,
    lat: 35.4958,
    lng: 138.8014,
    note: "经典富士山视角；约 400 级台阶，预留 60–90 分钟，雨雾天降低期待。",
    link: "https://www.japan.travel/en/spot/1571/",
  },
  {
    id: "fuji-lawson",
    title: "河口湖站前便利店取景点（备选）",
    area: "河口湖站周边",
    category: "play",
    day: 3,
    routeOrder: 6,
    lat: 35.4992,
    lng: 138.7681,
    note: "只停留 20–30 分钟拍照和买水；注意站前道路安全，不为网红机位压缩返程。",
  },
  {
    id: "kamakura-station",
    title: "镰仓站 / 小町通",
    area: "镰仓",
    category: "play",
    day: 4,
    routeOrder: 1,
    lat: 35.3192,
    lng: 139.5467,
    note: "东京日归海岸线的起点；从上野出发预留约 1 小时，车票与返程时间先看好。",
    link: "https://www.japan.travel/en/destinations/kanto/kanagawa/kamakura-and-around/",
  },
  {
    id: "kamakura-food",
    title: "镰仓熟食午餐",
    area: "小町通 / 镰仓站周边",
    category: "food",
    day: 4,
    routeOrder: 2,
    lat: 35.3198,
    lng: 139.5502,
    note: "先吃热食再逛寺院；豆腐、咖喱、烤物和定食比现场临时挑战生海鲜更稳。",
    price: "¥1,500–3,000 / 人",
    meal: "午餐",
    foodNote: "确认汤底、鱼介、鲑鱼和共用餐具；女友想吃海鲜就分开点单。",
    checked: false,
  },
  {
    id: "kotoku-in",
    title: "高德院 / 镰仓大佛",
    area: "长谷",
    category: "play",
    day: 4,
    routeOrder: 3,
    lat: 35.3167,
    lng: 139.5367,
    note: "第一次镰仓优先级高；停留 45–60 分钟，和长谷寺二选一深逛。",
    link: "https://www.kotoku-in.jp/en/",
  },
  {
    id: "hasedera",
    title: "长谷寺",
    area: "长谷",
    category: "play",
    day: 4,
    routeOrder: 4,
    lat: 35.3126,
    lng: 139.5339,
    note: "寺院、海景和坡道结合；体力不足时和大佛二选一，别把镰仓排成打卡冲刺。",
    link: "https://www.hasedera.jp/en/",
  },
  {
    id: "shichirigahama",
    title: "七里滨海岸",
    area: "镰仓海岸",
    category: "play",
    day: 4,
    routeOrder: 5,
    lat: 35.3068,
    lng: 139.5146,
    note: "用江之电串起海岸线；看天气和风力决定停留 30–45 分钟，海边不要靠近危险区域。",
    link: "https://www.japan.travel/en/uk/uk/inspiration/meet-the-great-buddha-of-kamakura/",
  },
  {
    id: "enoshima",
    title: "江之岛",
    area: "江之岛",
    category: "play",
    day: 4,
    routeOrder: 6,
    lat: 35.2997,
    lng: 139.4811,
    note: "日落前逛神社与海边；如果当天阴雨，停留缩短，把返程安全放在第一位。",
    link: "https://www.japan.travel/en/destinations/kanto/kanagawa/enoshima/",
  },
  {
    id: "shibuya-sky",
    title: "SHIBUYA SKY（回东京后备选）",
    area: "涩谷",
    category: "play",
    day: 4,
    routeOrder: 7,
    lat: 35.6584,
    lng: 139.702,
    note: "只有回东京不累且天气好才加；门票要提前看，雨天直接删掉。",
    link: "https://www.gotokyo.org/en/spot/1749/index.html",
  },
  {
    id: "kyoto-base-stay",
    title: "京都基地：四条乌丸 / 河原町酒店",
    area: "四条乌丸或河原町站步行圈",
    category: "stay",
    day: 5,
    routeOrder: 1,
    lat: 35.0037,
    lng: 135.7633,
    note: "连续住 2 晚；去锦市场、祇园、奈良和大阪都顺，优先选可寄存行李的酒店。",
    link: "https://kyoto.travel/en/",
    price: "¥16,000–30,000 / 晚 / 双人房",
  },
  {
    id: "fushimi-inari",
    title: "伏见稻荷大社",
    area: "京都南部",
    category: "play",
    day: 5,
    routeOrder: 2,
    lat: 34.9671,
    lng: 135.7727,
    note: "第一次京都很值得加入的千本鸟居；抵达日只走入口到中腹，不追求完整登山。",
    link: "https://inari.jp/en/",
  },
  {
    id: "nishiki",
    title: "锦市场熟食小吃",
    area: "京都 · 锦市场",
    category: "food",
    day: 5,
    routeOrder: 3,
    lat: 35.005,
    lng: 135.764,
    note: "抵达京都后的轻量午后；只挑能问清成分的熟食，不追求把整条市场都吃完。",
    link: "https://www.kyoto-nishiki.or.jp/en/",
    price: "¥1,500–3,000 / 人",
    meal: "午餐 / 小食",
    foodNote: "确认鱼介、柴鱼片、鲑鱼和共用夹具；你的首选是肉类、玉子或明确标注的蔬食。",
    checked: false,
  },
  {
    id: "teramachi",
    title: "寺町 · 新京极商店街",
    area: "河原町",
    category: "shop",
    day: 5,
    routeOrder: 4,
    lat: 35.0065,
    lng: 135.7688,
    note: "适合雨天购物和找伴手礼；不用在换城日再跑远处景点。",
    link: "https://kyoto.travel/en/",
  },
  {
    id: "yasaka",
    title: "八坂神社",
    area: "祇园",
    category: "play",
    day: 5,
    routeOrder: 5,
    lat: 35.0037,
    lng: 135.7785,
    note: "傍晚进入祇园的门；留 30–45 分钟拍照和参拜，尊重当地居民与禁止拍摄区域。",
    link: "https://www.yasaka-jinja.or.jp/en/",
  },
  {
    id: "hanamikoji",
    title: "花见小路 · 祇园白川",
    area: "祇园",
    category: "play",
    day: 5,
    routeOrder: 6,
    lat: 35.0024,
    lng: 135.7761,
    note: "慢走看町家；不拦人、不追拍艺伎，夜间保持安静。",
    link: "https://kyoto.travel/en/areas/gion/",
  },
  {
    id: "kiyomizu",
    title: "清水寺 / 二年坂三年坂",
    area: "东山",
    category: "play",
    day: 5,
    routeOrder: 7,
    lat: 34.9949,
    lng: 135.785,
    note: "若体力尚可再走到清水寺；店铺和坡道多，雨天穿防滑鞋，排队时给自己留余量。",
    link: "https://www.kiyomizudera.or.jp/en/",
  },
  {
    id: "pontocho",
    title: "先斗町 / 鴨川晚餐",
    area: "四条河原町",
    category: "food",
    day: 5,
    routeOrder: 8,
    lat: 35.0065,
    lng: 135.7705,
    note: "晚上回到交通方便的河原町；优先熟食、烤物或烧肉，海鲜由女友单独安排。",
    price: "¥2,500–5,000 / 人",
    meal: "晚餐",
    foodNote: "确认出汁、酱汁、鲑鱼与共用烤网；准备日语过敏卡。",
    checked: false,
  },
  {
    id: "nara-park",
    title: "奈良公园 / 鹿群",
    area: "奈良公园",
    category: "play",
    day: 6,
    routeOrder: 1,
    lat: 34.6851,
    lng: 135.843,
    note: "京都出发约 45–60 分钟；鹿仙贝只在指定处购买，包和地图收好，保持距离。",
    link: "https://www.visitnara.jp/venues/A00535/",
  },
  {
    id: "nara-food",
    title: "奈良熟食：柿叶寿司 / 茶粥改选",
    area: "奈良公园周边",
    category: "food",
    day: 6,
    routeOrder: 2,
    lat: 34.6812,
    lng: 135.828,
    note: "柿叶寿司对你不一定安全，列为女友体验；你选择确认过的定食、乌冬或肉类。",
    price: "¥1,200–3,000 / 人",
    meal: "午餐",
    foodNote: "再次排除鲑鱼、鱼介出汁与交叉污染；不要把‘熟制’当作过敏安全保证。",
    checked: false,
  },
  {
    id: "todaiji",
    title: "东大寺大佛殿",
    area: "奈良公园",
    category: "play",
    day: 6,
    routeOrder: 3,
    lat: 34.6889,
    lng: 135.8398,
    note: "奈良文化主线；预留 60–90 分钟，和鹿群、春日大社之间按体力取舍。",
    link: "https://www.todaiji.or.jp/en/",
  },
  {
    id: "kasuga-taisha",
    title: "春日大社",
    area: "奈良公园东侧",
    category: "play",
    day: 6,
    routeOrder: 4,
    lat: 34.6814,
    lng: 135.8481,
    note: "森林参道和灯笼很有氛围；如果下午下雨或走累了，可换成若草山远眺。",
    link: "https://www.kasugataisha.or.jp/en/",
  },
  {
    id: "wakakusayama",
    title: "若草山（天气好再上）",
    area: "奈良公园东侧",
    category: "play",
    day: 6,
    routeOrder: 5,
    lat: 34.6855,
    lng: 135.8547,
    note: "想看城市远景再走；不把它和春日大社都当成必须，按当日步数删一个。",
    link: "https://www.visitnara.jp/venues/A00536/",
  },
  {
    id: "kamo-river",
    title: "鴨川散步",
    area: "京都四条",
    category: "play",
    day: 6,
    routeOrder: 6,
    lat: 35.0116,
    lng: 135.7681,
    note: "回京都后的低强度收尾；坐在河边休息，不再加远处景点。",
  },
  {
    id: "kyoto-night-food",
    title: "京都晚餐：烧肉 / 乌冬 / 定食",
    area: "四条河原町",
    category: "food",
    day: 6,
    routeOrder: 7,
    lat: 35.0058,
    lng: 135.7686,
    note: "奈良回程后选择离酒店近的熟食；给第二天进大阪留体力。",
    price: "¥2,000–4,500 / 人",
    meal: "晚餐",
    foodNote: "点单前说明鲑鱼过敏，确认出汁、酱汁与共用烤网。",
    checked: false,
  },
  {
    id: "osaka-namba-stay",
    title: "大阪住宿：难波 / 心斋桥",
    area: "难波站步行圈",
    category: "stay",
    day: 7,
    routeOrder: 1,
    lat: 34.6687,
    lng: 135.5013,
    note: "最后一晚住难波；去道顿堀、黑门和第二天 KIX 都方便，少拖一次箱。",
    price: "¥14,000–26,000 / 晚 / 双人房",
  },
  {
    id: "kuromon",
    title: "黑门市场",
    area: "日本桥 · 难波",
    category: "food",
    day: 7,
    routeOrder: 2,
    lat: 34.6657,
    lng: 135.5063,
    note: "从京都到大阪后若还没到午后可安排；女友吃海鲜，你选烤物、玉子烧等确认过的熟食。",
    link: "https://kuromon.com/en/",
    price: "¥1,000–3,000 / 人",
    meal: "午餐 / 小食",
    foodNote: "不同摊位共用夹具和餐台风险高；你的食物要单独确认，不共用蘸料。",
    checked: false,
  },
  {
    id: "osaka-castle",
    title: "大阪城天守阁",
    area: "大阪城公园",
    category: "play",
    day: 7,
    routeOrder: 3,
    lat: 34.6873,
    lng: 135.5262,
    note: "大阪文化主线；天守阁约 60 分钟，公园和换乘另留 1 小时。",
    link: "https://www.osakacastle.net/english/",
  },
  {
    id: "umeda-sky",
    title: "梅田蓝天大厦",
    area: "梅田",
    category: "play",
    day: 7,
    routeOrder: 4,
    lat: 34.7053,
    lng: 135.4897,
    note: "日落前后看大阪城市线；若下雨或预约困难，就把时间让给难波购物。",
    link: "https://www.skybldg.co.jp/en/",
  },
  {
    id: "shinsaibashi",
    title: "心斋桥筋商店街",
    area: "心斋桥",
    category: "shop",
    day: 7,
    routeOrder: 5,
    lat: 34.6721,
    lng: 135.5005,
    note: "集中完成药妆和伴手礼；保留发票与免税包装，别为了折扣走到很远。",
    link: "https://osaka-info.jp/en/spot/shinsaibashi-suji/",
  },
  {
    id: "dotonbori",
    title: "道顿堀 · 戎桥",
    area: "难波",
    category: "play",
    day: 7,
    routeOrder: 6,
    lat: 34.6687,
    lng: 135.5013,
    note: "夜间看霓虹、格力高跑男和河道；晚餐就在附近解决，避免来回折返。",
    link: "https://osaka-info.jp/en/spot/dotonbori/",
  },
  {
    id: "osaka-okonomiyaki",
    title: "大阪烧（肉 / 蔬菜款）",
    area: "道顿堀 / 心斋桥",
    category: "food",
    day: 7,
    routeOrder: 7,
    lat: 34.6694,
    lng: 135.5022,
    note: "大阪代表性热食；你点肉类或蔬菜款，女友的海鲜版本单独确认。",
    price: "¥1,200–2,500 / 人",
    meal: "晚餐",
    foodNote: "明确说不要鲑鱼和海鲜，确认柴鱼片、鱼粉、酱汁与共用铁板。",
    checked: false,
  },
  {
    id: "osaka-takoyaki",
    title: "章鱼烧（女友小吃体验）",
    area: "道顿堀小吃街",
    category: "food",
    day: 7,
    routeOrder: 8,
    lat: 34.6681,
    lng: 135.5032,
    note: "只作为女友的小吃体验；你若对其他海鲜也敏感就跳过，改吃肉类或甜点。",
    price: "¥600–1,200 / 份",
    meal: "小食",
    foodNote: "含章鱼、鱼粉或柴鱼片；你不要因为‘熟了’就默认安全。",
    checked: false,
  },
  {
    id: "osaka-kushikatsu",
    title: "新世界串炸（备选）",
    area: "通天阁 / 新世界",
    category: "food",
    day: 7,
    routeOrder: 9,
    lat: 34.6525,
    lng: 135.5063,
    note: "和大阪烧二选一；优先肉类和蔬菜串，确认面糊、蘸酱与共用炸锅。",
    price: "¥1,500–3,000 / 人",
    meal: "晚餐备选",
    foodNote: "确认炸锅和酱汁交叉污染，无法确认就不点。",
    checked: false,
  },
  {
    id: "namba-yasaka",
    title: "难波八阪神社",
    area: "难波",
    category: "play",
    day: 8,
    routeOrder: 1,
    lat: 34.6621,
    lng: 135.4959,
    note: "返程日的 30–45 分钟文化收尾；离难波近，适合取行李前安排。",
    link: "https://osaka-info.jp/en/spot/nambayasaka-jinja/",
  },
  {
    id: "osaka-coffee",
    title: "难波咖啡 / 最后整理",
    area: "难波",
    category: "drink",
    day: 8,
    routeOrder: 2,
    lat: 34.6674,
    lng: 135.5011,
    note: "最后确认护照、充电宝、药物和免税袋；不要再开启一段跨区购物。",
    price: "¥700–1,500 / 人",
    meal: "咖啡 / 甜点",
    foodNote: "看成分标示；优先选原料清楚的饮品和包装甜点。",
    checked: false,
  },
  {
    id: "namba-shopping",
    title: "难波最后采购",
    area: "难波 / 心斋桥",
    category: "shop",
    day: 8,
    routeOrder: 3,
    lat: 34.6688,
    lng: 135.5018,
    note: "只买清单内缺的东西；返程日不要把免税手续和机场交通压到最后。",
  },
  {
    id: "kix-airport",
    title: "关西国际机场 KIX",
    area: "大阪湾",
    category: "play",
    day: 8,
    routeOrder: 4,
    lat: 34.4347,
    lng: 135.244,
    note: "国际航班按起飞前 2.5–3 小时抵达倒推；若是早班机，前一晚改住临空城或机场附近。",
    link: "https://www.kansai-airport.or.jp/en/",
  },
];

const FLIGHT_ROUTE_EXTRA_PLACES: Place[] = [
  {
    id: "tsukiji-d1-breakfast",
    title: "筑地场外市场 · D1 早饭",
    area: "筑地",
    category: "food",
    day: 1,
    routeOrder: 1,
    lat: 35.6655,
    lng: 139.7708,
    note: "8/30 05:00 羽田落地后直接进城；周日部分店铺可能休息，前一晚确认营业店。女友海鲜、你选择能问清成分的熟食。",
    link: "https://www.tsukiji.or.jp/english/shopping/",
    price: "¥2,000–6,000 / 两人",
    meal: "早餐",
    foodNote: "你必须说明鲑鱼过敏并确认交叉污染；不要共用餐具、酱油碟或不明汤底。",
    checked: false,
  },
  {
    id: "kyoto-arrival-stay",
    title: "京都基地：四条乌丸 / 河原町酒店",
    area: "四条乌丸或河原町站步行圈",
    category: "stay",
    day: 4,
    routeOrder: 1,
    lat: 35.0037,
    lng: 135.7633,
    note: "D4 东京乘新干线抵达后先寄存行李；连续住京都 2 晚，不在京都内再换酒店。",
    link: "https://kyoto.travel/en/",
    price: "¥16,000–30,000 / 晚 / 双人房",
  },
  {
    id: "kyoto-arrival-nishiki",
    title: "锦市场熟食小吃",
    area: "京都 · 锦市场",
    category: "food",
    day: 4,
    routeOrder: 2,
    lat: 35.005,
    lng: 135.764,
    note: "东京到京都后只逛市场中段；你优先选择肉类、玉子或明确标注的蔬食，女友再单独看海鲜。",
    link: "https://www.kyoto-nishiki.or.jp/en/",
    price: "¥1,500–3,000 / 人",
    meal: "下午茶 / 小食",
    foodNote: "逐项确认鱼介、柴鱼片、鲑鱼和共用夹具；不要因为是熟食就默认安全。",
    checked: false,
  },
  {
    id: "kyoto-arrival-teramachi",
    title: "寺町 · 新京极商店街",
    area: "河原町",
    category: "shop",
    day: 4,
    routeOrder: 3,
    lat: 35.0065,
    lng: 135.7688,
    note: "与锦市场相邻，适合换城日室内逛；只买轻便伴手礼，不把箱子提前塞满。",
    link: "https://kyoto.travel/en/",
  },
  {
    id: "kyoto-arrival-yasaka",
    title: "八坂神社",
    area: "祇园",
    category: "play",
    day: 4,
    routeOrder: 4,
    lat: 35.0037,
    lng: 135.7785,
    note: "从河原町向东走进祇园的第一站；留 30–45 分钟，不为抵达日追完整东山线。",
    link: "https://www.yasaka-jinja.or.jp/en/",
  },
  {
    id: "kyoto-arrival-hanamikoji",
    title: "花见小路 · 祇园白川",
    area: "祇园",
    category: "play",
    day: 4,
    routeOrder: 5,
    lat: 35.0024,
    lng: 135.7761,
    note: "慢走看町家，尊重居民和禁止拍摄区域；时间晚了就直接去附近晚餐。",
    link: "https://kyoto.travel/en/areas/gion/",
  },
  {
    id: "kyoto-arrival-pontocho",
    title: "先斗町 / 鴨川晚餐",
    area: "四条河原町",
    category: "food",
    day: 4,
    routeOrder: 6,
    lat: 35.0065,
    lng: 135.7705,
    note: "抵达日就在河原町收尾；优先烧肉、乌冬、定食等熟食，不再跨区找店。",
    price: "¥2,500–5,000 / 人",
    meal: "晚餐",
    foodNote: "确认出汁、酱汁、鲑鱼和共用烤网；准备日语过敏卡。",
    checked: false,
  },
  {
    id: "kyoto-day6-start",
    title: "京都酒店出发点：四条乌丸 / 河原町",
    area: "京都酒店 → 奈良",
    category: "stay",
    day: 6,
    routeOrder: 1,
    lat: 35.0037,
    lng: 135.7633,
    note: "D6 早上 10:00 退房，从京都带轻装去奈良；晚上不回京都，直接前往大阪难波入住。",
    link: "https://kyoto.travel/en/",
  },
  {
    id: "osaka-nakanoshima",
    title: "中之岛水岸与中央公会堂",
    area: "中之岛",
    category: "play",
    day: 7,
    routeOrder: 3,
    lat: 34.6922,
    lng: 135.5021,
    note: "吸收小红书‘人少、好找’的夜景思路，放在大阪城之后、梅田之前；日间看水岸，晚上若体力够可回看灯光。",
    link: "https://osaka-info.jp/en/spot/nakanoshima/",
  },
  {
    id: "osaka-day7-start",
    title: "难波酒店出发点（退房寄存）",
    area: "难波",
    category: "stay",
    day: 7,
    routeOrder: 1,
    lat: 34.6687,
    lng: 135.5013,
    note: "9/5 10:00 左右退房，把大件行李寄存在难波酒店；轻装去大阪城和黑门，15:00 左右取行李去 KIX。",
    link: "https://osaka-info.jp/en/",
  },
];

const FLIGHT_ROUTE_PLACES: Place[] = [
  ...UPDATED_PLACES
    .filter((place) => {
      const removedFromFixedRoute = [
        "kamo-river",
        "kyoto-night-food",
        "umeda-sky",
        "osaka-kushikatsu",
      ];
      const movedFromReturnDay = ["kix-airport", "namba-yasaka", "namba-shopping", "osaka-coffee"];
      return place.day !== 4
        && (place.day !== 8 || movedFromReturnDay.includes(place.id))
        && !removedFromFixedRoute.includes(place.id);
    })
    .map((place) => {
      if (place.id === "osaka-namba-stay") return { ...place, day: 6 as DayId, routeOrder: 7 };
      if (place.id === "osaka-castle") return { ...place, day: 7 as DayId, routeOrder: 2 };
      if (place.id === "kuromon") return { ...place, day: 7 as DayId, routeOrder: 3 };
      return place;
    }),
  ...FLIGHT_ROUTE_EXTRA_PLACES.filter((place) => place.id !== "osaka-nakanoshima"),
].map((place) => {
  if (place.id === "namba-yasaka") return { ...place, day: 7 as DayId, routeOrder: 4 };
  if (place.id === "osaka-coffee") return { ...place, day: 7 as DayId, routeOrder: 5 };
  if (place.id === "namba-shopping") return { ...place, day: 7 as DayId, routeOrder: 6 };
  if (place.id === "shinsaibashi") return { ...place, day: 7 as DayId, routeOrder: 7 };
  if (place.id === "dotonbori") return { ...place, day: 7 as DayId, routeOrder: 8 };
  if (place.id === "osaka-okonomiyaki") return { ...place, day: 7 as DayId, routeOrder: 9 };
  if (place.id === "osaka-takoyaki") return { ...place, day: 7 as DayId, routeOrder: 10 };
  if (place.id === "kix-airport") return { ...place, day: 7 as DayId, routeOrder: 11 };
  if (place.id === "kyoto-day6-start") return { ...place, day: 6 as DayId, routeOrder: 1 };
  if (place.id === "osaka-day7-start") return { ...place, day: 7 as DayId, routeOrder: 1 };
  if (place.id === "tsukiji-d1-breakfast") return { ...place, day: 1 as DayId, routeOrder: 1 };
  if (place.id === "sensoji") return { ...place, day: 1 as DayId, routeOrder: 2 };
  if (place.id === "asakusa-tempura") return { ...place, day: 1 as DayId, routeOrder: 3 };
  if (place.id === "kappabashi") return { ...place, day: 1 as DayId, routeOrder: 4 };
  if (place.id === "asakusa-kissaten") return { ...place, day: 1 as DayId, routeOrder: 5 };
  if (place.id === "tokyo-base-stay") return { ...place, day: 1 as DayId, routeOrder: 6 };
  if (place.id === "ameyoko") return { ...place, day: 1 as DayId, routeOrder: 7 };
  if (place.id === "kyoto-base-stay") return { ...place, day: 5 as DayId, routeOrder: 1 };
  if (place.id === "fushimi-inari") return { ...place, day: 5 as DayId, routeOrder: 2 };
  if (place.id === "kiyomizu") return { ...place, day: 5 as DayId, routeOrder: 3 };
  if (place.id === "yasaka") return { ...place, day: 5 as DayId, routeOrder: 4 };
  if (place.id === "hanamikoji") return { ...place, day: 5 as DayId, routeOrder: 5 };
  if (place.id === "nishiki") return { ...place, day: 5 as DayId, routeOrder: 6 };
  if (place.id === "teramachi") return { ...place, day: 5 as DayId, routeOrder: 7 };
  if (place.id === "pontocho") return { ...place, day: 5 as DayId, routeOrder: 8 };
  if (place.id === "nara-park") return { ...place, day: 6 as DayId, routeOrder: 2 };
  if (place.id === "nara-food") return { ...place, day: 6 as DayId, routeOrder: 3 };
  if (place.id === "todaiji") return { ...place, day: 6 as DayId, routeOrder: 4 };
  if (place.id === "kasuga-taisha") return { ...place, day: 6 as DayId, routeOrder: 5 };
  if (place.id === "wakakusayama") return { ...place, day: 6 as DayId, routeOrder: 6 };
  return place;
});

PLACES.splice(0, PLACES.length, ...FLIGHT_ROUTE_PLACES);

const STAY_PLANS: StayPlan[] = [
  {
    id: "stay-day-1",
    day: 1,
    title: "东京基地：上野 / 浅草酒店",
    area: "建议住上野御徒町或浅草地铁站步行圈",
    price: "¥14,000–28,000 / 晚",
    note: "8/30 入住第 1 晚；本方案不加订 8/29 晚，05:00 落地先直接进城逛，15:00 左右再回酒店办理入住。",
    placeId: "tokyo-base-stay",
  },
  {
    id: "stay-day-2",
    day: 2,
    title: "东京基地：上野 / 浅草酒店",
    area: "东京站 → 筑地 → 银座 → 秋叶原顺线",
    price: "¥14,000–28,000 / 晚",
    note: "8/31 第 2 晚；不换酒店，按一条线完成 Chiikawa、女友生鱼体验、银座和秋叶原。",
    placeId: "tokyo-base-stay",
  },
  {
    id: "stay-day-3",
    day: 3,
    title: "东京基地：上野 / 浅草酒店",
    area: "轻装去河口湖，晚上回东京",
    price: "¥14,000–28,000 / 晚",
    note: "9/1 第 3 晚；富士山日归看天气，晚上仍回东京，不增加一晚河口湖拖箱。",
    placeId: "tokyo-base-stay",
  },
  {
    id: "stay-day-4",
    day: 4,
    title: "京都基地：四条乌丸 / 河原町酒店",
    area: "9/2 东京退房 → 京都，15:00 后入住",
    price: "¥16,000–30,000 / 晚",
    note: "京都第 1 晚；10:00 左右退房，先到京都酒店寄存行李，15:00 左右正式入住。",
    placeId: "kyoto-arrival-stay",
  },
  {
    id: "stay-day-5",
    day: 5,
    title: "京都基地：四条乌丸 / 河原町酒店",
    area: "京都东山与鴨川整日",
    price: "¥16,000–30,000 / 晚",
    note: "9/3 京都第 2 晚；不拖箱换区，把时间留给清水寺、伏见稻荷和祇园。",
    placeId: "kyoto-base-stay",
  },
  {
    id: "stay-day-6",
    day: 6,
    title: "大阪住宿：难波 / 心斋桥",
    area: "9/4 京都退房 → 奈良 → 大阪难波",
    price: "¥14,000–26,000 / 晚",
    note: "大阪第 1 晚；10:00 退京都房，奈良只带轻装，傍晚直接到难波，不回京都取箱。",
    placeId: "osaka-namba-stay",
  },
  {
    id: "stay-day-7",
    day: 7,
    title: "大阪住宿 → 关西机场",
    area: "9/5 退房寄存 → 大阪城 / 难波 → KIX",
    price: "已含第 6 晚；机场交通另计",
    note: "返程日；常见 10:00 退房，行李寄存在难波，15:00 左右取行李去 KIX，19:30 起飞。",
    placeId: "osaka-day7-start",
  },
];

const TRIP_DATA_VERSION = 11;

type ScheduleItem = {
  time: string;
  title: string;
  detail: string;
  area: string;
  price?: string;
  placeId?: string;
  tag?: string;
};

type HourlyPlan = {
  day: DayId;
  title: string;
  summary: string;
  distance: string;
  items: ScheduleItem[];
};

const HOURLY_PLANS: HourlyPlan[] = [
  {
    day: 1,
    title: "晚起抵达东京 · 浅草与上野",
    summary: "主方案选择中午前后的航班，09:00 起床后再出发；如果从 NRT 进城较晚，按顺序删掉合羽桥和上野，不熬夜补行程。",
    distance: "约 8–11k 步 · 住东京",
    items: [
      { time: "09:00–10:00", title: "起床、早餐、去机场", detail: "主方案只选不需要 09:00 前起床的航班；出发前确认护照、过敏药和日语过敏卡。", area: "上海 → PVG / SHA", tag: "出发" },
      { time: "10:00–14:00", title: "上海 → 东京、入境", detail: "按 HND 进城较快的航班估算；NRT 要把机场进城和行李等待再加 45–60 分钟。", area: "PVG / SHA → HND / NRT", tag: "交通" },
      { time: "14:00–15:30", title: "机场 → 酒店寄存行李", detail: "先办网络、交通卡和寄存；不要拖箱进浅草寺。若 NRT 到得晚，直接跳到晚餐。", area: "机场 → 上野 / 浅草", price: "¥1,000–3,000 / 两人", tag: "落地" },
      { time: "15:30–16:15", title: "浅草热食午餐", detail: "天妇罗、鳗鱼或明确成分的定食；你先确认鱼介、鲑鱼和酱汁，女友生鱼另行安排。", area: "浅草", placeId: "asakusa-tempura", price: "¥3,000–7,000 / 两人", tag: "吃" },
      { time: "16:15–17:45", title: "雷门 · 浅草寺 · 仲见世", detail: "从雷门走到本堂，抽签和拍照留余量；不为第一天的每一家小店排队。", area: "浅草", placeId: "sensoji", tag: "文化" },
      { time: "17:45–18:30", title: "合羽桥道具街（可删）", detail: "看食品模型、厨具和小伴手礼；店铺关门或体力不足就直接去上野。", area: "浅草西侧", placeId: "kappabashi", tag: "购物" },
      { time: "18:30–20:00", title: "上野公园与阿美横丁", detail: "逛折扣店并买雨具、饮料等补给；晚到时只保留阿美横丁。", area: "上野", placeId: "ameyoko", tag: "散步" },
      { time: "20:00–21:00", title: "上野熟食晚餐", detail: "鸡肉、烤物、拉面或烧肉优先；鱼介汤底、酱汁和共用锅仍要问。", area: "上野", placeId: "ameyoko", price: "¥2,000–4,000 / 两人", tag: "吃" },
      { time: "21:00–22:30", title: "回酒店、洗漱、确认 Day 2", detail: "看河口湖天气和巴士班次；主线不安排 00:00 后移动，保证 02:00 前睡。", area: "上野 / 浅草", tag: "收尾" },
    ],
  },
  {
    day: 2,
    title: "晚起版富士山 · 河口湖一日",
    summary: "按 09:00 起床重排：河口湖湖畔 + 天上山是主线，忠灵塔 / 大石公园二选一；晚起会牺牲部分机位，但更符合你们的作息。",
    distance: "约 10–14k 步 · 住东京",
    items: [
      { time: "09:00–09:45", title: "起床、早餐、补给", detail: "前一晚买好饭团、香蕉和水；过敏药与日语过敏卡放在随身小包。", area: "东京酒店", price: "¥800–1,500 / 两人", tag: "出发" },
      { time: "09:45–10:30", title: "酒店 → 新宿高速巴士站", detail: "按车票站点提前 15–20 分钟到；晚起版不追求最早一班，先保证状态。", area: "上野 / 浅草 → 新宿", price: "¥1,000–2,000 / 两人", tag: "交通" },
      { time: "10:45–12:30", title: "高速巴士去河口湖", detail: "官方参考单程 ¥2,200 / 人、约 1 小时 45 分；实际班次、座位和堵车以预约页面为准。", area: "新宿 → 河口湖站", placeId: "fuji-kawaguchiko", price: "约 ¥8,800 / 两人往返", tag: "交通" },
      { time: "12:30–13:00", title: "河口湖站补给", detail: "先确认回程站台、厕所和天气；晚起版不安排站前长时间拍照。", area: "河口湖站", placeId: "fuji-kawaguchiko", price: "¥500–1,000 / 两人", tag: "落地" },
      { time: "13:00–14:00", title: "ほうとう 午餐", detail: "先确认鱼介、鲑鱼和柴鱼成分；女友想吃海鲜时单独点，不共用餐具和汤底。", area: "河口湖", placeId: "fuji-hoto", price: "¥3,000–5,000 / 两人", tag: "吃" },
      { time: "14:00–15:15", title: "天上山公园缆车 / 湖畔", detail: "天气好上缆车，排队超过 30 分钟就改湖畔散步；这是晚起版富士山主线。", area: "河口湖畔", placeId: "fuji-tenjo", price: "约 ¥2,000–2,500 / 两人", tag: "自然" },
      { time: "15:15–16:45", title: "忠灵塔或大石公园（二选一）", detail: "天气好、体力足选忠灵塔；想少换乘选大石公园。不要两处都塞，避免错过返程巴士。", area: "下吉田 / 河口湖北岸", placeId: "chureito", price: "¥1,000–2,000 / 两人交通", tag: "自然" },
      { time: "16:45–17:15", title: "回河口湖站、买伴手礼", detail: "留出补水、厕所和站台确认时间；云层压山时不再追拍。", area: "河口湖站", placeId: "fuji-kawaguchiko", tag: "补给" },
      { time: "17:30–19:15", title: "巴士回新宿", detail: "返程可能堵车；晚餐不要预约 19:30 前不可取消的座位。", area: "河口湖 → 新宿", price: "已含往返交通", tag: "交通" },
      { time: "19:30–21:00", title: "新宿 / 上野熟食晚餐", detail: "吃烤肉、鸡肉或定食；很累就直接回酒店，不再加夜景。", area: "新宿 / 上野", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "21:00–22:30", title: "回酒店、泡脚、看天气", detail: "整理 Day 3 购物清单，保证 02:00 前入睡；不把‘富士山没拍到’变成熬夜补救。", area: "东京酒店", tag: "收尾" },
    ],
  },
  {
    day: 3,
    title: "Chiikawa · 银座 · 秋叶原",
    summary: "先买限定，再逛银座；秋叶原安排在下午到晚上，路线集中在东京站—银座—秋叶原一带。",
    distance: "约 10–13k 步 · 住东京",
    items: [
      { time: "09:00–10:00", title: "起床、早餐与购物清单", detail: "把 Chiikawa 预算分成‘必买 / 看库存再买 / 不买’，避免第一家店就花完。", area: "东京酒店", price: "¥1,000–2,000 / 两人", tag: "准备" },
      { time: "10:00–11:15", title: "东京站 Character Street", detail: "先去 ちいかわらんど；库存、排队和限购以当天公告为准，买到就先寄回酒店。", area: "东京站", placeId: "tokyo-chiikawa", price: "购物预算 ¥5,000–15,000+", tag: "Chiikawa" },
      { time: "11:15–12:00", title: "丸之内站舍与东京站周边", detail: "上地面拍红砖站舍，顺便买水；不要把皇居和东京塔硬塞进今天。", area: "丸之内", placeId: "marunouchi", tag: "文化" },
      { time: "12:00–13:00", title: "东京站午餐", detail: "选择熟食定食、烤鸡或咖喱；站内店多，先看成分再点。", area: "东京站八重洲", placeId: "tokyo-yakitori", price: "¥2,000–4,000 / 两人", tag: "吃" },
      { time: "13:00–15:30", title: "银座中央通与百货", detail: "药妆、伴手礼和品牌分批买；把大件集中装袋，不要带着战利品逛整晚。", area: "银座", placeId: "ginza", price: "购物预算 ¥5,000–20,000+", tag: "购物" },
      { time: "15:30–16:15", title: "银座喫茶", detail: "坐下充电、整理购物袋；这是当天的体力缓冲，不建议跳过。", area: "银座", placeId: "ginza-dessert", price: "¥1,800–4,000 / 两人", tag: "休息" },
      { time: "16:30–18:15", title: "秋叶原 Radio Kaikan", detail: "从银座乘地铁到秋叶原，先逛整栋，再决定是否买二手周边；重点只看 Chiikawa 和真正喜欢的品类。", area: "秋叶原", placeId: "radio-kaikan", tag: "购物" },
      { time: "18:15–19:00", title: "神田明神短线", detail: "如果购物排队超时就删掉；保留 30–45 分钟作为文化收尾。", area: "御茶之水", placeId: "kanda-myojin", tag: "文化" },
      { time: "19:15–20:30", title: "秋叶原熟食晚餐", detail: "鸡肉、烤物、米饭或烧肉；不要默认‘熟食’就没有鱼介，点单前问清楚。", area: "秋叶原", placeId: "tokyo-yakitori", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "20:30–22:00", title: "回酒店打包", detail: "把 Day 4 的换城行李压缩成一件箱；票、酒店地址和护照放在同一个随身袋。", area: "东京酒店", tag: "收尾" },
    ],
  },
  {
    day: 4,
    title: "新干线进大阪 · 大阪城与道顿堀",
    summary: "今天唯一一次换城，上午移动、下午文化、晚上美食；不要再加京都或 USJ。",
    distance: "约 11–14k 步 · 住大阪",
    items: [
      { time: "09:00–09:45", title: "起床、退房、整理行李", detail: "尽量把行李压到一件；如果用宅急便，前一晚问酒店能否寄到大阪。", area: "东京酒店", tag: "换城" },
      { time: "09:45–10:30", title: "东京站早餐与取票", detail: "买水和便当，留出站内换乘余量；不把出发卡在最后 5 分钟。", area: "东京站", price: "¥1,500–3,000 / 两人", tag: "交通" },
      { time: "10:45–13:15", title: "东海道新干线去新大阪", detail: "时间版看 Nozomi；预算版 Kodama 约 4 小时，会压缩大阪下午内容。具体班次和票价以预约页为准。", area: "东京 → 新大阪", price: "约 ¥25,100 / 两人起", tag: "交通" },
      { time: "13:15–14:15", title: "到大阪、酒店寄存行李", detail: "从新大阪先到难波，不要拖箱进大阪城；先把住处和晚餐区域定下来。", area: "新大阪 → 难波", price: "¥1,000–2,000 / 两人", tag: "落地" },
      { time: "14:15–15:00", title: "大阪午餐", detail: "定食、乌冬或肉类热食；今天不要把大阪特色小吃一次吃满。", area: "大阪城周边", price: "¥2,000–4,000 / 两人", tag: "吃" },
      { time: "15:00–17:00", title: "大阪城天守阁与公园", detail: "官方开放时间参考 9:00–18:00；天守阁约 60 分钟，公园和换乘另留 1 小时。", area: "大阪城公园", placeId: "osaka-castle", price: "门票约 ¥1,200 / 人", tag: "文化" },
      { time: "17:00–18:00", title: "大阪城 → 心斋桥", detail: "用地铁前往难波方向；到酒店放下大件购物袋，晚上只带小包。", area: "大阪城 → 心斋桥", price: "约 ¥500–800 / 两人", tag: "交通" },
      { time: "18:00–19:15", title: "心斋桥筋商店街", detail: "集中完成药妆和伴手礼；保留发票和免税包装，别为了打折走到很远。", area: "心斋桥", placeId: "shinsaibashi", tag: "购物" },
      { time: "19:15–21:15", title: "大阪烧 / 章鱼烧晚餐", detail: "女友可尝章鱼烧；你选肉类大阪烧或其他熟食，明确排除鲑鱼、海鲜、柴鱼片和不明鱼粉。", area: "道顿堀", placeId: "osaka-okonomiyaki", price: "¥3,000–6,000 / 两人", tag: "大阪美食" },
      { time: "21:15–22:30", title: "道顿堀夜景与法善寺横丁", detail: "看格力高跑男、戎桥和河道；人多时只沿主线走，不追求把每条巷子走完。", area: "道顿堀", placeId: "dotonbori", tag: "夜景" },
    ],
  },
  {
    day: 5,
    title: "难波短线 · 关西机场",
    summary: "主方案按 18:00 后航班安排，09:00 起床后走难波短线；如果买到早班机，前一晚应改住临空城 / KIX 附近，不把早起硬塞进这条主线。",
    distance: "约 5–9k 步 · 大阪 → 上海",
    items: [
      { time: "09:00–10:00", title: "起床、退房与行李寄存", detail: "主方案按 18:00 后航班；把护照、免税购物、过敏药放在随身包，向酒店确认最晚取行李时间。", area: "难波", tag: "返程" },
      { time: "10:00–11:30", title: "黑门市场早午餐", detail: "女友可吃海鲜，你选烤物、玉子烧等确认过的熟食；不共用餐具、蘸料和不明汤底。", area: "日本桥", placeId: "kuromon", price: "¥2,000–6,000 / 两人", tag: "吃" },
      { time: "11:30–12:15", title: "难波八阪神社", detail: "巨大狮子头拍照 30–45 分钟；如果下雨或买东西超时就删掉。", area: "难波", placeId: "namba-yasaka", tag: "文化" },
      { time: "12:15–13:30", title: "咖啡、整理购物袋", detail: "最后确认护照、充电宝、药物和免税袋；不要再开启一段跨区购物。", area: "难波", placeId: "osaka-coffee", price: "¥1,400–3,000 / 两人", tag: "休息" },
      { time: "13:30–14:15", title: "取行李、前往机场", detail: "从难波出发比从大阪城更稳；主方案按国际航班提前 2.5–3 小时到 KIX 反推。", area: "难波 → KIX", price: "¥2,000–4,000 / 两人", tag: "交通" },
      { time: "14:15–15:45", title: "关西机场值机与免税", detail: "预留安检、退税 / 免税确认和登机口步行时间；不要把最后的 Chiikawa 采购押在机场。", area: "关西机场", tag: "返程" },
      { time: "15:45–起飞前", title: "机场休息、按登机口候机", detail: "主方案要求航班约 18:00 后；若航班更早，改成前一晚住临空城 / KIX 附近。", area: "关西机场", tag: "返程" },
    ],
  },
];

const UPDATED_HOURLY_PLANS: HourlyPlan[] = [
  {
    day: 1,
    title: "晚起抵达东京 · 浅草与上野",
    summary: "主方案选择中午前后的航班，09:00 起床后再出发；如果从 NRT 进城较晚，按顺序删掉合羽桥和上野，不熬夜补行程。",
    distance: "约 8–11k 步 · 住东京",
    items: [
      { time: "09:00–10:00", title: "起床、早餐、去机场", detail: "出发前确认护照、氯雷他定、日语过敏卡和充电设备；不要为了买便宜机票选择需要凌晨起床的航班。", area: "上海 → PVG / SHA", tag: "出发" },
      { time: "10:00–14:00", title: "上海 → 东京、入境", detail: "优先比较 HND 进城时间；NRT 要把机场进城和行李等待再加 45–60 分钟，别把下午排满。", area: "PVG / SHA → HND / NRT", tag: "交通" },
      { time: "14:00–15:30", title: "机场 → 酒店寄存行李", detail: "先办网络、交通卡和寄存；不要拖箱进浅草寺。若 NRT 到得晚，直接跳到晚餐。", area: "机场 → 上野 / 浅草", price: "¥1,000–3,000 / 两人", tag: "落地" },
      { time: "15:30–16:15", title: "浅草热食", detail: "天妇罗、鳗鱼或明确成分的定食；你先确认鱼介、鲑鱼和酱汁，女友生鱼另行安排。", area: "浅草", placeId: "asakusa-tempura", price: "¥3,000–7,000 / 两人", tag: "吃" },
      { time: "16:15–17:45", title: "雷门 · 浅草寺 · 仲见世", detail: "从雷门走到本堂，抽签和拍照留余量；不为第一天的每一家小店排队。", area: "浅草", placeId: "sensoji", tag: "文化" },
      { time: "17:45–18:30", title: "合羽桥道具街（可删）", detail: "看食品模型、厨具和小伴手礼；店铺关门或体力不足就直接去上野。", area: "浅草西侧", placeId: "kappabashi", tag: "购物" },
      { time: "18:30–20:00", title: "上野与阿美横丁", detail: "逛折扣店并买雨具、饮料等补给；晚到时只保留阿美横丁。", area: "上野", placeId: "ameyoko", tag: "散步" },
      { time: "20:00–21:00", title: "上野熟食晚餐", detail: "鸡肉、烤物、拉面或烧肉优先；鱼介汤底、酱汁和共用锅仍要问。", area: "上野", placeId: "ameyoko", price: "¥2,000–4,000 / 两人", tag: "吃" },
      { time: "21:00–22:30", title: "回酒店、洗漱、确认 Day 2", detail: "看东京站店铺公告和秋叶原清单；主线不安排 00:00 后移动，保证 02:00 前睡。", area: "上野 / 浅草", tag: "收尾" },
    ],
  },
  {
    day: 2,
    title: "Chiikawa · 银座 · 秋叶原",
    summary: "按东京站 → 筑地 → 银座 → 秋叶原顺线走：先买限定，再让女友完成生鱼体验，之后向北逛银座和秋叶原；不再加入丸之内、晴空塔等折返点。",
    distance: "约 10–14k 步 · 住东京",
    items: [
      { time: "09:00–10:00", title: "起床、早餐、列购物清单", detail: "把 Chiikawa 分成‘必买 / 有货再买 / 不买’三档；预算先封顶，别第一家店就花完。", area: "东京酒店", price: "¥1,000–2,000 / 两人", tag: "准备" },
      { time: "10:00–11:15", title: "东京站 Character Street", detail: "先去 ちいかわらんど；库存、排队和限购以当天公告为准，买到的东西先寄回酒店。", area: "东京站", placeId: "tokyo-chiikawa", price: "购物预算 ¥5,000–15,000+", tag: "Chiikawa" },
      { time: "11:15–12:15", title: "筑地场外市场（女友可吃生鱼）", detail: "从东京站南下到筑地；女友可以安排寿司 / 刺身，你选玉子烧或确认过的熟食，不共用餐具、酱油碟和不明汤底。", area: "筑地", placeId: "tsukiji", price: "¥2,000–6,000 / 两人", tag: "分开吃" },
      { time: "12:15–14:15", title: "银座中央通与午餐", detail: "从筑地向北进入银座，先吃熟食再逛百货、药妆和伴手礼；大件集中装袋，不要带着战利品逛整晚。", area: "银座", placeId: "ginza", price: "餐饮 ¥3,000–6,000 / 两人 · 购物 ¥5,000–20,000+", tag: "购物" },
      { time: "14:15–15:00", title: "银座喫茶", detail: "坐下充电、整理购物袋；这是当天的体力缓冲，不建议跳过。", area: "银座", placeId: "ginza-dessert", price: "¥1,800–4,000 / 两人", tag: "休息" },
      { time: "15:00–15:45", title: "银座 → 秋叶原", detail: "乘地铁向北移动，不在东京站和晴空塔之间来回；把购物袋收好后再开始秋叶原。", area: "银座 → 秋叶原", tag: "交通" },
      { time: "15:45–16:15", title: "秋叶原电气街", detail: "先确定只买 Chiikawa 和真正喜欢的品类，再进入整栋商场；不为了凑店硬逛。", area: "秋叶原", placeId: "akihabara", tag: "购物" },
      { time: "16:15–18:30", title: "秋叶原 Radio Kaikan", detail: "先逛整栋再决定是否买二手周边；检查盒况、配件、价格牌和正版标识。", area: "秋叶原", placeId: "radio-kaikan", tag: "购物" },
      { time: "18:30–19:15", title: "神田明神（可删）", detail: "从秋叶原步行顺路到神田明神；如果购物排队超时就删除，不影响主线。", area: "御茶之水", placeId: "kanda-myojin", tag: "文化" },
      { time: "20:00–21:30", title: "秋叶原熟食晚餐", detail: "鸡肉、烤物、米饭或烧肉；不要默认熟食就没有鱼介，点单前问清楚。", area: "秋叶原", placeId: "tokyo-yakitori", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "21:30–22:30", title: "回酒店整理战利品", detail: "把 Day 3 的河口湖随身包准备好，提前确认高速巴士回程班次和天气；今天不再增加远处夜景。", area: "东京酒店", tag: "收尾" },
    ],
  },
  {
    day: 3,
    title: "晚起版富士山 · 河口湖一日",
    summary: "河口湖湖畔 + 天上山是主线，忠灵塔 / 大石公园二选一；晚起会牺牲部分机位，但更符合你们的作息，也避免把富士山变成赶场。",
    distance: "约 10–14k 步 · 住东京",
    items: [
      { time: "09:00–09:45", title: "起床、早餐、补给", detail: "前一晚买好饭团、香蕉和水；过敏药与日语过敏卡放在随身小包。", area: "东京酒店", price: "¥800–1,500 / 两人", tag: "出发" },
      { time: "09:45–10:30", title: "酒店 → 新宿高速巴士站", detail: "按车票站点提前 15–20 分钟到；晚起版不追求最早一班，先保证状态。", area: "上野 / 浅草 → 新宿", price: "¥1,000–2,000 / 两人", tag: "交通" },
      { time: "10:45–12:30", title: "高速巴士去河口湖", detail: "官方参考单程约 ¥2,200 / 人、约 1 小时 45 分；实际班次、座位和堵车以预约页面为准。", area: "新宿 → 河口湖站", placeId: "fuji-kawaguchiko", price: "约 ¥8,800 / 两人往返", tag: "交通" },
      { time: "12:30–13:30", title: "ほうとう 午餐", detail: "先确认鱼介、鲑鱼和柴鱼成分；女友想吃海鲜时单独点，不共用餐具和汤底。", area: "河口湖", placeId: "fuji-hoto", price: "¥3,000–5,000 / 两人", tag: "吃" },
      { time: "13:30–14:45", title: "天上山公园缆车 / 湖畔", detail: "天气好上缆车，排队超过 30 分钟就改湖畔散步；这是晚起版富士山主线。", area: "河口湖畔", placeId: "fuji-tenjo", price: "约 ¥2,000–2,500 / 两人", tag: "自然" },
      { time: "14:45–16:30", title: "忠灵塔或大石公园（二选一）", detail: "天气好、体力足选忠灵塔；想少换乘选大石公园。不要两处都塞，避免错过返程巴士。", area: "下吉田 / 河口湖北岸", placeId: "chureito", price: "¥1,000–2,000 / 两人交通", tag: "自然" },
      { time: "16:30–17:15", title: "回河口湖站、买伴手礼", detail: "留出补水、厕所和站台确认时间；云层压山时不再追拍。", area: "河口湖站", placeId: "fuji-kawaguchiko", tag: "补给" },
      { time: "17:30–19:15", title: "巴士回新宿", detail: "返程可能堵车；晚餐不要预约 19:30 前不可取消的座位。", area: "河口湖 → 新宿", price: "已含往返交通", tag: "交通" },
      { time: "19:30–21:00", title: "东京熟食晚餐", detail: "吃烤肉、鸡肉或定食；很累就直接回酒店，不再加夜景。", area: "新宿 / 上野", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "21:00–22:30", title: "泡脚、看天气、早点睡", detail: "富士山能见度不可控，不要为了‘没拍到’熬夜补救；为 Day 4 东京→京都换城准备轻装。", area: "东京酒店", tag: "收尾" },
    ],
  },
  {
    day: 4,
    title: "东京→京都 · 锦市场与祇园",
    summary: "把东京南侧日归删掉，提前换城：东京站出发到京都，入住后用锦市场、寺町、八坂和祇园完成抵达日慢线。",
    distance: "约 11–15k 步 · 住东京",
    items: [
      { time: "09:00–10:00", title: "起床、早餐、准备轻装", detail: "带水、防晒、雨具和充电宝；当天不拖购物箱，晚上仍回东京基地。", area: "东京酒店", tag: "出发" },
      { time: "10:00–11:00", title: "东京站取票、早餐", detail: "提前到站内找月台和买水，不把新干线出发卡在最后 5 分钟。", area: "上野 / 浅草 → 东京站", price: "¥500–1,000 / 两人", tag: "交通" },
      { time: "11:00–13:00", title: "东海道新干线去京都", detail: "优先 Nozomi；大件行李位、指定席和实际票价出发前按官方页面确认。", area: "东京 → 京都", price: "约 ¥28,000–32,000 / 两人", tag: "换城" },
      { time: "13:00–14:00", title: "京都酒店寄存行李", detail: "先把箱子放下再开始步行；接下来连续住京都 2 晚，不再拖箱换区。", area: "四条乌丸 / 河原町", placeId: "kyoto-arrival-stay", tag: "落地" },
      { time: "14:00–15:00", title: "锦市场熟食小吃", detail: "你优先肉类、玉子或明确蔬食，女友海鲜单独安排；逐项确认鱼介、柴鱼片和鲑鱼。", area: "锦市场", placeId: "kyoto-arrival-nishiki", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "15:00–16:00", title: "寺町 · 新京极", detail: "与锦市场相邻，适合换城日逛伴手礼；不提前把行李塞满。", area: "河原町", placeId: "kyoto-arrival-teramachi", tag: "购物" },
      { time: "16:00–17:00", title: "八坂神社", detail: "从河原町向东走进祇园，留 30–45 分钟；抵达日不追完整东山线。", area: "祇园", placeId: "kyoto-arrival-yasaka", tag: "文化" },
      { time: "17:00–18:00", title: "花见小路 · 祇园白川", detail: "慢走看町家，遵守禁止拍摄提示；时间晚了就直接去晚餐。", area: "祇园", placeId: "kyoto-arrival-hanamikoji", tag: "散步" },
      { time: "18:00–19:30", title: "先斗町熟食晚餐", detail: "优先烧肉、乌冬、定食等熟食；女友海鲜单独安排，你继续确认出汁和酱汁。", area: "四条河原町", placeId: "kyoto-arrival-pontocho", price: "¥5,000–10,000 / 两人", tag: "吃" },
      { time: "15:30–17:00", title: "江之岛神社与海边", detail: "沿江之电到江之岛；日落前慢走，阴雨天缩短停留，优先保证回程。", area: "江之岛", placeId: "enoshima", tag: "自然" },
      { time: "17:00–18:30", title: "江之岛 → 东京", detail: "回程不再临时加横滨；如果体力和天气都好，才考虑回东京后去 SHIBUYA SKY。", area: "江之岛 → 东京", price: "约 ¥2,000–3,000 / 两人", tag: "交通" },
      { time: "19:30–21:00", title: "东京基地附近晚餐", detail: "选酒店周边熟食，别为了最后一餐跨区；确认鲑鱼、鱼介和共用餐具。", area: "上野 / 浅草", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "21:00–22:30", title: "回酒店、整理换城行李", detail: "把 1 件主箱和 1 件随身包分开，预约次日 Nozomi；睡前确认京都酒店地址。", area: "东京酒店", tag: "收尾" },
    ],
  },
  {
    day: 5,
    title: "东京 → 京都 · 锦市场与祇园",
    summary: "全程第 1 次换酒店：上午新干线、下午锦市场与寺町、傍晚八坂和祇园；不把抵达日塞成京都景点大全。",
    distance: "约 9–13k 步 · 住京都",
    items: [
      { time: "09:00–10:00", title: "起床、退房、早餐", detail: "确认酒店寄存 / 宅急便，行李压到一件；早餐选择原料清楚的便利店熟食。", area: "东京酒店", tag: "换城" },
      { time: "10:00–10:45", title: "酒店 → 东京站取票", detail: "预留站内找月台和买水时间；不要把出发卡在最后 5 分钟。", area: "上野 / 浅草 → 东京站", price: "¥500–1,000 / 两人", tag: "交通" },
      { time: "10:45–13:00", title: "东海道新干线去京都", detail: "优先 Nozomi；两人普通车指定席价格按实时票面确认，提前买好大件行李位规则。", area: "东京 → 京都", price: "约 ¥28,000–32,000 / 两人", tag: "交通" },
      { time: "13:00–14:00", title: "京都酒店入住 / 寄存", detail: "先把箱子放下，再开始步行；京都站到四条乌丸不要拖箱逛景点。", area: "京都四条乌丸", placeId: "kyoto-base-stay", tag: "落地" },
      { time: "14:00–15:00", title: "伏见稻荷大社", detail: "先走千本鸟居入口到中腹，不追求完整登山；这也是小红书京都笔记反复推荐的第一次必看点。", area: "京都南部", placeId: "fushimi-inari", tag: "古迹" },
      { time: "15:00–16:00", title: "锦市场熟食小吃", detail: "只挑能问清成分的热食；你的鱼介、鲑鱼、柴鱼片与出汁风险要逐项确认。", area: "锦市场", placeId: "nishiki", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "16:00–17:00", title: "寺町 · 新京极", detail: "雨天也能逛的商店街；买伴手礼但不要提前把行李塞满。", area: "河原町", placeId: "teramachi", tag: "购物" },
      { time: "17:00–18:00", title: "八坂神社与花见小路", detail: "按顺序从八坂进入祇园；不拦人、不追拍艺伎，遵守当地禁止拍摄提示。", area: "祇园", placeId: "yasaka", tag: "文化" },
      { time: "18:00–19:15", title: "清水寺 / 二年坂三年坂（体力够再加）", detail: "坡道多，雨天穿防滑鞋；时间或体力不够就留在花见小路，不为‘全都去’赶路。", area: "东山", placeId: "kiyomizu", tag: "古迹" },
      { time: "19:15–20:30", title: "先斗町熟食晚餐", detail: "选择烧肉、乌冬、定食等熟食；女友海鲜单独安排，你继续确认出汁和酱汁。", area: "四条河原町", placeId: "pontocho", price: "¥5,000–10,000 / 两人", tag: "吃" },
      { time: "20:30–21:30", title: "鴨川边散步", detail: "只走一小段就回酒店；把京都夜色当作放松，不再加远处景点。", area: "鴨川", tag: "夜景" },
      { time: "21:30–22:30", title: "回酒店、确认奈良路线", detail: "准备次日奈良轻装、现金和防晒；依然 02:00 前睡。", area: "京都酒店", tag: "收尾" },
    ],
  },
  {
    day: 6,
    title: "奈良鹿群 · 东大寺 · 京都夜色",
    summary: "京都日归奈良，路线控制在奈良公园东大寺一带；下午回京都后只安排鴨川和附近晚餐，把步数留给大阪。",
    distance: "约 12–16k 步 · 住京都",
    items: [
      { time: "09:00–10:00", title: "起床、早餐、出发", detail: "不早于 09:00 起床；在车站买水和简单补给，鹿仙贝只在指定处买。", area: "京都酒店", tag: "出发" },
      { time: "10:00–11:00", title: "京都 → 奈良", detail: "优先近铁到近铁奈良站，少走一段；具体班次和站台以当天导航为准。", area: "京都 → 奈良", price: "约 ¥1,500–2,500 / 两人往返", tag: "交通" },
      { time: "11:00–12:30", title: "奈良公园与鹿群", detail: "收好包、地图和食物，给鹿留距离；不要在拥挤处举高食物或逗鹿。", area: "奈良公园", placeId: "nara-park", tag: "自然" },
      { time: "12:30–13:30", title: "奈良熟食午餐", detail: "柿叶寿司列为女友可尝候选；你选择确认过的定食、乌冬或肉类，不共享餐具。", area: "奈良公园周边", placeId: "nara-food", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "13:30–15:00", title: "东大寺大佛殿", detail: "预留 60–90 分钟；第一次奈良最值得看的文化主线，不急着同时打卡所有寺社。", area: "东大寺", placeId: "todaiji", tag: "古迹" },
      { time: "15:00–16:00", title: "春日大社 / 若草山（二选一）", detail: "喜欢森林参道选春日大社，想看远景选若草山；下雨或步数高就直接返程。", area: "奈良公园东侧", placeId: "kasuga-taisha", tag: "文化" },
      { time: "16:00–17:00", title: "奈良 → 京都", detail: "不要把返程拖到太晚；明天还要换到大阪，回京都先休息。", area: "奈良 → 京都", price: "已含往返交通", tag: "交通" },
      { time: "17:00–18:00", title: "酒店休息 / 洗漱", detail: "补水、充电、整理明天换城行李；这是这趟旅行必要的缓冲，不是浪费时间。", area: "京都酒店", tag: "休息" },
      { time: "18:00–19:00", title: "鴨川散步", detail: "只走酒店附近的一小段，天气不好就改成四条商圈室内休息。", area: "鴨川", placeId: "kamo-river", tag: "散步" },
      { time: "19:00–20:30", title: "京都熟食晚餐", detail: "选离酒店近的烧肉、乌冬或定食；点单前说明鲑鱼过敏，确认出汁、酱汁和共用烤网。", area: "四条河原町", placeId: "kyoto-night-food", price: "¥4,000–9,000 / 两人", tag: "吃" },
      { time: "20:30–22:30", title: "回酒店、准备大阪", detail: "确认大阪住宿、退房时间和 KIX 航班；不晚于 02:00 睡。", area: "京都酒店", tag: "收尾" },
    ],
  },
  {
    day: 7,
    title: "京都 → 大阪 · 大阪城与难波夜食",
    summary: "全程第 2 次也是最后一次换酒店：中午前后到大阪，下午大阪城与梅田，晚上心斋桥、道顿堀集中吃喝购物。",
    distance: "约 12–16k 步 · 住大阪",
    items: [
      { time: "09:00–10:00", title: "起床、退房、早餐", detail: "把行李压到一件；确认京都酒店最晚取行李时间，早餐选成分清楚的熟食。", area: "京都酒店", tag: "换城" },
      { time: "10:00–11:00", title: "京都 → 大阪难波", detail: "按酒店位置选择阪急 / 京阪 / JR；不要为了省几百日元拖箱绕路。", area: "京都 → 大阪", price: "约 ¥1,500–2,500 / 两人", tag: "交通" },
      { time: "11:00–12:00", title: "大阪酒店寄存行李", detail: "先把住处和晚餐区域定下来；只带小包出门，不带购物箱逛大阪城。", area: "难波", placeId: "osaka-namba-stay", tag: "落地" },
      { time: "12:00–13:00", title: "黑门市场午餐 / 小食", detail: "女友可吃海鲜，你选择烤物、玉子烧等确认过的熟食；不同摊位交叉污染风险高。", area: "日本桥", placeId: "kuromon", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "13:00–14:30", title: "大阪城天守阁与公园", detail: "天守阁约 60 分钟，公园和换乘另留 30–60 分钟；官方开放时间出发前再确认。", area: "大阪城公园", placeId: "osaka-castle", price: "约 ¥1,200 / 人", tag: "文化" },
      { time: "14:30–16:00", title: "梅田蓝天大厦（天气好再上）", detail: "日落前后看城市线；雨天或预约困难就把这段换成难波室内购物。", area: "梅田", placeId: "umeda-sky", price: "约 ¥3,000 / 两人起", tag: "城市景观" },
      { time: "16:00–17:00", title: "梅田 → 心斋桥", detail: "回难波方向，先到酒店放下可能买到的东西；不让战利品拖累晚餐。", area: "梅田 → 难波", price: "约 ¥500–800 / 两人", tag: "交通" },
      { time: "17:00–18:00", title: "心斋桥筋商店街", detail: "集中完成药妆和伴手礼，保留发票和免税包装；预算到线就停。", area: "心斋桥", placeId: "shinsaibashi", tag: "购物" },
      { time: "18:00–20:00", title: "道顿堀夜景与大阪烧", detail: "看格力高跑男、戎桥和河道；你点肉 / 蔬菜大阪烧，明确排除鲑鱼、海鲜、柴鱼片和不明鱼粉。", area: "道顿堀", placeId: "osaka-okonomiyaki", price: "¥3,000–6,000 / 两人", tag: "大阪美食" },
      { time: "20:00–21:00", title: "章鱼烧 / 串炸（二选一）", detail: "女友可单独尝章鱼烧；你若对其他海鲜也敏感就跳过，改吃肉类或甜点。", area: "道顿堀 / 新世界", placeId: "osaka-takoyaki", price: "¥1,200–3,000 / 两人", tag: "小吃" },
      { time: "21:00–22:30", title: "回难波酒店、整理免税袋", detail: "护照、免税单和药物放在随身包；确认次日航班与 KIX 交通。", area: "难波", tag: "收尾" },
    ],
  },
  {
    day: 8,
    title: "难波收尾 · 关西机场返程",
    summary: "按 18:00 后航班安排的返程日：09:00 起床，难波短线、最后采购、提前到 KIX；早班机直接删掉市区段。",
    distance: "约 5–9k 步 · 大阪 → 上海",
    items: [
      { time: "09:00–10:00", title: "起床、早餐、退房寄存", detail: "确认最晚取行李时间；把护照、免税购物、过敏药和充电宝放在随身包。", area: "难波酒店", tag: "返程" },
      { time: "10:00–10:45", title: "难波八阪神社", detail: "巨大狮子头拍照 30–45 分钟；下雨或买东西超时就删掉。", area: "难波", placeId: "namba-yasaka", tag: "文化" },
      { time: "10:45–12:00", title: "难波最后采购", detail: "只买清单内缺的东西；不要开启一段跨区购物，也不要把免税手续压到机场最后一刻。", area: "难波 / 心斋桥", placeId: "namba-shopping", tag: "购物" },
      { time: "12:00–13:00", title: "咖啡与整理购物袋", detail: "核对护照、登机牌、充电宝、药物、免税袋和酒店寄存凭证。", area: "难波", placeId: "osaka-coffee", price: "¥1,400–3,000 / 两人", tag: "休息" },
      { time: "13:00–14:00", title: "取行李、简单午餐", detail: "选离车站近的熟食；你不在返程日尝试成分不明的海鲜。", area: "难波", price: "¥2,000–4,000 / 两人", tag: "补给" },
      { time: "14:00–15:00", title: "难波 → 关西机场", detail: "主方案按 18:00 后国际航班倒推；机场快线座位和行李空间提前确认。", area: "难波 → KIX", price: "¥2,000–4,000 / 两人", tag: "交通" },
      { time: "15:00–16:30", title: "值机、免税与安检", detail: "预留退税 / 免税确认、安检和登机口步行时间；不要把最后的 Chiikawa 采购押在机场。", area: "关西机场", placeId: "kix-airport", tag: "返程" },
      { time: "16:30–起飞前", title: "机场休息、按登机口候机", detail: "若航班早于 18:00，前一晚改住临空城 / KIX 附近；不要为了逛完市区牺牲睡眠。", area: "关西机场", tag: "返程" },
    ],
  },
];

const FLIGHT_DAY_4: HourlyPlan = {
  day: 4,
  title: "9/2 周三 · 东京 → 京都",
  summary: "东京酒店按常见 10:00 退房，带一件主箱乘新干线到京都；酒店先寄存，15:00 左右入住，下午只走河原町—祇园一条线。",
  distance: "约 9–12k 步 · 京都住 2 晚",
  items: [
    { time: "09:00–10:00", title: "起床、整理、办理退房", detail: "常见退房时间是 10:00 左右，具体以你们预订酒店为准；把护照、药物和充电宝放在随身包。", area: "东京酒店", tag: "换城" },
    { time: "10:00–10:45", title: "酒店 → 东京站取票", detail: "从上野 / 浅草基地按酒店位置选 JR 山手线或东京 Metro，尽量只换乘一次；到站后先找月台、买水和确认行李位。", area: "上野 / 浅草 → 东京站", price: "¥500–1,000 / 两人", tag: "交通" },
    { time: "10:45–13:00", title: "东海道新干线去京都", detail: "优先 Nozomi 普通车指定席；小红书换城搜索结果反复提醒提前确认车票和大件行李，三边合计超过 160cm 的行李按 JR 规则提前处理。", area: "东京 → 京都", price: "约 ¥28,000–32,000 / 两人", tag: "交通" },
    { time: "13:00–13:45", title: "京都酒店寄存行李", detail: "先把箱子放下；酒店常见 15:00 左右入住，提前入住要看房态，不把它当成必然。", area: "四条乌丸 / 河原町", placeId: "kyoto-arrival-stay", tag: "行李" },
    { time: "13:45–15:00", title: "锦市场熟食小吃", detail: "只挑能问清成分的食物；你优先肉类、玉子或明确蔬食，女友海鲜单独安排。", area: "锦市场", placeId: "kyoto-arrival-nishiki", price: "¥3,000–6,000 / 两人", tag: "吃" },
    { time: "15:00–15:30", title: "回酒店办理入住", detail: "把箱子放进房间、洗手和充电；如果房间尚未准备好，就继续在河原町咖啡店休息。", area: "京都酒店", placeId: "kyoto-arrival-stay", tag: "入住" },
    { time: "15:30–16:15", title: "寺町 · 新京极", detail: "与锦市场相邻，适合换城日逛伴手礼；只买轻便物品，不提前把箱子塞满。", area: "河原町", placeId: "kyoto-arrival-teramachi", tag: "购物" },
    { time: "16:15–17:00", title: "八坂神社", detail: "从河原町向东走进祇园，留 30–45 分钟；抵达日不追完整东山线。", area: "祇园", placeId: "kyoto-arrival-yasaka", tag: "文化" },
    { time: "17:00–18:00", title: "花见小路 · 祇园白川", detail: "慢走看町家，遵守禁止拍摄提示；时间晚了就直接去晚餐。", area: "祇园", placeId: "kyoto-arrival-hanamikoji", tag: "散步" },
    { time: "18:00–19:30", title: "先斗町熟食晚餐", detail: "优先烧肉、乌冬、定食等熟食；女友海鲜单独安排，你继续确认出汁和酱汁。", area: "四条河原町", placeId: "kyoto-arrival-pontocho", price: "¥5,000–10,000 / 两人", tag: "吃" },
    { time: "19:30–21:00", title: "鴨川边散步、回酒店", detail: "只走一小段就回房间，换城日不再加清水寺或远处夜景。", area: "鴨川 → 京都酒店", tag: "收尾" },
  ],
};

const FLIGHT_DAY_5: HourlyPlan = {
  day: 5,
  title: "9/3 周四 · 京都东山经典线",
  summary: "京都整日只走一条由南向北的线：伏见稻荷 → 清水寺 → 八坂 / 祇园 → 锦市场 / 先斗町，删掉岚山，避免京都两端往返。",
  distance: "约 11–15k 步 · 住京都",
  items: [
    { time: "09:00–10:00", title: "起床、早餐、准备轻装", detail: "带水、防晒、雨具和充电宝；不拖大箱，只在京都东山这一片移动。", area: "京都酒店", tag: "出发" },
    { time: "10:00–10:45", title: "四条乌丸 → 伏见稻荷", detail: "按当天导航选择电车；热门段给排队和拍照留余量。", area: "京都 → 伏见稻荷", price: "约 ¥600–1,000 / 两人", tag: "交通" },
    { time: "10:45–12:15", title: "伏见稻荷大社", detail: "走千本鸟居入口到中腹即可，不追求完整登山；之后直接向东山移动，不折回河原町。", area: "京都南部", placeId: "fushimi-inari", tag: "古迹" },
    { time: "12:15–13:30", title: "伏见稻荷 → 东山午餐", detail: "在清水寺附近先吃定食、乌冬或肉类热食；不为了锦市场把路线拉回市中心。", area: "伏见稻荷 → 东山", price: "¥2,000–4,000 / 两人", tag: "交通 / 吃" },
    { time: "13:30–15:30", title: "清水寺 · 二年坂三年坂", detail: "第一次京都的重点古迹；坡道多，雨天穿防滑鞋，不为每间店排队。", area: "东山", placeId: "kiyomizu", tag: "古迹" },
    { time: "15:30–16:30", title: "八坂神社", detail: "沿东山向北走，若步数已高就只看主殿，不继续加远处寺社。", area: "祇园", placeId: "yasaka", tag: "文化" },
    { time: "16:30–17:30", title: "花见小路 · 祇园白川", detail: "慢走拍建筑，不拦人、不追拍艺伎；把晚餐放在交通方便的河原町。", area: "祇园", placeId: "hanamikoji", tag: "散步" },
    { time: "17:30–18:30", title: "锦市场 · 寺町 / 新京极", detail: "从祇园向西走回市中心，买伴手礼和熟食小吃；鱼介、柴鱼片与鲑鱼逐项确认。", area: "锦市场 / 河原町", placeId: "nishiki", price: "¥1,500–3,000 / 两人", tag: "吃 / 购物" },
    { time: "18:30–20:00", title: "先斗町熟食晚餐", detail: "选烧肉、乌冬或定食；女友可以单独安排海鲜，你继续避免共用餐具。", area: "四条河原町", placeId: "pontocho", price: "¥5,000–10,000 / 两人", tag: "吃" },
    { time: "20:00–21:30", title: "鴨川边散步", detail: "小红书京都路线反复强调按片区慢走；今天不再跨到岚山，早点回酒店。", area: "鴨川", tag: "夜景" },
  ],
};

const FLIGHT_DAY_6: HourlyPlan = {
  day: 6,
  title: "9/4 周五 · 京都 → 奈良 → 大阪",
  summary: "第二次也是最后一次换酒店：10:00 左右退京都房，带轻装去奈良，傍晚从近铁奈良直接到大阪难波；不回京都取箱，减少折返。",
  distance: "约 12–16k 步 · 大阪住 1 晚",
  items: [
    { time: "09:00–10:00", title: "起床、整理、京都退房", detail: "常见退房约 10:00，具体以酒店规定为准；把主箱压到一件，贵重物和药物随身带。", area: "京都酒店", tag: "换城" },
    { time: "10:00–10:45", title: "京都酒店 → 近铁京都站", detail: "四条乌丸 / 河原町先步行或乘地铁到京都站，按酒店位置选择最少换乘的方案；到近铁京都站后乘近铁京都线前往近铁奈良站。", area: "京都 → 近铁奈良", price: "约 ¥1,500–2,500 / 两人", tag: "交通" },
    { time: "10:45–11:15", title: "奈良站寄存行李 / 买水", detail: "小红书行李经验提醒先确认柜子尺寸；放不下就不要硬塞，改为全程随身一件小箱。", area: "近铁奈良站", tag: "行李" },
    { time: "11:15–12:30", title: "奈良公园与鹿群", detail: "收好包、地图和食物，给鹿留距离；鹿仙贝只在指定处购买。", area: "奈良公园", placeId: "nara-park", tag: "自然" },
    { time: "12:30–13:30", title: "奈良熟食午餐", detail: "柿叶寿司列为女友可尝候选；你选择确认过的定食、乌冬或肉类，不共享餐具。", area: "奈良公园周边", placeId: "nara-food", price: "¥3,000–6,000 / 两人", tag: "吃" },
    { time: "13:30–15:00", title: "东大寺大佛殿", detail: "奈良文化主线预留 60–90 分钟；不把春日大社和若草山都当成必须。", area: "东大寺", placeId: "todaiji", tag: "古迹" },
    { time: "15:00–16:00", title: "春日大社 / 若草山（二选一）", detail: "森林参道选春日大社，想看远景选若草山；下雨或步数高就直接回车站。", area: "奈良公园东侧", placeId: "kasuga-taisha", tag: "文化" },
    { time: "16:00–17:00", title: "奈良 → 大阪难波", detail: "从近铁奈良站乘近铁奈良线到大阪难波，优先看直达或少停站车次；不返回京都取箱，抵达后直接办理入住或寄存。", area: "近铁奈良 → 大阪难波", price: "约 ¥1,500–2,500 / 两人", tag: "换城" },
    { time: "17:00–18:00", title: "难波酒店入住 / 放行李", detail: "常见入住时间约 15:00，抵达时一般可直接办理；若预订有晚到规则，提前告知酒店。", area: "大阪难波", placeId: "osaka-namba-stay", tag: "入住" },
    { time: "18:00–20:30", title: "道顿堀 · 心斋桥晚餐", detail: "先熟悉返程日要用的南海难波动线；你吃肉类 / 蔬菜大阪烧，女友再单独安排海鲜。", area: "道顿堀 / 心斋桥", placeId: "dotonbori", price: "¥4,000–9,000 / 两人", tag: "大阪" },
    { time: "20:30–22:00", title: "回难波酒店，准备 KIX", detail: "确认南海电铁 / 机场快线、航站楼、退房与寄存凭证；不再跑梅田或中之岛。", area: "难波酒店", tag: "收尾" },
  ],
};

const FLIGHT_DAY_7: HourlyPlan = {
  day: 7,
  title: "9/5 周六 · 大阪整日 → 19:30 KIX 返沪",
  summary: "返程日不再去梅田和中之岛两头折返：难波退房寄存 → 大阪城 → 黑门 → 难波购物 → KIX，15:00 左右离开难波，给国际航班留足余量。",
  distance: "约 9–13k 步 · 大阪 → 浦东",
  items: [
    { time: "09:00–10:00", title: "起床、早餐、退房寄存", detail: "日本酒店常见 10:00 左右退房；提前确认最晚取行李时间，把护照、免税单、药物和充电宝放随身包。", area: "难波酒店", placeId: "osaka-day7-start", tag: "返程" },
    { time: "10:00–10:30", title: "难波 → 大阪城", detail: "只带小包；常用走法是 Osaka Metro 御堂筋线难波 → 本町，换中央线到谷町四丁目，再步行进公园，具体出口按当天导航确认。", area: "难波 → 谷町四丁目", price: "约 ¥500–800 / 两人", tag: "交通" },
    { time: "10:30–12:15", title: "大阪城天守阁与公园", detail: "大阪文化主线；天守阁约 60 分钟，公园和换乘另留 30–45 分钟。", area: "大阪城公园", placeId: "osaka-castle", price: "约 ¥1,200 / 人", tag: "文化" },
    { time: "12:15–12:45", title: "大阪城 → 黑门市场", detail: "从谷町四丁目乘中央线到堺筋本町，再换堺筋线到日本桥，向南回到黑门；全程不再上梅田，提前看好最后取行李时间。", area: "谷町四丁目 → 日本桥", price: "约 ¥500–800 / 两人", tag: "交通" },
    { time: "12:45–13:45", title: "黑门市场午餐 / 小食", detail: "女友可吃海鲜，你选择烤物、玉子烧等确认过的熟食；不同摊位交叉污染风险高。", area: "日本桥", placeId: "kuromon", price: "¥3,000–6,000 / 两人", tag: "吃" },
    { time: "13:45–14:15", title: "难波八阪神社", detail: "返程日前的 30 分钟文化收尾；如果黑门排队或天气不好，直接删除。", area: "难波", placeId: "namba-yasaka", tag: "文化" },
    { time: "14:15–15:00", title: "心斋桥 / 难波最后采购", detail: "只买清单内缺的 Chiikawa、药妆和伴手礼；保留发票和免税包装，不去梅田开新战线。", area: "难波 / 心斋桥", placeId: "namba-shopping", tag: "购物" },
    { time: "15:00–15:30", title: "取行李、整理购物袋", detail: "核对护照、登机牌、充电宝、药物、免税袋和酒店寄存凭证；预留一次厕所和补水。", area: "难波酒店", placeId: "osaka-coffee", price: "¥1,400–3,000 / 两人", tag: "收尾" },
    { time: "15:30–16:20", title: "南海难波 → 关西机场", detail: "按小红书返程搜索结果采用南海电铁主线：提前确认机场急行或 Rapi:t 的车次、座位和航站楼；不临时绕去梅田换 JR。", area: "南海难波 → KIX", price: "约 ¥2,000–4,000 / 两人", tag: "交通" },
    { time: "16:20–19:30", title: "值机、免税、安检与候机", detail: "19:30 国际航班，目标 16:30 前到机场；不要把最后的 Chiikawa 采购押在机场。", area: "关西机场", placeId: "kix-airport", tag: "返程" },
    { time: "19:30–21:00", title: "关西 → 浦东", detail: "固定返程：2026/9/5 19:30 起飞、21:00 抵达上海浦东。", area: "KIX → PVG", tag: "航班" },
  ],
};

const FLIGHT_DAY_1: HourlyPlan = {
  day: 1,
  title: "8/30 周日 · 01:05 浦东 → 05:00 羽田",
  summary: "不额外订 8/29 晚：05:00 到羽田后直接进市区，先吃一顿早饭、逛筑地和浅草，下午 15:00 左右才回东京基地办理入住、放行李，再安排低强度晚线。",
  distance: "约 9–13k 步 · 东京住 3 晚",
  items: [
    { time: "8/29 22:00–23:00", title: "到浦东机场办理值机", detail: "01:05 国际航班建议提前到机场；护照、登机牌、过敏药、日语过敏卡和充电宝放在随身包。", area: "浦东机场 T1 / T2", tag: "出发" },
    { time: "01:05–05:00", title: "浦东 → 东京羽田", detail: "固定航班：2026/8/30 01:05 起飞、05:00 抵达；日本比上海快 1 小时。", area: "PVG → HND", tag: "航班" },
    { time: "05:00–06:30", title: "入境、取行李、买网络", detail: "先完成入境和取行李；如果首班车前有空档就在机场补水，不把 05:00 当作景点开始时间。", area: "羽田 T3", tag: "落地" },
    { time: "06:30–07:30", title: "羽田 → 东京市区", detail: "首选当天可用的京急线，优先看直通都营浅草线、前往东银座 / 浅草方向的车次；若班次不合适，备选东京单轨到滨松町再换 JR。首班时刻出发前一周再核对。", area: "HND T3 → 东银座 / 浅草", price: "约 ¥1,000–2,000 / 两人", tag: "交通" },
    { time: "07:30–09:30", title: "筑地场外市场早饭与散步", detail: "小红书搜索里多次出现筑地早晨路线；但 8/30 是周日，场外市场部分店铺可能休息，前一晚确认营业店。女友可选寿司，你选择玉子烧、烤物或明确成分的热食。", area: "筑地", placeId: "tsukiji-d1-breakfast", price: "¥2,000–6,000 / 两人", tag: "早饭" },
    { time: "09:30–10:15", title: "筑地 → 浅草", detail: "按当天导航从筑地乘东京 Metro 日比谷线到上野，再换银座线到浅草；不先回酒店，保持早上的顺线。", area: "筑地 → 浅草", price: "约 ¥500–800 / 两人", tag: "交通" },
    { time: "10:15–12:00", title: "雷门 · 浅草寺 · 仲见世", detail: "浅草寺本堂和雷门适合早到先逛；仲见世店铺营业时间各不相同，店没开就先看寺院和隅田川，不为了购物停留。", area: "浅草", placeId: "sensoji", tag: "文化" },
    { time: "12:00–13:30", title: "浅草热食午餐", detail: "天妇罗、鳗鱼或明确成分的定食；你继续确认鱼介、鲑鱼、柴鱼和酱汁，女友生鱼另行安排。", area: "浅草", placeId: "asakusa-tempura", price: "¥3,000–7,000 / 两人", tag: "吃" },
    { time: "13:30–14:30", title: "浅草 → 东京基地", detail: "回上野 / 浅草酒店办理入住；如果房间还没准备好，先寄存行李、充电和换衣，15:00 后再进房。", area: "浅草 → 上野 / 浅草酒店", price: "约 ¥500–1,000 / 两人", tag: "入住" },
    { time: "15:00–16:30", title: "办理入住、放行李、洗漱", detail: "这次不加订前一晚酒店，下午按标准入住窗口处理；把大件行李放下后再出门，不拖箱继续逛。", area: "东京酒店", placeId: "tokyo-base-stay", tag: "入住" },
    { time: "17:00–19:00", title: "浅草低强度晚线", detail: "状态好就补逛仲见世、合羽桥或隅田川；夜航后很累就只在酒店周边吃饭，不再跨区。", area: "浅草", placeId: "sensoji", tag: "散步" },
    { time: "19:00–20:30", title: "浅草热食晚餐", detail: "鸡肉、烤物或明确成分的定食优先；第一天不挑战成分不明的鱼汤、酱汁和共用锅。", area: "浅草", placeId: "asakusa-tempura", price: "¥3,000–7,000 / 两人", tag: "吃" },
    { time: "20:30–22:00", title: "回酒店、为 D2 充电", detail: "第二天要去东京站、筑地、银座和秋叶原；今天早起已经消耗体力，22:00 左右收尾。", area: "东京酒店", tag: "收尾" },
  ],
};

const FLIGHT_HOURLY_PLANS: HourlyPlan[] = UPDATED_HOURLY_PLANS
  .filter((plan) => ![1, 4, 5, 6, 7, 8].includes(plan.day))
  .concat([FLIGHT_DAY_1, FLIGHT_DAY_4, FLIGHT_DAY_5, FLIGHT_DAY_6, FLIGHT_DAY_7])
  .sort((a, b) => a.day - b.day);

HOURLY_PLANS.splice(0, HOURLY_PLANS.length, ...FLIGHT_HOURLY_PLANS);

type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  timing: string;
  priority?: "必做" | "建议" | "按需";
};

type ChecklistGroup = {
  id: string;
  kicker: string;
  title: string;
  note: string;
  items: ChecklistItem[];
};

const PRE_DEPARTURE_GROUPS: ChecklistGroup[] = [
  {
    id: "documents",
    kicker: "01 / 证件",
    title: "身份、入境与保险",
    note: "先把‘能不能顺利出发’的事情做完；护照、二维码和酒店地址不要只存在一个手机里。",
    items: [
      { id: "check-doc-passport", title: "护照原件与有效期", detail: "两个人分别检查姓名、出生日期、签名页和有效期；护照放在随身包，不放托运行李。", timing: "现在", priority: "必做" },
      { id: "check-doc-visa", title: "签证 / 入境资格材料", detail: "你们已办好签证，仍要保存签证相关材料，并核对护照姓名与机票、酒店预订是否一致。", timing: "现在", priority: "必做" },
      { id: "check-doc-copy", title: "证件备份", detail: "护照资料页、签证、机票、酒店确认单各留一份离线 PDF / 截图；可各自保存一份，不要只放在同一台手机。", timing: "出发前 7–14 天", priority: "必做" },
      { id: "check-doc-vjw", title: "填写 Visit Japan Web", detail: "按入境机场和航班录入入境、海关信息，生成二维码；出发前再次打开确认，并保留纸质 / 截图备份。", timing: "出发前 72 小时", priority: "必做" },
      { id: "check-doc-address", title: "酒店日文地址与电话", detail: "把东京、京都、大阪三处酒店的日文地址、电话、入住人姓名保存到备忘录；给司机或问路时直接出示。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-doc-flight", title: "往返机票与机场确认", detail: "确认上海出发机场、东京进港（HND / NRT）、大阪回程 KIX、行李额度、航站楼和在线值机时间。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-doc-insurance", title: "旅行保险与紧急联系人", detail: "保存保单号、理赔电话、两位家人 / 朋友联系方式；把过敏情况和常用药写进自己的紧急信息。", timing: "出发前 7–14 天", priority: "建议" },
      { id: "check-doc-customs", title: "检查日本海关限制物品", detail: "肉制品、植物、药品和免税品规则不要凭攻略猜；不确定的物品先查日本海关官方说明。", timing: "出发前 7 天", priority: "必做" },
    ],
  },
  {
    id: "bookings",
    kicker: "02 / 预订",
    title: "机票、酒店与跨城交通",
    note: "你们的路线是东京 → 京都 → 大阪，只有两次换酒店；提前锁定关键交通，现场只处理小调整。",
    items: [
      { id: "check-book-flight", title: "比较 HND / NRT 进东京", detail: "把票价、落地时间和进城耗时一起比较；不要为便宜一点的票牺牲你们 09:00 起床和第一天体力。", timing: "现在", priority: "必做" },
      { id: "check-book-hotels", title: "确认 3 个住宿基地与日期", detail: "东京 3 晚（8/30–9/1）、京都 2 晚（9/2–9/3）、大阪难波 1 晚（9/4）；确认 15:00 入住、10:00 退房、提前寄存、晚到入住规则，以及 D1 凌晨到达是否需要加订 8/29 晚。", timing: "现在", priority: "必做" },
      { id: "check-book-fuji", title: "预留东京—河口湖往返交通", detail: "按晚起版预留高速巴士 / 铁路方案，确认集合点、回程班次、退改规则和天气不好时的备选。", timing: "出发前 14–30 天", priority: "必做" },
      { id: "check-book-shinkansen", title: "预订东京 → 京都新干线", detail: "比较 Nozomi / 其他班次和指定席；两个人坐一起，行李多时确认大件行李规则。", timing: "出发前 14–30 天", priority: "必做" },
      { id: "check-book-kix", title: "确认大阪难波 → KIX 路线", detail: "根据航班时间倒推，提前看 Nankai / JR 机场快线和最晚班次；返程日不要临时从远处跨区。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-book-reservations", title: "预约必须预约的项目", detail: "把热门餐厅、富士山巴士、展望台、需要预约的温泉和限定活动分开列；不确定就留可取消方案。", timing: "出发前 7–30 天", priority: "按需" },
      { id: "check-book-luggage", title: "决定行李寄送还是自己拖", detail: "东京换京都、京都换大阪时优先问酒店宅急便；随身只留 1 晚换洗、药物、充电器和证件。", timing: "出发前 7 天", priority: "建议" },
      { id: "check-book-share", title: "把行程分享给女朋友和家人", detail: "用网页的‘分享行程’复制链接；再把酒店、航班和紧急联系人发给一位家人，避免只有一个人知道全程。", timing: "出发前 72 小时", priority: "建议" },
    ],
  },
  {
    id: "phone",
    kicker: "03 / 网络",
    title: "流量卡、手机与常用 App",
    note: "手机是地图、翻译、二维码和联系酒店的核心；流量卡建议在国内买好并把激活步骤离线保存。",
    items: [
      { id: "check-phone-unlocked", title: "确认手机支持 eSIM / 实体 SIM 且未锁网", detail: "两个人分别确认机型、运营商限制、双卡能力和剩余存储；不确定就选择实体卡或 Wi‑Fi 备用。", timing: "现在", priority: "必做" },
      { id: "check-phone-sim", title: "购买日本流量卡 / eSIM", detail: "按 7 天用量选套餐；比较总流量、热点、有效期、是否支持 5G 和客服方式，不要只看单价。", timing: "出发前 7–14 天", priority: "必做" },
      { id: "check-phone-qr", title: "保存 eSIM QR 与安装说明", detail: "把 QR、APN、客服入口和激活步骤保存为截图 / PDF；部分产品安装或启用就开始计时，按商家说明操作。", timing: "出发前 72 小时", priority: "必做" },
      { id: "check-phone-sms", title: "保留中国 SIM 接收短信", detail: "如果银行卡、航司或验证码依赖中国号码，确认双卡线路名称；关闭中国卡数据漫游，避免误产生费用。", timing: "出发前 72 小时", priority: "必做" },
      { id: "check-phone-apps", title: "安装地图、翻译与交通 App", detail: "提前登录并测试 Google Maps / Apple 地图、翻译、航司、酒店、JR / 巴士购票页面；把关键路线截屏。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-phone-offline", title: "下载离线资料", detail: "保存机场到酒店、酒店到车站、富士山返程、京都到奈良和难波到 KIX 的地址与路线。", timing: "出发前 72 小时", priority: "建议" },
      { id: "check-phone-backup", title: "准备网络备用方案", detail: "至少一部手机保留漫游 / 另一张 SIM / 移动 Wi‑Fi 其中一项；在山区和地下站不要假设信号一直稳定。", timing: "出发前 7 天", priority: "建议" },
      { id: "check-phone-charge", title: "出门前把两台手机充满", detail: "飞机上、机场和长途巴士都可能需要导航；充电宝放随身包，别放托运行李。", timing: "每天出门前", priority: "必做" },
    ],
  },
  {
    id: "money",
    kicker: "04 / 钱包",
    title: "现金、银行卡与交通卡",
    note: "日本城市里刷卡和 IC 卡很方便，但小店、神社、市场和部分机器仍可能只收现金；两个人不要只带一张卡。",
    items: [
      { id: "check-money-cards", title: "准备两张不同渠道的银行卡", detail: "两个人各自保管一张；出发前确认境外支付、磁条 / 芯片、取现和风控设置，别把卡号完整写进网页。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-money-bank", title: "告知银行出境旅行 / 检查限额", detail: "确认短信验证、境外手续费和每日限额；准备一张不依赖同一账户的备用支付方式。", timing: "出发前 7 天", priority: "建议" },
      { id: "check-money-yen", title: "准备少量日元现金与硬币袋", detail: "机场交通、自动售票机、神社、市场和小店可能要现金；不要一次换太多，留意硬币收纳。", timing: "出发前 1–3 天", priority: "必做" },
      { id: "check-money-ic", title: "决定 Suica / PASMO / ICOCA 方案", detail: "东京和关西都可按实际路线选择 IC 卡；提前确认手机地区、卡片兼容性或到站购买方式。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-money-taxfree", title: "准备免税购物的护照与预算", detail: "免税店通常需要本人护照；Chiikawa、药妆和伴手礼分开记预算，保留发票和包装。", timing: "出发前 7 天", priority: "建议" },
      { id: "check-money-budget", title: "做每日上限与共同账本", detail: "把机酒、跨城交通、餐饮、Chiikawa、药妆和应急金分栏；当天超预算就删低优先级购物。", timing: "出发前 7 天", priority: "建议" },
    ],
  },
  {
    id: "clothes",
    kicker: "05 / 衣物",
    title: "衣服、裤子与 9 月体感",
    note: "9 月仍可能闷热、下雨或遇台风；按出发前一周预报调整，宁可带轻薄可洗的衣物，也不要带一箱厚衣服。",
    items: [
      { id: "check-clothes-tops", title: "透气短袖 4–5 件", detail: "优先速干、容易洗和不怕皱的款式；按酒店洗衣条件决定是否少带一件。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-clothes-bottoms", title: "轻薄长裤 / 半裙 2–3 件", detail: "东京、京都、大阪每天步行多；选能坐车、爬台阶、应对空调和寺社场合的款式。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-clothes-underwear", title: "内衣裤与袜子按 7 天准备", detail: "建议 7 套起，再按是否中途洗衣调整；装一个干净袋和一个脏衣袋。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-clothes-sleep", title: "睡衣 / 轻薄家居服", detail: "酒店不一定提供适合你的睡衣；两个人各带一套，减少晚上临时买东西。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-clothes-layer", title: "薄外套或长袖衬衫", detail: "飞机、车站、商场和夜间可能偏冷；不需要厚羽绒，选择可卷起的轻薄层。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-clothes-rain", title: "折叠伞 / 轻便雨衣", detail: "富士山、京都和大阪都可能临时下雨；鞋袜湿了会明显影响步行体验。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-clothes-shoes", title: "已经磨合的步行鞋", detail: "至少带一双真正走过长距离的运动鞋；不要把新鞋留到日本第一天穿。", timing: "现在", priority: "必做" },
      { id: "check-clothes-sandals", title: "备用凉鞋 / 拖鞋（按需）", detail: "温泉、酒店和洗衣后可用；如果行李紧张，优先保证主鞋和雨具。", timing: "出发前 3 天", priority: "按需" },
      { id: "check-clothes-sun", title: "帽子、防晒和吸汗用品", detail: "富士山湖畔、奈良和大阪步行路段日晒明显；防晒霜、墨镜和小毛巾放日包。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-clothes-laundry", title: "洗衣袋、压缩袋和少量洗衣用品", detail: "把衣物按‘干净 / 待洗 / 明天穿’分开；液体用品按航空随身规则分装。", timing: "出发前 3 天", priority: "建议" },
    ],
  },
  {
    id: "health",
    kicker: "06 / 健康",
    title: "过敏药、常用药与安全边界",
    note: "你对生三文鱼等海鲜过敏，‘带药’不等于可以试吃过敏原；把避让、沟通和就医信息一起准备好。",
    items: [
      { id: "check-health-loratadine", title: "氯雷他定片与个人常用药", detail: "按医生 / 药品说明准备足量，放随身包；不要只带一两片，也不要把全部药放托运行李。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-health-package", title: "保留原包装与药品说明", detail: "处方药或成分特殊的药先查日本携带规定；药名、成分、剂量和用法写成中英日对照。", timing: "出发前 14 天", priority: "必做" },
      { id: "check-health-card", title: "制作日语过敏卡", detail: "写清：鮭 / 生魚等已知过敏项、不要共用餐具、确认鱼介出汁和酱汁；打印两张并存手机。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-health-cross", title: "约定‘不确定就不吃’规则", detail: "女朋友可以单独吃寿司或刺身；你不共用筷子、蘸料、汤底、烤网，也不把熟食默认成无鱼介。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-health-firstaid", title: "创可贴、磨脚贴与消毒用品", detail: "每天 1–1.5 万步很容易磨脚；小包装创可贴、消毒湿巾和备用袜子放日包。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-health-motion", title: "晕车 / 晕船与肠胃备用品", detail: "富士山巴士、奈良和长途车程准备个人适用的药品；先确认成分和携带规则。", timing: "出发前 7 天", priority: "按需" },
      { id: "check-health-sanitize", title: "湿巾、纸巾、免洗洗手液", detail: "市场、车站和排队时很实用；注意液体随身容量与航空规定。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-health-sun", title: "防晒、止痒和防蚊用品", detail: "富士、奈良、公园和晚间河边都可能用到；按个人皮肤情况选择。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-health-emergency", title: "记录急救与就医信息", detail: "把保险电话、酒店地址、过敏卡和紧急联系人放在锁屏 / 钱包里；严重过敏按医生的应急方案处理。", timing: "出发前 72 小时", priority: "必做" },
    ],
  },
  {
    id: "electronics",
    kicker: "07 / 电子",
    title: "充电器、插头与随身设备",
    note: "日本是 100V、Type A 插座；中国大陆设备是否需要转换插头 / 变压器，要看插头和设备铭牌。",
    items: [
      { id: "check-tech-adapter", title: "Type A 转换插头", detail: "日本常用两片平行插脚；确认充电器插头是否能直接使用，必要时带一个小型转换头。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-tech-voltage", title: "检查设备 100V 兼容性", detail: "手机、相机充电器通常支持宽电压，但吹风机、卷发棒等大功率设备要看铭牌，必要时别带。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-tech-chargers", title: "手机 / 手表 / 相机充电器", detail: "两个人各自准备自己的线，公共充电器再带一套；线材贴标签，避免换酒店遗漏。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-tech-powerbank", title: "充电宝放随身包", detail: "不要托运；提前确认容量标识、航空公司最新要求和是否需要单独收纳。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-tech-camera", title: "相机、备用电池与存储卡", detail: "富士山和 Chiikawa 购物都可能拍很多照片；出发前备份旧照片并格式化备用卡。", timing: "出发前 3 天", priority: "按需" },
      { id: "check-tech-earbuds", title: "耳机、眼罩和耳塞", detail: "凌晨去程、巴士和酒店隔音都不确定；给 7 天路线留一点安静的恢复时间。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-tech-cable", title: "线材收纳袋", detail: "把充电头、线、转换头和充电宝放在同一小包，换酒店时一眼可见。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-tech-backup", title: "重要文件离线可读", detail: "机票、酒店、VJW、过敏卡和交通票不要只依赖登录状态；截图时遮住不必要的隐私信息。", timing: "出发前 72 小时", priority: "必做" },
    ],
  },
  {
    id: "daily",
    kicker: "08 / 日包",
    title: "每天真正会拿出来的东西",
    note: "把大行李留在酒店，日包只装一天的必需品；特别是富士山和奈良，不要背着全部购物战利品。",
    items: [
      { id: "check-daily-bag", title: "轻便斜挎包 / 小背包", detail: "能放护照、手机、钱包、药物、充电宝、雨具和水；拉链比开放式托特更稳妥。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-daily-passport", title: "护照与小额现金随身", detail: "免税购物、酒店、交通和入境相关场景可能会用到；不要放在行李箱深处。", timing: "每天出门前", priority: "必做" },
      { id: "check-daily-towel", title: "小毛巾 / 吸汗巾", detail: "日本很多洗手间不一定提供烘手机或纸巾；9 月步行时也能应对出汗。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-daily-bottle", title: "可重复使用水瓶", detail: "每天出门前装水；喝完再在便利店或酒店补，别因为找水打断路线。", timing: "每天出门前", priority: "建议" },
      { id: "check-daily-bags", title: "折叠购物袋与密封袋", detail: "日本街头垃圾桶不一定随处可见；购物、湿伞、零食和小垃圾分开装。", timing: "出发前 3 天", priority: "必做" },
      { id: "check-daily-pen", title: "笔与小纸条", detail: "填写纸质表格、记车次、写日文过敏说明或给店员看时都方便。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-daily-luggage", title: "行李牌、行李锁和备用绑带", detail: "给两个人的箱子写英文姓名和联系方式；购物后用绑带固定外袋。", timing: "出发前 3 天", priority: "建议" },
      { id: "check-daily-phrases", title: "保存 5 句日语求助句", detail: "过敏、问路、确认站台、请帮忙和买单先写好；翻译软件失灵时也能直接出示。", timing: "出发前 7 天", priority: "必做" },
    ],
  },
  {
    id: "timeline",
    kicker: "09 / 倒计时",
    title: "出发前 14 天到起飞当天",
    note: "把准备拆成小块，不要在起飞前一晚同时找护照、买流量卡和查天气。",
    items: [
      { id: "check-time-weather", title: "看东京、富士、京都、大阪预报", detail: "先看 7 天趋势，再在出发前 48 小时看降雨、台风和高温；富士山可在 D3 与大阪夜景之间调整强弱。", timing: "出发前 7 天 / 48 小时", priority: "必做" },
      { id: "check-time-stock", title: "查 Chiikawa 店铺公告与库存规则", detail: "东京站店、秋叶原和可能的机场备选分开记录；不要把限定商品有货当成保证。", timing: "出发前 7 天 / 当天早上", priority: "必做" },
      { id: "check-time-reserve", title: "复核预约和取消截止时间", detail: "把富士巴士、新干线、住宿、展望台和餐厅按日期排好；把不可退项目单独标红。", timing: "出发前 7 天", priority: "必做" },
      { id: "check-time-vjw", title: "截图 VJW 二维码与酒店信息", detail: "用 Wi‑Fi 和流量各测试一次能否打开；截图不含多余隐私，二维码只给同行和工作人员看。", timing: "出发前 72 小时", priority: "必做" },
      { id: "check-time-sim", title: "测试 eSIM / SIM 安装步骤", detail: "不要在不清楚计时规则时提前激活；把日本数据线路、漫游开关和 APN 步骤写在纸上。", timing: "出发前 72 小时", priority: "必做" },
      { id: "check-time-cash", title: "换日元、检查银行卡与充电宝", detail: "现金、卡、手机和充电宝分开保管；两个人至少各有一套能独立完成一天的支付和导航工具。", timing: "出发前 48 小时", priority: "必做" },
      { id: "check-time-online", title: "完成航司在线值机 / 座位确认", detail: "检查托运行李、机场航站楼、起飞时间和到达后的交通，不要只看购票邮件标题。", timing: "出发前 24 小时", priority: "必做" },
      { id: "check-time-pack", title: "按随身包 / 托运行李分装", detail: "随身包：证件、药物、充电宝、充电器、过敏卡、贵重物；托运行李：衣物和非必要用品。", timing: "出发前 24 小时", priority: "必做" },
      { id: "check-time-home", title: "关水电、清空易坏食物、备份钥匙", detail: "把家里、工作和宠物 / 植物安排好；不要让旅行第一天还在处理家中琐事。", timing: "出发前 24 小时", priority: "建议" },
      { id: "check-time-final", title: "出门前最后 10 项点名", detail: "护照、钱包、手机、充电器、充电宝、药物、过敏卡、机票、VJW、酒店地址。", timing: "出发当天", priority: "必做" },
    ],
  },
  {
    id: "arrival",
    kicker: "10 / 落地",
    title: "抵达日本后的前两小时",
    note: "这部分也提前看一遍：落地后只做必要动作，不要刚入境就拖箱跨城追景点。",
    items: [
      { id: "check-arrival-sim", title: "落地后再启用日本数据线路", detail: "按购买说明切换数据线路，确认能打开地图和联系酒店；中国号码保留接收验证码。", timing: "落地后", priority: "必做" },
      { id: "check-arrival-immigration", title: "准备护照、VJW 二维码、酒店地址", detail: "把二维码和酒店信息放在容易打开的位置，入境与海关时按工作人员指引操作。", timing: "落地后", priority: "必做" },
      { id: "check-arrival-luggage", title: "取行李后检查箱体与物品", detail: "确认行李牌、箱锁和贵重物；如果要寄送行李，先拍照留存并确认送达时间。", timing: "落地后", priority: "建议" },
      { id: "check-arrival-ic", title: "完成 IC 卡 / 机场交通准备", detail: "先确认从 HND / NRT 到酒店的路线，再买卡或车票；不要拖着行李在站内来回找机器。", timing: "落地后", priority: "必做" },
      { id: "check-arrival-hotel", title: "先到酒店寄存，再开始行程", detail: "把护照、药物、充电器和当晚换洗留在随身包；第一天只走浅草 / 上野主线。", timing: "落地后", priority: "必做" },
      { id: "check-arrival-message", title: "给家人和同行者报平安", detail: "发送‘已入境 / 已到酒店’即可，不要在公共场合长时间掏出全部证件和现金。", timing: "到酒店后", priority: "建议" },
      { id: "check-arrival-reset", title: "晚上不补行程", detail: "确认第二天车票、天气、药物和充电后休息；不为了打卡把睡觉拖到 02:00 以后。", timing: "每天 21:00 后", priority: "必做" },
    ],
  },
];

type ChecklistSource = {
  title: string;
  author: string;
  noteId: string;
  summary: string;
  link: string;
};

const CHECKLIST_SOURCES: ChecklistSource[] = [
  {
    title: "第一次去日本需要带什么（J人版）",
    author: "修勾礼宝 · 07-18",
    noteId: "6a5b472b000000000a03b096",
    summary: "从第一次出行的角度整理证件、衣物、电子设备、药品和随身小物，适合用来做漏项检查。",
    link: "https://www.xiaohongshu.com/explore/6a5b472b000000000a03b096",
  },
  {
    title: "🇯🇵日本旅行必备清单（临时出发版✈️）",
    author: "Mandy · 2025-11-06",
    noteId: "690ca5400000000007000be0",
    summary: "临时出发视角，集中提醒护照、充电、网络、现金和行李减法，适合出发前 72 小时复核。",
    link: "https://www.xiaohongshu.com/explore/690ca5400000000007000be0",
  },
  {
    title: "日本玩了 7 天，分享超详细旅行清单！",
    author: "囡囝囚团. · 07-16",
    noteId: "6a58a34c000000000f00bb02",
    summary: "7 天实测型清单，补充交通卡、防晒、现金、预约和衣物等容易被忽略的旅行细节。",
    link: "https://www.xiaohongshu.com/explore/6a58a34c000000000f00bb02",
  },
  {
    title: "🧾日本自由行保姆级行前准备清单",
    author: "蟹宝爱睡觉 · 2025-09-10",
    noteId: "68c161b7000000001d01e8a3",
    summary: "按出发前、机场和抵达后的时间顺序整理，适合和本页倒计时区一起核对。",
    link: "https://www.xiaohongshu.com/explore/68c161b7000000001d01e8a3",
  },
  {
    title: "第一次去日本旅行的 check list🧾",
    author: "空空 · 07-14",
    noteId: "6a55e50e000000000702b4cf",
    summary: "用 checklist 形式提醒证件、网络、换汇和日用品，适合两个人分工勾选。",
    link: "https://www.xiaohongshu.com/explore/6a55e50e000000000702b4cf",
  },
  {
    title: "去关西没提前买手机流量卡，怎么办？",
    author: "马尼马 · 07-11",
    noteId: "6a51b430000000002101b5b0",
    summary: "提醒不要等落地后才处理网络；本页将 eSIM / 实体卡、二维码、双卡和备用方案拆开。",
    link: "https://www.xiaohongshu.com/explore/6a51b430000000002101b5b0",
  },
  {
    title: "新手向：两种日本流量开通方式",
    author: "黑色麦芽 · 2025-10-01",
    noteId: "68dd4b43000000000301e6a2",
    summary: "围绕实体卡 / eSIM 的启用方式做对比；具体套餐、有效期和 APN 仍需看购买商家的最新说明。",
    link: "https://www.xiaohongshu.com/explore/68dd4b43000000000301e6a2",
  },
  {
    title: "日本签证 Visit Japan Web VJW 一定要提前填",
    author: "CatCameBack · 2025-08-19",
    noteId: "68a42945000000001c030a35",
    summary: "围绕入境二维码和资料填写提醒提前准备；本页同时放了日本数字厅官方入口。",
    link: "https://www.xiaohongshu.com/explore/68a42945000000001c030a35",
  },
  {
    title: "日本一分钟丝滑入境！关西机场保姆级攻略",
    author: "正在漫游 · 07-16",
    noteId: "6a57d1f70000000008003731",
    summary: "按 KIX 落地动线提示入境、取行李、交通与时间留余；适合核对返程和大阪落地两段流程。",
    link: "https://www.xiaohongshu.com/explore/6a57d1f70000000008003731",
  },
  {
    title: "赴日支付保姆级攻略✨90%场景全覆盖",
    author: "Vivian · 08-10",
    noteId: "6a79e2060000000005033a5b",
    summary: "提醒现金、银行卡和移动支付要做备份；本页进一步按东京、京都、大阪的小店场景拆分。",
    link: "https://www.xiaohongshu.com/explore/6a79e2060000000005033a5b",
  },
  {
    title: "✅日本西瓜卡终极省钱技巧",
    author: "FFMO · 2 小时前",
    noteId: "6a83e4550000000005032bef",
    summary: "围绕 IC 卡使用场景做提醒；实际选择手机卡、实体卡或关西 IC 卡要按设备和路线确认。",
    link: "https://www.xiaohongshu.com/explore/6a83e4550000000005032bef",
  },
];

const CHECKLIST_OFFICIAL_SOURCES = [
  { label: "羽田交通", title: "Keikyu · Haneda Airport access", href: "https://www.keikyu.co.jp/en/visit/haneda-airport/access/train.html" },
  { label: "单轨", title: "Tokyo Monorail · Haneda Terminal 3", href: "https://www.tokyo-monorail.co.jp/sc/guidance/kokusaisen/index.html" },
  { label: "筑地", title: "Tsukiji Outer Market · Official", href: "https://www.tsukiji.or.jp/english/shopping/" },
  { label: "入境", title: "Visit Japan Web · 日本数字厅", href: "https://www.digital.go.jp/en/policies/visit_japan_web" },
  { label: "海关", title: "Japan Customs · Passenger Clearance", href: "https://www.customs.go.jp/english/summary/passenger.htm" },
  { label: "药品", title: "JNTO · Bringing Medication into Japan", href: "https://www.japan.travel/en/ca/bringing-medication-into-japan/" },
  { label: "插座", title: "JNTO · Plugs & Electricity", href: "https://www.japan.travel/en/plan/plug-and-electricity/" },
  { label: "行李", title: "JNTO · Luggage & Storage", href: "https://www.japan.travel/en/plan/getting-around/luggage-storage/" },
  { label: "天气", title: "Japan Meteorological Agency · Forecast", href: "https://www.jma.go.jp/jma/en/Activities/forecast.html" },
  { label: "规划", title: "JNTO · Japan Travel Planning", href: "https://www.japan.travel/en/plan/" },
  { label: "免税", title: "JNTO · Japan’s Tax Exemption", href: "https://www.japan.travel/en/plan/japans-tax-exemption/" },
];

const RESEARCH_TIPS = [
  {
    label: "小红书笔记 01",
    sourceTitle: "日本8日「东进阪出」超全攻略✨",
    author: "A锦鲤🍯",
    noteId: "6a75d1e90000000006005aeb",
    title: "东京 → 镰仓 → 富士 → 京都 → 奈良 → 大阪",
    text: "正文按东京银座 / 秋叶原、镰仓江之岛、富士山、京都、奈良、大阪的顺序展开：东京文化与购物、镰仓海岸线、富士山机位、京都古迹、奈良公园和大阪城道顿堀都有具体落点。",
    decision: "吸收东进阪出的方向，但不照搬高密度节奏；本网页保留 09:00 起床与 02:00 前睡的缓冲，并用完整大阪日替代东京南侧日归。",
    usedIn: "全程骨架，重点落在 D1–D7；东京购物主线落在 D2",
    link: "https://www.xiaohongshu.com/explore/6a75d1e90000000006005aeb",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 02",
    sourceTitle: "日本自由行5天4晚，这样排才不会废腿",
    author: "saint在日本",
    noteId: "6a4288a70000000022018209",
    title: "5 天最重要的是少换乘",
    text: "笔记正文明确提醒：第一天不要硬塞景点；东京段可以把浅草、上野、银座放在同一大区；第四天东京去大阪，晚上只走心斋桥和道顿堀；返程日不要再硬塞京都奈良。",
    decision: "直接采用“只换一次酒店”和 D4 东京→大阪的松弛边界；保留 D1 浅草 + 上野，把东京站、筑地、银座和秋叶原集中在 D2，并把早班机降为需要机场酒店的例外，不破坏你们的晚起作息。",
    usedIn: "D1、D2、D4、D5",
    link: "https://www.xiaohongshu.com/explore/6a4288a70000000022018209",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 03",
    sourceTitle: "东京Chiikawa地图🗺️全收藏",
    author: "一只小黄堡",
    noteId: "6a4f37010000000015027bee",
    title: "Chiikawa 采购不只看一间店",
    text: "作者分享了餐厅、面包店、Chiikawa Land，以及银座联名店的步行扫货体验，并提到全程 walk-in；这篇对你们最有价值的是“按区域串店”，不是某件商品一定有货。",
    decision: "把东京站 ちいかわらんど设为第一优先，并按区域串成东京站 → 筑地 → 银座 → 秋叶原；库存、限购、入场和限定商品不从笔记推断，改看当天官方公告。",
    usedIn: "D2：东京站 → 筑地 → 银座 → 秋叶原",
    link: "https://www.xiaohongshu.com/explore/6a4f37010000000015027bee",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 04",
    sourceTitle: "日本东京、大阪、富士山、机位全攻略！！！",
    author: "猪皮香奈儿",
    noteId: "6a15309d0000000038020711",
    title: "富士山拍照点要做减法",
    text: "笔记整理了富士吉田罗森、街道路口、忠灵塔，以及东京塔、晴空塔和大阪道顿堀等拍摄点，并强调蓝调时刻和天气对成片的影响。",
    decision: "只保留忠灵塔 + 河口湖湖畔作为主线，便利店和其他街道路口列为顺路备选；不为拍照跨城折返，也不在车道边停留。",
    usedIn: "D3：忠灵塔、河口湖湖畔、天气备选",
    link: "https://www.xiaohongshu.com/explore/6a15309d0000000038020711",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 05",
    sourceTitle: "日本双人五天四晚自由行攻略，人均五千!",
    author: "KK",
    noteId: "6a476ca80000000016027420",
    title: "机场接驳、雨天和预算要留余量",
    text: "作者公开记录了双人 5 天 4 晚的机场酒店、东京市区、跨城交通和餐饮花费，并提醒机场优先坐酒店接驳、雨天不要硬去高空观景台、第三方门票可能无法退改。",
    decision: "吸收机场接驳优先、雨天删景点、酒店价格按两人整晚计算这三条经验；不照搬其香港出发和东京—京都路线，改成上海东京进、大阪出。",
    usedIn: "D1 落地、D3 雨天备选、总预算",
    link: "https://www.xiaohongshu.com/explore/6a476ca80000000016027420",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 06",
    sourceTitle: "8.13 东京出发｜富士山一日懒人攻略✨",
    author: "富士观光旅游",
    noteId: "6a7bcb0a00000000050207de",
    title: "富士山点位要按顺序取舍",
    text: "笔记把山中湖、忍野八海、大石公园、富士吉田便利店、忠灵塔和日川时计店排成东京出发的一日路线，并把集合、拍照和返回时间写得很清楚。",
    decision: "参考其“先湖景、再河口湖、最后富士吉田机位”的顺序，但因你们 09:00 才起床，主线只留天上山 / 湖畔 + 忠灵塔或大石公园二选一，不把六个点硬塞进一天。",
    usedIn: "D3 晚起版富士山、天气切换",
    link: "https://www.xiaohongshu.com/explore/6a7bcb0a00000000050207de",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 07",
    sourceTitle: "Chiikawa 扫货攻略 | ~羽田机场t3!",
    author: "曾小朵",
    noteId: "696bb308000000001a028df2",
    title: "羽田机场限定适合作为备选",
    text: "笔记实测羽田 T3 五楼 TOKYO POP TOWN 的 Haikala 店，位置在安检前的 Hot Zone，提到毛绒、挂件、文具、零食和羽田 / 地区限定，也提醒提前 2–3 小时到机场并预留挑选时间。",
    decision: "把它列为去程 HND 才能使用的 Chiikawa 备选，不拿它替代 D2 东京站主线；若从 NRT 进或 KIX 回，就不为机场限定专门折返。",
    usedIn: "D1 去程 HND 备选、D2 Chiikawa 清单",
    link: "https://www.xiaohongshu.com/explore/696bb308000000001a028df2",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 08",
    sourceTitle: "🇯🇵日本7天6晚自由行｜详细版攻略奉上🤟",
    author: "小媞同學🍥",
    noteId: "6a65a51f000000001101a8fa",
    title: "大阪 / 京都 / 富士 / 东京的取舍",
    text: "笔记记录了大阪道顿堀、USJ、京都与奈良包车、御殿场、富士和东京浅草银座涩谷的组合，也提醒交通卡、现金、预约与 9 月炎热问题。",
    decision: "把 USJ 留为可替换日而非主线，保留其对现金、交通卡、防晒和 9 月体感的提醒；本次主线用奈良的文化自然体验和大阪城市线替代主题乐园。",
    usedIn: "D3 富士山、D6 奈良、D7 大阪；出发前准备",
    link: "https://www.xiaohongshu.com/explore/6a65a51f000000001101a8fa",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 09",
    sourceTitle: "日本8天7晚旅游攻略！💰8k+含机酒",
    author: "小昕🌟",
    noteId: "6a41fa58000000001101e5f6",
    title: "京都 + 箱根 + 横滨的替代思路",
    text: "笔记采用大阪、京都、箱根、横滨、东京的 8 天线路，细写了京都南禅寺 / 永观堂、贵船、箱根芦之湖与大涌谷、横滨红砖仓库等点，并记录了交通、住宿与餐饮花费。",
    decision: "吸收京都至少安排两天、箱根适合雨天泡温泉的思路；因为你们想看富士山、又不喜欢频繁换酒店，本方案不再叠加箱根和横滨，箱根保留为温泉替换方案。",
    usedIn: "D5、D6、住宿取舍与预算校准",
    link: "https://www.xiaohongshu.com/explore/6a41fa58000000001101e5f6",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 10",
    sourceTitle: "🇯🇵7天6晚｜东京-富士山-伊豆-大阪京都奈良",
    author: "nbcs",
    noteId: "6a72a257000000002403c85a",
    title: "伊豆很美，但这次先不塞",
    text: "笔记把山中湖、伊豆城崎海岸、门胁吊桥、大室山、京都、奈良和大阪串起来，并特别提醒伊豆公共交通班次少、错过巴士后等待时间长，东京到伊豆再进大阪会消耗很多时间。",
    decision: "不把伊豆加入这次 8 天主线：它更适合下一次专门做温泉与海岸线，或替换镰仓；本次少换酒店和晚起作息优先。",
    usedIn: "路线取舍：D4 提前东京→京都，不增加伊豆换乘；镰仓 / 江之岛留作下次",
    link: "https://www.xiaohongshu.com/explore/6a72a257000000002403c85a",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 11",
    sourceTitle: "京都新手保姆级攻略✨少绕路｜一次搞定",
    author: "炸鸡大王🍗（见过拉椅子版）",
    noteId: "6a7f15780000000032023f8d",
    title: "第一次京都：经典线不要贪多",
    text: "笔记强调第一次京都按片区游玩、交通加步行组合，并把伏见稻荷、清水寺、二年坂三年坂、八坂神社、祇园和鴨川列成经典顺路线；同时建议热门点尽量早点去。",
    decision: "把经典东山线拆成 D4 抵达日的锦市场—祇园和 D5 的伏见稻荷—清水寺—祇园；不照搬需要清晨出门的版本，仍以你们 09:00 起床为边界。",
    usedIn: "D4 京都抵达日、D5 京都整日",
    link: "https://www.xiaohongshu.com/explore/6a7f15780000000032023f8d",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 12",
    sourceTitle: "大阪真没啥玩的｜2天1夜路线直接抄",
    author: "流浪的Joonwoo",
    noteId: "6a5cd0230000000009037578",
    title: "大阪按片区走，不要把景点打散",
    text: "这篇在大阪攻略搜索结果中以‘2天1夜’和区域路线为主题；本页只吸收其分区、少折返的方向，不把标题当成具体营业时间或票价依据。",
    decision: "先吸收‘按片区、少折返’的方向；固定 9/5 晚航班后，主线收窄为大阪城 → 黑门 → 难波 / 道顿堀，梅田与中之岛不再硬塞。",
    usedIn: "D6 抵达大阪、D7 返程日大阪主线",
    link: "https://www.xiaohongshu.com/explore/6a5cd0230000000009037578",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 13",
    sourceTitle: "🇯🇵 To Do List 大阪夜景精选 🌃",
    author: "大阪地铁-OsakaMetroNiNE",
    noteId: "6a796ef1000000002402d777",
    title: "把夜景放在移动方向的末端",
    text: "站内搜索结果显示这篇专门整理大阪夜景；用于校准梅田、道顿堀和中之岛的夜间选择，不据此推断当天是否有票或临时开放。",
    decision: "保留为下一次大阪夜景或本次航班改晚时的替换；9/5 返程日不把梅田夜景安排在值机前。",
    usedIn: "D7 可替换项，不进入固定主线",
    link: "https://www.xiaohongshu.com/explore/6a796ef1000000002402d777",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 14",
    sourceTitle: "人少+好找！大阪中之岛夜景观景台路线！",
    author: "大雄同学",
    noteId: "69d3784a00000000220267cf",
    title: "中之岛加入大阪主线",
    text: "这篇在大阪夜景搜索结果中明确以中之岛水岸路线为主题，适合作为梅田与难波之间的缓冲；现场仍以当日交通和天气为准。",
    decision: "这次固定航班后不进入主线；如果你们临时放弃大阪城，才用中之岛替换，不能再与梅田同时加入。",
    usedIn: "D7 大阪城的替换项",
    link: "https://www.xiaohongshu.com/explore/69d3784a00000000220267cf",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 15",
    sourceTitle: "大阪阿倍野展望台！🌃服部平次好会找告白地！",
    author: "今天小胡离职了吗",
    noteId: "6a6e153a000000003300c08a",
    title: "阿倍野 HARUKAS 作为梅田替换",
    text: "搜索结果里这篇以阿倍野展望台为主题；保留为南区夜景替换，不与梅田蓝天大厦同一天硬塞。",
    decision: "返程日不推荐再加展望台；只有你们删掉大阪城并确认时间充足时，才把它作为南区替换。",
    usedIn: "D7 返程日备选",
    link: "https://www.xiaohongshu.com/explore/6a6e153a000000003300c08a",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 16",
    sourceTitle: "🇯🇵大坂四天三夜必吃美食推荐🌟‼️（实测😋）",
    author: "Raaachel",
    noteId: "6a58e2980000000002003c01",
    title: "大阪烧、章鱼烧只安排一次",
    text: "这篇在大阪美食搜索结果中以实测店铺合集为主题；本页只吸收‘集中在大阪完成代表性热食’的方向，具体店铺和过敏原必须现场确认。",
    decision: "主线保留大阪烧，章鱼烧 / 串炸二选一；你明确排除鲑鱼、海鲜、柴鱼片和不明鱼粉，女友再单独尝海鲜小吃。",
    usedIn: "D7 道顿堀晚餐与小吃",
    link: "https://www.xiaohongshu.com/explore/6a58e2980000000002003c01",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 17",
    sourceTitle: "🇯🇵 | 大阪梅田逛吃住合集",
    author: "didarlin",
    noteId: "693692a1000000001e0354b7",
    title: "梅田不与难波重复安排",
    text: "搜索结果把梅田的逛吃住集中成一个区域；这支持了把梅田作为 D7 北区段、难波作为晚餐和住宿段的分工。",
    decision: "吸收其‘梅田与难波分区’思路；本次把难波 / 心斋桥作为返程日主购物区，梅田留作下次整晚体验。",
    usedIn: "D7 难波 / 心斋桥主线",
    link: "https://www.xiaohongshu.com/explore/693692a1000000001e0354b7",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书搜索摘要 18",
    sourceTitle: "日本酒店为什么都是10:00退房？？!",
    author: "吃薇蒸变帅哥 · 2025-03-19",
    noteId: "search-hotel-checkout-10",
    sourceRef: "小红书站内搜索摘要",
    title: "常见是 10:00 退房，不是统一 09:00",
    text: "在‘日本酒店入住退房时间 15点 10点’搜索结果中看到这篇直接讨论 10:00 退房；同一页也出现 15:00 / 16:00 入住、10:00 退房的经验。不同酒店仍以订单和前台规则为准。",
    decision: "把 D4 东京退房、D6 京都退房、D7 大阪退房都按 10:00 左右倒推，并在住宿卡中提醒确认具体酒店；不再把 09:00 当成统一退房时间。",
    usedIn: "住宿安排、D4 / D6 / D7 换城时间",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E6%97%A5%E6%9C%AC%E9%85%92%E5%BA%97%20%E5%85%A5%E4%BD%8F%20%E9%80%80%E6%88%BF%20%E6%97%B6%E9%97%B4%2015%E7%82%B9%2010%E7%82%B9&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 19",
    sourceTitle: "日本酒店行李寄存常用会话 / 东京行李存放周边",
    author: "站内搜索结果",
    noteId: "search-hotel-luggage-storage",
    sourceRef: "小红书站内搜索摘要",
    title: "寄存行李要先问前台，不要默认提前入住",
    text: "搜索‘日本酒店 入住 退房 寄存行李’时出现行李寄存会话、退房后寄存和东京行李存放经验；这些内容适合做沟通提醒，但没有替你们的具体酒店做承诺。",
    decision: "D1 先把行李寄到东京酒店、D4 / D6 退房后按酒店允许时间处理；如果酒店不能收存，再启用车站 / 机场柜子或宅急便。",
    usedIn: "D1 落地、D4 东京→京都、D6 京都→奈良→大阪、D7 返程",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E6%97%A5%E6%9C%AC%20%E9%85%92%E5%BA%97%20%E5%85%A5%E4%BD%8F%20%E9%80%80%E6%88%BF%20%E5%AF%84%E5%AD%98%E8%A1%8C%E6%9D%8E&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 20",
    sourceTitle: "羽田机场 T3 温泉过夜 + 行李寄存攻略",
    author: "Miu · 2023-07-09",
    noteId: "search-haneda-t3-overnight",
    sourceRef: "小红书站内搜索摘要",
    title: "凌晨到羽田：机场过夜只做备用，不占用早晨",
    text: "‘东京凌晨到达 羽田 酒店 寄存行李’搜索结果中出现羽田 T3 过夜、温泉和寄存方案；本次不额外订前一晚酒店，机场休息只作为首班车前的临时备选。",
    decision: "D1 05:00 到羽田后先入境，按首班京急 / 都营浅草线或单轨方案进市区；如果入境过慢或身体不适，才退回机场休息，不硬撑。",
    usedIn: "D1 羽田 → 市区早饭",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E4%B8%9C%E4%BA%AC%E5%87%8C%E6%99%A8%E5%88%B0%E8%BE%BE%20%E7%BE%BD%E7%94%B0%20%E9%85%92%E5%BA%97%20%E5%AF%84%E5%AD%98%E8%A1%8C%E6%9D%8E&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 25",
    sourceTitle: "凌晨1点到羽田机场，坐5:26首班地铁（京急线）",
    author: "小红书站内搜索结果",
    noteId: "search-haneda-first-keikyu",
    sourceRef: "小红书站内搜索摘要",
    title: "羽田凌晨进城：先查首班京急，不默认打车",
    text: "搜索‘羽田机场 凌晨5点 到达 东京市区 交通 早餐’时出现首班京急线、羽田机场交通图解和凌晨落地经验；截图中的时间不能替代 8/30 当天时刻表。",
    decision: "D1 06:30–07:30 优先查京急线直通都营浅草线；车次不合适时再用东京单轨到滨松町换 JR，交通预算不把出租车作为默认项。",
    usedIn: "D1 羽田 → 东银座 / 浅草",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E7%BE%BD%E7%94%B0%E6%9C%BA%E5%9C%BA%20%E5%87%8C%E6%99%A85%E7%82%B9%20%E5%88%B0%E8%BE%BE%20%E4%B8%9C%E4%BA%AC%E5%B8%82%E5%8C%BA%20%E4%BA%A4%E9%80%9A%20%E6%97%A9%E9%A4%90&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 26",
    sourceTitle: "6:30am 就排队，开了70年的牛丼 / 东京筑地市场完整攻略",
    author: "小红书站内搜索结果",
    noteId: "search-tokyo-morning-food",
    sourceRef: "小红书站内搜索摘要",
    title: "早饭优先选筑地，周日必须准备备选",
    text: "搜索‘东京 早上6点 早餐 逛街 上野 浅草 筑地 攻略’时出现 6:30 排队的老店牛丼、东京筑地市场和东京早午餐结果；具体店铺营业日和排队情况仍需当天确认。",
    decision: "D1 把筑地场外市场设为早饭主线，周日若店休就切换为浅草 / 上野的热食早餐，不为了某一家店打乱下午入住。",
    usedIn: "D1 07:30–09:30 筑地早饭",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E4%B8%9C%E4%BA%AC%20%E6%97%A9%E4%B8%8A6%E7%82%B9%20%E6%97%A9%E9%A4%90%20%E9%80%9B%E8%A1%97%20%E4%B8%8A%E9%87%8E%20%E6%B5%85%E8%8D%89%20%E7%AD%91%E5%9C%B0%20%E6%94%BB%E7%95%A5&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 21",
    sourceTitle: "不要再吸票焦虑了｜日本新干线购票&乘车教程",
    author: "白菜飞侠 · 2025-09-06",
    noteId: "search-tokyo-kyoto-shinkansen",
    sourceRef: "小红书站内搜索摘要",
    title: "东京→京都换城先处理车票和大件行李",
    text: "‘京都 新干线 行李 酒店 退房’搜索结果集中出现新干线购票、乘车和大件行李经验；本页只吸收提前确认车票、座位和行李的做法，票价和规则仍以官方购票页面为准。",
    decision: "D4 10:00 退东京房、10:45 左右到东京站、午间到京都；不在换城日额外加入镰仓，也不为了省小额交通费拖箱绕路。",
    usedIn: "D4 东京→京都换城",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E4%B8%9C%E4%BA%AC%20%E4%BA%AC%E9%83%BD%20%E6%96%B0%E5%B9%B2%E7%BA%BF%20%E8%A1%8C%E6%9D%8E%20%E9%85%92%E5%BA%97%20%E9%80%80%E6%88%BF&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 22",
    sourceTitle: "第五天：京都-奈良 / 大阪出发｜奈良一日游完整攻略",
    author: "小红书站内搜索结果",
    noteId: "search-kyoto-nara-traffic",
    sourceRef: "小红书站内搜索摘要",
    title: "京都到奈良，近铁直达比折返更适合这条线",
    text: "搜索‘京都 奈良 大阪 近铁 交通 一日游’时出现京都—奈良、‘大阪出发｜奈良一日游’等结果；本页只吸收按区域串联和近铁到近铁奈良站的方向，不把搜索卡片当作实时班次依据。",
    decision: "D6 退京都房后先到京都站，乘近铁京都线到近铁奈良站寄存；看完奈良再乘近铁奈良线到大阪难波，不回京都取箱。",
    usedIn: "D6 京都 → 奈良 → 大阪换城",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E4%BA%AC%E9%83%BD%20%E5%A5%88%E8%89%AF%20%E5%A4%A7%E9%98%AA%20%E8%BF%91%E9%93%81%20%E4%BA%A4%E9%80%9A%20%E4%B8%80%E6%97%A5%E6%B8%B8&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 23",
    sourceTitle: "关西机场下飞机后，怎么去难波 / 从大阪市区到关西机场怎么坐电车？",
    author: "小红书站内搜索结果",
    noteId: "search-kix-namba-traffic",
    sourceRef: "小红书站内搜索摘要",
    title: "难波与 KIX 之间固定走南海电铁",
    text: "搜索‘大阪 难波 关西机场 交通 返程 攻略’时出现机场—难波往返、南海电铁和机场快线图解等结果；车次、座席、航站楼和临时施工仍需出发前复核。",
    decision: "D7 15:30 左右从南海难波站出发，优先确认机场急行或 Rapi:t 的可用车次；不在返程日改走梅田或临时跨线。",
    usedIn: "D7 难波 → KIX 返程",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E5%A4%A7%E9%98%AA%20%E9%9A%BE%E6%B3%A2%20%E5%85%B3%E8%A5%BF%E6%9C%BA%E5%9C%BA%20%E4%BA%A4%E9%80%9A%20%E8%BF%94%E7%A8%8B%20%E6%94%BB%E7%95%A5&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书搜索摘要 24",
    sourceTitle: "日本高铁带大箱没预约收1000 / 大件行李票不要慌",
    author: "小红书站内搜索结果",
    noteId: "search-shinkansen-large-baggage",
    sourceRef: "小红书站内搜索摘要",
    title: "跨城日只带一件主箱，提前处理大件行李",
    text: "东京—京都新干线搜索页出现大件行李预约、纸质票和‘带 28 寸行李箱’等结果；这类内容用于提醒行李尺寸和座席确认，收费规则以 JR 官方购票页面为准。",
    decision: "D4 退房前把购物袋收进一件主箱，提前订指定席并核对超大行李位；D6 只带小包进奈良，主箱不在奈良公园里拖行。",
    usedIn: "D4 东京 → 京都、D6 京都 → 奈良",
    link: "https://www.xiaohongshu.com/search_result/?keyword=%E4%B8%9C%E4%BA%AC%20%E4%BA%AC%E9%83%BD%20%E6%96%B0%E5%B9%B2%E7%BA%BF%20%E8%A1%8C%E6%9D%8E%20%E6%8D%A2%E5%9F%8E%20%E6%94%BB%E7%95%A5&type=51",
    linkText: "打开小红书搜索页 ↗",
  },
  {
    label: "小红书笔记 25",
    sourceTitle: "去日本旅游需要带多少现金💰",
    author: "小严很严肃 · 2025-10-12",
    noteId: "68eba40900000000050014a5",
    sourceRef: "小红书站内搜索结果",
    title: "现金按小额和备用金准备，不与大额购物混在一起",
    text: "本轮在小红书搜索‘日本 现金 微信支付 旅游’时看到的现金经验笔记；搜索结果可确认标题、作者和互动量，但无法把作者个人消费额当成你们这次的固定标准。",
    decision: "网页按两个人 7 天、酒店和大额购物优先刷卡的前提，先带 ¥40,000–50,000；市场、小店、神社和交通卡充值偏多时再补到 ¥60,000–70,000。",
    usedIn: "现金估算、每日钱包分配",
    link: "https://www.xiaohongshu.com/explore/68eba40900000000050014a5",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 26",
    sourceTitle: "🇯🇵日本旅游两周移动支付心得总结",
    author: "刹那 · 08-12",
    noteId: "6a7c69e6000000003302c050",
    sourceRef: "小红书站内搜索结果",
    title: "移动支付可以减轻现金压力，但不要只准备一种通道",
    text: "搜索结果把这篇笔记标为日本两周移动支付经验；它适合用来观察游客真实支付组合，但商户是否接入、二维码方向和手续费仍要现场看标识。",
    decision: "把信用卡 / IC 卡 / 微信支付 / 日元现金排成四层备份；微信支付只作为支持商户的补充，不替代现金和银行卡。",
    usedIn: "现金与支付模块、出发前银行卡检查",
    link: "https://www.xiaohongshu.com/explore/6a7c69e6000000003302c050",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 27",
    sourceTitle: "在日本可以用微信支付了？？",
    author: "小夏老师 · 07-22",
    noteId: "6a60630f000000001f01d332",
    sourceRef: "小红书站内搜索结果",
    title: "先看商户二维码和 PayPay / HIVEX 标识",
    text: "搜索页里出现了这篇关于日本微信支付的笔记；标题说明了游客正在遇到的变化，但不能据此推断所有店铺都能收微信。",
    decision: "网页明确写成‘部分参与商户可用’，并补充官方 PayPay / HIVEX 规则；付款前先问，再准备现金或刷卡完成结账。",
    usedIn: "微信支付说明、常用日语支付口语",
    link: "https://www.xiaohongshu.com/explore/6a60630f000000001f01d332",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 28",
    sourceTitle: "不会日语也能玩转日本！已按场景分好类！",
    author: "虾兵 · 08-09",
    noteId: "6a7891d7000000002500d1a4",
    sourceRef: "小红书站内搜索结果",
    title: "把句子按机场、交通、餐厅和购物场景分开",
    text: "语言搜索页中的这篇笔记以‘按场景分类’为主题；本网页沿用这个组织方式，把最常用的问路、付款、餐厅、入住和过敏句子放在一起。",
    decision: "不要求你们临时学完整日语，只准备能直接出示的日文短句、中文近似读法和翻译 App 备用。",
    usedIn: "常用日语模块、出发前语言准备",
    link: "https://www.xiaohongshu.com/explore/6a7891d7000000002500d1a4",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 29",
    sourceTitle: "本i人不会日语勇闯日本，实测这些app真有用",
    author: "游山玩水小吗喽 · 04-17",
    noteId: "69e1f5b4000000002102c867",
    sourceRef: "小红书站内搜索结果",
    title: "翻译、相机翻译和离线截图比硬背更稳",
    text: "搜索结果把这篇笔记标为不会日语的 App 实测经验；具体 App 版本会更新，因此网页只吸收‘出发前测试、离线保存、关键内容截图’这条方法。",
    decision: "两台手机都装翻译工具；一台开口说，一台展示日文文字和地图定位，酒店地址、过敏卡和回程路线提前离线保存。",
    usedIn: "语言沟通建议、出发前清单",
    link: "https://www.xiaohongshu.com/explore/69e1f5b4000000002102c867",
    linkText: "打开原笔记 ↗",
  },
  {
    label: "小红书笔记 30",
    sourceTitle: "日本旅游场景200句，日常交流+自由行必备",
    author: "一小时听日文 · 06-28",
    noteId: "6a4128b9000000001102e456",
    sourceRef: "小红书站内搜索结果",
    title: "把高频句子做成旅行现场能扫一眼的卡片",
    text: "搜索结果显示这篇笔记专门整理旅行场景句子；网页没有照搬原文，而是结合你们的路线补上支付、入住、问路和海鲜过敏句，并自写读法与空耳。",
    decision: "短句优先、先出示文字再开口；‘空耳’只当记忆提示，真正沟通仍以日文文字、翻译页面或过敏卡为准。",
    usedIn: "常用日语口语模块",
    link: "https://www.xiaohongshu.com/explore/6a4128b9000000001102e456",
    linkText: "打开原笔记 ↗",
  },
];

const LANGUAGE_PHRASES = [
  { scene: "开场", zh: "不好意思 / 打扰一下", jp: "すみません", read: "sumimasen", ear: "苏米马森", use: "问路、叫店员、需要帮助时先说。" },
  { scene: "礼貌", zh: "谢谢", jp: "ありがとうございます", read: "arigatou gozaimasu", ear: "阿里嘎多 勾ざ以马斯", use: "比只说‘阿里嘎多’更完整、礼貌。" },
  { scene: "购物", zh: "这个多少钱？", jp: "これはいくらですか？", read: "kore wa ikura desu ka", ear: "口勒哇 一哭拉 得斯卡", use: "问商品、限定玩偶或伴手礼价格。" },
  { scene: "付款", zh: "可以刷信用卡吗？", jp: "クレジットカードは使えますか？", read: "kurejitto kaado wa tsukaemasu ka", ear: "库雷吉托 卡多 哇 次卡诶马斯卡", use: "酒店、餐厅或商场结账前先问。" },
  { scene: "付款", zh: "只能现金吗？", jp: "現金のみですか？", read: "genkin nomi desu ka", ear: "根金 诺米 得斯卡", use: "现金不够时先确认支付方式。" },
  { scene: "付款", zh: "可以用微信支付吗？", jp: "WeChat Payは使えますか？", read: "WeChat Pay wa tsukaemasu ka", ear: "微信佩 哇 次卡诶马斯卡", use: "只对有对应二维码 / 标识的商户询问。" },
  { scene: "餐厅", zh: "有英文 / 中文菜单吗？", jp: "英語／中国語のメニューはありますか？", read: "eigo / chuugokugo no menyuu wa arimasu ka", ear: "诶伊勾 / 秋国勾 诺 梅纽 哇 阿里马斯卡", use: "看不懂菜单时直接把文字给店员看。" },
  { scene: "餐厅", zh: "请给我这个。", jp: "これをください。", read: "kore o kudasai", ear: "口勒哦 库达赛", use: "配合手指或菜单照片点单。" },
  { scene: "餐厅", zh: "这是生鱼吗？", jp: "これは生魚ですか？", read: "kore wa nama-zakana desu ka", ear: "口勒哇 纳马杂卡纳 得斯卡", use: "需要避开生鱼或不明成分料理时先确认。" },
  { scene: "过敏", zh: "有食物过敏时，请确认成分。", jp: "食物アレルギーがある場合、原材料を確認してください。", read: "shokumotsu arerugii ga aru baai, genzairyou o kakunin shite kudasai", ear: "肖库莫次 阿雷鲁吉 嘎阿鲁 巴爱；根在料 哦 卡库宁 西特 库达赛", use: "把具体过敏食材填进日文卡片，同时出示文字；不要只依赖空耳或药物。" },
  { scene: "入住", zh: "我想寄存行李。", jp: "ホテルに荷物を預けたいです。", read: "hoteru ni nimotsu o azuketai desu", ear: "厚特鲁 尼 尼莫次 哦 阿组凯太 得斯", use: "凌晨落地或退房后与酒店前台沟通。" },
  { scene: "问路", zh: "车站在哪里？", jp: "駅はどこですか？", read: "eki wa doko desu ka", ear: "诶ki 哇 多口 得斯卡", use: "也可以把目的地日文名称直接给对方看。" },
  { scene: "沟通", zh: "请再说一遍。", jp: "もう一度お願いします。", read: "mou ichido onegaishimasu", ear: "莫 伊奇多 哦内嘎伊西马斯", use: "没听清时比点头猜测更安全。" },
  { scene: "沟通", zh: "我不明白。", jp: "わかりません。", read: "wakarimasen", ear: "哇卡里马森", use: "接着打开翻译器或展示截图。" },
  { scene: "求助", zh: "请帮帮我。", jp: "助けてください。", read: "tasukete kudasai", ear: "他苏凯特 库达赛", use: "迷路、身体不适或需要工作人员帮助时用。" },
] as const;

const NEARBY_CANDIDATES: NearbyCandidate[] = [
  {
    id: "nearby-tokyo-kamakura-enoshima",
    region: "东京",
    title: "镰仓 + 江之岛：寺院、海岸线和江之电",
    area: "镰仓 · 江之岛",
    distance: "东京单程约 1 小时",
    note: "小红书高频的一日海边线：小町通、镰仓大佛、长谷和江之岛可以按体力删减。晴天优先，阴雨天不建议硬追日落。",
    sourceTitle: "🇯🇵 镰仓＋江之岛｜东京出发一日游攻略 🌊⛩️",
    sourceAuthor: "Audrey 💎",
    sourceNoteId: "6a88854500000000370340f3",
    sourceUrl: "https://www.xiaohongshu.com/explore/6a88854500000000370340f3",
  },
  {
    id: "nearby-tokyo-hakone",
    region: "东京",
    title: "箱根：温泉街 + 雕刻之森 + 芦之湖",
    area: "箱根",
    distance: "东京单程约 1.5–2 小时",
    note: "温泉、火山景观和湖景的一日组合；如果已经安排富士山，不建议同一趟再塞箱根，适合替换富士山雨天方案。",
    sourceTitle: "箱根一日游⛩️🌋",
    sourceAuthor: "芒果yaya🥕",
    sourceNoteId: "6958fa18000000001e031c47",
    sourceUrl: "https://www.xiaohongshu.com/explore/6958fa18000000001e031c47",
  },
  {
    id: "nearby-tokyo-nikko",
    region: "东京",
    title: "日光：东照宫 + 中禅寺湖",
    area: "日光",
    distance: "东京单程约 2 小时",
    note: "历史建筑和山湖自然一次结合，适合想把文化古迹和自然放在同一天的人；往返较长，不建议和银座购物同日。",
    sourceTitle: "🇯🇵东京暑假好去处｜日光一日游完整攻略",
    sourceAuthor: "常常",
    sourceNoteId: "6a7802330000000005033960",
    sourceUrl: "https://www.xiaohongshu.com/explore/6a7802330000000005033960",
  },
  {
    id: "nearby-tokyo-izu",
    region: "东京",
    title: "伊豆：大室山 + 城崎海岸",
    area: "伊豆高原",
    distance: "东京单程约 2.5–3 小时",
    note: "火山草原、海岸步道和海景的组合，风景很强但交通时间长；只有愿意牺牲东京购物日才值得加入。",
    sourceTitle: "东京出发｜伊豆一日游🌊大室山+城ヶ崎海岸",
    sourceAuthor: "王小王在大理",
    sourceNoteId: "6a7db04d00000000290314c6",
    sourceUrl: "https://www.xiaohongshu.com/explore/6a7db04d00000000290314c6",
  },
  {
    id: "nearby-tokyo-yokohama",
    region: "东京",
    title: "横滨：港未来 + 山下公园 + 中华街",
    area: "横滨",
    distance: "东京约 30–40 分钟",
    note: "最适合临时加进半天的候选：海港散步、红砖仓库和中华街，强度比镰仓低，适合作为东京购物日的替换。",
    sourceTitle: "东京周边半小时宝藏横滨一日CityWalk完整攻",
    sourceAuthor: "Vivian",
    sourceNoteId: "6a7673720000000022031069",
    sourceUrl: "https://www.xiaohongshu.com/explore/6a7673720000000022031069",
  },
  {
    id: "nearby-osaka-nara",
    region: "大阪",
    title: "奈良：鹿群 + 东大寺 + 若草山",
    area: "奈良公园",
    distance: "大阪约 45–60 分钟",
    note: "你们现有路线已经安排奈良；勾选后保留鹿群和东大寺，春日大社 / 若草山按步数二选一，不要全塞。",
    sourceTitle: "第一次来奈良，请直接复制这条一日游行程",
    sourceAuthor: "大侠V5",
    sourceNoteId: "68b4ec29000000001d01d083",
    sourceUrl: "https://www.xiaohongshu.com/explore/68b4ec29000000001d01d083",
  },
  {
    id: "nearby-osaka-kobe",
    region: "大阪",
    title: "神户：北野异人馆 + 港口夜景",
    area: "神户",
    distance: "大阪约 30–45 分钟",
    note: "城市散步、洋馆、港口和神户牛可以组合；如果大阪整日已经很满，优先把它留作下一次，不要替换奈良。",
    sourceTitle: "🇯🇵Kobe｜神户不赶路一日游（往返大阪版）",
    sourceAuthor: "YY一条小鱼干",
    sourceNoteId: "69ee053b00000000220279b7",
    sourceUrl: "https://www.xiaohongshu.com/explore/69ee053b00000000220279b7",
  },
  {
    id: "nearby-osaka-uji",
    region: "大阪",
    title: "宇治：平等院 + 抹茶街 + 宇治川",
    area: "宇治",
    distance: "大阪约 45–60 分钟",
    note: "抹茶和古迹的轻松半日线；更适合从京都出发，若大阪只留一整天，不建议为宇治再折返。",
    sourceTitle: "宇治半日游攻略｜被抹茶包围的下午好幸福🍵",
    sourceAuthor: "1yu",
    sourceNoteId: "69eb94c1000000003803551e",
    sourceUrl: "https://www.xiaohongshu.com/explore/69eb94c1000000003803551e",
  },
  {
    id: "nearby-osaka-wakayama",
    region: "大阪",
    title: "和歌山：贵志站 + 小玉电车",
    area: "和歌山",
    distance: "大阪约 1.5–2 小时",
    note: "猫猫电车和乡下小站是特色，但往返时间明显更长；适合猫咪主题专程去，不适合塞进你们现有大阪一晚。",
    sourceTitle: "🇯🇵和歌山｜全世界唯一的小猫车站🐈🚉！",
    sourceAuthor: "格格小仙女🌝",
    sourceNoteId: "68e610bf000000000302272f",
    sourceUrl: "https://www.xiaohongshu.com/explore/68e610bf000000000302272f",
  },
  {
    id: "nearby-osaka-arima",
    region: "大阪",
    title: "有马温泉：金泉银泉 + 温泉街",
    area: "神户北部",
    distance: "大阪约 1–1.5 小时",
    note: "如果温泉比大阪购物更重要，可以把大阪整日换成有马；你们这次不建议再增加换酒店，日归即可。",
    sourceTitle: "🇯🇵大阪电车1小时可达！有马温泉一日游攻略",
    sourceAuthor: "旅行的大钊🍉",
    sourceNoteId: "69414040000000001b026c0e",
    sourceUrl: "https://www.xiaohongshu.com/explore/69414040000000001b026c0e",
  },
  {
    id: "nearby-kyoto-uji",
    region: "京都",
    title: "宇治：平等院 + 抹茶体验",
    area: "宇治",
    distance: "京都约 20–30 分钟",
    note: "京都周边最容易加入的半日候选，适合替换重复的商店街；伏见稻荷和宇治可安排同一方向，但要看体力。",
    sourceTitle: "一定要把伏见稻荷和宇治安排在一天‼️",
    sourceAuthor: "小红书搜索结果",
    sourceNoteId: "6a819fb00000000006005102",
    sourceUrl: "https://www.xiaohongshu.com/explore/6a819fb00000000006005102",
  },
  {
    id: "nearby-kyoto-biwa",
    region: "京都",
    title: "琵琶湖：大津湖畔 + 近江景色",
    area: "大津 / 琵琶湖",
    distance: "京都约 10–30 分钟",
    note: "离京都近、自然感强，适合高温或想放慢的一天；湖边风景优先，别为了多景点反复换乘。",
    sourceTitle: "🇯🇵京都周边｜请一定要留一天时间来琵琶湖！",
    sourceAuthor: "小红书搜索结果",
    sourceNoteId: "68c146d5000000001b032e96",
    sourceUrl: "https://www.xiaohongshu.com/explore/68c146d5000000001b032e96",
  },
  {
    id: "nearby-kyoto-kifune",
    region: "京都",
    title: "贵船 + 三千院 + 琉璃光院",
    area: "京都北山",
    distance: "京都约 40–60 分钟",
    note: "森林、溪流和寺院的避暑线；景点分散，适合早出发的一整天，不适合和清水寺东山线硬拼。",
    sourceTitle: "🇯🇵京都一日游攻略|三千院+琉璃光院+贵船",
    sourceAuthor: "小红书搜索结果",
    sourceNoteId: "6a27f434000000002103dac4",
    sourceUrl: "https://www.xiaohongshu.com/explore/6a27f434000000002103dac4",
  },
  {
    id: "nearby-kyoto-nekojinja",
    region: "京都",
    title: "猫猫寺：京都北部小众寺院",
    area: "京都北山",
    distance: "京都约 30–45 分钟",
    note: "喜欢猫咪主题可以去，和你们喜欢 Chiikawa 的兴趣有一点呼应；体量小，适合作为北山半日而不是专程跨城。",
    sourceTitle: "京都 来猫猫寺为小猫祈福🐈",
    sourceAuthor: "小红书搜索结果",
    sourceNoteId: "68de40d60000000007003a1a",
    sourceUrl: "https://www.xiaohongshu.com/explore/68de40d60000000007003a1a",
  },
  {
    id: "nearby-kyoto-ine",
    region: "京都",
    title: "天桥立 + 伊根舟屋",
    area: "京都府北部",
    distance: "京都单程约 2–2.5 小时",
    note: "海景和舟屋很特别，但对你们这次 2 晚京都来说太远；除非明确放弃东山 / 奈良，否则建议删除。",
    sourceTitle: "京都往返天桥立伊根一日游——伊根篇",
    sourceAuthor: "小红书搜索结果",
    sourceNoteId: "68839a350000000012021722",
    sourceUrl: "https://www.xiaohongshu.com/explore/68839a350000000012021722",
  },
  {
    id: "nearby-fuji-kawaguchiko",
    region: "富士山",
    title: "河口湖：天上山 + 大石公园",
    area: "河口湖",
    distance: "东京单程约 2 小时",
    note: "你们现有富士山日归的主选：天气好时做缆车和湖畔，排队或云雾严重就删掉一个机位，保证回程。",
    sourceTitle: "🗻富士山游玩图鉴｜这些打卡地别错过！",
    sourceAuthor: "星辰海鸥票务服务",
    sourceNoteId: "690481a50000000004020dc3",
    sourceUrl: "https://www.xiaohongshu.com/explore/690481a50000000004020dc3",
  },
  {
    id: "nearby-fuji-five-stops",
    region: "富士山",
    title: "富士山一日 5 站：河口湖经典机位",
    area: "河口湖站周边",
    distance: "东京往返约 10–12 小时",
    note: "适合第一次去富士山做路线参考，但你们晚起，建议只保留 2–3 站，不要照搬五站打卡。",
    sourceTitle: "富士山一日游｜5站打卡保姆级攻略✨",
    sourceAuthor: "和风旅-日本旅行定制师Saku",
    sourceNoteId: "6983e7170000000028009770",
    sourceUrl: "https://www.xiaohongshu.com/explore/6983e7170000000028009770",
  },
  {
    id: "nearby-fuji-yamanakako",
    region: "富士山",
    title: "山中湖：湖畔视角与河口湖二选一",
    area: "山中湖",
    distance: "东京单程约 2–2.5 小时",
    note: "比河口湖更安静，但交通和站点衔接更复杂；如果想少逛商业设施、专注湖景，可以把它作为河口湖替换。",
    sourceTitle: "🇯🇵富士山的AB面｜河口湖 vs 山中湖",
    sourceAuthor: "Eatchhh",
    sourceNoteId: "6a7f20bb0000000022030fdc",
    sourceUrl: "https://www.xiaohongshu.com/explore/6a7f20bb0000000022030fdc",
  },
  {
    id: "nearby-fuji-transport",
    region: "富士山",
    title: "新宿往返河口湖：高速巴士线",
    area: "新宿 · 河口湖",
    distance: "单程约 2 小时，堵车需留余量",
    note: "这是交通候选，不是景点：你们晚起版本一定要先锁回程班次，天气差时不要临时改成更远的山中湖。",
    sourceTitle: "🇯🇵东京往返富士山🗻｜自由行交通攻略",
    sourceAuthor: "小红书搜索结果",
    sourceNoteId: "69141158000000000300eac6",
    sourceUrl: "https://www.xiaohongshu.com/explore/69141158000000000300eac6",
  },
  {
    id: "nearby-fuji-shizuoka",
    region: "富士山",
    title: "静冈：三保松原 / 日本平海景",
    area: "静冈",
    distance: "东京单程约 1.5–2.5 小时",
    note: "适合想从另一侧看富士山和海景的人；这次已经有河口湖，不建议再加，作为以后住静冈的备选。",
    sourceTitle: "富士山-静冈周边游",
    sourceAuthor: "小红书搜索结果",
    sourceNoteId: "6968dd1f000000001a01e9ce",
    sourceUrl: "https://www.xiaohongshu.com/explore/6968dd1f000000001a01e9ce",
  },
  {
    id: "nearby-tokyo-kawagoe",
    region: "东京",
    title: "川越：藏造街 + 时之钟 + 菓子屋横丁",
    area: "埼玉 · 川越",
    distance: "东京单程约 45–60 分钟",
    note: "老街、抹茶和小点心集中，步行线路清楚；比镰仓更适合不想跑海边、又想加一段日式街景的日子。",
    sourceTitle: "小红书检索：东京周边 · 川越一日游",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:东京周边川越一日游",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E4%B8%9C%E4%BA%AC%20%E5%91%A8%E8%BE%B9%20%E5%B7%9D%E8%B6%8A%20%E4%B8%80%E6%97%A5%E6%B8%B8&type=51",
  },
  {
    id: "nearby-tokyo-naritasan",
    region: "东京",
    title: "成田山新胜寺：寺院 + 表参道老街",
    area: "成田",
    distance: "东京单程约 1–1.5 小时",
    note: "更适合和成田机场进出结合；如果从羽田落地，不建议为了它专程往返，作为下次或返程机场附近的备选。",
    sourceTitle: "小红书检索：东京周边 · 成田山一日游",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:东京周边成田山一日游",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E4%B8%9C%E4%BA%AC%20%E5%91%A8%E8%BE%B9%20%E6%88%90%E7%94%B0%E5%B1%B1%20%E4%B8%80%E6%97%A5%E6%B8%B8&type=51",
  },
  {
    id: "nearby-tokyo-chiikawa-harajuku",
    region: "东京",
    title: "Chiikawa Land 原宿：限定周边 + 表参道",
    area: "原宿 · 表参道",
    distance: "东京市区约 20–30 分钟",
    note: "适合和明治神宫、表参道、涩谷放在同一天；Chiikawa 门店可能有整理券和限购，出发前再看当天规则与库存。",
    sourceTitle: "小红书检索：Chiikawa 东京限定玩偶购买攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa东京限定购物",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E4%B8%9C%E4%BA%AC%20%E9%99%90%E5%AE%9A%20%E7%8E%A9%E5%81%B6%20%E8%B4%AD%E7%89%A9&type=51",
  },
  {
    id: "nearby-tokyo-chiikawa-ikebukuro",
    region: "东京",
    title: "Chiikawa Land 池袋：PARCO + Sunshine City",
    area: "池袋",
    distance: "东京市区约 25–35 分钟",
    note: "可以和池袋商场、Sunshine City 一起逛，适合作为雨天购物线；不要把池袋和秋叶原、银座拆成来回折返。",
    sourceTitle: "小红书检索：Chiikawa 池袋门店 / 东京购物攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa池袋门店",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E6%B1%A0%E8%A2%8B%20%E9%97%A8%E5%BA%97%20%E4%B8%9C%E4%BA%AC%E8%B4%AD%E7%89%A9&type=51",
  },
  {
    id: "nearby-tokyo-chiikawa-shinjuku",
    region: "东京",
    title: "Chiikawa 新宿购物线：门店 + 歌舞伎町夜景",
    area: "新宿",
    distance: "东京市区约 20–30 分钟",
    note: "适合把 Chiikawa 采购、百货和夜景压在同一片区域；如果当天已经安排涩谷，二选一即可。",
    sourceTitle: "小红书检索：Chiikawa 新宿限定 / 东京购物",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa新宿限定",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E6%96%B0%E5%AE%BF%20%E9%99%90%E5%AE%9A%20%E4%B8%9C%E4%BA%AC%E8%B4%AD%E7%89%A9&type=51",
  },
  {
    id: "nearby-tokyo-character-street-chiikawa",
    region: "东京",
    title: "东京站一番街：Character Street + Chiikawa",
    area: "东京站",
    distance: "东京站内，适合换乘或银座前后",
    note: "把角色周边集中采购放在东京站最省路；与现有东京站 Chiikawa 点位可以合并，不必单独占半天。",
    sourceTitle: "小红书检索：东京站 Chiikawa / Character Street 购买攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:东京站ChiikawaCharacterStreet",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E4%B8%9C%E4%BA%AC%E7%AB%99%20Chiikawa%20Character%20Street%20%E8%B4%AD%E7%89%A9&type=51",
  },
  {
    id: "nearby-osaka-himeji",
    region: "大阪",
    title: "姬路：姬路城 + 好古园",
    area: "兵库 · 姬路",
    distance: "大阪单程约 1 小时",
    note: "日本城郭和庭园的完成度很高；如果你们更想看文化古迹，可以用它替换神户，但不建议和奈良同日。",
    sourceTitle: "小红书检索：大阪周边 · 姬路城一日游",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:大阪周边姬路城一日游",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%A4%A7%E9%98%AA%20%E5%91%A8%E8%BE%B9%20%E5%A7%AC%E8%B7%AF%E5%9F%8E%20%E4%B8%80%E6%97%A5%E6%B8%B8&type=51",
  },
  {
    id: "nearby-osaka-minoo",
    region: "大阪",
    title: "箕面：瀑布 + 山林散步",
    area: "大阪北部 · 箕面",
    distance: "大阪市区约 30–45 分钟",
    note: "自然强度适中，适合想从难波和梅田抽半天换空气；雨后步道湿滑，穿防滑鞋更稳。",
    sourceTitle: "小红书检索：大阪周边 · 箕面瀑布攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:大阪周边箕面瀑布",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%A4%A7%E9%98%AA%20%E5%91%A8%E8%BE%B9%20%E7%AE%95%E9%9D%A2%E7%80%91%E5%B8%83%E6%94%BB%E7%95%A5&type=51",
  },
  {
    id: "nearby-osaka-sakai",
    region: "大阪",
    title: "堺：茶道文化 + 古坟与老街",
    area: "大阪南部 · 堺",
    distance: "难波约 30–45 分钟",
    note: "适合想看大阪府内更安静的一面；如果大阪只安排一整天，优先大阪城 / 黑门 / 难波，不要贪多。",
    sourceTitle: "小红书检索：大阪周边 · 堺市一日游",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:大阪周边堺市一日游",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%A4%A7%E9%98%AA%20%E5%91%A8%E8%BE%B9%20%E5%A0%BA%E5%B8%82%20%E4%B8%80%E6%97%A5%E6%B8%B8&type=51",
  },
  {
    id: "nearby-osaka-chiikawa-umeda",
    region: "大阪",
    title: "Chiikawa Land 大阪梅田：HEP FIVE 购物线",
    area: "梅田",
    distance: "大阪市区约 10–20 分钟",
    note: "大阪最适合优先确认的 Chiikawa 采购点；可以和梅田百货、空中庭园放在同一晚，注意整理券、限购和库存变化。",
    sourceTitle: "小红书检索：Chiikawa 大阪梅田限定 / 购物攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa大阪梅田限定",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E5%A4%A7%E9%98%AA%20%E6%A2%85%E7%94%B0%20%E9%99%90%E5%AE%9A%20%E8%B4%AD%E7%89%A9&type=51",
  },
  {
    id: "nearby-osaka-chiikawa-shinsaibashi",
    region: "大阪",
    title: "Chiikawa Land 心斋桥：PARCO + 道顿堀",
    area: "心斋桥 · 难波",
    distance: "大阪市区步行可串联",
    note: "与你们现有难波住宿和道顿堀最顺路，适合在离开大阪前采购；比单独跑梅田更适合最后一晚或返程前。",
    sourceTitle: "小红书检索：Chiikawa 心斋桥 PARCO / 大阪限定",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa心斋桥PARCO",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E5%BF%83%E6%96%8B%E6%A1%A5%20PARCO%20%E5%A4%A7%E9%98%AA%E9%99%90%E5%AE%9A&type=51",
  },
  {
    id: "nearby-osaka-chiikawa-popup",
    region: "大阪",
    title: "Chiikawa 大阪期间限定活动：看到就加入",
    area: "大阪各商场 / 快闪场地",
    distance: "以当期活动地点为准",
    note: "快闪和联名店变化很快，只作为“看到就买”的机会清单；不要为了不确定的快闪调整主路线，出发前重新核对日期与入场规则。",
    sourceTitle: "小红书检索：Chiikawa 大阪 快闪 / 限定周边",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa大阪快闪限定",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E5%A4%A7%E9%98%AA%20%E5%BF%AB%E9%97%AA%20%E9%99%90%E5%AE%9A%E5%91%A8%E8%BE%B9&type=51",
  },
  {
    id: "nearby-kyoto-arashiyama",
    region: "京都",
    title: "岚山：竹林 + 渡月桥 + 天龙寺",
    area: "京都西部 · 岚山",
    distance: "京都市区约 30–45 分钟",
    note: "第一次去京都很值得保留的半日线；早上先去竹林和天龙寺，下午可接嵯峨野小火车或回市区，不要再绕去伏见稻荷。",
    sourceTitle: "小红书检索：京都岚山半日 / 一日游攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:京都岚山半日一日游",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E4%BA%AC%E9%83%BD%20%E5%B2%9A%E5%B1%B1%20%E5%8D%8A%E6%97%A5%20%E4%B8%80%E6%97%A5%E6%B8%B8%E6%94%BB%E7%95%A5&type=51",
  },
  {
    id: "nearby-kyoto-ohara",
    region: "京都",
    title: "大原：三千院 + 山村庭院",
    area: "京都北部 · 大原",
    distance: "京都市区约 50–70 分钟",
    note: "比东山更安静，适合想看自然和寺院的人；交通时间较长，建议和贵船 / 琉璃光院只选一条北山线。",
    sourceTitle: "小红书检索：京都大原三千院一日游",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:京都大原三千院",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E4%BA%AC%E9%83%BD%20%E5%A4%A7%E5%8E%9F%20%E4%B8%89%E5%8D%83%E9%99%A2%20%E4%B8%80%E6%97%A5%E6%B8%B8&type=51",
  },
  {
    id: "nearby-kyoto-toei",
    region: "京都",
    title: "东映太秦映画村：时代剧 + 室内体验",
    area: "京都 · 太秦",
    distance: "京都站约 25–35 分钟",
    note: "雨天和不想一直逛寺院时很实用；适合情侣轻松体验，但不建议与岚山、金阁寺全塞同一天。",
    sourceTitle: "小红书检索：京都东映太秦映画村攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:京都东映太秦映画村",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E4%BA%AC%E9%83%BD%20%E4%B8%9C%E6%98%A0%E5%A4%AA%E7%A7%A6%E6%98%A0%E7%94%BB%E6%9D%91%E6%94%BB%E7%95%A5&type=51",
  },
  {
    id: "nearby-kyoto-chiikawa-kawaramachi",
    region: "京都",
    title: "Chiikawa Land 京都四条河原町",
    area: "四条河原町",
    distance: "京都市区步行 / 电车可达",
    note: "可与锦市场、祇园、鸭川合并，适合在京都买限定周边而不额外跑远；库存与整理券以门店当天公告为准。",
    sourceTitle: "小红书检索：Chiikawa 京都四条河原町限定",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa京都四条河原町",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E4%BA%AC%E9%83%BD%20%E5%9B%9B%E6%9D%A1%E6%B2%B3%E5%8E%9F%E7%94%BA%20%E9%99%90%E5%AE%9A&type=51",
  },
  {
    id: "nearby-kyoto-chiikawa-station",
    region: "京都",
    title: "京都站周边：角色周边 + 返程补买",
    area: "京都站",
    distance: "京都站内 / 周边",
    note: "适合退房后寄存行李、去奈良或大阪之前快速补买；不建议为了不确定的限定商品专程折返，先安排主线再看时间。",
    sourceTitle: "小红书检索：Chiikawa 京都站 / 京都限定周边",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:Chiikawa京都站限定周边",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=Chiikawa%20%E4%BA%AC%E9%83%BD%E7%AB%99%20%E9%99%90%E5%AE%9A%E5%91%A8%E8%BE%B9&type=51",
  },
  {
    id: "nearby-fuji-oshino",
    region: "富士山",
    title: "忍野八海：清水池 + 乡村富士山视角",
    area: "山梨 · 忍野",
    distance: "河口湖约 30–40 分钟",
    note: "适合和河口湖二选一或顺路加入；池子之间步行不算难，但巴士班次要先查，别为了一站错过回东京班次。",
    sourceTitle: "小红书检索：富士山周边 · 忍野八海一日游",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:富士山周边忍野八海",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%AF%8C%E5%A3%AB%E5%B1%B1%20%E5%91%A8%E8%BE%B9%20%E5%BF%8D%E9%87%8E%E5%85%AB%E6%B5%B7%20%E4%B8%80%E6%97%A5%E6%B8%B8&type=51",
  },
  {
    id: "nearby-fuji-fujiq",
    region: "富士山",
    title: "富士急乐园：过山车 + 富士山视角",
    area: "富士吉田",
    distance: "河口湖约 10–20 分钟",
    note: "喜欢刺激项目才值得选；如果你们更想拍富士山和泡温泉，别同时塞富士急，二选一会舒服很多。",
    sourceTitle: "小红书检索：富士山周边 · 富士急乐园攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:富士山周边富士急乐园",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%AF%8C%E5%A3%AB%E5%B1%B1%20%E5%91%A8%E8%BE%B9%20%E5%AF%8C%E5%A3%AB%E6%80%A5%E4%B9%90%E5%9B%AD%E6%94%BB%E7%95%A5&type=51",
  },
  {
    id: "nearby-fuji-ice-caves",
    region: "富士山",
    title: "鸣泽冰穴 + 富岳风穴：溶岩洞穴线",
    area: "青木原树海",
    distance: "河口湖约 30–45 分钟",
    note: "自然体验有特色，夏季凉爽；洞内湿滑、台阶多，穿运动鞋，且要预留巴士间隔时间。",
    sourceTitle: "小红书检索：富士山周边 · 冰穴风穴攻略",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:富士山冰穴风穴",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%AF%8C%E5%A3%AB%E5%B1%B1%20%E5%86%B0%E7%A9%B4%20%E9%A3%8E%E7%A9%B4%20%E5%91%A8%E8%BE%B9%E6%B8%B8&type=51",
  },
  {
    id: "nearby-fuji-gotemba",
    region: "富士山",
    title: "御殿场 Premium Outlets：购物 + 富士山远景",
    area: "静冈 · 御殿场",
    distance: "东京约 1.5–2 小时，河口湖约 1 小时",
    note: "购物优先时的替代方案；和河口湖、富士急不要同日全塞，适合把东京购物日换成郊区奥莱。",
    sourceTitle: "小红书检索：富士山周边 · 御殿场奥特莱斯",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:富士山御殿场奥莱",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%AF%8C%E5%A3%AB%E5%B1%B1%20%E5%BE%A1%E6%AE%BF%E5%9C%BA%20%E5%A5%A5%E7%89%B9%E8%8E%B1%E6%96%AF&type=51",
  },
  {
    id: "nearby-fuji-saiko-iyashi",
    region: "富士山",
    title: "西湖疗愈之里根场：茅草屋 + 湖区慢游",
    area: "西湖",
    distance: "河口湖约 30–45 分钟",
    note: "比河口湖主街安静，适合拍传统村落和慢慢看山；班次少，确定去就把往返巴士先锁好。",
    sourceTitle: "小红书检索：富士山西湖疗愈之里根场",
    sourceAuthor: "小红书搜索结果（公开检索页）",
    sourceNoteId: "search:富士山西湖疗愈之里根场",
    sourceUrl: "https://www.xiaohongshu.com/search_result/?keyword=%E5%AF%8C%E5%A3%AB%E5%B1%B1%20%E8%A5%BF%E6%B9%96%20%E7%96%97%E6%84%88%E4%B9%8B%E9%87%8C%E6%A0%B9%E5%9C%BA&type=51",
  },
];

const NEARBY_CANDIDATE_CATALOG_VERSION = 2;

function migrateNearbyCandidates(saved: NearbyCandidate[], catalogVersion?: number) {
  if (catalogVersion === NEARBY_CANDIDATE_CATALOG_VERSION) return saved;
  const existingIds = new Set(saved.map((candidate) => candidate.id));
  return [...saved, ...NEARBY_CANDIDATES.filter((candidate) => !existingIds.has(candidate.id))];
}

const PERSONAL_EXPENSES: PersonalExpense[] = [
  { id: "personal-flight-out", group: "机票 / 住宿 / 基础交通", label: "机票去", amount: 1288, note: "用户原稿金额；币种未标，先按原数字保存。", checked: true },
  { id: "personal-flight-back", group: "机票 / 住宿 / 基础交通", label: "机票回", amount: 754, checked: true },
  { id: "personal-osaka-stay", group: "机票 / 住宿 / 基础交通", label: "大阪住", amount: 1462, checked: true },
  { id: "personal-kyoto-stay", group: "机票 / 住宿 / 基础交通", label: "京都住", amount: 747, checked: true },
  { id: "personal-sim", group: "机票 / 住宿 / 基础交通", label: "电话卡", amount: 92, checked: true },
  { id: "personal-pass", group: "活动 / 交通", label: "周游卡", amount: 620, checked: true },
  { id: "personal-photo", group: "活动 / 交通", label: "约拍照", amount: 350, checked: true },
  { id: "personal-ic-card", group: "活动 / 交通", label: "IC卡", amount: 450, checked: true },
  { id: "personal-arashiyama-train", group: "活动 / 交通", label: "岚山小火车", amount: 42, note: "原稿写作“42岚山小火车”。", checked: true },
  { id: "personal-wristband-1", group: "活动 / 交通", label: "租手环 1", amount: 38, checked: true },
  { id: "personal-wristband-2", group: "活动 / 交通", label: "租手环 2", amount: 45, checked: true },
  { id: "personal-murin-an", group: "活动 / 交通", label: "无邻庵", amount: 30, checked: true },
  { id: "personal-kulikuli", group: "活动 / 交通", label: "kulikuli", amount: 36, checked: true },
  { id: "personal-day-1-shopping", group: "每日已记录", label: "买东西", amount: 226, dayLabel: "第一天", checked: true },
  { id: "personal-day-2-food", group: "每日已记录", label: "吃东西", amount: 30, dayLabel: "第二天", checked: true },
  { id: "personal-day-3-muji", group: "每日已记录", label: "无印良品", amount: 887, dayLabel: "第三天", checked: true },
  { id: "personal-day-4-matcha", group: "每日已记录", label: "抹茶", amount: 164, dayLabel: "第四天", checked: true },
  { id: "personal-day-5-meal-1", group: "每日已记录", label: "吃饭 1", amount: 176, dayLabel: "第五天", checked: true },
  { id: "personal-day-5-kimono", group: "每日已记录", label: "👘 和服", amount: 369, dayLabel: "第五天", checked: true },
  { id: "personal-day-5-ticket", group: "每日已记录", label: "门票", amount: 50, dayLabel: "第五天", checked: true },
  { id: "personal-day-5-meal-2", group: "每日已记录", label: "吃饭 2", amount: 80, dayLabel: "第五天", checked: true },
  { id: "personal-day-5-muji", group: "每日已记录", label: "无印良品", amount: 601, dayLabel: "第五天", checked: true },
  { id: "personal-day-5-drugstore", group: "每日已记录", label: "药妆", amount: 612, dayLabel: "第五天", checked: true },
  { id: "personal-day-6-food", group: "每日已记录", label: "吃饭", amount: 177, dayLabel: "第六天", checked: true },
  { id: "personal-day-7-drugstore", group: "每日已记录", label: "药妆", amount: 539, dayLabel: "第七天", checked: true },
  { id: "personal-day-7-ice", group: "每日已记录", label: "吃冰", amount: 62, dayLabel: "第七天", checked: true },
  { id: "personal-day-7-souvenir", group: "每日已记录", label: "纪念品", amount: 270, dayLabel: "第七天", checked: true },
  { id: "personal-day-7-meal", group: "每日已记录", label: "吃饭", amount: 100, dayLabel: "第七天", checked: true },
  { id: "personal-day-7-shopping", group: "每日已记录", label: "买东西", amount: 807, dayLabel: "第七天", checked: true },
  { id: "personal-day-8-cosmetics", group: "每日已记录", label: "化妆品", amount: 900, dayLabel: "第八天", checked: true },
  { id: "personal-day-8-muji", group: "每日已记录", label: "无印良品", amount: 424, dayLabel: "第八天", checked: true },
  { id: "personal-planned-aquarium", group: "待安排预算", label: "海洋馆", amount: 3100, note: "原稿列为周游券 / 活动预算，暂不计入已记录合计。", planned: true },
  { id: "personal-planned-mio", group: "待安排预算", label: "天王寺MIO券", amount: 1500, note: "原稿列为券或购物预算，暂不计入已记录合计。", planned: true },
];

const PERSONAL_TASKS: PersonalTask[] = [
  { id: "buy-ast-77pro", group: "要买的", title: "天斧 77 Pro", detail: "确认拍柄规格、颜色、价格与退税条件。" },
  { id: "buy-nanoflare", group: "要买的", title: "Nanoflare 700 Pro / 800 Pro（4U）", detail: "到店试挥并确认 4U、穿线和保修。" },
  { id: "buy-jersey", group: "要买的", title: "球衣" },
  { id: "buy-pillow", group: "要买的", title: "枕头" },
  { id: "buy-film-camera", group: "要买的", title: "一次胶片机" },
  { id: "buy-highlight-stick", group: "要买的", title: "高光棒" },
  { id: "buy-rubbing-strip", group: "要买的", title: "搓条" },
  { id: "shop-takashimaya", group: "购物地点", title: "高岛屋" },
  { id: "shop-daimaru", group: "购物地点", title: "大丸" },
  { id: "shop-mitsuhashi", group: "购物地点", title: "Sports Mitsuhashi Kyoto Flagship" },
  { id: "shop-aeon", group: "购物地点", title: "永旺" },
  { id: "shop-railway-museum", group: "购物地点", title: "京都铁道博物馆" },
  { id: "shop-ninenzaka", group: "购物地点", title: "二年坂 / 三年坂" },
  { id: "pass-weekly", group: "交通 / 门票", title: "周游券", detail: "先核对包含的景点、有效期和兑换方式。" },
  { id: "pass-aquarium", group: "交通 / 门票", title: "海洋馆", detail: "原稿预算 3100；确认是两人票还是套票。" },
  { id: "pass-ferris-wheel", group: "交通 / 门票", title: "摩天轮" },
  { id: "pass-keihan", group: "交通 / 门票", title: "京阪电车" },
  { id: "pass-soraniwa", group: "交通 / 门票", title: "空庭温泉", detail: "原稿安排 19:00–21:00；确认预约和入场规则。" },
  { id: "pass-takoyaki", group: "交通 / 门票", title: "章鱼小丸子" },
  { id: "pass-umeda-sky", group: "交通 / 门票", title: "梅田空中庭院" },
  { id: "pass-tennoji-mio", group: "交通 / 门票", title: "天王寺MIO 1500券", detail: "确认券面额、适用店铺和使用期限。" },
  { id: "pass-jr-3day", group: "交通 / 门票", title: "JR 3日券", detail: "原稿写作“JR3日：京坂”；购买前按实际跨城段核算。" },
  { id: "pass-hankyu", group: "交通 / 门票", title: "阪急电车" },
  { id: "pass-kyoto-subway", group: "交通 / 门票", title: "京都地下铁" },
  { id: "food-izakaya", group: "要吃的", title: "居酒屋" },
  { id: "food-okonomiyaki", group: "要吃的", title: "大阪烧" },
  { id: "food-sukiyaki", group: "要吃的", title: "寿喜烧" },
  { id: "food-wagyu", group: "要吃的", title: "和牛" },
  { id: "food-ramen", group: "要吃的", title: "拉面" },
  { id: "food-omurice", group: "要吃的", title: "蛋包饭" },
  { id: "food-sushi", group: "要吃的", title: "寿司", detail: "你不吃生三文鱼；点餐时分开餐具，并确认熟食和鱼介出汁。" },
  { id: "food-chazuke", group: "要吃的", title: "茶泡饭" },
  { id: "food-unagi", group: "要吃的", title: "鳗鱼饭" },
];

const PERSONAL_DAYS: PersonalDayMemo[] = [
  {
    id: "personal-osaka-25",
    label: "大阪25",
    title: "关西机场 → 入住 → 难波 / 心斋桥夜逛",
    note: "先完成机场换券、入住和补给，再在同一片区内逛；游船最晚一班原稿记为 21:30，出发前核对当天班次。",
    items: [
      { id: "osaka25-airport-pass", time: "18:00", title: "关西机场换券", detail: "在机场换 JRPASS / 关西机场线相关票券；先确认柜台位置、开放时间和需要的订单凭证。", tag: "交通" },
      { id: "osaka25-checkin", time: "19:00", title: "入住大阪住宿", detail: "放行李、确认第二天 USJ / 空庭温泉安排；顺便问退房、寄存和垃圾分类。", tag: "住宿" },
      { id: "osaka25-supplies", time: "19:30", title: "先买生活补给", detail: "面膜、板凳、拖鞋、早饭、胶片机、药妆、休足时间；可按心斋桥 → 难波顺路购买。", tag: "补给" },
      { id: "osaka25-cruise", time: "20:30", title: "道顿堀游船 Dotonbori Riverside Wonder Pub", detail: "游船约 20 分钟，原稿备注最晚一班 21:30；预约成功后再安排晚饭。", tag: "已勾选", checked: true },
      { id: "osaka25-shopping", time: "20:50", title: "心斋桥 / 难波夜逛", detail: "PARCO 7F 无印良品、大丸、Namba CITY 7F GU、优衣库、堂吉诃德、DAISO 凳子拖鞋、OS Drug。", tag: "购物" },
    ],
  },
  {
    id: "personal-osaka-26",
    label: "大阪26",
    title: "USJ → 空庭温泉 → 难波晚饭",
    note: "这是高强度日；手环、面膜和水放随身包，USJ 结束后不要再塞多个远距离景点。",
    items: [
      { id: "osaka26-usj", time: "07:00–08:00", title: "环球影城 USJ", detail: "带手环、面膜和水；提前确认入园、整理券 / 抽选券和小丸子相关活动。", tag: "已勾选", checked: true },
      { id: "osaka26-usj-exit", time: "18:00", title: "离开 USJ", detail: "原稿计划 18:00 离场；如果当天排队过久，优先保留预约的温泉，减少晚间购物。", tag: "取舍" },
      { id: "osaka26-soraniwa", time: "19:00–21:00", title: "空庭温泉", detail: "原稿备注距环球约 24 分钟、23:00 关门；确认交通和预约时间，不要压缩更衣 / 泡汤时间。", tag: "已勾选", checked: true },
      { id: "osaka26-dinner", time: "21:20", title: "难波晚饭：从酒场 / 烧鸟 / 烧肉中选一家", detail: "候选：炭火焼とりえんや難波3号店、海鲜屋台おくまん、希味、多平烧肉、Sumiyaki-shoten Yo Namba、Sushi Sakaba Sashisu、一半 sushi、肉食堂・肉酒場1129、TOTTOTTO。你优先熟食，刺身给女友单独点。", tag: "晚饭" },
    ],
  },
  {
    id: "personal-kobe-27",
    label: "神户27",
    title: "三宫 / 生田神社 → 南京町 → 港区海边",
    note: "神户候选很多，建议按体力在“港区 + 须磨海边”二选一；不要把所有海边站点都串起来。",
    items: [
      { id: "kobe27-start", time: "08:00", title: "起床，前往三宫站", detail: "先到三宫集中活动；若从大阪出发，优先选直达或少换乘线路。", tag: "交通" },
      { id: "kobe27-hair", time: "09:00", title: "编发（待定）", detail: "kotonoocho 5-6-8 / hair set salon beiller；先确认预约、付款方式和迟到规则。", tag: "待定" },
      { id: "kobe27-ikuta", time: "10:00", title: "生田神社 / 算卦", detail: "三宫步行可达；把神社、占卜和街拍控制在同一片区。", tag: "文化" },
      { id: "kobe27-lunch", time: "11:30", title: "午饭：Mando shuhari 或加虎烧肉 / 贺正轩", detail: "候选包含烧肉和豚骨拉面；鱼介过敏方优先选择能明确说明汤底的熟食。", tag: "午饭" },
      { id: "kobe27-chinatown", time: "13:00", title: "南京町、三宫商业街", detail: "边逛边补充小吃和购物；不要为了赶景点在街区来回折返。", tag: "已勾选" },
      { id: "kobe27-harbor", time: "14:00", title: "MOSAIC 摩天轮 → 面包超人博物馆 → 美利坚广场 / umie", detail: "港区集中路线，摩天轮和商场可按排队情况取舍。", tag: "港区" },
      { id: "kobe27-coast", time: "16:00", title: "须磨海边 / 舞子公园二选一", detail: "候选：须磨站—须磨海边公园、舞子海上站—舞子公园、须磨海洋公园。四点后只保留一个海边点，避免跨站往返。", tag: "二选一" },
      { id: "kobe27-cruise", time: "晚上", title: "预约当晚游船", detail: "没有当晚名额就预约明晚；如果已经游过，改为天王寺无印良品、买球拍、阿倍野 16F / 59F。", tag: "备选" },
    ],
  },
  {
    id: "personal-nara-uji-28",
    label: "奈良—宇治28",
    title: "宇治抹茶 → 奈良古迹与鹿",
    note: "宇治和奈良都值得去，但同一天非常满；建议把宇治作为上午主线、奈良只留东大寺—春日大社—奈良公园，或直接二选一。",
    items: [
      { id: "nara28-start", time: "08:00", title: "起床 / 询问宅急便", detail: "先确认行李是否要寄送、寄送到哪家住宿，以及柜台收件截止时间。", tag: "行李" },
      { id: "nara28-station", time: "09:00", title: "前往 JR 站", detail: "按当天选择宇治或奈良主线；京阪本线适合宇治，JR 适合和奈良段衔接。", tag: "交通" },
      { id: "nara28-uji-food", time: "10:00", title: "宇治抹茶店巡礼", detail: "辻利兵卫本店、中村藤吉（零食 / 玄米茶 / 抹茶曲奇）、Food Park 和牛定食、楠楠咖啡抹茶拿铁；中村藤吉平等院店可选芭菲。", tag: "美食" },
      { id: "nara28-uji-walk", time: "11:30", title: "宇治公园 → 宇治神社 → 宇治桥", detail: "加伊藤久右卫门宇治本店（吃 / 周边）；排队过长就只买伴手礼，不要重复排两家抹茶店。", tag: "已勾选" },
      { id: "nara28-nara", time: "14:00", title: "奈良：春日大社 → 东大寺 → 若草山 / 奈良公园", detail: "般若寺、九品寺彼岸花属于加长版备选；若宇治停留较久，删掉远端花景点。", tag: "取舍" },
      { id: "nara28-tennoji", time: "晚上", title: "天王寺购物 / 无印良品", detail: "体力不足时直接回住宿；需要补买再安排天王寺 MIO，别再额外跨城。", tag: "备选" },
    ],
  },
  {
    id: "personal-osaka-kyoto-29",
    label: "大阪—京都29",
    title: "梅田集中购物，再决定是否换到京都",
    note: "原稿只有“9:00 出门去梅田”；建议把高岛屋 / 大丸 / 体育用品 / 生活用品按百货营业时间排成一条，不要跨城往返。",
    items: [
      { id: "osaka-kyoto29-umeda", time: "09:00", title: "出门去梅田", detail: "优先完成梅田空中庭院、百货和购物任务；把行李寄存 / 送到京都住宿的方案提前确认。", tag: "已勾选" },
      { id: "osaka-kyoto29-shopping", time: "10:00–15:00", title: "梅田 / 大丸 / 高岛屋购物", detail: "按清单找球拍、球衣、枕头、胶片机和药妆；大件先问退税、寄送和能否现场取货。", tag: "购物" },
      { id: "osaka-kyoto29-transfer", time: "15:00后", title: "大阪 → 京都（如当天换住宿）", detail: "优先选择与住宿区域最顺的京阪 / 阪急 / JR；先处理入住或寄存，再去晚餐。", tag: "换城" },
    ],
  },
  {
    id: "personal-kyoto-30",
    label: "京都30",
    title: "南禅寺—哲学之道—伏见稻荷，晚上鸭川",
    note: "原稿景点密度很高；无邻庵、南禅寺、哲学之道和银阁寺在同一东山轴线上，伏见稻荷放在傍晚前后更顺。",
    items: [
      { id: "kyoto30-start", time: "08:00", title: "起床 / 租车或自行车 / 编头发", detail: "停车场日文可搜“駐輪場”；先确认租车地点、还车时间和雨天方案。", tag: "准备" },
      { id: "kyoto30-murin-an", time: "09:00–10:00", title: "无邻庵", detail: "原稿写 9:00 起床、预约 10:00；入场时间以预约单为准。", tag: "已勾选", checked: true },
      { id: "kyoto30-nanzenji", time: "10:30–12:30", title: "金地院 → 蓝瓶咖啡 → 南禅寺 → 天授庵", detail: "原稿备注金地院 6、天授庵 4.5，像是门票 / 评分记录；现场按开放时间取舍，不要把评分当票价。", tag: "文化" },
      { id: "kyoto30-philosophy", time: "13:00–15:00", title: "永观堂 → 哲学之道 → 慈照寺 / 银阁寺", detail: "慈照寺原稿备注“一般”；体力不足时可删银阁寺，保留南禅寺和哲学之道。", tag: "取舍" },
      { id: "kyoto30-fushimi", time: "16:00", title: "伏见稻荷大社", detail: "原稿备注 Chiikawa 京都伏见店 17:00 关门；如果要买限定品，先去店再爬鸟居，营业时间与库存出发前复核。", tag: "Chiikawa" },
      { id: "kyoto30-evening", time: "晚上", title: "鸭川大阪烧 / 京风料理 + Standard Products", detail: "可安排骑车路线：鸭川公园 → 贺茂川 → 相国寺 → 同志社大学 → 京都御所；只在天气和体力允许时执行。", tag: "晚饭" },
      { id: "kyoto30-sukiyaki", time: "备选", title: "寿喜烧三岛亭", detail: "作为正式晚餐备选；需要预约时提前确认。", tag: "美食" },
    ],
  },
  {
    id: "personal-kyoto-1",
    label: "京都1 / 岚山",
    title: "岚山小火车 → 奥嵯峨 → 渡月桥",
    note: "小火车班次和座位必须先锁；穴太寺属于额外支线，和 9:30 小火车不能默认同天全部完成。",
    items: [
      { id: "kyoto1-start", time: "08:00", title: "出门前往龟冈", detail: "若要去穴太寺看彼岸花，先核对公交和回程；否则直接去小火车起点。", tag: "交通" },
      { id: "kyoto1-train", time: "09:30", title: "岚山小火车：龟冈 → 嵯峨岚山", detail: "原稿金额记录 42；票券、站点和发车时间出发前再次确认。", tag: "已记录", checked: true },
      { id: "kyoto1-okusan", time: "10:30–12:50", title: "爱宕念佛寺 → 证安院朱印 → 祇王寺 → 二尊院 → 常寂光寺 → 御发神社", detail: "原稿细分为 10:30–11:00、11:20、12:00–12:40、12:50；这是奥嵯峨连续步行段，注意坡度和鞋子。", tag: "寺院" },
      { id: "kyoto1-lunch", time: "13:00", title: "午饭：wagyu donburi-ya nikuni 或喜重郎", detail: "生和牛拌饭需要确认是否可做熟；你过敏时不要因为“和牛”三个字忽略酱汁和配菜的鱼介成分。", tag: "午饭" },
      { id: "kyoto1-garden", time: "13:45–15:30", title: "大河内山庄 → 天龙寺 → 佑斋亭", detail: "原稿把常寂光寺重复写了一次；建议只走一次。佑斋亭预约码 W5F1L9 仅按你原稿记录，现场以官方订单为准。", tag: "预约" },
      { id: "kyoto1-museum", time: "15:30–17:00", title: "福田美术馆 → 渡月桥", detail: "按体力决定是否入馆；最后坐岚山电车回，不要为了一兰再横穿京都。", tag: "收尾" },
      { id: "kyoto1-dinner", time: "晚上", title: "晚饭：肉どうし或一兰拉面", detail: "二选一即可；如果排队太长，优先找附近熟食。", tag: "美食" },
    ],
  },
  {
    id: "personal-return",
    label: "回程",
    title: "前往机场",
    note: "原稿写 16:00 起飞；这是另一套返程时间，请最终以机票订单为准，并反推机场到达时间。",
    items: [
      { id: "return-luggage", time: "上午", title: "退房、取寄存行李", detail: "确认住宿退房时间和寄存凭证；液体、药妆、化妆品分开整理。", tag: "行李" },
      { id: "return-airport", time: "起飞前 3 小时左右", title: "前往机场", detail: "根据机场、航站楼和退税 / 托运情况倒推；不要把最后购物安排到机场出发前。", tag: "交通" },
      { id: "return-flight", time: "16:00", title: "返程航班", detail: "按原稿记录；与当前网页主线的 9/5 19:30 关西飞浦东不同，订票后请以确认单覆盖。", tag: "待确认" },
    ],
  },
];

const DEFAULT_XHS_SHARES: XiaohongshuShare[] = [
  ...RESEARCH_TIPS.map((tip) => ({
    id: `researched-${tip.noteId}`,
    title: tip.sourceTitle,
    url: tip.link,
    note: `${tip.title}：${tip.decision}`,
    author: tip.author,
    sourceRef: tip.sourceRef ?? "小红书原笔记",
    source: "researched" as const,
  })),
  ...CHECKLIST_SOURCES.map((source) => ({
    id: `researched-checklist-${source.noteId}`,
    title: source.title,
    url: source.link,
    note: source.summary,
    author: source.author,
    sourceRef: "小红书原笔记",
    source: "researched" as const,
  })),
];

function mergeDefaultXhsShares(saved: XiaohongshuShare[]) {
  const savedResearchIds = new Set(saved.filter((item) => item.source === "researched").map((item) => item.id));
  const savedUserLinks = saved.filter((item) => item.source !== "researched");
  const savedResearchLinks = saved.filter((item) => item.source === "researched");
  return [
    ...savedResearchLinks,
    ...DEFAULT_XHS_SHARES.filter((item) => !savedResearchIds.has(item.id)),
    ...savedUserLinks,
  ];
}

const CATEGORY_META: Record<PlaceCategory | "all", { label: string; icon: string }> = {
  all: { label: "全部", icon: "⌘" },
  food: { label: "吃", icon: "◌" },
  drink: { label: "喝", icon: "◒" },
  play: { label: "玩", icon: "✦" },
  stay: { label: "住", icon: "⌂" },
  shop: { label: "买", icon: "＋" },
};

const STORAGE_KEY = "tokyo-two-person-trip-v1";

type PlaceDraft = Omit<Place, "id">;
type StayDraft = Omit<StayPlan, "id">;

function makeDraft(day: DayId = 1): PlaceDraft {
  return {
    title: "",
    area: "",
    category: "play",
    day,
    lat: 35.6812,
    lng: 139.7671,
    note: "",
    link: "",
  };
}

function makeStayDraft(day: DayId = 1): StayDraft {
  return {
    day,
    title: "",
    area: "",
    price: "",
    note: "",
    placeId: undefined,
  };
}

function makeSnapshot(
  days: DayPlan[],
  places: Place[],
  stays: StayPlan[],
  xiaohongshuLinks: XiaohongshuShare[],
  preDepartureChecklist: Record<string, boolean> = {},
  nearbyCandidates: NearbyCandidate[] = NEARBY_CANDIDATES,
  personalExpenses: PersonalExpense[] = PERSONAL_EXPENSES,
  personalTasks: PersonalTask[] = PERSONAL_TASKS,
  personalDays: PersonalDayMemo[] = PERSONAL_DAYS,
): TripState {
  return {
    version: TRIP_DATA_VERSION,
    days,
    places,
    stays,
    xiaohongshuLinks,
    preDepartureChecklist,
    nearbyCandidates,
    nearbyCandidateCatalogVersion: NEARBY_CANDIDATE_CATALOG_VERSION,
    personalExpenses,
    personalTasks,
    personalDays,
  };
}

const XHS_HOSTS = new Set([
  "xiaohongshu.com",
  "www.xiaohongshu.com",
  "xhslink.com",
  "www.xhslink.com",
  "xhslink.cn",
  "www.xhslink.cn",
]);

const XHS_URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:xiaohongshu\.com|xhslink\.com|xhslink\.cn)(?:\/[^\s<>"'`]+)?/i;
const XHS_TRAILING_PUNCTUATION = /[.,!?;:，。！？；：、）)】\]}》」』]+$/gu;

type ParsedXiaohongshuInput = {
  url: string;
  title: string;
};

function parseXiaohongshuInput(value: string): ParsedXiaohongshuInput | null {
  const match = value.match(XHS_URL_PATTERN);
  if (!match || match.index === undefined) return null;

  const rawUrl = match[0]
    .replace(/複製後開啟小紅書查看筆記.*$/u, "")
    .replace(XHS_TRAILING_PUNCTUATION, "");
  const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !XHS_HOSTS.has(url.hostname.toLowerCase())) return null;

    const title = value
      .slice(0, match.index)
      .replace(/^[\s|｜:：\-—]+|[\s|｜:：\-—]+$/gu, "")
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, 80);

    return { url: url.toString(), title };
  } catch {
    return null;
  }
}

function mergeDefaultPlaces(saved: Place[]) {
  const existingIds = new Set(saved.map((place) => place.id));
  return [...saved, ...PLACES.filter((place) => !existingIds.has(place.id))];
}

const BUILT_IN_PLACE_IDS = new Set([
  ...LEGACY_PLACES.map((place) => place.id),
  ...PLACES.map((place) => place.id),
]);

function migratePlaces(saved: Place[]) {
  // Rebuild built-in points when the route changes, while keeping points the
  // couple added themselves through the CRUD editor.
  return mergeDefaultPlaces(saved.filter((place) => !BUILT_IN_PLACE_IDS.has(place.id)));
}

function encodeShare(payload: TripState) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeShare(encoded: string): TripState | null {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as TripState;
    if (!Array.isArray(parsed.days) || !Array.isArray(parsed.places)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function categoryLabel(category: PlaceCategory) {
  return CATEGORY_META[category].label;
}

function dayFor(day: number): DayPlan {
  return DAYS.find((item) => item.id === day) ?? DAYS[0];
}

export default function Home() {
  const [days, setDays] = useState<DayPlan[]>(DAYS);
  const [places, setPlaces] = useState<Place[]>(PLACES);
  const [stayPlans, setStayPlans] = useState<StayPlan[]>(STAY_PLANS);
  const [xiaohongshuLinks, setXiaohongshuLinks] = useState<XiaohongshuShare[]>(DEFAULT_XHS_SHARES);
  const [preDepartureChecklist, setPreDepartureChecklist] = useState<Record<string, boolean>>({});
  const [nearbyCandidates, setNearbyCandidates] = useState<NearbyCandidate[]>(NEARBY_CANDIDATES);
  const [nearbyRegion, setNearbyRegion] = useState<NearbyRegion | "all">("all");
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpense[]>(PERSONAL_EXPENSES);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>(PERSONAL_TASKS);
  const [personalDays, setPersonalDays] = useState<PersonalDayMemo[]>(PERSONAL_DAYS);
  const [personalDayFilter, setPersonalDayFilter] = useState("all");
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaceDraft>(makeDraft());
  const [stayEditorOpen, setStayEditorOpen] = useState(false);
  const [editingStayId, setEditingStayId] = useState<string | null>(null);
  const [stayDraft, setStayDraft] = useState<StayDraft>(makeStayDraft());
  const [xhsUrlDraft, setXhsUrlDraft] = useState("");
  const [xhsTitleDraft, setXhsTitleDraft] = useState("");
  const [xhsNoteDraft, setXhsNoteDraft] = useState("");
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const importInput = useRef<HTMLInputElement | null>(null);
  const xhsAutoTitleRef = useRef("");

  useEffect(() => {
    const shared = window.location.hash.startsWith("#share=")
      ? decodeShare(window.location.hash.slice(7))
      : null;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    let local: TripState | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TripState;
        if (Array.isArray(parsed.days) && Array.isArray(parsed.places)) local = parsed;
      } catch {
        local = null;
      }
    }
    const next = shared ?? local;

    const timer = window.setTimeout(() => {
      if (next) {
        const isCurrentVersion = next.version === TRIP_DATA_VERSION;
        setDays(isCurrentVersion && next.days.length ? next.days : DAYS);
        setPlaces(isCurrentVersion ? next.places : migratePlaces(next.places));
        setStayPlans(Array.isArray(next.stays) ? next.stays : STAY_PLANS);
        setXiaohongshuLinks(Array.isArray(next.xiaohongshuLinks) ? mergeDefaultXhsShares(next.xiaohongshuLinks) : DEFAULT_XHS_SHARES);
        setPreDepartureChecklist(next.preDepartureChecklist ?? {});
        setNearbyCandidates(Array.isArray(next.nearbyCandidates) ? migrateNearbyCandidates(next.nearbyCandidates, next.nearbyCandidateCatalogVersion) : NEARBY_CANDIDATES);
        setPersonalExpenses(Array.isArray(next.personalExpenses) ? next.personalExpenses : PERSONAL_EXPENSES);
        setPersonalTasks(Array.isArray(next.personalTasks) ? next.personalTasks : PERSONAL_TASKS);
        setPersonalDays(Array.isArray(next.personalDays) ? next.personalDays : PERSONAL_DAYS);
        if (shared) setToast("已载入分享行程");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeSnapshot(days, places, stayPlans, xiaohongshuLinks, preDepartureChecklist, nearbyCandidates, personalExpenses, personalTasks, personalDays)));
  }, [days, hydrated, nearbyCandidates, personalDays, personalExpenses, personalTasks, places, preDepartureChecklist, stayPlans, xiaohongshuLinks]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visiblePlaces = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return places
      .filter((place) => selectedDay === "all" || place.day === selectedDay)
      .filter((place) => categoryFilter === "all" || place.category === categoryFilter)
      .filter((place) => {
        if (!keyword) return true;
        return [place.title, place.area, place.note].some((value) =>
          value.toLowerCase().includes(keyword),
        );
      })
      .sort((a, b) => a.day - b.day);
  }, [categoryFilter, places, search, selectedDay]);

  const routePlaces = useMemo(
    () => places.filter((place) => selectedDay === "all" || place.day === selectedDay),
    [places, selectedDay],
  );

  const foodPlaces = useMemo(
    () =>
      places
        .filter((place) => place.category === "food" || place.category === "drink")
        .filter((place) => selectedDay === "all" || place.day === selectedDay)
        .sort((a, b) => a.day - b.day),
    [places, selectedDay],
  );

  const checkedFoodCount = foodPlaces.filter((place) => place.checked).length;

  const visibleNearbyCandidates = useMemo(
    () => nearbyCandidates.filter((candidate) => nearbyRegion === "all" || candidate.region === nearbyRegion),
    [nearbyCandidates, nearbyRegion],
  );
  const checkedNearbyCount = nearbyCandidates.filter((candidate) => candidate.checked).length;

  const recordedPersonalTotal = personalExpenses.filter((expense) => !expense.planned).reduce((total, expense) => total + expense.amount, 0);
  const plannedPersonalTotal = personalExpenses.filter((expense) => expense.planned).reduce((total, expense) => total + expense.amount, 0);
  const checkedPersonalExpenseCount = personalExpenses.filter((expense) => expense.checked).length;
  const checkedPersonalTaskCount = personalTasks.filter((task) => task.checked).length;
  const personalRouteTotal = personalDays.reduce((total, day) => total + day.items.length, 0);
  const checkedPersonalRouteCount = personalDays.reduce((total, day) => total + day.items.filter((item) => item.checked).length, 0);
  const visiblePersonalDays = personalDayFilter === "all"
    ? personalDays
    : personalDays.filter((day) => day.id === personalDayFilter);

  const checklistItems = useMemo(
    () => PRE_DEPARTURE_GROUPS.flatMap((group) => group.items),
    [],
  );
  const checkedChecklistCount = checklistItems.filter((item) => preDepartureChecklist[item.id]).length;

  const toggleChecklistItem = (id: string) => {
    setPreDepartureChecklist((current) => ({ ...current, [id]: !current[id] }));
  };

  const markChecklist = (checked: boolean) => {
    setPreDepartureChecklist(Object.fromEntries(checklistItems.map((item) => [item.id, checked])));
    setToast(checked ? "出发前清单已全部标记" : "已清空出发前清单勾选");
  };

  const toggleFoodChecked = (id: string) => {
    setPlaces((current) => current.map((place) => (
      place.id === id ? { ...place, checked: !place.checked } : place
    )));
  };

  const toggleNearbyCandidate = (id: string) => {
    setNearbyCandidates((current) => current.map((candidate) => (
      candidate.id === id ? { ...candidate, checked: !candidate.checked } : candidate
    )));
  };

  const togglePersonalExpense = (id: string) => {
    setPersonalExpenses((current) => current.map((expense) => (
      expense.id === id ? { ...expense, checked: !expense.checked } : expense
    )));
  };

  const togglePersonalTask = (id: string) => {
    setPersonalTasks((current) => current.map((task) => (
      task.id === id ? { ...task, checked: !task.checked } : task
    )));
  };

  const togglePersonalRouteItem = (dayId: string, itemId: string) => {
    setPersonalDays((current) => current.map((day) => (
      day.id === dayId
        ? { ...day, items: day.items.map((item) => item.id === itemId ? { ...item, checked: !item.checked } : item) }
        : day
    )));
  };

  const deleteNearbyCandidate = (candidate: NearbyCandidate) => {
    if (!window.confirm(`确定从周边候选中删除“${candidate.title}”吗？`)) return;
    setNearbyCandidates((current) => current.filter((item) => item.id !== candidate.id));
    setToast("已从周边候选中删除");
  };

  const restoreNearbyCandidates = () => {
    if (!window.confirm("恢复默认周边候选会保留当前主线，但会覆盖你对候选的勾选和删除，确定继续吗？")) return;
    setNearbyCandidates(NEARBY_CANDIDATES);
    setNearbyRegion("all");
    setToast("已恢复小红书周边候选");
  };

  const openCreate = (day: DayId = selectedDay === "all" ? 1 : (selectedDay as DayId), category: PlaceCategory = "play") => {
    setEditingId(null);
    setDraft({ ...makeDraft(day), category });
    setEditorOpen(true);
  };

  const openEdit = (place: Place) => {
    setEditingId(place.id);
    setDraft({ ...place });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
  };

  const openStayCreate = (day: DayId = selectedDay === "all" ? 1 : (selectedDay as DayId)) => {
    setEditingStayId(null);
    setStayDraft(makeStayDraft(day));
    setStayEditorOpen(true);
  };

  const openStayEdit = (plan: StayPlan) => {
    setEditingStayId(plan.id);
    setStayDraft({ day: plan.day, title: plan.title, area: plan.area, price: plan.price, note: plan.note, placeId: plan.placeId });
    setStayEditorOpen(true);
  };

  const closeStayEditor = () => {
    setStayEditorOpen(false);
    setEditingStayId(null);
  };

  const updateStayDraft = <K extends keyof StayDraft>(key: K, value: StayDraft[K]) => {
    setStayDraft((current) => ({ ...current, [key]: value }));
  };

  const submitStay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stayDraft.title.trim() || !stayDraft.area.trim()) {
      setToast("请先填写住宿名称和区域");
      return;
    }

    const normalized: StayPlan = {
      ...stayDraft,
      id: editingStayId ?? `stay-${Date.now()}`,
      title: stayDraft.title.trim(),
      area: stayDraft.area.trim(),
      price: stayDraft.price.trim() || "价格待补",
      note: stayDraft.note.trim() || "入住 / 退房时间和行李寄存以订单与酒店前台为准。",
      placeId: stayDraft.placeId || undefined,
    };

    setStayPlans((current) => {
      const next = editingStayId
        ? current.map((plan) => (plan.id === editingStayId ? normalized : plan))
        : [...current, normalized];
      return next.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
    });
    setToast(editingStayId ? "住宿安排已更新" : "住宿安排已加入");
    closeStayEditor();
  };

  const deleteStay = (plan: StayPlan) => {
    if (!window.confirm(`确定删除“${plan.title}”这条住宿安排吗？`)) return;
    setStayPlans((current) => current.filter((item) => item.id !== plan.id));
    setToast("住宿安排已删除");
  };

  const restoreStayPlans = () => {
    if (!window.confirm("恢复示例住宿会覆盖当前住宿安排，确定继续吗？")) return;
    setStayPlans(STAY_PLANS);
    setToast("已恢复示例住宿安排");
  };

  const updateDraft = <K extends keyof PlaceDraft>(key: K, value: PlaceDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submitPlace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.area.trim()) {
      setToast("请先填写地点名称和区域");
      return;
    }

    const normalized: Place = {
      ...draft,
      id: editingId ?? `place-${Date.now()}`,
      title: draft.title.trim(),
      area: draft.area.trim(),
      note: draft.note.trim(),
      link: draft.link?.trim() || undefined,
      lat: Number(draft.lat),
      lng: Number(draft.lng),
    };

    setPlaces((current) =>
      editingId ? current.map((place) => (place.id === editingId ? normalized : place)) : [...current, normalized],
    );
    setSelectedPlaceId(normalized.id);
    setToast(editingId ? "地点已更新" : "地点已加入行程");
    closeEditor();
  };

  const deletePlace = (place: Place) => {
    if (!window.confirm(`确定删除“${place.title}”吗？`)) return;
    setPlaces((current) => current.filter((item) => item.id !== place.id));
    setSelectedPlaceId(null);
    setToast("地点已删除");
  };

  const addXiaohongshuLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseXiaohongshuInput(xhsUrlDraft);
    if (!parsed) {
      setToast("请粘贴有效的小红书链接或手机端整段分享文案");
      return;
    }

    const item: XiaohongshuShare = {
      id: `xhs-user-${Date.now()}`,
      title: xhsTitleDraft.trim() || parsed.title || "我的小红书攻略",
      url: parsed.url,
      note: xhsNoteDraft.trim() || "自己收藏的攻略，出发前再核对交通、营业时间与库存。",
      author: "你添加的链接",
      source: "user",
    };
    setXiaohongshuLinks((current) => [item, ...current]);
    setXhsUrlDraft("");
    setXhsTitleDraft("");
    setXhsNoteDraft("");
    xhsAutoTitleRef.current = "";
    setToast("小红书链接已加入分享板块");
  };

  const handleXiaohongshuInputChange = (value: string) => {
    setXhsUrlDraft(value);
    const parsed = parseXiaohongshuInput(value);
    if (!parsed?.title) return;

    setXhsTitleDraft((current) => {
      if (!current.trim() || current === xhsAutoTitleRef.current) return parsed.title;
      return current;
    });
    xhsAutoTitleRef.current = parsed.title;
  };

  const removeXiaohongshuLink = (id: string) => {
    setXiaohongshuLinks((current) => current.filter((item) => item.id !== id));
    setToast("已移除这条小红书链接");
  };

  const shareTrip = async () => {
    const url = `${window.location.origin}${window.location.pathname}#share=${encodeShare(makeSnapshot(days, places, stayPlans, xiaohongshuLinks, preDepartureChecklist, nearbyCandidates, personalExpenses, personalTasks, personalDays))}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setToast("分享链接已复制，发给她即可在另一台设备打开");
    } catch {
      window.prompt("复制这条分享链接", url);
    }
  };

  const exportTrip = () => {
    const file = new Blob([JSON.stringify(makeSnapshot(days, places, stayPlans, xiaohongshuLinks, preDepartureChecklist, nearbyCandidates, personalExpenses, personalTasks, personalDays), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tokyo-trip-plan.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("行程 JSON 已导出");
  };

  const importTrip = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as TripState;
      if (!Array.isArray(parsed.days) || !Array.isArray(parsed.places)) throw new Error("invalid");
      const isCurrentVersion = parsed.version === TRIP_DATA_VERSION;
      setDays(isCurrentVersion && parsed.days.length ? parsed.days : DAYS);
      setPlaces(isCurrentVersion ? parsed.places : migratePlaces(parsed.places));
      setStayPlans(Array.isArray(parsed.stays) ? parsed.stays : STAY_PLANS);
      setXiaohongshuLinks(Array.isArray(parsed.xiaohongshuLinks) ? mergeDefaultXhsShares(parsed.xiaohongshuLinks) : DEFAULT_XHS_SHARES);
      setPreDepartureChecklist(parsed.preDepartureChecklist ?? {});
      setNearbyCandidates(Array.isArray(parsed.nearbyCandidates) ? migrateNearbyCandidates(parsed.nearbyCandidates, parsed.nearbyCandidateCatalogVersion) : NEARBY_CANDIDATES);
      setPersonalExpenses(Array.isArray(parsed.personalExpenses) ? parsed.personalExpenses : PERSONAL_EXPENSES);
      setPersonalTasks(Array.isArray(parsed.personalTasks) ? parsed.personalTasks : PERSONAL_TASKS);
      setPersonalDays(Array.isArray(parsed.personalDays) ? parsed.personalDays : PERSONAL_DAYS);
      setToast("行程已导入");
    } catch {
      setToast("导入失败，请选择这个网页导出的 JSON 文件");
    } finally {
      event.target.value = "";
    }
  };

  const resetTrip = () => {
    if (!window.confirm("恢复示例路线会覆盖当前地点数据，确定继续吗？")) return;
    setDays(DAYS);
    setPlaces(PLACES);
    setStayPlans(STAY_PLANS);
    setXiaohongshuLinks(DEFAULT_XHS_SHARES);
    setPreDepartureChecklist({});
    setNearbyCandidates(NEARBY_CANDIDATES);
    setNearbyRegion("all");
    setPersonalExpenses(PERSONAL_EXPENSES);
    setPersonalTasks(PERSONAL_TASKS);
    setPersonalDays(PERSONAL_DAYS);
    setPersonalDayFilter("all");
    setSelectedDay("all");
    setCategoryFilter("all");
    setSearch("");
    setToast("已恢复日本 7 天固定航班示例路线");
  };

  const selectPlace = (id: string) => {
    setSelectedPlaceId(id);
    setCategoryFilter("all");
    setSearch("");
    const place = places.find((item) => item.id === id);
    if (place && selectedDay !== "all" && place.day !== selectedDay) setSelectedDay(place.day);
  };

  const focusScheduleItem = (plan: HourlyPlan, item: ScheduleItem) => {
    setSelectedDay(plan.day);
    setCategoryFilter("all");
    setSearch("");
    if (item.placeId) {
      setSelectedPlaceId(item.placeId);
    } else {
      setSelectedPlaceId(null);
    }
  };

  return (
    <main className="trip-app" id="top">
      <header className="topbar">
        <div className="brand-mark" aria-label="Two in Tokyo">2<span>in</span>JP</div>
        <div className="topbar-copy">
        <p className="eyebrow">TOKYO · FUJI · KYOTO · NARA · OSAKA / 2026.08.30–09.05</p>
          <span>两个人的 7 天 6 晚日本旅行</span>
        </div>
        <div className="top-actions">
          <button className="button button-ghost" onClick={exportTrip}>导出</button>
          <button className="button button-ghost" onClick={() => importInput.current?.click()}>导入</button>
          <button className="button button-dark" onClick={shareTrip}>分享行程 ↗</button>
          <input ref={importInput} className="visually-hidden" type="file" accept="application/json" onChange={importTrip} />
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <div className="kicker"><span className="kicker-dot" />早秋出发，东京进大阪出</div>
          <h1>东京进，<em>大阪出。</em></h1>
          <p className="hero-subtitle">一份给两个人的 7 天地图计划：东京、富士山、京都、奈良、大阪，按小时拆开，留出酒店寄存、换城、排队和天气缓冲。</p>
          <p className="routine-note">作息约束：除凌晨去程外 09:00 起床 · 02:00 前睡 · 8/30 01:05 浦东 → 羽田，9/5 19:30 KIX → 浦东</p>
          <div className="trip-facts">
            <div><strong>7</strong><span>天 6 晚</span></div>
            <div><strong>2</strong><span>次换酒店</span></div>
            <div><strong>10–15k</strong><span>步 / 日</span></div>
            <div><strong>2.4w–3.3w</strong><span>两人预算</span></div>
          </div>
        </div>
        <div className="brief-card">
          <div className="brief-card-head"><span>ROUTE NOTE</span><span className="status-dot">● 已规划</span></div>
          <h2>东京 3 晚 + 京都 2 晚 + 大阪 1 晚</h2>
          <p>按“8/30 01:05 浦东 → 羽田、9/5 19:30 KIX → 浦东”重排：删掉镰仓 / 江之岛，9/2 东京换城到京都，9/4 经奈良进入大阪，9/5 把白天留给大阪后去机场。</p>
          <div className="brief-lines">
            <div><span>去程</span><b>08/30 01:05 浦东 PVG → 05:00 东京羽田 HND</b></div>
            <div><span>返程</span><b>09/05 19:30 关西机场 KIX → 21:00 浦东 PVG</b></div>
            <div><span>取舍</span><b>删镰仓 / 江之岛，保留富士山、京都、奈良与大阪整日</b></div>
          </div>
        </div>
      </section>

      <section className="flight-alert" aria-label="航班与作息提醒">
        <span className="flight-alert-icon">!</span>
        <div>
          <strong>固定机票已落地：这次实际是 7 天 6 晚，且去程需要凌晨出发。</strong>
          <p>8/30 01:05 浦东起飞、05:00 到羽田；本方案不额外订前一晚酒店，先按首班交通进市区吃早饭、逛筑地和浅草，15:00 左右再回东京基地办理入住、放行李。D4 / D6 仍按常见 10:00 退房换城，具体以订单为准。</p>
        </div>
      </section>

      <nav className="module-nav" aria-label="页面模块快速跳转">
        <span className="module-nav-title">快速跳转</span>
        <div>{PAGE_MODULES.map((module) => <a href={module.href} key={module.href}>{module.label}</a>)}</div>
      </nav>

      <section className="workspace-card" id="map">
        <div className="workspace-toolbar">
          <div>
            <p className="section-label">MAP / 路线地图</p>
            <h2>路线地图：数字是顺序，彩线是方向。</h2>
          </div>
          <div className="toolbar-actions">
            <label className="search-box">
              <span>⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索地点、区域或备注" aria-label="搜索地点" />
            </label>
            <button className="button button-accent" onClick={() => openCreate()}>＋ 新增地点</button>
          </div>
        </div>

        <div className="day-tabs" role="tablist" aria-label="按天筛选">
          <button className={`day-tab day-tab-all ${selectedDay === "all" ? "is-active" : ""}`} onClick={() => setSelectedDay("all")} role="tab" aria-selected={selectedDay === "all"}>
            <span className="day-number">全部</span><span className="day-tab-title">整张地图</span>
          </button>
          {days.map((day) => (
            <button key={day.id} className={`day-tab ${selectedDay === day.id ? "is-active" : ""}`} style={{ "--day-color": day.color } as CSSProperties} onClick={() => setSelectedDay(day.id)} role="tab" aria-selected={selectedDay === day.id}>
              <span className="day-number">{String(day.id).padStart(2, "0")}</span><span className="day-tab-title">{day.title.replace(" · ", " / ")}</span>
            </button>
          ))}
        </div>

        <div className="map-layout">
          <div className="map-panel">
            <MapView places={visiblePlaces} routePlaces={routePlaces} days={days} selectedDay={selectedDay} selectedPlaceId={selectedPlaceId} onSelectPlace={selectPlace} />
            <div className="map-legend">
              {days.map((day) => <span key={day.id}><i style={{ backgroundColor: day.color }} />D{day.id}</span>)}
            </div>
            <div className="map-caption"><span>⌖</span> 完整日程按天连线并用箭头指向下一站；搜索 / 分类只隐藏标记，不会把不相邻地点重新连线</div>
          </div>
          <aside className="filter-panel">
            <div className="filter-head"><span>筛选标签</span><button onClick={() => { setCategoryFilter("all"); setSearch(""); }}>清除</button></div>
            <div className="category-filters">
              {(Object.keys(CATEGORY_META) as Array<PlaceCategory | "all">).map((category) => (
                <button key={category} className={`category-chip ${categoryFilter === category ? "is-active" : ""}`} onClick={() => setCategoryFilter(category)}>
                  <span>{CATEGORY_META[category].icon}</span>{CATEGORY_META[category].label}
                </button>
              ))}
            </div>
            <div className="filter-divider" />
            <div className="stats-mini"><div><strong>{visiblePlaces.length}</strong><span>当前地点</span></div><div><strong>{new Set(visiblePlaces.map((place) => place.area)).size}</strong><span>覆盖区域</span></div></div>
            <div className="helper-note"><span>✦</span><p>每个地点都能编辑。把你们临时发现的小店也加进来，分享链接会同步这份地图。</p></div>
            <details className="place-manager">
              <summary><span>地点管理</span><b>{visiblePlaces.length} 个地点</b></summary>
              <div className="place-manager-list">
                {visiblePlaces.map((place) => (
                  <div className="place-manager-row" key={place.id}>
                    <button type="button" className="place-manager-name" onClick={() => selectPlace(place.id)}><strong>{place.title}</strong><small>{categoryLabel(place.category)} · D{place.day}</small></button>
                    <div><button type="button" onClick={() => openEdit(place)}>编辑</button><button type="button" onClick={() => deletePlace(place)}>删除</button></div>
                  </div>
                ))}
                {!visiblePlaces.length && <p className="place-manager-empty">当前筛选没有地点。</p>}
              </div>
            </details>
            <button className="reset-button" onClick={resetTrip}>恢复示例路线</button>
          </aside>
        </div>
      </section>

      <section className="nearby-card" id="nearby">
        <div className="nearby-heading">
          <div>
            <p className="section-label">NEARBY PICKS / 周边候选</p>
            <h2>先把想去的地方勾出来，再做取舍。</h2>
            <p className="expansion-intro">我按小红书站内搜索整理了东京、大阪、京都、富士山周边的候选点，并补了一组 Chiikawa 门店、角色街和快闪检索。勾选只是“想去 / 保留”，不会自动改动你们现在的小时行程；删除只会移出候选池，最后确定后再加入地图和具体日期。Chiikawa 的库存、整理券、营业时间和快闪日期，出发前请再点来源页核对。</p>
          </div>
          <div className="nearby-heading-actions">
            <span className="muted">{checkedNearbyCount} / {nearbyCandidates.length} 个已勾选</span>
            <button type="button" className="button button-ghost" onClick={restoreNearbyCandidates}>恢复默认候选</button>
          </div>
        </div>
        <div className="nearby-toolbar">
          <div className="nearby-region-tabs" role="tablist" aria-label="周边候选地区">
            <button type="button" className={nearbyRegion === "all" ? "is-active" : ""} onClick={() => setNearbyRegion("all")} role="tab" aria-selected={nearbyRegion === "all"}>全部</button>
            {(["东京", "大阪", "京都", "富士山"] as NearbyRegion[]).map((region) => (
              <button type="button" key={region} className={nearbyRegion === region ? "is-active" : ""} onClick={() => setNearbyRegion(region)} role="tab" aria-selected={nearbyRegion === region}>{region}</button>
            ))}
          </div>
          <span className="nearby-toolbar-note">来源：小红书站内搜索结果 · Chiikawa 条目优先看当天规则 · 先看距离，再决定替换哪一段主线</span>
        </div>
        <div className="nearby-grid">
          {visibleNearbyCandidates.map((candidate) => (
            <article className={`nearby-item ${candidate.checked ? "is-picked" : ""}`} key={candidate.id}>
              <div className="nearby-item-top"><span className="nearby-region-badge">{candidate.region}</span><button type="button" className="nearby-delete" aria-label={`删除${candidate.title}`} onClick={() => deleteNearbyCandidate(candidate)}>删除</button></div>
              <label className="nearby-pick-label">
                <input type="checkbox" checked={Boolean(candidate.checked)} onChange={() => toggleNearbyCandidate(candidate.id)} />
                <span className="nearby-check-box" aria-hidden="true">{candidate.checked ? "✓" : ""}</span>
                <span>{candidate.checked ? "已选：想去" : "想去吗？"}</span>
              </label>
              <h3>{candidate.title}</h3>
              <div className="nearby-meta"><span>{candidate.area}</span><span>{candidate.distance}</span></div>
              <p>{candidate.note}</p>
              <div className="nearby-source">
                <span>小红书检索参考</span>
                <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">{candidate.sourceTitle} ↗</a>
                <small>{candidate.sourceAuthor} · ID {candidate.sourceNoteId}</small>
              </div>
            </article>
          ))}
          {!visibleNearbyCandidates.length && <div className="nearby-empty">这一组候选都被删除了。点击右上角“恢复默认候选”，可以重新加载搜索结果。</div>}
        </div>
      </section>

      <section className="personal-plan-card" id="personal-plan">
        <div className="personal-plan-heading">
          <div>
            <p className="section-label">YOUR LEDGER / 我的行程清单</p>
            <h2>把你们的真实清单，按预算和每天路线放在一起。</h2>
            <p className="expansion-intro">以下内容按你提供的“大阪25 → 京都1”原稿录入。它和当前网页的 8/30–9/5 航班主线日期不一致，所以先作为并行备忘，不会自动覆盖主线小时攻略；等你确认日期后，再把需要的项目放回主线。金额保留你输入的原数字，未擅自判断币种或做汇率换算。</p>
          </div>
          <span className="personal-plan-badge">可勾选 · 自动保存 · 可导出分享</span>
        </div>
        <div className="personal-plan-summary">
          <div className="personal-plan-stat"><span>已记录金额</span><strong>{recordedPersonalTotal.toLocaleString("zh-CN")}</strong><small>不含待安排预算</small></div>
          <div className="personal-plan-stat"><span>待安排金额</span><strong>{plannedPersonalTotal.toLocaleString("zh-CN")}</strong><small>海洋馆 + 天王寺MIO券</small></div>
          <div className="personal-plan-stat"><span>费用已核对</span><strong>{checkedPersonalExpenseCount}<small> / {personalExpenses.length}</small></strong><small>点每行可取消勾选</small></div>
          <div className="personal-plan-stat"><span>路线已勾选</span><strong>{checkedPersonalRouteCount}<small> / {personalRouteTotal}</small></strong><small>含原稿中已打勾项目</small></div>
        </div>

        <div className="personal-plan-columns">
          <div className="personal-plan-panel personal-expense-panel">
            <div className="personal-panel-head"><div><span className="option-kicker">EXPENSES / 费用</span><h3>预算与已发生花费</h3></div><span className="muted">原金额记录</span></div>
            {Array.from(new Set(personalExpenses.map((expense) => expense.group))).map((group) => (
              <div className="personal-expense-group" key={group}>
                <div className="personal-group-label"><span>{group}</span><strong>{personalExpenses.filter((expense) => expense.group === group).reduce((total, expense) => total + expense.amount, 0).toLocaleString("zh-CN")}</strong></div>
                <div className="personal-expense-list">
                  {personalExpenses.filter((expense) => expense.group === group).map((expense) => (
                    <label className={`personal-check-row ${expense.checked ? "is-done" : ""}`} key={expense.id}>
                      <input type="checkbox" checked={Boolean(expense.checked)} onChange={() => togglePersonalExpense(expense.id)} />
                      <span className="personal-check-box" aria-hidden="true">{expense.checked ? "✓" : ""}</span>
                      <span className="personal-check-copy"><strong>{expense.label}</strong><small>{expense.dayLabel ?? expense.note ?? (expense.planned ? "待安排" : "已记录")}</small></span>
                      <b className={expense.planned ? "is-planned" : ""}>{expense.amount.toLocaleString("zh-CN")}</b>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="personal-plan-panel personal-task-panel">
            <div className="personal-panel-head"><div><span className="option-kicker">CHECKLIST / 待办</span><h3>购物、交通、门票和想吃的</h3></div><span className="muted">{checkedPersonalTaskCount} / {personalTasks.length} 已完成</span></div>
            {Array.from(new Set(personalTasks.map((task) => task.group))).map((group) => (
              <div className="personal-task-group" key={group}>
                <div className="personal-group-label"><span>{group}</span><strong>{personalTasks.filter((task) => task.group === group && task.checked).length}/{personalTasks.filter((task) => task.group === group).length}</strong></div>
                <div className="personal-task-list">
                  {personalTasks.filter((task) => task.group === group).map((task) => (
                    <label className={`personal-check-row ${task.checked ? "is-done" : ""}`} key={task.id}>
                      <input type="checkbox" checked={Boolean(task.checked)} onChange={() => togglePersonalTask(task.id)} />
                      <span className="personal-check-box" aria-hidden="true">{task.checked ? "✓" : ""}</span>
                      <span className="personal-check-copy"><strong>{task.title}</strong>{task.detail && <small>{task.detail}</small>}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="personal-route-panel">
          <div className="personal-panel-head personal-route-head"><div><span className="option-kicker">DAY NOTES / 每日原稿</span><h3>按天查看详细路线，逐项勾选</h3></div><span className="muted">原稿中的 [x] 已预先标记</span></div>
          <div className="personal-day-tabs" role="tablist" aria-label="我的行程清单日期">
            <button type="button" className={personalDayFilter === "all" ? "is-active" : ""} onClick={() => setPersonalDayFilter("all")}>全部</button>
            {personalDays.map((day) => <button type="button" className={personalDayFilter === day.id ? "is-active" : ""} key={day.id} onClick={() => setPersonalDayFilter(day.id)}>{day.label}</button>)}
          </div>
          <div className="personal-day-grid">
            {visiblePersonalDays.map((day) => (
              <article className="personal-day-card" key={day.id}>
                <div className="personal-day-card-head"><div><span>{day.label}</span><h4>{day.title}</h4></div><strong>{day.items.filter((item) => item.checked).length}/{day.items.length}</strong></div>
                {day.note && <p className="personal-day-note">{day.note}</p>}
                <div className="personal-route-list">
                  {day.items.map((item) => (
                    <label className={`personal-route-item ${item.checked ? "is-done" : ""}`} key={item.id}>
                      <input type="checkbox" checked={Boolean(item.checked)} onChange={() => togglePersonalRouteItem(day.id, item.id)} />
                      <span className="personal-check-box" aria-hidden="true">{item.checked ? "✓" : ""}</span>
                      <span className="personal-route-copy"><span className="personal-route-top"><time>{item.time ?? ""}</time><strong>{item.title}</strong>{item.tag && <em>{item.tag}</em>}</span>{item.detail && <small>{item.detail}</small>}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="planner-expansion">
        <section className="lodging-card" id="stays">
          <div className="expansion-heading">
            <div>
              <p className="section-label">STAY / 住宿节奏</p>
              <h2>住宿按你的真实订单来写。</h2>
            </div>
            <div className="stay-heading-actions">
              <span className="muted">可新增、编辑、删除</span>
              <button type="button" className="button button-accent" onClick={() => openStayCreate()}>＋ 添加住宿</button>
            </div>
          </div>
          <p className="expansion-intro">下面只是按路线生成的住宿占位，不代表你必须住这些区域或酒店。把你实际订到的酒店名称、区域、价格、入住 / 退房和寄存规则写进来；住宿安排会跟网页的本地保存、导出和分享链接一起带走。</p>
          <div className="lodging-grid">
            <div className="stay-timeline">
              {stayPlans.map((plan) => (
                <div className="stay-row" key={plan.id}>
                  <button
                    type="button"
                    className="stay-row-main"
                    onClick={() => {
                      setSelectedDay("all");
                      setCategoryFilter("all");
                      setSearch("");
                      if (plan.placeId) {
                        setSelectedPlaceId(plan.placeId);
                      } else {
                        setSelectedPlaceId(null);
                        setToast("这条住宿还没有绑定地图地点");
                      }
                    }}
                  >
                    <span className="stay-day" style={{ "--stay-color": dayFor(plan.day).color } as CSSProperties}>D{plan.day}</span>
                    <span className="stay-copy"><strong>{plan.title}</strong><small>{plan.area} · {plan.note}</small></span>
                    <span className="stay-arrow" aria-hidden="true">{plan.placeId ? "⌖" : "·"}</span>
                  </button>
                  <span className="stay-price">{plan.price}</span>
                  <div className="stay-actions">
                    <button type="button" onClick={() => openStayEdit(plan)}>编辑</button>
                    <button type="button" onClick={() => deleteStay(plan)}>删除</button>
                  </div>
                </div>
              ))}
              {!stayPlans.length && <div className="stay-empty">还没有住宿安排，点击右上角添加第一条。</div>}
            </div>
            <aside className="stay-guidance">
              <span className="option-kicker">CUSTOM STAY / 自定义</span>
              <h3>把你订好的住宿填进来</h3>
              <p>每条住宿可以单独改名、改区域、改价格和备注；如果在地图里新增了“住”地点，还能在编辑时把它关联起来。</p>
              <div className="stay-guidance-rule"><b>入住</b><span>常见 15:00 左右，提前入住看房态。</span></div>
              <div className="stay-guidance-rule"><b>退房</b><span>常见 10:00 左右，具体以订单为准。</span></div>
              <div className="stay-guidance-rule"><b>寄存</b><span>先问前台是否能提前收箱或退房后寄存。</span></div>
              <button type="button" className="text-button stay-restore" onClick={restoreStayPlans}>恢复示例住宿</button>
            </aside>
          </div>
        </section>

        <section className="food-card" id="food">
          <div className="expansion-heading">
            <div>
              <p className="section-label">EAT / 美食清单</p>
              <h2>先收藏，再决定这一餐吃什么。</h2>
            </div>
            <div className="food-heading-actions">
              <span className="muted">{selectedDay === "all" ? "全程清单" : `Day ${selectedDay} · 当前日`}</span>
              <button type="button" className="button button-accent" onClick={() => openCreate(selectedDay === "all" ? 1 : (selectedDay as DayId), "food")}>＋ 添加美食</button>
            </div>
          </div>
          <p className="expansion-intro">清单里的每一项都和地图相连：点击名称定位，点击圆点打卡。价格按人均粗估，临近出发再看营业日、预约和菜单。</p>
          <div className="food-layout">
            <div className="food-list">
              {foodPlaces.map((place) => (
                <div className={`food-item ${place.checked ? "is-done" : ""}`} key={place.id}>
                  <button
                    type="button"
                    className="food-check"
                    aria-label={`${place.checked ? "取消" : "标记"}${place.title}`}
                    aria-pressed={Boolean(place.checked)}
                    onClick={() => toggleFoodChecked(place.id)}
                  >
                    {place.checked ? "✓" : "○"}
                  </button>
                  <button type="button" className="food-copy" onClick={() => selectPlace(place.id)}>
                    <span className="food-item-head"><strong>{place.title}</strong><em>{place.meal ?? "随时"}</em></span>
                    <span className="food-location">D{place.day} · {place.area}</span>
                    <p>{place.foodNote ?? place.note}</p>
                  </button>
                  <span className="food-price">{place.price ?? "价格待补"}</span>
                  <button type="button" className="food-delete" aria-label={`删除${place.title}`} onClick={() => deletePlace(place)}>删除</button>
                </div>
              ))}
              {!foodPlaces.length && <div className="food-empty">这一天还没有美食清单，切回“全部”查看全程候选。</div>}
            </div>
            <aside className="food-side-note">
              <div className="food-progress"><strong>{checkedFoodCount}<small>/{foodPlaces.length}</small></strong><span>已收藏 / 打卡</span></div>
              <div className="progress-track"><i style={{ width: `${foodPlaces.length ? (checkedFoodCount / foodPlaces.length) * 100 : 0}%` }} /></div>
              <p>你们可以先把想吃的勾出来，再用上面的 Day 标签收窄地图和清单，避免每天临时搜索。</p>
              <div className="food-rule"><b>你</b><span>熟食优先；鱼汤、酱汁、鲑鱼和交叉污染都要问。</span></div>
              <div className="food-rule"><b>她</b><span>寿司 / 刺身可以单独安排，但不要共用餐具或不明汤底。</span></div>
              <a className="food-source" href="https://www.tsukiji.or.jp/english/shopping/" target="_blank" rel="noreferrer">筑地官方提示：多数店 9:00–14:00，部分周日 / 周三休息 ↗</a>
            </aside>
          </div>
        </section>
      </section>

      <section className="departure-checklist-card" id="checklist">
        <div className="checklist-heading">
          <div>
            <p className="section-label">BEFORE YOU GO / 出发前清单</p>
            <h2>把护照、裤子、充电器和流量卡，一项项打勾。</h2>
            <p className="expansion-intro">这份清单按你们 8/30–9/5 的 7 天东京—富士山—京都—奈良—大阪路线整理：先合并小红书多篇行前清单，再补上日本官方的入境、海关、药品、插座、天气和行李资料。每一项都能勾选，勾选状态会随本地保存、导出和分享链接带走。</p>
          </div>
          <div className="checklist-score"><strong>{checkedChecklistCount}</strong><span>/ {checklistItems.length} 项已完成</span><i><b style={{ width: `${checklistItems.length ? (checkedChecklistCount / checklistItems.length) * 100 : 0}%` }} /></i></div>
        </div>
        <div className="checklist-toolbar">
          <span>优先处理标有“必做”的项目；“建议 / 按需”可以按行李空间取舍。</span>
          <div><button type="button" className="text-button" onClick={() => markChecklist(true)}>全部勾选</button><button type="button" className="text-button" onClick={() => markChecklist(false)}>清空勾选</button></div>
        </div>
        <div className="checklist-groups">
          {PRE_DEPARTURE_GROUPS.map((group) => {
            const groupDone = group.items.filter((item) => preDepartureChecklist[item.id]).length;
            return (
              <article className="checklist-group" key={group.id}>
                <div className="checklist-group-top"><span>{group.kicker}</span><strong>{groupDone}/{group.items.length}</strong></div>
                <h3>{group.title}</h3>
                <p className="checklist-group-note">{group.note}</p>
                <div className="checklist-items">
                  {group.items.map((item) => {
                    const checked = Boolean(preDepartureChecklist[item.id]);
                    return (
                      <button type="button" className={`checklist-item ${checked ? "is-done" : ""}`} key={item.id} aria-pressed={checked} onClick={() => toggleChecklistItem(item.id)}>
                        <span className="checklist-box" aria-hidden="true">{checked ? "✓" : ""}</span>
                        <span className="checklist-item-copy"><span><strong>{item.title}</strong>{item.priority && <em className={`checklist-priority priority-${item.priority === "必做" ? "must" : item.priority === "建议" ? "suggest" : "optional"}`}>{item.priority}</em>}</span><small><b>{item.timing}</b>{item.detail}</small></span>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
        <div className="checklist-sources" id="sources">
          <div className="checklist-sources-head">
            <div><p className="section-label">SOURCE CHECK / 来源核对</p><h3>这份清单参考了哪些小红书笔记？</h3></div>
            <span>小红书站内搜索 · 行前准备</span>
          </div>
          <p className="checklist-source-intro">下面保留笔记标题、作者和笔记 ID，方便你们手机打开原文复核。小红书内容是经验参考，套餐价格、入境规则、药品和天气请以右侧官方页面为准。</p>
          <div className="checklist-source-grid">
            {CHECKLIST_SOURCES.map((source) => (
              <a className="checklist-source-card" href={source.link} target="_blank" rel="noreferrer" key={source.noteId}>
                <span className="checklist-source-badge">小红书笔记</span>
                <strong>{source.title}</strong>
                <small>{source.author} · ID {source.noteId}</small>
                <p>{source.summary}</p>
                <em>打开原笔记 ↗</em>
              </a>
            ))}
          </div>
          <div className="checklist-official">
            <span>官方核对入口</span>
            <div>{CHECKLIST_OFFICIAL_SOURCES.map((source) => <a href={source.href} target="_blank" rel="noreferrer" key={source.href}><b>{source.label}</b>{source.title} ↗</a>)}</div>
          </div>
        </div>
      </section>

      <section className="language-card" id="language">
        <div className="expansion-heading">
          <div>
            <p className="section-label">MONEY & LANGUAGE / 现金与语言</p>
            <h2>现金别带过量，日语先准备能用的。</h2>
          </div>
          <span className="muted">两个人 · 7 天 6 晚 · 东京进大阪出</span>
        </div>
        <p className="expansion-intro">现金金额是结合你们路线和支付习惯的旅行估算；口语是现场备用工具，不要求临时学会完整日语。遇到付款、过敏或紧急情况，优先展示日文文字和官方信息。</p>
        <div className="language-overview-grid">
          <article className="cash-plan">
            <div className="cash-plan-head"><span className="option-kicker">CASH PLAN / 现金估算</span><span>两人合计</span></div>
            <div className="cash-amount">¥40,000–50,000</div>
            <p>建议先换 / 取这一区间，分给两个人保管；每天随身约 ¥10,000–15,000 / 人，其余作为备用。若会逛市场、神社、现金小店或频繁充值 IC 卡，再补到 ¥60,000–70,000。</p>
            <div className="cash-rules">
              <div><b>刷卡</b><span>酒店、百货、Chiikawa 大额购物和多数城市餐厅优先用 Visa / Mastercard / JCB。</span></div>
              <div><b>IC 卡</b><span>东京与关西交通、便利店和自动售货机常用；充值仍要留意部分机器只收现金。</span></div>
              <div><b>现金</b><span>市场、小店、神社、部分机器和偏远地点的备用通道；硬币袋一定要带。</span></div>
              <div><b>取现</b><span>带两张不同渠道的卡；7-Eleven / Seven Bank 和 Japan Post ATM 可作为补给点，手续费看发卡行和 ATM。</span></div>
            </div>
            <p className="cash-warning">微信支付：现在日本“部分”商户可以用，但绝不是所有店都能用。PayPay 已把 WeChat Pay 接入部分使用 HIVEX 的商户二维码，付款前先看标识、问店员；不要把微信支付当唯一方案。</p>
            <div className="language-source-links">
              <a href="https://about.paypay.ne.jp/pr/20250904/01/" target="_blank" rel="noreferrer">PayPay 官方：WeChat Pay 接入说明 ↗</a>
              <a href="https://www.japan.travel/en/plan/cashless-payments-in-japan/" target="_blank" rel="noreferrer">JNTO：日本无现金支付与 IC 卡 ↗</a>
              <a href="https://www.sevenbank.co.jp/intlcard/card.html" target="_blank" rel="noreferrer">Seven Bank：海外发行卡取现说明 ↗</a>
            </div>
          </article>
          <article className="language-guidance">
            <div className="language-guidance-head"><span className="option-kicker">WHEN WORDS FAIL / 沟通备份</span><strong>真到了日本，按这几步处理</strong></div>
            <ol>
              <li><b>先出示文字：</b>酒店日文地址、车站名、订单截图、过敏卡都提前保存；不会读也没关系，工作人员看得懂文字和地图。</li>
              <li><b>翻译工具双保险：</b>两台手机都装翻译 App，下载日语离线包并测试相机翻译；一台开口说，一台展示译文。</li>
              <li><b>交通只问一个动作：</b>说清“我要去哪里”，再把地图定位给站员看；优先找机场、车站和游客中心的工作人员，不要只靠路人比划。</li>
              <li><b>过敏不能靠猜：</b>如果同行者有食物过敏，点餐前先展示下面的日文过敏句；鱼介、柴鱼粉、鱼介出汁和共用锅不确定就不吃，药物也不能替代避让和确认。</li>
              <li><b>真的卡住时：</b>JNTO Japan Visitor Hotline <strong>050-3816-2787</strong>（24 小时、中英韩）；警察 <strong>110</strong>，火灾 / 救护车 <strong>119</strong>。</li>
            </ol>
            <div className="language-official-links">
              <a href="https://www.japan.travel/en/plan/hotline/" target="_blank" rel="noreferrer">JNTO Japan Visitor Hotline ↗</a>
              <a href="https://www.jnto.go.jp/news/press/20260313.html" target="_blank" rel="noreferrer">JNTO 2026 多语言观光咨询 ↗</a>
            </div>
          </article>
        </div>
        <div className="language-phrases-head">
          <div><p className="section-label">USEFUL JAPANESE / 常用日语口语</p><h3>先看日文，再用读法和空耳开口。</h3></div>
          <span>空耳只作记忆提示，关键事项请展示日文原句</span>
        </div>
        <div className="language-phrase-grid">
          {LANGUAGE_PHRASES.map((phrase, index) => (
            <article className="language-phrase" key={`${phrase.jp}-${index}`}>
              <div className="language-phrase-top"><span>{phrase.scene}</span><strong>{phrase.zh}</strong></div>
              <p className="language-japanese">{phrase.jp}</p>
              <div className="language-reading"><span>读法</span><code>{phrase.read}</code></div>
              <div className="language-reading language-ear"><span>空耳</span><b>{phrase.ear}</b></div>
              <p className="language-use">{phrase.use}</p>
            </article>
          ))}
        </div>
        <div className="language-xhs-sources">
          <span>本模块的小红书检索参考</span>
          <a href="https://www.xiaohongshu.com/explore/6a4128b9000000001102e456" target="_blank" rel="noreferrer">日本旅游场景200句 · 一小时听日文 ↗</a>
          <a href="https://www.xiaohongshu.com/explore/6a7891d7000000002500d1a4" target="_blank" rel="noreferrer">不会日语也能玩转日本 · 虾兵 ↗</a>
          <a href="https://www.xiaohongshu.com/explore/69e1f5b4000000002102c867" target="_blank" rel="noreferrer">不会日语勇闯日本 · 游山玩水小吗喽 ↗</a>
          <a href="https://www.xiaohongshu.com/explore/6a60630f000000001f01d332" target="_blank" rel="noreferrer">在日本可以用微信支付了？ · 小夏老师 ↗</a>
        </div>
      </section>

      <section className="hourly-card" id="hourly">
        <div className="expansion-heading">
          <div>
            <p className="section-label">HOUR BY HOUR / 小时级攻略</p>
            <h2>把每一天拆成能执行的节奏。</h2>
          </div>
          <span className="muted">点击时间段可联动地图</span>
        </div>
        <p className="expansion-intro">这是“主线 + 可删减点”的版本：有些时间是交通和排队缓冲，不建议把它们全部挤掉。Day 3 富士山最看天气与返程班次，Day 7 最看航班。</p>
        <div className="hourly-list">
          {HOURLY_PLANS.filter((plan) => selectedDay === "all" || plan.day === selectedDay).map((plan) => (
            <article className="hourly-day" key={plan.day} style={{ "--day-color": dayFor(plan.day).color } as CSSProperties}>
              <div className="hourly-day-head">
                <div>
                  <span className="hourly-day-number">D{String(plan.day).padStart(2, "0")}</span>
                  <h3>{plan.title}</h3>
                </div>
                <span className="hourly-distance">{plan.distance}</span>
              </div>
              <p className="hourly-summary">{plan.summary}</p>
              <div className="hourly-items">
                {plan.items.map((item) => (
                  <button type="button" className={`hourly-item ${item.placeId ? "is-link" : ""}`} key={`${plan.day}-${item.time}-${item.title}`} onClick={() => focusScheduleItem(plan, item)}>
                    <span className="hourly-time">{item.time}</span>
                    <span className="hourly-item-body">
                      <span className="hourly-item-title"><strong>{item.title}</strong>{item.tag && <em>{item.tag}</em>}</span>
                      <span className="hourly-detail">{item.detail}</span>
                      <span className="hourly-meta"><span>{item.area}</span>{item.price && <span>{item.price}</span>}{item.placeId && <span className="hourly-map-link">地图定位 ↗</span>}</span>
                    </span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="xiaohongshu-board" id="xhs-board">
        <div className="xhs-board-head">
          <div>
            <p className="section-label">RED NOTE / 小红书分享</p>
            <h2>把想看的攻略，集中放在这里。</h2>
            <p>这里集中放路线与行前小红书笔记；你还可以继续粘贴自己的收藏。链接会和地点、打卡状态、出发前清单一起保存在浏览器，也会随导出文件和分享行程带走。</p>
          </div>
          <span className="xhs-board-count">{xiaohongshuLinks.length} 条链接</span>
        </div>
        <div className="xhs-board-layout">
          <form className="xhs-add-form" onSubmit={addXiaohongshuLink}>
            <div className="xhs-form-title"><span>＋</span><strong>添加一篇小红书</strong></div>
            <label>小红书链接<input type="text" inputMode="url" autoComplete="url" spellCheck={false} value={xhsUrlDraft} onChange={(event) => handleXiaohongshuInputChange(event.target.value)} placeholder="粘贴手机端整段分享文案或链接" required /></label>
            <label>标题 <span className="optional">（可选，整段文案会自动提取）</span><input value={xhsTitleDraft} onChange={(event) => { xhsAutoTitleRef.current = ""; setXhsTitleDraft(event.target.value); }} placeholder="例如：东京 Chiikawa 扫货路线" /></label>
            <label>你的备注 <span className="optional">（可选）</span><textarea value={xhsNoteDraft} onChange={(event) => setXhsNoteDraft(event.target.value)} placeholder="写下想吸收的点、适合哪一天或需要核对的事项" rows={4} /></label>
            <button type="submit" className="button button-dark">加入分享板块 ↗</button>
            <small>手机端可直接粘贴“标题 + 链接 + 複製後開啟小紅書查看筆記”整段文案，系统会自动提取链接和前面的标题。支持 xiaohongshu.com / xhslink.com / xhslink.cn；只保存链接和你的备注，不会代你发布内容。</small>
          </form>
          <div className="xhs-share-list">
            {xiaohongshuLinks.map((item) => (
              <article className="xhs-share-card" key={item.id}>
                <div className="xhs-share-card-top">
                  <span>{item.source === "user" ? "我的收藏" : item.sourceRef === "小红书站内搜索结果" ? "小红书搜索摘要" : "小红书笔记"}</span>
                  {item.source === "user" && <button type="button" className="xhs-delete" onClick={() => removeXiaohongshuLink(item.id)}>移除</button>}
                </div>
                <h3>{item.title}</h3>
                {item.author && <small className="xhs-author">作者：{item.author}</small>}
                <p>{item.note}</p>
                <a href={item.url} target="_blank" rel="noreferrer">打开原笔记 ↗</a>
              </article>
            ))}
            {!xiaohongshuLinks.length && <div className="xhs-empty">还没有收藏的笔记，先从左侧加入一条链接。</div>}
          </div>
        </div>
      </section>

      <footer className="footer-strip"><span>东京 3 晚 + 京都 2 晚 + 大阪 1 晚 · 两次换酒店</span><span>08/30 PVG → HND · 09/05 19:30 KIX → PVG</span><span>Made for two ↗</span></footer>
      <a className="back-to-top" href="#top" aria-label="返回顶部" title="返回顶部">↑</a>

      {editorOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
        <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
          <div className="editor-head"><div><p className="section-label">地点管理 / CRUD</p><h2 id="editor-title">{editingId ? "编辑地点" : "新增地点"}</h2></div><button className="close-button" onClick={closeEditor} aria-label="关闭">×</button></div>
          <form onSubmit={submitPlace}>
            <div className="form-grid form-grid-wide"><label>地点名称<input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="例如：代官山咖啡店" required /></label><label>区域<input value={draft.area} onChange={(event) => updateDraft("area", event.target.value)} placeholder="例如：代官山" required /></label></div>
            <div className="form-grid"><label>归属日<select value={draft.day} onChange={(event) => updateDraft("day", Number(event.target.value) as DayId)}>{days.map((day) => <option value={day.id} key={day.id}>Day {day.id} · {day.title}</option>)}</select></label><label>类型<select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as PlaceCategory)}>{(Object.keys(CATEGORY_META) as Array<PlaceCategory | "all">).filter((category): category is PlaceCategory => category !== "all").map((category) => <option value={category} key={category}>{CATEGORY_META[category].label}</option>)}</select></label></div>
            <div className="form-grid"><label>纬度<input type="number" step="any" value={draft.lat} onChange={(event) => updateDraft("lat", Number(event.target.value))} required /></label><label>经度<input type="number" step="any" value={draft.lng} onChange={(event) => updateDraft("lng", Number(event.target.value))} required /></label></div>
            <label>备注<textarea value={draft.note} onChange={(event) => updateDraft("note", event.target.value)} placeholder="写下预约、过敏、营业时间或你们自己的提醒" rows={3} /></label>
            <label>参考链接 <span className="optional">（可选）</span><input type="url" value={draft.link ?? ""} onChange={(event) => updateDraft("link", event.target.value)} placeholder="https://…" /></label>
            <div className="editor-footer"><span>颜色会跟随 Day {draft.day}：<i style={{ backgroundColor: dayFor(draft.day).color }} /></span><div><button type="button" className="button button-ghost" onClick={closeEditor}>取消</button><button type="submit" className="button button-dark">保存地点</button></div></div>
          </form>
        </section>
      </div>}

      {stayEditorOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeStayEditor(); }}>
        <section className="editor-modal stay-editor-modal" role="dialog" aria-modal="true" aria-labelledby="stay-editor-title">
          <div className="editor-head"><div><p className="section-label">住宿管理 / CUSTOM STAY</p><h2 id="stay-editor-title">{editingStayId ? "编辑住宿安排" : "新增住宿安排"}</h2></div><button type="button" className="close-button" onClick={closeStayEditor} aria-label="关闭">×</button></div>
          <form onSubmit={submitStay}>
            <div className="form-grid form-grid-wide"><label>住宿名称<input value={stayDraft.title} onChange={(event) => updateStayDraft("title", event.target.value)} placeholder="例如：上野站旁的酒店 / 河口湖温泉旅馆" required /></label><label>归属日<select value={stayDraft.day} onChange={(event) => updateStayDraft("day", Number(event.target.value) as DayId)}>{days.map((day) => <option value={day.id} key={day.id}>Day {day.id} · {day.title}</option>)}</select></label></div>
            <div className="form-grid"><label>区域或地址<input value={stayDraft.area} onChange={(event) => updateStayDraft("area", event.target.value)} placeholder="例如：上野御徒町，距车站 5 分钟" required /></label><label>价格<input value={stayDraft.price} onChange={(event) => updateStayDraft("price", event.target.value)} placeholder="例如：¥18,000 / 晚" /></label></div>
            <label>入住 / 退房 / 寄存备注<textarea value={stayDraft.note} onChange={(event) => updateStayDraft("note", event.target.value)} placeholder="例如：15:00 入住，10:00 退房；可提前寄存；已含早餐" rows={4} /></label>
            <label>关联地图住宿点 <span className="optional">（可选）</span><select value={stayDraft.placeId ?? ""} onChange={(event) => updateStayDraft("placeId", event.target.value || undefined)}><option value="">不关联地图地点</option>{places.filter((place) => place.category === "stay").map((place) => <option value={place.id} key={place.id}>D{place.day} · {place.title} · {place.area}</option>)}</select></label>
            <div className="editor-footer"><span>颜色会跟随 Day {stayDraft.day}：<i style={{ backgroundColor: dayFor(stayDraft.day).color }} /></span><div><button type="button" className="button button-ghost" onClick={closeStayEditor}>取消</button><button type="submit" className="button button-dark">保存住宿</button></div></div>
          </form>
        </section>
      </div>}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

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
import type { DayId, DayPlan, Place, PlaceCategory, TripState, XiaohongshuShare } from "./types";

const MapView = dynamic(() => import("./LeafletMap"), {
  loading: () => <div className="map-frame map-placeholder">地图正在准备…</div>,
});

const DAYS: DayPlan[] = [
  { id: 1, label: "DAY 01", title: "抵达东京 · 浅草入门", focus: "浅草 · 上野", color: "#df6b5f" },
  { id: 2, label: "DAY 02", title: "东京站 · 银座 · 秋叶原", focus: "Chiikawa · 银座 · 秋叶原", color: "#e29b42" },
  { id: 3, label: "DAY 03", title: "富士山 · 河口湖日归", focus: "河口湖 · 忠灵塔 / 大石公园", color: "#6e936a" },
  { id: 4, label: "DAY 04", title: "镰仓 · 江之岛海岸线", focus: "镰仓 · 江之岛", color: "#b66c85" },
  { id: 5, label: "DAY 05", title: "东京 → 京都 · 祇园夜色", focus: "新干线 · 锦市场 · 祇园", color: "#5488a0" },
  { id: 6, label: "DAY 06", title: "奈良鹿 · 京都古迹", focus: "奈良公园 · 东大寺 · 鴨川", color: "#6f8f62" },
  { id: 7, label: "DAY 07", title: "京都 → 大阪 · 夜食", focus: "大阪城 · 梅田 · 道顿堀", color: "#806d9c" },
  { id: 8, label: "DAY 08", title: "难波收尾 · 关西机场", focus: "难波八阪 · 最后采购 · KIX", color: "#bf7f4e" },
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
    note: "主方案连续住 4 晚；优先地铁或 JR 站步行圈，方便河口湖、镰仓与换城。",
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

PLACES.splice(0, PLACES.length, ...UPDATED_PLACES);

type StayPlan = {
  day: DayId;
  title: string;
  area: string;
  price: string;
  note: string;
  placeId: string;
};

const STAY_PLANS: StayPlan[] = [
  {
    day: 1,
    title: "东京基地：上野 / 浅草酒店",
    area: "建议住上野御徒町或浅草地铁站步行圈",
    price: "¥14,000–28,000 / 晚",
    note: "入住；主方案连续住 4 晚，减少第一段拖箱",
    placeId: "tokyo-base-stay",
  },
  {
    day: 2,
    title: "东京基地：上野 / 浅草酒店",
    area: "东京站 → 筑地 → 银座 → 秋叶原顺线",
    price: "¥14,000–28,000 / 晚",
    note: "第 2 晚；不再绕去晴空塔或丸之内，按一条线完成 Chiikawa、女友生鱼体验、银座和秋叶原",
    placeId: "tokyo-base-stay",
  },
  {
    day: 3,
    title: "东京基地：上野 / 浅草酒店",
    area: "轻装去河口湖，晚上回东京",
    price: "¥14,000–28,000 / 晚",
    note: "第 3 晚；富士山看天气，晚起版只带轻装",
    placeId: "tokyo-base-stay",
  },
  {
    day: 4,
    title: "东京基地：上野 / 浅草酒店",
    area: "镰仓、江之岛日归，晚上回东京",
    price: "¥14,000–28,000 / 晚",
    note: "第 4 晚；海岸线日归后回原酒店，避免多换一次房",
    placeId: "tokyo-base-stay",
  },
  {
    day: 5,
    title: "京都基地：四条乌丸 / 河原町酒店",
    area: "东京乘新干线到京都，入住后走锦市场与祇园",
    price: "¥16,000–30,000 / 晚",
    note: "第 1 晚；酒店集中在四条乌丸或河原町，减少京都内换乘",
    placeId: "kyoto-base-stay",
  },
  {
    day: 6,
    title: "京都基地：四条乌丸 / 河原町酒店",
    area: "奈良日归，晚上回京都",
    price: "¥16,000–30,000 / 晚",
    note: "第 2 晚；奈良只带轻装，回京都后不再换房",
    placeId: "kyoto-base-stay",
  },
  {
    day: 7,
    title: "大阪住宿：难波 / 心斋桥",
    area: "京都乘电车到大阪，入住后走大阪城与难波",
    price: "¥14,000–26,000 / 晚",
    note: "第 1 晚；这是全程第 2 次换酒店，换来大阪夜食和 KIX 动线",
    placeId: "osaka-namba-stay",
  },
  {
    day: 8,
    title: "大阪住宿 → 关西机场",
    area: "难波短线后前往 KIX",
    price: "已含第 7 晚；机场交通另计",
    note: "返程日；按 18:00 后航班安排，早班机改住临空城 / KIX 附近",
    placeId: "osaka-namba-stay",
  },
];

const STAY_OPTIONS = [
  {
    label: "预算优先",
    title: "上野御徒町商务酒店",
    price: "¥14,000–22,000 / 晚",
    total: "东京 4 晚约 ¥56,000–88,000",
    note: "JR、地铁和机场动线都顺，把预算留给吃、富士山巴士和 Chiikawa。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
  },
  {
    label: "平衡推荐",
    title: "京都四条乌丸 + 大阪难波",
    price: "京都 ¥16,000–30,000 / 晚；大阪 ¥14,000–26,000 / 晚",
    total: "京都 2 晚 + 大阪 1 晚约 ¥46,000–86,000",
    note: "两个关西基地都靠近交通节点；8 天只换两次酒店，最适合你们的晚起作息。",
    link: "https://kyoto.travel/en/",
  },
  {
    label: "温泉替换",
    title: "河口湖住 1 晚 + 日式温泉旅馆",
    price: "¥25,000–55,000 / 晚 / 两人",
    total: "把东京第 4 晚替换，酒店变为 3 次换城",
    note: "如果温泉优先于少换酒店，可把 D3 改为河口湖住一晚；主方案不采用，避免 8 天拖箱过多。",
    link: "https://www.japan.travel/en/destinations/kanto/yamanashi/fuji-five-lakes/",
  },
];

const TRIP_DATA_VERSION = 7;

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
      { time: "21:00–22:30", title: "泡脚、看天气、早点睡", detail: "富士山能见度不可控，不要为了‘没拍到’熬夜补救；为 Day 4 镰仓准备轻装。", area: "东京酒店", tag: "收尾" },
    ],
  },
  {
    day: 4,
    title: "镰仓 · 江之岛海岸线",
    summary: "东京 4 晚里的自然与古迹日归：镰仓寺院、江之电、七里滨和江之岛，按体力把大佛 / 长谷寺二选一。",
    distance: "约 11–15k 步 · 住东京",
    items: [
      { time: "09:00–10:00", title: "起床、早餐、准备轻装", detail: "带水、防晒、雨具和充电宝；当天不拖购物箱，晚上仍回东京基地。", area: "东京酒店", tag: "出发" },
      { time: "10:00–11:00", title: "上野 / 浅草 → 镰仓站", detail: "按 Google Maps 当天换乘；周末和雨天多留 15 分钟，不要卡死返程。", area: "东京 → 镰仓", price: "约 ¥2,000–3,000 / 两人往返", tag: "交通" },
      { time: "11:00–12:00", title: "镰仓站、小町通", detail: "先逛小町通并看午餐排队；人多时从主街侧巷绕行，不和人流硬挤。", area: "镰仓", placeId: "kamakura-station", tag: "散步" },
      { time: "12:00–13:00", title: "镰仓熟食午餐", detail: "豆腐、咖喱、烤物和定食优先；女友要海鲜就分开点单，你确认汤底和调味。", area: "小町通", placeId: "kamakura-food", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "13:00–14:30", title: "镰仓大佛 / 长谷寺（二选一深逛）", detail: "第一次建议大佛优先；若更喜欢庭院、海景与坡道就选长谷寺，别把两个点都赶完。", area: "长谷", placeId: "kotoku-in", tag: "古迹" },
      { time: "14:30–15:30", title: "七里滨海岸", detail: "看风力和天气停留 30–45 分钟；海边拍照注意台阶、浪和车辆，不站到危险位置。", area: "镰仓海岸", placeId: "shichirigahama", tag: "自然" },
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

HOURLY_PLANS.splice(0, HOURLY_PLANS.length, ...UPDATED_HOURLY_PLANS);

const RESEARCH_TIPS = [
  {
    label: "小红书笔记 01",
    sourceTitle: "日本8日「东进阪出」超全攻略✨",
    author: "A锦鲤🍯",
    noteId: "6a75d1e90000000006005aeb",
    title: "东京 → 镰仓 → 富士 → 京都 → 奈良 → 大阪",
    text: "正文按东京银座 / 秋叶原、镰仓江之岛、富士山、京都、奈良、大阪的顺序展开：东京文化与购物、镰仓海岸线、富士山机位、京都古迹、奈良公园和大阪城道顿堀都有具体落点。",
    decision: "吸收东进阪出的方向，并把镰仓、京都、奈良补进 8 天；原笔记节奏更像高密度参考，本网页保留 09:00 起床与 02:00 前睡的缓冲。",
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
    decision: "把 USJ 留为可替换日而非主线，保留其对现金、交通卡、防晒和 9 月体感的提醒；本次主线用镰仓和奈良的文化自然体验替代主题乐园。",
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
    usedIn: "路线取舍：D4 选择镰仓 / 江之岛，不增加伊豆换乘",
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
    decision: "把经典东山线拆成抵达日的锦市场—祇园和后续奈良日归后的鴨川收尾；不照搬需要清晨出门的版本，仍以你们 09:00 起床为边界。",
    usedIn: "D5 京都抵达日、D6 京都夜间收尾",
    link: "https://www.xiaohongshu.com/explore/6a7f15780000000032023f8d",
    linkText: "打开原笔记 ↗",
  },
];

const DEFAULT_XHS_SHARES: XiaohongshuShare[] = RESEARCH_TIPS.map((tip) => ({
  id: `researched-${tip.noteId}`,
  title: tip.sourceTitle,
  url: tip.link,
  note: `${tip.title}：${tip.decision}`,
  author: tip.author,
  source: "researched",
}));

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

function makeSnapshot(days: DayPlan[], places: Place[], xiaohongshuLinks: XiaohongshuShare[]): TripState {
  return { version: TRIP_DATA_VERSION, days, places, xiaohongshuLinks };
}

const XHS_HOSTS = new Set([
  "xiaohongshu.com",
  "www.xiaohongshu.com",
  "xhslink.com",
  "www.xhslink.com",
]);

function normalizeXiaohongshuUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !XHS_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.toString();
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
  const [xiaohongshuLinks, setXiaohongshuLinks] = useState<XiaohongshuShare[]>(DEFAULT_XHS_SHARES);
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaceDraft>(makeDraft());
  const [xhsUrlDraft, setXhsUrlDraft] = useState("");
  const [xhsTitleDraft, setXhsTitleDraft] = useState("");
  const [xhsNoteDraft, setXhsNoteDraft] = useState("");
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const importInput = useRef<HTMLInputElement | null>(null);

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
        setXiaohongshuLinks(Array.isArray(next.xiaohongshuLinks) ? next.xiaohongshuLinks : DEFAULT_XHS_SHARES);
        if (shared) setToast("已载入分享行程");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeSnapshot(days, places, xiaohongshuLinks)));
  }, [days, hydrated, places, xiaohongshuLinks]);

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

  const groupedPlaces = useMemo(
    () =>
      days.map((day) => ({
        day,
        places: visiblePlaces.filter((place) => place.day === day.id),
      })),
    [days, visiblePlaces],
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

  const toggleFoodChecked = (id: string) => {
    setPlaces((current) => current.map((place) => (
      place.id === id ? { ...place, checked: !place.checked } : place
    )));
  };

  const openCreate = (day: DayId = selectedDay === "all" ? 1 : (selectedDay as DayId)) => {
    setEditingId(null);
    setDraft(makeDraft(day));
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
    const url = normalizeXiaohongshuUrl(xhsUrlDraft);
    if (!url) {
      setToast("请粘贴有效的小红书链接（xiaohongshu.com 或 xhslink.com）");
      return;
    }

    const item: XiaohongshuShare = {
      id: `xhs-user-${Date.now()}`,
      title: xhsTitleDraft.trim() || "我的小红书攻略",
      url,
      note: xhsNoteDraft.trim() || "自己收藏的攻略，出发前再核对交通、营业时间与库存。",
      author: "你添加的链接",
      source: "user",
    };
    setXiaohongshuLinks((current) => [item, ...current]);
    setXhsUrlDraft("");
    setXhsTitleDraft("");
    setXhsNoteDraft("");
    setToast("小红书链接已加入分享板块");
  };

  const removeXiaohongshuLink = (id: string) => {
    setXiaohongshuLinks((current) => current.filter((item) => item.id !== id));
    setToast("已移除这条小红书链接");
  };

  const shareTrip = async () => {
    const url = `${window.location.origin}${window.location.pathname}#share=${encodeShare(makeSnapshot(days, places, xiaohongshuLinks))}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setToast("分享链接已复制，发给她即可在另一台设备打开");
    } catch {
      window.prompt("复制这条分享链接", url);
    }
  };

  const exportTrip = () => {
    const file = new Blob([JSON.stringify(makeSnapshot(days, places, xiaohongshuLinks), null, 2)], { type: "application/json" });
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
      setXiaohongshuLinks(Array.isArray(parsed.xiaohongshuLinks) ? parsed.xiaohongshuLinks : DEFAULT_XHS_SHARES);
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
    setXiaohongshuLinks(DEFAULT_XHS_SHARES);
    setSelectedDay("all");
    setCategoryFilter("all");
    setSearch("");
    setToast("已恢复日本 8 天示例路线");
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
    <main className="trip-app">
      <header className="topbar">
        <div className="brand-mark" aria-label="Two in Tokyo">2<span>in</span>JP</div>
        <div className="topbar-copy">
          <p className="eyebrow">TOKYO · FUJI · KAMAKURA · KYOTO · NARA · OSAKA / 2026.09</p>
          <span>两个人的 8 天 7 晚日本旅行</span>
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
          <h1>日本，<em>慢慢走。</em></h1>
          <p className="hero-subtitle">一份给两个人的 8 天地图计划：东京、富士山、镰仓、京都、奈良、大阪，按小时拆开，留出排队、天气和临场决定的余地。</p>
          <p className="routine-note">作息约束：09:00 起床起步 · 02:00 前睡 · 富士山采用晚起舒适版</p>
          <div className="trip-facts">
            <div><strong>8</strong><span>天 7 晚</span></div>
            <div><strong>2</strong><span>次换酒店</span></div>
            <div><strong>10–15k</strong><span>步 / 日</span></div>
            <div><strong>2.4w–3.3w</strong><span>两人预算</span></div>
          </div>
        </div>
        <div className="brief-card">
          <div className="brief-card-head"><span>ROUTE NOTE</span><span className="status-dot">● 已规划</span></div>
          <h2>东京 4 晚 + 京都 2 晚 + 大阪 1 晚</h2>
          <p>从上海优先看东京进、大阪出的开口航班；河口湖、镰仓都做日归，只换两次酒店，把时间留给富士山、Chiikawa、京都古迹和大阪夜食。</p>
          <div className="brief-lines">
            <div><span>出发</span><b>上海 PVG / SHA → 东京 HND / NRT</b></div>
            <div><span>返程</span><b>大阪难波 → 关西机场 KIX → 上海</b></div>
            <div><span>特别任务</span><b>东京站 Chiikawa、河口湖、镰仓、京都、奈良</b></div>
          </div>
        </div>
      </section>

      <section className="workspace-card">
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
          </aside>
        </div>
      </section>

      <section className="planner-expansion">
        <section className="lodging-card">
          <div className="expansion-heading">
            <div>
              <p className="section-label">STAY / 住宿节奏</p>
              <h2>住哪里，比多换一个景点更重要。</h2>
            </div>
            <span className="muted">两人一间 · 价格参考</span>
          </div>
          <p className="expansion-intro">主方案是东京 4 晚、京都 2 晚、大阪 1 晚，只换两次酒店；河口湖和镰仓做日归。下面每一行都能点回地图；价格是 2026 年 9 月的预算占位，不是实时房价。</p>
          <div className="lodging-grid">
            <div className="stay-timeline">
              {STAY_PLANS.map((plan) => (
                <button
                  type="button"
                  className="stay-row"
                  key={plan.day}
                  onClick={() => {
                    setSelectedDay("all");
                    setSelectedPlaceId(plan.placeId);
                    setCategoryFilter("all");
                    setSearch("");
                  }}
                >
                  <span className="stay-day" style={{ "--stay-color": dayFor(plan.day).color } as CSSProperties}>D{plan.day}</span>
                  <span className="stay-copy"><strong>{plan.title}</strong><small>{plan.area} · {plan.note}</small></span>
                  <span className="stay-price">{plan.price}</span>
                  <span className="stay-arrow" aria-hidden="true">⌖</span>
                </button>
              ))}
            </div>
            <div className="stay-options">
              {STAY_OPTIONS.map((option) => (
                <a className="stay-option" href={option.link} target="_blank" rel="noreferrer" key={option.label}>
                  <span className="option-kicker">{option.label}</span>
                  <strong>{option.title}</strong>
                  <span className="option-price">{option.price}</span>
                  <span className="option-total">{option.total}</span>
                  <p>{option.note}</p>
                  <span className="option-link">看区域资料 ↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="food-card">
          <div className="expansion-heading">
            <div>
              <p className="section-label">EAT / 美食清单</p>
              <h2>先收藏，再决定这一餐吃什么。</h2>
            </div>
            <span className="muted">{selectedDay === "all" ? "全程清单" : `Day ${selectedDay} · 当前日`}</span>
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

      <section className="hourly-card">
        <div className="expansion-heading">
          <div>
            <p className="section-label">HOUR BY HOUR / 小时级攻略</p>
            <h2>把每一天拆成能执行的节奏。</h2>
          </div>
          <span className="muted">点击时间段可联动地图</span>
        </div>
        <p className="expansion-intro">这是“主线 + 可删减点”的版本：有些时间是交通和排队缓冲，不建议把它们全部挤掉。Day 3 富士山最看天气与返程班次，Day 8 最看航班。</p>
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

      <section className="research-strip">
        <div className="research-heading">
          <p className="section-label">FIELD NOTES / 攻略吸收</p>
          <h2>{RESEARCH_TIPS.length} 篇小红书笔记，逐条拆进路线。</h2>
          <p>以下卡片来自你已登录的小红书站内搜索和笔记正文。笔记只负责提供路线灵感、体感和打卡经验；交通、票价、开放时间、库存和过敏安全仍以官方信息和现场确认执行。</p>
        </div>
        <div className="research-grid">
          {RESEARCH_TIPS.map((tip) => (
            <article className="research-card" key={tip.title}>
              <span>{tip.label}</span>
              <h3>{tip.title}</h3>
              <div className="research-source"><strong>{tip.sourceTitle}</strong><small>{tip.author} · 笔记 ID {tip.noteId}</small></div>
              <p>{tip.text}</p>
              <p className="research-decision"><b>落地：</b>{tip.decision}</p>
              <p className="research-used"><b>对应：</b>{tip.usedIn}</p>
              <a href={tip.link} target="_blank" rel="noreferrer">{tip.linkText}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="lower-grid">
        <div className="itinerary-section">
          <div className="section-heading"><div><p className="section-label">DAY BY DAY / 行程卡</p><h2>{selectedDay === "all" ? "八天的节奏" : dayFor(selectedDay).title}</h2></div><span className="muted">{selectedDay === "all" ? "可按天气调换 Day 3 / Day 4" : `${visiblePlaces.length} 个地点`}</span></div>
          <div className="itinerary-list">
            {groupedPlaces.filter(({ day }) => selectedDay === "all" || day.id === selectedDay).map(({ day, places: dayPlaces }) => (
              <article className="day-card" key={day.id} style={{ "--day-color": day.color } as CSSProperties}>
                <div className="day-card-rail"><span>{String(day.id).padStart(2, "0")}</span><i /></div>
                <div className="day-card-content">
                  <div className="day-card-heading"><div><p>{day.label} · {day.focus}</p><h3>{day.title}</h3></div><button className="text-button" onClick={() => openCreate(day.id)}>＋ 加地点</button></div>
                  <div className="day-places">
                    {dayPlaces.length ? dayPlaces.map((place) => (
                      <div className={`place-row ${selectedPlaceId === place.id ? "is-selected" : ""}`} key={place.id} role="button" tabIndex={0} onClick={() => selectPlace(place.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectPlace(place.id); } }}>
                        <span className="place-dot" style={{ backgroundColor: day.color }} />
                        <div className="place-main"><div><strong>{place.title}</strong><span className="place-category">{categoryLabel(place.category)} · {place.area}</span>{place.price && <span className="place-price">{place.price}</span>}</div><p>{place.note}</p></div>
                        <div className="place-actions"><button aria-label={`编辑${place.title}`} onClick={(event) => { event.stopPropagation(); openEdit(place); }}>编辑</button><button aria-label={`删除${place.title}`} onClick={(event) => { event.stopPropagation(); deletePlace(place); }}>删除</button>{place.link && <a href={place.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>↗</a>}</div>
                      </div>
                    )) : <div className="empty-day">这一天暂时没有符合筛选条件的地点。<button className="text-button" onClick={() => openCreate(day.id)}>现在添加</button></div>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="notes-column">
          <div className="note-card note-card-yellow">
            <div className="note-card-top"><span className="note-index">01</span><span>给你们的版本</span></div>
            <h3>早起，把富士山和限定都买在前面。</h3>
            <p>Day 3 按晚起版安排河口湖，Day 2 把东京站 Chiikawa 放在上午。天气、库存与入场规则会变，出发前一周和当天早上各看一次官方信息。</p>
          </div>
          <div className="note-card note-card-blue">
            <div className="note-card-top"><span className="note-index">02</span><span>过敏提醒</span></div>
            <h3>你的安全优先于“尝一口”。</h3>
            <p>准备日语卡片：<em>鮭（さけ）アレルギーがあります。生魚・加熱した魚・だしも確認してください。</em> 女朋友可以吃生鱼，但你不要共用餐具或把不确定的汤底当作安全。</p>
          </div>
          <div className="source-card">
            <div className="source-card-head"><span>出发前资料</span><span>↗</span></div>
            <a href="https://highway-buses.jp/course/kawaguchiko.php" target="_blank" rel="noreferrer"><span>BUS</span>新宿 · 河口湖高速巴士</a>
            <a href="https://travel.jr-central.co.jp/plan/en/" target="_blank" rel="noreferrer"><span>JR</span>东京 · 新大阪 Platt-KODAMA</a>
            <a href="https://www.osaka-info.jp/en/spot/osaka-castle-main-keep/" target="_blank" rel="noreferrer"><span>OSAKA</span>大阪城开放与交通</a>
            <a href="https://www.caa.go.jp/en/policy/food_labeling/" target="_blank" rel="noreferrer"><span>CAA</span>日本食品过敏沟通卡</a>
          </div>
          <button className="reset-button" onClick={resetTrip}>恢复示例路线</button>
        </aside>
      </section>

      <section className="xiaohongshu-board">
        <div className="xhs-board-head">
          <div>
            <p className="section-label">RED NOTE / 小红书分享</p>
            <h2>把想看的攻略，集中放在这里。</h2>
            <p>左侧是你已核验的 {RESEARCH_TIPS.length} 篇小红书笔记，右侧可以继续粘贴自己的收藏。链接会和地点、打卡状态一起保存在浏览器，也会随导出文件和分享行程带走。</p>
          </div>
          <span className="xhs-board-count">{xiaohongshuLinks.length} 条链接</span>
        </div>
        <div className="xhs-board-layout">
          <form className="xhs-add-form" onSubmit={addXiaohongshuLink}>
            <div className="xhs-form-title"><span>＋</span><strong>添加一篇小红书</strong></div>
            <label>小红书链接<input type="url" value={xhsUrlDraft} onChange={(event) => setXhsUrlDraft(event.target.value)} placeholder="https://www.xiaohongshu.com/explore/…" required /></label>
            <label>标题 <span className="optional">（可选）</span><input value={xhsTitleDraft} onChange={(event) => setXhsTitleDraft(event.target.value)} placeholder="例如：东京 Chiikawa 扫货路线" /></label>
            <label>你的备注 <span className="optional">（可选）</span><textarea value={xhsNoteDraft} onChange={(event) => setXhsNoteDraft(event.target.value)} placeholder="写下想吸收的点、适合哪一天或需要核对的事项" rows={4} /></label>
            <button type="submit" className="button button-dark">加入分享板块 ↗</button>
            <small>支持 xiaohongshu.com / xhslink.com；只保存链接和你的备注，不会代你发布内容。</small>
          </form>
          <div className="xhs-share-list">
            {xiaohongshuLinks.map((item) => (
              <article className="xhs-share-card" key={item.id}>
                <div className="xhs-share-card-top">
                  <span>{item.source === "user" ? "我的收藏" : "已核验笔记"}</span>
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

      <footer className="footer-strip"><span>东京 4 晚 + 京都 2 晚 + 大阪 1 晚 · 两次换酒店</span><span>数据保存在浏览器，也可用分享链接带走</span><span>Made for two ↗</span></footer>

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

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

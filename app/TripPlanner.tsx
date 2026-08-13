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
import type { DayId, DayPlan, Place, PlaceCategory, TripState } from "./types";

const MapView = dynamic(() => import("./LeafletMap"), {
  loading: () => <div className="map-frame map-placeholder">地图正在准备…</div>,
});

const DAYS: DayPlan[] = [
  { id: 1, label: "DAY 01", title: "抵达东京 · 浅草入门", focus: "浅草 · 上野", color: "#df6b5f" },
  { id: 2, label: "DAY 02", title: "富士山 · 河口湖清晨", focus: "富士山 · 河口湖", color: "#e29b42" },
  { id: 3, label: "DAY 03", title: "东京站 · 银座 · 秋叶原", focus: "Chiikawa · 银座 · 秋叶原", color: "#6e936a" },
  { id: 4, label: "DAY 04", title: "东京 → 大阪 · 道顿堀", focus: "大阪城 · 心斋桥 · 道顿堀", color: "#5488a0" },
  { id: 5, label: "DAY 05", title: "大阪最后一站 · 关西机场", focus: "黑门市场 · 难波 · KIX", color: "#806d9c" },
];

const LEGACY_PLACES: Place[] = [
  {
    id: "sensoji",
    title: "浅草寺 / 雷门",
    area: "浅草",
    category: "play",
    day: 1,
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
    lat: 35.7114,
    lng: 139.777,
    note: "主方案住东京 3 晚；靠近地铁或 JR 站，拖箱、河口湖早出发和换城都更轻松。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
    price: "¥14,000–28,000 / 晚 / 双人房",
  },
  {
    id: "fuji-kawaguchiko",
    title: "河口湖站 · 富士山一日线",
    area: "河口湖",
    category: "play",
    day: 2,
    lat: 35.4994,
    lng: 138.7689,
    note: "从新宿高速巴士往返的主节点；早出发是看山和避开人流的关键。",
    link: "https://highway-buses.jp/course/kawaguchiko.php",
  },
  {
    id: "fuji-lawson",
    title: "河口湖站前便利店取景点",
    area: "河口湖站周边",
    category: "play",
    day: 2,
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
    lat: 34.6674,
    lng: 135.5011,
    note: "把最后一小时留给坐下、整理购物袋和确认机场交通，不要把返程日排满。",
    price: "¥700–1,500 / 人",
    meal: "咖啡 / 甜点",
    foodNote: "看成分标示；优先选原料清楚的饮品和包装甜点。",
    checked: false,
  },
];

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
    note: "入住；主方案先住 3 晚，减少第一段拖箱",
    placeId: "tokyo-base-stay",
  },
  {
    day: 2,
    title: "东京基地：上野 / 浅草酒店",
    area: "轻装去河口湖，晚上回东京",
    price: "¥14,000–28,000 / 晚",
    note: "第 2 晚；富士山一日往返，不带大件行李",
    placeId: "tokyo-base-stay",
  },
  {
    day: 3,
    title: "东京基地：上野 / 浅草酒店",
    area: "东京站、银座、秋叶原往返",
    price: "¥14,000–28,000 / 晚",
    note: "第 3 晚；把 Chiikawa 和购物集中完成",
    placeId: "tokyo-base-stay",
  },
  {
    day: 4,
    title: "大阪住宿：难波 / 心斋桥",
    area: "东京乘新干线到新大阪，再住难波站步行圈",
    price: "¥12,000–25,000 / 晚",
    note: "第 4 晚；晚上走道顿堀，第二天去关西机场",
    placeId: "osaka-namba-stay",
  },
  {
    day: 5,
    title: "大阪住宿 → 关西机场",
    area: "退房后寄存行李，难波短线后前往 KIX",
    price: "已含第 4 晚；机场交通另计",
    note: "返程日；早班机直接删掉黑门市场和难波短线",
    placeId: "osaka-namba-stay",
  },
];

const STAY_OPTIONS = [
  {
    label: "预算优先",
    title: "上野御徒町商务酒店",
    price: "¥14,000–22,000 / 晚",
    total: "东京 3 晚约 ¥42,000–66,000",
    note: "JR、地铁和机场动线都顺，把预算留给吃和 Chiikawa。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
  },
  {
    label: "平衡推荐",
    title: "浅草雷门 / 隅田川附近",
    price: "¥22,000–35,000 / 晚",
    total: "东京 3 晚约 ¥66,000–105,000",
    note: "早晚散步氛围最好；东京部分周末和临近出发日会明显浮动。",
    link: "https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/",
  },
  {
    label: "大阪一晚",
    title: "难波 / 心斋桥站旁",
    price: "¥12,000–25,000 / 晚 / 两人",
    total: "大阪 1 晚约 ¥12,000–25,000",
    note: "五天跨两城时优先住交通节点；想泡温泉可把大阪替换成箱根，但会牺牲大阪。",
    link: "https://osaka-info.jp/en/area/namba/",
  },
];

const TRIP_DATA_VERSION = 3;

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
    title: "抵达东京 · 浅草与上野",
    summary: "第一天不跨大区，先用浅草建立方向感；如果航班晚到，删掉合羽桥，把晚餐提前。",
    distance: "约 9–11k 步 · 住东京",
    items: [
      { time: "07:30–11:00", title: "上海 → 东京", detail: "示例按上午航班估算；HND 更省时间，NRT 需把机场进城再加 45–60 分钟。", area: "PVG / SHA → HND / NRT", tag: "交通" },
      { time: "11:00–12:00", title: "入境、交通卡、酒店寄存", detail: "先办网络和交通，再把大件行李放下；不要第一站就拖箱去景点。", area: "机场 → 上野 / 浅草", price: "¥1,000–3,000 / 两人", tag: "落地" },
      { time: "12:00–13:00", title: "热食午餐", detail: "天妇罗、鳗鱼或明确成分的定食；你出示过敏卡，女友想吃生鱼另行安排。", area: "浅草", placeId: "asakusa-tempura", price: "¥3,000–7,000 / 两人", tag: "吃" },
      { time: "13:00–14:30", title: "雷门 · 浅草寺 · 仲见世", detail: "从雷门一路走到本堂，抽签和拍照都留余量；下午人多时不必排每个小店。", area: "浅草", placeId: "sensoji", tag: "文化" },
      { time: "14:30–15:45", title: "合羽桥道具街", detail: "看食品模型、厨具和小伴手礼；店铺提前关门，临时关闭就直接去上野。", area: "浅草西侧", placeId: "kappabashi", tag: "购物" },
      { time: "15:45–16:30", title: "喫茶与和甜点", detail: "给脚和时差一个缓冲，不建议第一天连续走满 15k 步。", area: "浅草", placeId: "asakusa-kissaten", price: "¥1,600–3,000 / 两人", tag: "休息" },
      { time: "16:30–18:00", title: "上野公园与阿美横丁", detail: "从浅草往上野移动，逛折扣店和街头小店；买饮料、雨具等补给。", area: "上野", placeId: "ameyoko", tag: "散步" },
      { time: "18:00–19:30", title: "上野熟食晚餐", detail: "鸡肉、烤物、拉面或烧肉优先；鱼介汤底、酱汁和共用锅仍要问。", area: "上野", placeId: "ameyoko", price: "¥2,000–4,000 / 两人", tag: "吃" },
      { time: "19:30–20:30", title: "回酒店整理", detail: "确认 Day 2 新宿高速巴士、天气和起床闹钟；富士山日不要临时熬夜。", area: "上野 / 浅草", tag: "收尾" },
    ],
  },
  {
    day: 2,
    title: "富士山 · 河口湖早出发",
    summary: "把小红书/UGC 攻略中反复出现的‘早出发—忠灵塔—河口湖—回新宿’做成可执行版本；能见度比打卡数量更重要。",
    distance: "约 12–15k 步 · 住东京",
    items: [
      { time: "06:15–06:45", title: "起床、便利店早餐", detail: "前一晚买好饭团、香蕉和水；把过敏药放在随身小包，不放托运行李。", area: "东京酒店", price: "¥800–1,500 / 两人", tag: "早起" },
      { time: "06:45–07:30", title: "酒店 → 新宿高速巴士站", detail: "按车票站点提前 20 分钟到；周末或 9 月晴天日不要卡点。", area: "上野 / 浅草 → 新宿", price: "¥1,000–2,000 / 两人", tag: "交通" },
      { time: "07:45–09:30", title: "高速巴士去河口湖", detail: "官方参考单程 ¥2,200 / 人、约 1 小时 45 分；实际班次与座位以预约页面为准。", area: "新宿 → 河口湖站", placeId: "fuji-kawaguchiko", price: "¥4,400 / 两人往返约 ¥8,800", tag: "交通" },
      { time: "09:30–10:00", title: "车站补给与取景点", detail: "拍照控制在 20–30 分钟，注意不要站到车道；如果云层已压山，马上执行室内备选。", area: "河口湖站", placeId: "fuji-lawson", price: "¥500–1,000 / 两人", tag: "拍照" },
      { time: "10:00–11:45", title: "下吉田 · 忠灵塔", detail: "乘富士急行线或当地公交到下吉田，再走台阶；台阶和排队按 60–90 分钟留足。", area: "下吉田", placeId: "chureito", price: "¥1,000–1,500 / 两人交通", tag: "自然" },
      { time: "11:45–13:00", title: "ほうとう 午餐", detail: "安排一顿热汤面；你先确认鱼介、鲑鱼和柴鱼成分，女友再单独选择海鲜。", area: "河口湖", placeId: "fuji-hoto", price: "¥3,000–5,000 / 两人", tag: "吃" },
      { time: "13:00–14:30", title: "天上山公园缆车 / 湖畔", detail: "天气好上缆车，排队超过 30 分钟就改湖畔散步；不要为了一个机位错过返程车。", area: "河口湖畔", placeId: "fuji-tenjo", price: "约 ¥2,000–2,500 / 两人", tag: "自然" },
      { time: "14:30–15:30", title: "大石公园（天气好才去）", detail: "如果前面已经延误，这段直接删；云多时不必为了‘看富士山’继续跨湖。", area: "河口湖北岸", placeId: "oishi-park", tag: "备选" },
      { time: "15:30–16:15", title: "河口湖站买伴手礼", detail: "留出厕所、补水和等车时间；提前确认回程站台。", area: "河口湖站", placeId: "fuji-kawaguchiko", tag: "补给" },
      { time: "16:30–18:15", title: "巴士回新宿", detail: "返程可能受堵车影响；晚餐不要预约 18:30 前的不可取消座位。", area: "河口湖 → 新宿", price: "已含往返交通", tag: "交通" },
      { time: "18:30–20:00", title: "新宿熟食晚餐", detail: "回东京后吃烤肉、鸡肉或定食；如果很累就直接回上野，不再加夜景。", area: "新宿 / 上野", price: "¥3,000–6,000 / 两人", tag: "吃" },
    ],
  },
  {
    day: 3,
    title: "Chiikawa · 银座 · 秋叶原",
    summary: "先买限定，再逛银座；秋叶原安排在下午到晚上，路线集中在东京站—银座—秋叶原一带。",
    distance: "约 10–13k 步 · 住东京",
    items: [
      { time: "08:00–09:00", title: "早餐与购物清单确认", detail: "把 Chiikawa 预算分成‘必买 / 看库存再买 / 不买’，避免第一家店就花完。", area: "东京酒店", price: "¥1,000–2,000 / 两人", tag: "准备" },
      { time: "09:30–10:45", title: "东京站 Character Street", detail: "先冲 ちいかわらんど；库存、排队和限购以当天店铺公告为准，买到就先寄回酒店。", area: "东京站", placeId: "tokyo-chiikawa", price: "购物预算 ¥5,000–15,000+", tag: "Chiikawa" },
      { time: "10:45–11:30", title: "丸之内站舍与东京站周边", detail: "上地面拍红砖站舍，顺便买水；不要把皇居和东京塔硬塞进今天。", area: "丸之内", placeId: "marunouchi", tag: "文化" },
      { time: "11:30–12:30", title: "东京站午餐", detail: "选择熟食定食、烤鸡或咖喱；站内店多，先看成分再点。", area: "东京站八重洲", placeId: "tokyo-yakitori", price: "¥2,000–4,000 / 两人", tag: "吃" },
      { time: "12:30–15:00", title: "银座中央通与百货", detail: "药妆、伴手礼和品牌分批买；把大件集中装袋，不要带着战利品逛整晚。", area: "银座", placeId: "ginza", price: "购物预算 ¥5,000–20,000+", tag: "购物" },
      { time: "15:00–15:45", title: "银座喫茶", detail: "坐下充电、整理购物袋；这是当天的体力缓冲，不建议跳过。", area: "银座", placeId: "ginza-dessert", price: "¥1,800–4,000 / 两人", tag: "休息" },
      { time: "16:00–17:45", title: "秋叶原 Radio Kaikan", detail: "从银座乘地铁到秋叶原，先逛整栋，再决定是否买二手周边；重点只看 Chiikawa 和真正喜欢的品类。", area: "秋叶原", placeId: "radio-kaikan", tag: "购物" },
      { time: "17:45–18:30", title: "神田明神短线", detail: "如果购物排队超时就删掉；保留 30–45 分钟作为文化收尾。", area: "御茶之水", placeId: "kanda-myojin", tag: "文化" },
      { time: "18:45–20:00", title: "秋叶原熟食晚餐", detail: "鸡肉、烤物、米饭或烧肉；不要默认‘熟食’就没有鱼介，点单前问清楚。", area: "秋叶原", placeId: "tokyo-yakitori", price: "¥3,000–6,000 / 两人", tag: "吃" },
      { time: "20:00–21:00", title: "回酒店打包", detail: "把 Day 4 的换城行李压缩成一件箱；新干线票、酒店地址和护照放在同一个随身袋。", area: "东京酒店", tag: "收尾" },
    ],
  },
  {
    day: 4,
    title: "新干线进大阪 · 大阪城与道顿堀",
    summary: "今天唯一一次换城，上午移动、下午文化、晚上美食；不要再加京都或 USJ。",
    distance: "约 11–14k 步 · 住大阪",
    items: [
      { time: "07:00–07:45", title: "退房、寄送 / 携带行李", detail: "尽量把行李压到一件；如果用宅急便，前一晚问酒店能否寄到大阪。", area: "东京酒店", tag: "换城" },
      { time: "08:00–08:45", title: "东京站早餐与取票", detail: "提早到站，买水和便当；自由席也不要把出发卡在最后 5 分钟。", area: "东京站", price: "¥1,500–3,000 / 两人", tag: "交通" },
      { time: "09:00–11:30", title: "东海道新干线去新大阪", detail: "预算版看 Kodama，时间版看 Nozomi；JR Central 当前页面列出的东京→新大阪 Platt-KODAMA 参考价为 ¥12,550 / 人，具体班次与产品以预约页为准。", area: "东京 → 新大阪", price: "约 ¥25,100 / 两人起", tag: "交通" },
      { time: "11:30–12:30", title: "到大阪、酒店寄存行李", detail: "从新大阪先到难波，不要拖箱进大阪城；先把住处和晚餐区域定下来。", area: "新大阪 → 难波", price: "¥1,000–2,000 / 两人", tag: "落地" },
      { time: "12:30–13:30", title: "大阪午餐", detail: "定食、乌冬或肉类热食；今天不要把大阪特色小吃一次吃满。", area: "大阪城周边", price: "¥2,000–4,000 / 两人", tag: "吃" },
      { time: "14:00–16:00", title: "大阪城天守阁与公园", detail: "官方开放时间参考 9:00–18:00；天守阁约 60 分钟，公园和换乘另留 1 小时。", area: "大阪城公园", placeId: "osaka-castle", price: "门票约 ¥1,200 / 人", tag: "文化" },
      { time: "16:00–17:00", title: "大阪城 → 心斋桥", detail: "用地铁前往难波方向；到酒店放下大件购物袋，晚上只带小包。", area: "大阪城 → 心斋桥", price: "约 ¥500–800 / 两人", tag: "交通" },
      { time: "17:00–18:30", title: "心斋桥筋商店街", detail: "集中完成药妆和伴手礼；保留发票和免税包装，别为了打折走到很远。", area: "心斋桥", placeId: "shinsaibashi", tag: "购物" },
      { time: "18:30–20:30", title: "大阪烧 / 章鱼烧晚餐", detail: "女友可尝章鱼烧；你选肉类大阪烧或其他熟食，明确排除鲑鱼、海鲜、柴鱼片和不明鱼粉。", area: "道顿堀", placeId: "osaka-okonomiyaki", price: "¥3,000–6,000 / 两人", tag: "大阪美食" },
      { time: "20:30–21:30", title: "道顿堀夜景与法善寺横丁", detail: "看格力高跑男、戎桥和河道；人多时只沿主线走，不追求把每条巷子走完。", area: "道顿堀", placeId: "dotonbori", tag: "夜景" },
    ],
  },
  {
    day: 5,
    title: "难波短线 · 关西机场",
    summary: "返程日按航班切成早班机版和晚班机版；机场至少提前 2.5–3 小时到，购物不要压到最后一班车。",
    distance: "约 5–9k 步 · 大阪 → 上海",
    items: [
      { time: "06:30–08:00", title: "早班机版：直接去 KIX", detail: "如果 14:00 前起飞，删掉所有景点；从难波预留至少 90 分钟到机场并确认线路。", area: "难波 → 关西机场", price: "¥2,000–4,000 / 两人", tag: "返程" },
      { time: "08:00–09:00", title: "晚班机版：退房与行李寄存", detail: "把护照、免税购物和药品放在随身包；向酒店确认最晚取行李时间。", area: "难波", tag: "返程" },
      { time: "09:00–10:15", title: "黑门市场早午餐", detail: "晚班机才去；女友可吃海鲜，你选烤物、玉子烧等确认过的熟食，不共用餐具。", area: "日本桥", placeId: "kuromon", price: "¥2,000–6,000 / 两人", tag: "吃" },
      { time: "10:15–11:00", title: "难波八阪神社", detail: "巨大狮子头拍照 30–45 分钟；如果下雨或买东西超时就删掉。", area: "难波", placeId: "namba-yasaka", tag: "文化" },
      { time: "11:00–12:00", title: "咖啡、整理购物袋", detail: "最后确认护照、充电宝、药物和免税袋；不要再开启一段跨区购物。", area: "难波", placeId: "osaka-coffee", price: "¥1,400–3,000 / 两人", tag: "休息" },
      { time: "12:00–13:00", title: "取行李、前往机场", detail: "从难波出发比从大阪城更稳；按航班时间反推，国际航班至少提前 2.5–3 小时到 KIX。", area: "难波 → KIX", price: "¥2,000–4,000 / 两人", tag: "交通" },
      { time: "13:00–起飞前", title: "关西机场值机与免税", detail: "预留安检、退税 / 免税确认和登机口步行时间；不要把最后的 Chiikawa 采购押在机场。", area: "关西机场", tag: "返程" },
    ],
  },
];

const RESEARCH_TIPS = [
  {
    label: "小红书参考 01",
    title: "富士山要早出发",
    text: "公开检索到的小红书视频索引提到沿途看富士山、东京站地下街和大阪夜食；我将其中可复用的“早出发 + 河口湖”经验落地为清晨路线，但巴士、票价和备用删减点均以官方资料重新校准。",
    link: "https://6li6.com/xiaohongshu/view-58768",
    linkText: "小红书公开索引 / 经验参考 ↗",
  },
  {
    label: "路线判断 · 非小红书",
    title: "5 天不再塞京都和 USJ",
    text: "东京、富士山、大阪已经是三块区域；这版只保留大阪城与难波夜线，给换城、排队和返程留安全边界。",
    link: "https://www.gotokyo.org/en/itineraries/",
    linkText: "官方城市线路校准 ↗",
  },
  {
    label: "官方校准 · 非小红书",
    title: "天气不好就换顺序",
    text: "Day 2 富士山完全看能见度；阴雨时把东京站 / 银座提前，富士山改到 Day 3 清晨，或直接当作自然放弃项，不要为一张照片冒险。",
    link: "https://highway-buses.jp/course/kawaguchiko.php",
    linkText: "官方河口湖交通与票价 ↗",
  },
];

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

function makeSnapshot(days: DayPlan[], places: Place[]): TripState {
  return { version: TRIP_DATA_VERSION, days, places };
}

function mergeDefaultPlaces(saved: Place[]) {
  const existingIds = new Set(saved.map((place) => place.id));
  return [...saved, ...PLACES.filter((place) => !existingIds.has(place.id))];
}

function migratePlaces(saved: Place[]) {
  const legacyIds = new Set(LEGACY_PLACES.map((place) => place.id));
  return mergeDefaultPlaces(saved.filter((place) => !legacyIds.has(place.id)));
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
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaceDraft>(makeDraft());
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
        if (shared) setToast("已载入分享行程");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeSnapshot(days, places)));
  }, [days, hydrated, places]);

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

  const shareTrip = async () => {
    const url = `${window.location.origin}${window.location.pathname}#share=${encodeShare(makeSnapshot(days, places))}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setToast("分享链接已复制，发给她即可在另一台设备打开");
    } catch {
      window.prompt("复制这条分享链接", url);
    }
  };

  const exportTrip = () => {
    const file = new Blob([JSON.stringify(makeSnapshot(days, places), null, 2)], { type: "application/json" });
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
    setSelectedDay("all");
    setCategoryFilter("all");
    setSearch("");
    setToast("已恢复东京 5 日示例路线");
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
          <p className="eyebrow">TOKYO · FUJI · OSAKA / 2026.09</p>
          <span>两个人的第一次日本旅行</span>
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
          <p className="hero-subtitle">一份给两个人的 5 日地图计划：东京、富士山、大阪，按小时拆开，留出排队、天气和临场决定的余地。</p>
          <div className="trip-facts">
            <div><strong>5</strong><span>天</span></div>
            <div><strong>1</strong><span>次换城</span></div>
            <div><strong>10–15k</strong><span>步 / 日</span></div>
            <div><strong>2w+</strong><span>人民币预算</span></div>
          </div>
        </div>
        <div className="brief-card">
          <div className="brief-card-head"><span>ROUTE NOTE</span><span className="status-dot">● 已规划</span></div>
          <h2>东京 3 晚 + 大阪 1 晚</h2>
          <p>从上海优先看东京进、大阪出的开口航班；河口湖清晨往返，酒店只换一次，把时间留给富士山、Chiikawa 和大阪夜食。</p>
          <div className="brief-lines">
            <div><span>出发</span><b>上海 PVG / SHA → 东京 HND / NRT</b></div>
            <div><span>返程</span><b>大阪难波 → 关西机场 KIX → 上海</b></div>
            <div><span>特别任务</span><b>河口湖清晨、东京站 Chiikawa、道顿堀</b></div>
          </div>
        </div>
      </section>

      <section className="workspace-card">
        <div className="workspace-toolbar">
          <div>
            <p className="section-label">MAP / 路线地图</p>
            <h2>把想去的地方，放回同一天。</h2>
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
            <MapView places={visiblePlaces} days={days} selectedDay={selectedDay} selectedPlaceId={selectedPlaceId} onSelectPlace={selectPlace} />
            <div className="map-legend">
              {days.map((day) => <span key={day.id}><i style={{ backgroundColor: day.color }} />D{day.id}</span>)}
            </div>
            <div className="map-caption"><span>⌖</span> 地图图层来自 OpenStreetMap · 点选标记查看地点</div>
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
          <p className="expansion-intro">主方案是东京住 3 晚、大阪难波住 1 晚，河口湖做日归。下面每一行都能点回地图；价格是 2026 年 9 月的预算占位，不是实时房价。</p>
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
        <p className="expansion-intro">这是“主线 + 可删减点”的版本：有些时间是交通和排队缓冲，不建议把它们全部挤掉。Day 2 富士山最看天气，Day 5 最看航班。</p>
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
          <h2>网上攻略给灵感，官方信息管执行。</h2>
          <p>带有“小红书参考”的卡片来自可公开检索到的小红书索引 / 镜像经验；带有“官方校准”的卡片不是小红书内容，用于核对交通、价格和执行边界。</p>
        </div>
        <div className="research-grid">
          {RESEARCH_TIPS.map((tip) => (
            <article className="research-card" key={tip.title}>
              <span>{tip.label}</span>
              <h3>{tip.title}</h3>
              <p>{tip.text}</p>
              <a href={tip.link} target="_blank" rel="noreferrer">{tip.linkText}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="lower-grid">
        <div className="itinerary-section">
          <div className="section-heading"><div><p className="section-label">DAY BY DAY / 行程卡</p><h2>{selectedDay === "all" ? "五天的节奏" : dayFor(selectedDay).title}</h2></div><span className="muted">{selectedDay === "all" ? "可按天气调换 Day 3 / Day 4" : `${visiblePlaces.length} 个地点`}</span></div>
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
            <p>Day 2 把河口湖放在清晨，Day 3 把东京站 Chiikawa 放在上午。天气、库存与入场规则会变，出发前一周和当天早上各看一次官方信息。</p>
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

      <footer className="footer-strip"><span>东京 3 晚 + 大阪 1 晚 · 河口湖看天气决定</span><span>数据保存在浏览器，也可用分享链接带走</span><span>Made for two ↗</span></footer>

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

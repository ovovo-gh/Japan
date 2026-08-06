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
  ssr: false,
  loading: () => <div className="map-frame map-placeholder">地图正在准备…</div>,
});

const DAYS: DayPlan[] = [
  { id: 1, label: "DAY 01", title: "抵达东京 · 浅草入门", focus: "浅草 · 上野", color: "#df6b5f" },
  { id: 2, label: "DAY 02", title: "东京站 · 银座购物", focus: "Chiikawa · 银座", color: "#e29b42" },
  { id: 3, label: "DAY 03", title: "明治神宫 · 原宿涩谷", focus: "古迹 · 街头 · 夜景", color: "#6e936a" },
  { id: 4, label: "DAY 04", title: "箱根自然与温泉", focus: "芦之湖 · 温泉", color: "#5488a0" },
  { id: 5, label: "DAY 05", title: "最后采购 · 返程", focus: "丰洲/上野 · 机场", color: "#806d9c" },
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
    id: "hakone-yumoto",
    title: "箱根汤本",
    area: "箱根",
    category: "stay",
    day: 4,
    lat: 35.2324,
    lng: 139.1069,
    note: "从东京一日往返的换乘节点；可安排日归温泉和温泉街。",
    link: "https://www.japan.travel/en/destinations/kanto/kanagawa/hakone-and-around/",
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
    id: "toyosu",
    title: "丰洲市场",
    area: "丰洲",
    category: "food",
    day: 5,
    lat: 35.6457,
    lng: 139.7878,
    note: "只适合晚班机版本；海鲜选择多，你需要再次确认熟食与交叉污染。",
    link: "https://www.toyosu-market.or.jp/en/",
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
        setDays(next.days.length ? next.days : DAYS);
        setPlaces(next.places);
        if (shared) setToast("已载入分享行程");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ days, places }));
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
    const url = `${window.location.origin}${window.location.pathname}#share=${encodeShare({ days, places })}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setToast("分享链接已复制，发给她即可在另一台设备打开");
    } catch {
      window.prompt("复制这条分享链接", url);
    }
  };

  const exportTrip = () => {
    const file = new Blob([JSON.stringify({ days, places }, null, 2)], { type: "application/json" });
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
      setDays(parsed.days);
      setPlaces(parsed.places);
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
    const place = places.find((item) => item.id === id);
    if (place && selectedDay !== "all" && place.day !== selectedDay) setSelectedDay(place.day);
  };

  return (
    <main className="trip-app">
      <header className="topbar">
        <div className="brand-mark" aria-label="Two in Tokyo">2<span>in</span>JP</div>
        <div className="topbar-copy">
          <p className="eyebrow">TOKYO · HAKONE / 2026.09</p>
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
          <div className="kicker"><span className="kicker-dot" />早秋出发，东京做基地</div>
          <h1>东京，<em>慢慢走。</em></h1>
          <p className="hero-subtitle">一份给两个人的 5 日地图计划：美食、古迹、购物、自然和温泉，保留一点临场决定的余地。</p>
          <div className="trip-facts">
            <div><strong>5</strong><span>天</span></div>
            <div><strong>1</strong><span>次换城</span></div>
            <div><strong>10–15k</strong><span>步 / 日</span></div>
            <div><strong>2w+</strong><span>人民币预算</span></div>
          </div>
        </div>
        <div className="brief-card">
          <div className="brief-card-head"><span>ROUTE NOTE</span><span className="status-dot">● 已规划</span></div>
          <h2>东京 4 晚 + 箱根 1 日</h2>
          <p>从上海优先看直飞东京；酒店集中在上野 / 浅草 / 日本桥一带，减少拖箱子，把时间留给体验。</p>
          <div className="brief-lines">
            <div><span>出发</span><b>上海 PVG / SHA → 东京 HND / NRT</b></div>
            <div><span>住</span><b>东京一处基地，箱根不强制过夜</b></div>
            <div><span>特别任务</span><b>东京站与晴空塔 Chiikawa 限定</b></div>
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
                        <div className="place-main"><div><strong>{place.title}</strong><span className="place-category">{categoryLabel(place.category)} · {place.area}</span></div><p>{place.note}</p></div>
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
            <h3>早起，把限定买在前面。</h3>
            <p>东京站 Chiikawa Land、晴空塔店都放进路线了。门店库存与入场规则会变，出发前一周和当天早上各看一次官方信息。</p>
          </div>
          <div className="note-card note-card-blue">
            <div className="note-card-top"><span className="note-index">02</span><span>过敏提醒</span></div>
            <h3>你的安全优先于“尝一口”。</h3>
            <p>准备日语卡片：<em>鮭（さけ）アレルギーがあります。生魚・加熱した魚・だしも確認してください。</em> 女朋友可以吃生鱼，但你不要共用餐具或把不确定的汤底当作安全。</p>
          </div>
          <div className="source-card">
            <div className="source-card-head"><span>出发前资料</span><span>↗</span></div>
            <a href="https://www.japan.travel/en/itineraries/outdoor-art-hot-spring-resorts-and-fuji-views-in-hakone/" target="_blank" rel="noreferrer"><span>JNTO</span>箱根温泉与自然路线</a>
            <a href="https://www.tokyometro.jp/tst/en/index.html" target="_blank" rel="noreferrer"><span>METRO</span>东京地铁 24 / 48 / 72 小时券</a>
            <a href="https://www.caa.go.jp/en/policy/food_labeling/" target="_blank" rel="noreferrer"><span>CAA</span>日本食品过敏沟通卡</a>
            <a href="https://www.data.jma.go.jp/stats/data/en/normal/normal.html" target="_blank" rel="noreferrer"><span>JMA</span>东京 9 月气候平年值</a>
          </div>
          <button className="reset-button" onClick={resetTrip}>恢复示例路线</button>
        </aside>
      </section>

      <footer className="footer-strip"><span>东京 4 晚作基地 · 箱根看天气决定</span><span>数据保存在浏览器，也可用分享链接带走</span><span>Made for two ↗</span></footer>

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

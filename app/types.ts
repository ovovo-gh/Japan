export type PlaceCategory = "food" | "drink" | "play" | "stay" | "shop";

export type DayId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type DayPlan = {
  id: DayId;
  label: string;
  title: string;
  focus: string;
  color: string;
};

export type StayPlan = {
  id: string;
  day: DayId;
  title: string;
  area: string;
  price: string;
  note: string;
  placeId?: string;
};

export type Place = {
  id: string;
  title: string;
  area: string;
  category: PlaceCategory;
  day: DayId;
  routeOrder?: number;
  lat: number;
  lng: number;
  note: string;
  link?: string;
  price?: string;
  meal?: string;
  foodNote?: string;
  checked?: boolean;
};

export type XiaohongshuShare = {
  id: string;
  title: string;
  url: string;
  note?: string;
  author?: string;
  sourceRef?: string;
  source?: "researched" | "user";
};

export type NearbyRegion = "东京" | "大阪" | "京都" | "富士山";

export type NearbyCandidate = {
  id: string;
  region: NearbyRegion;
  title: string;
  area: string;
  distance: string;
  note: string;
  sourceTitle: string;
  sourceAuthor: string;
  sourceNoteId: string;
  sourceUrl: string;
  checked?: boolean;
};

export type TripState = {
  version?: number;
  days: DayPlan[];
  places: Place[];
  stays?: StayPlan[];
  xiaohongshuLinks?: XiaohongshuShare[];
  preDepartureChecklist?: Record<string, boolean>;
  nearbyCandidates?: NearbyCandidate[];
  nearbyCandidateCatalogVersion?: number;
};

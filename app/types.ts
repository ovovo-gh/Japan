export type PlaceCategory = "food" | "drink" | "play" | "stay" | "shop";

export type DayId = 1 | 2 | 3 | 4 | 5;

export type DayPlan = {
  id: DayId;
  label: string;
  title: string;
  focus: string;
  color: string;
};

export type Place = {
  id: string;
  title: string;
  area: string;
  category: PlaceCategory;
  day: DayId;
  lat: number;
  lng: number;
  note: string;
  link?: string;
};

export type TripState = {
  days: DayPlan[];
  places: Place[];
};

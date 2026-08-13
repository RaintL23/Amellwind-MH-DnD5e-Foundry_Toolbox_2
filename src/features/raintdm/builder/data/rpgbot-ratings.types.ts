export type RpgbotRating = "red" | "orange" | "green" | "blue";

export interface RpgbotRatingEntry {
  class: string;
  guide: string;
  subclass: string | null;
  section: string;
  subsection: string | null;
  category: string;
  name: string;
  source: string | null;
  rating: RpgbotRating;
  score: 1 | 2 | 3 | 4;
  summary: string;
  url: string;
}

export interface RpgbotRatingLookupEntry {
  name: string;
  source: string | null;
  rating: RpgbotRating;
  score: 1 | 2 | 3 | 4;
  summary: string;
  section: string;
  subsection: string | null;
}

export interface RpgbotRatingsPage {
  url: string;
  className: string;
  guide: string;
  subclass: string | null;
  title: string;
  entryCount: number;
  entries: RpgbotRatingEntry[];
}

export interface RpgbotRatingsData {
  meta: {
    source: string;
    attribution: string;
    scrapedAt: string;
    pageCount: number;
    entryCount: number;
    ratingScale: Record<RpgbotRating, number>;
    ratingLegend: Record<RpgbotRating, string>;
    urls?: string[];
    errors?: Array<{ url: string; error: string }>;
    bundleNote?: string;
  };
  /** Present in full scrape output; omitted in runtime bundle. */
  pages?: RpgbotRatingsPage[];
  byClass: Record<
    string,
    Record<string, Record<string, Record<string, RpgbotRatingLookupEntry>>>
  >;
}

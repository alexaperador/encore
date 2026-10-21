import { i18n } from "@/lib/i18n";

export type Concert = {
  id: string;
  title: string;
  artist: string;
  category: string;
  date: string | null;
  hour: string | null;
  venue: string | null;
  city: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  image: {
    url: string | null;
    width: number | null;
    height: number | null;
  };
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

export async function fetchConcerts(params?: {
  keyword?: string;
  city?: string;
  countryCode?: string;
  category?: string;
  offset?: number;
  limit?: number;
}): Promise<Concert[]> {
  const url = new URL("/api/concerts", apiUrl);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error(i18n.t("concerts.fetchError"));

  const data = (await response.json()) as { concerts: Concert[] };
  return data.concerts;
}

export function getConcertDaysRemaining(date: string | null) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const concertDate = new Date(`${date}T00:00:00`);
  return Math.round(
    (concertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function formatConcertTiming(date: string | null) {
  const days = getConcertDaysRemaining(date);

  if (days === null) return i18n.t("concertcard.timing.unknown");

  if (days < 0) {
    const count = Math.abs(days);
    return i18n.t(
      count === 1
        ? "concertcard.timing.finishedDay"
        : "concertcard.timing.finishedDays",
      { count },
    );
  }
  if (days === 0) return i18n.t("concertcard.timing.today");
  if (days === 1) return i18n.t("concertcard.timing.tomorrow");
  return i18n.t("concertcard.timing.inDays", { count: days });
}

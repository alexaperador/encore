const TICKETMASTER_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";
const PAGE_SIZE = 50;

type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
  artist?: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
  }>;
  images?: Array<{
    url?: string;
    width?: number;
    height?: number;
  }>;
  _embedded?: {
    attractions?: Array<{
      name?: string;
    }>;
    venues?: Array<{
      name?: string;
      city?: { name?: string };
    }>;
  };
};

type TicketmasterResponse = {
  _embedded?: { events?: TicketmasterEvent[] };
  page?: { totalPages?: number };
};

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
};

export type ConcertQuery = {
  keyword?: string;
  city?: string;
  countryCode?: string;
  category?: string;
  offset?: number;
  limit?: number;
};

export async function searchConcerts(
  query: ConcertQuery,
  apiKey: string,
): Promise<Concert[]> {
  const url = new URL(TICKETMASTER_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set(
    "startDateTime",
    new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  );
  url.searchParams.set("segmentName", "Music");
  url.searchParams.set("size", String(PAGE_SIZE));
  url.searchParams.set("sort", "relevance,desc");

  if (query.keyword) url.searchParams.set("keyword", query.keyword);
  if (query.city) url.searchParams.set("city", query.city);
  if (query.countryCode) url.searchParams.set("countryCode", query.countryCode);
  if (query.category) {
    url.searchParams.set("classificationName", query.category);
  }

  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.min(50, Math.max(1, query.limit ?? 20));
  const targetCount = offset + limit;
  const events: TicketmasterEvent[] = [];
  const artistKeys = new Set<string>();
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && events.length < targetCount) {
    url.searchParams.set("page", String(page));

    const response = await fetch(url);
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Ticketmaster returned ${response.status}: ${details}`);
    }

    const data = (await response.json()) as TicketmasterResponse;
    const musicEvents = (data._embedded?.events ?? []).filter(
      (event) =>
        event.classifications?.[0]?.segment?.name?.toLowerCase() === "music",
    );
    for (const event of musicEvents) {
      if (events.length >= targetCount) break;

      const artistName =
        event._embedded?.attractions?.[0]?.name ?? event.name ?? event.id;
      const artistKey = artistName?.trim().toLocaleLowerCase();

      if (!artistKey || artistKeys.has(artistKey)) continue;

      artistKeys.add(artistKey);
      events.push(event);
    }
    totalPages = data.page?.totalPages ?? page + 1;
    page += 1;
  }

  return events.slice(offset, offset + limit).map((event) => {
    const classification = event.classifications?.[0];
    const venue = event._embedded?.venues?.[0];
    const images = event.images ?? [];
    const image =
      [...images]
        .filter(
          (candidate) => (candidate.width ?? Number.MAX_SAFE_INTEGER) <= 800,
        )
        .sort((first, second) => (second.width ?? 0) - (first.width ?? 0))[0] ??
      [...images].sort(
        (first, second) => (second.width ?? 0) - (first.width ?? 0),
      )[0];

    return {
      id: event.id ?? "",
      title: event.name ?? "Sin título",
      category:
        classification?.genre?.name ?? classification?.segment?.name ?? "Otros",
      artist: event.artist ?? event._embedded?.attractions?.[0]?.name ?? "",
      date: event.dates?.start?.localDate ?? null,
      hour: event.dates?.start?.localTime?.slice(0, 5) ?? null,
      venue: venue?.name ?? null,
      city: venue?.city?.name ?? null,
      imageUrl: image?.url ?? null,
      ticketUrl: event.url ?? null,
    };
  });
}

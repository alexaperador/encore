const TICKETMASTER_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";
const MAX_CONCERTS = 200;
const PAGE_SIZE = 100;

type TicketmasterEvent = {
  id?: string;
  name?: string;
  url?: string;
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
  category: string;
  date: string | null;
  venue: string | null;
  city: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
};

export type ConcertQuery = {
  keyword?: string;
  city?: string;
  category?: string;
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
  url.searchParams.set("size", String(PAGE_SIZE));
  url.searchParams.set("sort", "date,asc");

  if (query.keyword) url.searchParams.set("keyword", query.keyword);
  if (query.city) url.searchParams.set("city", query.city);
  if (query.category) {
    url.searchParams.set("classificationName", query.category);
  }

  const events: TicketmasterEvent[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && events.length < MAX_CONCERTS) {
    url.searchParams.set("page", String(page));

    const response = await fetch(url);
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Ticketmaster returned ${response.status}: ${details}`);
    }

    const data = (await response.json()) as TicketmasterResponse;
    events.push(
      ...(data._embedded?.events ?? []).slice(0, MAX_CONCERTS - events.length),
    );
    totalPages = data.page?.totalPages ?? page + 1;
    page += 1;
  }

  return events.map((event) => {
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
      date: event.dates?.start?.localDate ?? null,
      venue: venue?.name ?? null,
      city: venue?.city?.name ?? null,
      imageUrl: image?.url ?? null,
      ticketUrl: event.url ?? null,
    };
  });
}

import { i18n } from "@/lib/i18n";

export type Concert = {
  id: string;
  title: string;
  artist: string;
  category: string;
  date: string | null;
  hour: string | null;
  timezone?: string | null;
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

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type DateTimeParts = DateParts & {
  hour: number;
  minute: number;
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const FETCH_TIMEOUT_MS = 15_000;

function parseConcertDate(date: string | null): DateParts | null {
  if (!date) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const [, year, month, day] = match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
  const dateValue = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  if (
    dateValue.getUTCFullYear() !== parts.year ||
    dateValue.getUTCMonth() !== parts.month - 1 ||
    dateValue.getUTCDate() !== parts.day
  ) {
    return null;
  }

  return parts;
}

function parseConcertDateTime(
  concert: Pick<Concert, "date" | "hour">,
  fallbackHour: string,
): DateTimeParts | null {
  const dateParts = parseConcertDate(concert.date);
  if (!dateParts) return null;

  const time = concert.hour ?? fallbackHour;
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return { ...dateParts, hour, minute };
}

function makeVenueDateTime(parts: DateTimeParts, timezone: string): Date {
  const desiredTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let timestamp = desiredTimestamp;

  // Convert the venue's wall-clock time to an instant without a timezone library.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const formattedParts = formatter.formatToParts(new Date(timestamp));
    const values = Object.fromEntries(
      formattedParts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const representedTimestamp = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    );
    const difference = desiredTimestamp - representedTimestamp;
    timestamp += difference;
    if (difference === 0) break;
  }

  return new Date(timestamp);
}

export function getConcertDateTime(
  concert: Pick<Concert, "date" | "hour" | "timezone">,
  fallbackHour = "09:00",
): Date | null {
  const parts = parseConcertDateTime(concert, fallbackHour);
  if (!parts) return null;

  if (concert.timezone) {
    try {
      return makeVenueDateTime(parts, concert.timezone);
    } catch {
      // Older saved concerts may contain a timezone no longer recognized by the runtime.
    }
  }

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
}

export function formatConcertDate(
  date: string | null,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string | null {
  const parts = parseConcertDate(date);
  if (!parts) return null;

  // Noon avoids changing the displayed civil date in timezones with unusual offsets.
  return new Intl.DateTimeFormat(
    locale,
    options,
  ).format(new Date(parts.year, parts.month - 1, parts.day, 12));
}

export async function fetchConcerts(params?: {
  keyword?: string;
  city?: string;
  countryCode?: string;
  category?: string;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<Concert[]> {
  if (!apiUrl) throw new Error(i18n.t("concerts.fetchError"));

  let url: URL;
  try {
    url = new URL("/api/concerts", apiUrl);
  } catch {
    throw new Error(i18n.t("concerts.fetchError"));
  }

  const { signal, ...query } = params ?? {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", abortRequest, { once: true });
  }
  const timeout = setTimeout(abortRequest, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(i18n.t("concerts.fetchError"));

    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("concerts" in data) ||
      !Array.isArray(data.concerts) ||
      !data.concerts.every(isConcert)
    ) {
      throw new Error(i18n.t("concerts.fetchError"));
    }

    return data.concerts;
  } catch {
    throw new Error(i18n.t("concerts.fetchError"));
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
  }
}

function isConcert(value: unknown): value is Concert {
  if (!value || typeof value !== "object") return false;
  const concert = value as Partial<Concert>;
  return (
    typeof concert.id === "string" &&
    typeof concert.title === "string" &&
    (typeof concert.date === "string" || concert.date === null) &&
    (typeof concert.hour === "string" || concert.hour === null)
  );
}

export function getConcertDaysRemaining(date: string | null) {
  const concertDate = parseConcertDate(date);
  if (!concertDate) return null;

  const today = new Date();
  const todayTimestamp = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const concertTimestamp = Date.UTC(
    concertDate.year,
    concertDate.month - 1,
    concertDate.day,
  );

  return Math.round((concertTimestamp - todayTimestamp) / 86_400_000);
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

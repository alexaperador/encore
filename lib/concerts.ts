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
  if (!response.ok) throw new Error("No se pudieron cargar los conciertos");

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

  if (days === null) return "Fecha por confirmar";

  if (days < 0) return `Finalizado hace ${Math.abs(days)} días`;
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

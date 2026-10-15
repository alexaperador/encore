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

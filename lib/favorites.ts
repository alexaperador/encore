import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Concert } from "./concerts";

const FAVORITES_KEY = "@encore/favorite-concerts";

export async function getFavoriteConcerts(): Promise<Concert[]> {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (concert): concert is Concert =>
        typeof concert === "object" &&
        concert !== null &&
        typeof concert.id === "string" &&
        typeof concert.title === "string",
    );
  } catch {
    return [];
  }
}

export async function getFavoriteConcertIds(): Promise<string[]> {
  const favorites = await getFavoriteConcerts();
  return favorites.map((concert) => concert.id);
}

export async function toggleFavoriteConcert(
  concert: Concert,
): Promise<string[]> {
  const favorites = await getFavoriteConcerts();
  const nextFavorites = favorites.some((favorite) => favorite.id === concert.id)
    ? favorites.filter((favorite) => favorite.id !== concert.id)
    : [...favorites, concert];

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
  return nextFavorites.map((favorite) => favorite.id);
}

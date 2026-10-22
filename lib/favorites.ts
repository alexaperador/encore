import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cancelAllConcertNotifications,
  setConcertNotificationEnabled,
} from "./notifications";
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
  const isFavorite = favorites.some((favorite) => favorite.id === concert.id);
  if (isFavorite) {
    await setConcertNotificationEnabled(concert, false);
  }

  const nextFavorites = isFavorite
    ? favorites.filter((favorite) => favorite.id !== concert.id)
    : [...favorites, concert];

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
  return nextFavorites.map((favorite) => favorite.id);
}

export async function clearEncoreData(): Promise<void> {
  await cancelAllConcertNotifications();

  const keys = await AsyncStorage.getAllKeys();
  const encoreKeys = keys.filter((key) => key.startsWith("@encore/"));
  if (encoreKeys.length > 0) await AsyncStorage.multiRemove(encoreKeys);
}

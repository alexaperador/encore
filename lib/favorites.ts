import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cancelAllConcertNotifications,
  setConcertNotificationEnabled,
} from "./notifications";
import type { Concert } from "./concerts";

const FAVORITES_KEY = "@encore/favorite-concerts";
let favoritesQueue: Promise<void> = Promise.resolve();
const favoriteListeners = new Set<() => void>();

export function subscribeToFavorites(listener: () => void): () => void {
  favoriteListeners.add(listener);
  return () => favoriteListeners.delete(listener);
}

function notifyFavoritesChanged() {
  favoriteListeners.forEach((listener) => listener());
}

function enqueueFavoriteOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = favoritesQueue.then(operation, operation);
  favoritesQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readFavoriteConcerts(): Promise<Concert[]> {
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

export function getFavoriteConcerts(): Promise<Concert[]> {
  return enqueueFavoriteOperation(readFavoriteConcerts);
}

export async function getFavoriteConcertIds(): Promise<string[]> {
  const favorites = await getFavoriteConcerts();
  return favorites.map((concert) => concert.id);
}

export function toggleFavoriteConcert(
  concert: Concert,
): Promise<string[]> {
  return enqueueFavoriteOperation(async () => {
    const favorites = await readFavoriteConcerts();
    const isFavorite = favorites.some((favorite) => favorite.id === concert.id);
    if (isFavorite) {
      await setConcertNotificationEnabled(concert, false);
    }

    const nextFavorites = isFavorite
      ? favorites.filter((favorite) => favorite.id !== concert.id)
      : [...favorites, concert];

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
    notifyFavoritesChanged();
    return nextFavorites.map((favorite) => favorite.id);
  });
}

export function clearEncoreData(): Promise<void> {
  return enqueueFavoriteOperation(async () => {
    await cancelAllConcertNotifications();

    const keys = await AsyncStorage.getAllKeys();
    const encoreKeys = keys.filter((key) => key.startsWith("@encore/"));
    if (encoreKeys.length > 0) await AsyncStorage.multiRemove(encoreKeys);
    notifyFavoritesChanged();
  });
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@encore/favorite-concert-ids";

export async function getFavoriteConcertIds(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export async function toggleFavoriteConcert(id: string): Promise<string[]> {
  const favorites = await getFavoriteConcertIds();
  const nextFavorites = favorites.includes(id)
    ? favorites.filter((favoriteId) => favoriteId !== id)
    : [...favorites, id];

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
  return nextFavorites;
}

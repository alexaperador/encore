import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "@encore/concert-notifications";

export async function getNotificationConcertIds(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
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

export async function toggleConcertNotification(
  concertId: string,
): Promise<string[]> {
  const notificationIds = await getNotificationConcertIds();
  const nextNotificationIds = notificationIds.includes(concertId)
    ? notificationIds.filter((id) => id !== concertId)
    : [...notificationIds, concertId];

  await AsyncStorage.setItem(
    NOTIFICATIONS_KEY,
    JSON.stringify(nextNotificationIds),
  );

  return nextNotificationIds;
}

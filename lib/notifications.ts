import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import type { Concert } from "./concerts";

const NOTIFICATIONS_KEY = "@encore/concert-notifications";
const REMINDER_PREFERENCES_KEY = "@encore/reminder-preferences";
const SCHEDULED_NOTIFICATIONS_KEY = "@encore/scheduled-notifications";

const REMINDER_DAYS: Record<string, number> = {
  "30-days": 30,
  "7-days": 7,
  "1-day": 1,
  "same-day": 0,
};

type ScheduledNotifications = Record<string, string[]>;

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

async function getScheduledNotifications(): Promise<ScheduledNotifications> {
  const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
  if (!stored) return {};

  try {
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) =>
          Array.isArray(value) && value.every((id) => typeof id === "string"),
      ),
    ) as ScheduledNotifications;
  } catch {
    return {};
  }
}

async function saveScheduledNotifications(
  scheduled: ScheduledNotifications,
): Promise<void> {
  await AsyncStorage.setItem(
    SCHEDULED_NOTIFICATIONS_KEY,
    JSON.stringify(scheduled),
  );
}

async function ensureNotificationPermissions(): Promise<void> {
  await Notifications.setNotificationChannelAsync("concert-reminders", {
    name: "Recordatorios de conciertos",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });

  const current = await Notifications.getPermissionsAsync();
  if (!current.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) throw new Error("Las notificaciones están desactivadas.");
  }
}

function getConcertDate(concert: Concert): Date | null {
  if (!concert.date) return null;

  const [year, month, day] = concert.date.split("-").map(Number);
  const [hour, minute] = (concert.hour ?? "09:00").split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;

  return new Date(year, month - 1, day, hour, minute);
}

function getReminderDate(concert: Concert, reminderId: string): Date | null {
  const concertDate = getConcertDate(concert);
  const daysBefore = REMINDER_DAYS[reminderId];
  if (!concertDate || daysBefore === undefined) return null;

  const reminderDate = new Date(concertDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  reminderDate.setTime(Date.now() + 10_000);
  return reminderDate;
}

function getNotificationBody(concert: Concert, reminderId: string): string {
  const reminderText =
    reminderId === "same-day"
      ? "Es hoy"
      : REMINDER_DAYS[reminderId] === 1
      ? "Queda 1 día para"
      : `Quedan ${REMINDER_DAYS[reminderId]} días para`;
  const artist = concert.artist ? ` de ${concert.artist}` : "";

  return `${reminderText} el concierto "${concert.title}"${artist}!`;
}

export async function scheduleConcertNotifications(
  concert: Concert,
  reminderIds: string[],
): Promise<void> {
  await cancelConcertNotifications(concert.id);

  const dates = reminderIds
    .map((reminderId) => ({ reminderId, date: getReminderDate(concert, reminderId) }))
    .filter(
      (reminder): reminder is { reminderId: string; date: Date } =>
        reminder.date !== null && reminder.date.getTime() > Date.now(),
    );

  if (dates.length === 0) return;
  await ensureNotificationPermissions();

  const identifiers = await Promise.all(
    dates.map(({ reminderId, date }) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "¡Concierto próximo!",
          body: getNotificationBody(concert, reminderId),
          data: { concertId: concert.id },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: "concert-reminders",
        },
      }).then((identifier) => `${reminderId}:${identifier}`),
    ),
  );

  const scheduled = await getScheduledNotifications();
  scheduled[concert.id] = identifiers;
  await saveScheduledNotifications(scheduled);
}

export async function cancelConcertNotifications(concertId: string): Promise<void> {
  const scheduled = await getScheduledNotifications();
  const identifiers = scheduled[concertId] ?? [];

  await Promise.all(
    identifiers.map((entry) =>
      Notifications.cancelScheduledNotificationAsync(entry.split(":").slice(1).join(":")),
    ),
  );

  delete scheduled[concertId];
  await saveScheduledNotifications(scheduled);
}

export async function getReminderPreferences(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(REMINDER_PREFERENCES_KEY);
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

export async function toggleReminderPreference(
  reminderId: string,
): Promise<string[]> {
  const preferences = await getReminderPreferences();
  const nextPreferences = preferences.includes(reminderId)
    ? preferences.filter((id) => id !== reminderId)
    : [...preferences, reminderId];

  await AsyncStorage.setItem(
    REMINDER_PREFERENCES_KEY,
    JSON.stringify(nextPreferences),
  );

  return nextPreferences;
}

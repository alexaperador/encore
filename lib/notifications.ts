import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { i18n } from "./i18n";
import { getConcertDateTime, type Concert } from "./concerts";

const NOTIFICATIONS_KEY = "@encore/concert-notifications";
const REMINDER_PREFERENCES_KEY = "@encore/reminder-preferences";
const SCHEDULED_NOTIFICATIONS_KEY = "@encore/scheduled-notifications";
const DEFAULT_REMINDER_PREFERENCES = ["1-day"];

const REMINDER_DAYS: Record<string, number> = {
  "30-days": 30,
  "7-days": 7,
  "1-day": 1,
  "same-day": 0,
};

type ScheduledNotifications = Record<string, string[]>;
let notificationMutationQueue: Promise<void> = Promise.resolve();

function enqueueNotificationMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = notificationMutationQueue.then(operation, operation);
  notificationMutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

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
    name: i18n.t("notifications.channelName"),
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });

  const current = await Notifications.getPermissionsAsync();
  if (!current.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) throw new Error("notification-permission-denied");
  }
}

function getConcertDate(concert: Concert): Date | null {
  return getConcertDateTime(concert, "09:00");
}

function getReminderDate(concert: Concert, reminderId: string): Date | null {
  const concertDate = getConcertDate(concert);
  const daysBefore = REMINDER_DAYS[reminderId];
  if (!concertDate || daysBefore === undefined) return null;

  const reminderDate = new Date(concertDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  return reminderDate;
}

function getNotificationBody(concert: Concert, reminderId: string): string {
  const concertName = concert.artist
    ? `${concert.title} — ${concert.artist}`
    : concert.title;
  const daysBefore = REMINDER_DAYS[reminderId];

  return i18n.t(
    reminderId === "same-day"
      ? "notifications.reminderToday"
      : daysBefore === 1
        ? "notifications.reminderOneDay"
        : "notifications.reminderDays",
    { concert: concertName, count: daysBefore },
  );
}

export async function scheduleConcertNotifications(
  concert: Concert,
  reminderIds: string[],
): Promise<number> {
  await cancelConcertNotifications(concert.id);

  const dates = reminderIds
    .map((reminderId) => ({ reminderId, date: getReminderDate(concert, reminderId) }))
    .filter(
      (reminder): reminder is { reminderId: string; date: Date } =>
        reminder.date !== null && reminder.date.getTime() > Date.now(),
    );

  if (dates.length === 0) return 0;
  await ensureNotificationPermissions();

  const identifiers: string[] = [];
  try {
    for (const { reminderId, date } of dates) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t("notifications.title"),
          body: getNotificationBody(concert, reminderId),
          data: { concertId: concert.id },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: "concert-reminders",
        },
      });
      identifiers.push(`${reminderId}:${identifier}`);
    }
  } catch (error) {
    await Promise.all(
      identifiers.map((entry) =>
        Notifications.cancelScheduledNotificationAsync(
          entry.split(":").slice(1).join(":"),
        ),
      ),
    );
    throw error;
  }

  const scheduled = await getScheduledNotifications();
  scheduled[concert.id] = identifiers;
  try {
    await saveScheduledNotifications(scheduled);
  } catch (error) {
    await Promise.all(
      identifiers.map((entry) =>
        Notifications.cancelScheduledNotificationAsync(
          entry.split(":").slice(1).join(":"),
        ),
      ),
    );
    throw error;
  }
  return identifiers.length;
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

export function setConcertNotificationEnabled(
  concert: Concert,
  enabled: boolean,
): Promise<string[]> {
  return enqueueNotificationMutation(() =>
    updateConcertNotificationEnabled(concert, enabled),
  );
}

async function updateConcertNotificationEnabled(
  concert: Concert,
  enabled: boolean,
): Promise<string[]> {
  const currentIds = await getNotificationConcertIds();

  if (!enabled) {
    await cancelConcertNotifications(concert.id);
    const nextIds = currentIds.filter((id) => id !== concert.id);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(nextIds));
    return nextIds;
  }

  const reminders = await getReminderPreferences();
  if (reminders.length === 0) throw new Error("no-reminder-preferences");

  const scheduledCount = await scheduleConcertNotifications(concert, reminders);
  if (scheduledCount === 0) throw new Error("no-future-reminders");

  const nextIds = currentIds.includes(concert.id)
    ? currentIds
    : [...currentIds, concert.id];
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(nextIds));
  } catch (error) {
    await cancelConcertNotifications(concert.id);
    throw error;
  }

  return nextIds;
}

export function cancelAllConcertNotifications(): Promise<void> {
  return enqueueNotificationMutation(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Promise.all([
      AsyncStorage.removeItem(NOTIFICATIONS_KEY),
      AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY),
    ]);
  });
}

export function syncActiveConcertNotifications(
  concerts: Concert[],
  reminderIds: string[],
): Promise<void> {
  return enqueueNotificationMutation(async () => {
    const concertIds = new Set(concerts.map((concert) => concert.id));
    const activeIds = await getNotificationConcertIds();
    const orphanedIds = activeIds.filter((id) => !concertIds.has(id));

    for (const concertId of orphanedIds) {
      await cancelConcertNotifications(concertId);
    }

    const validActiveIds = activeIds.filter((id) => concertIds.has(id));
    if (validActiveIds.length !== activeIds.length) {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(validActiveIds));
    }

    if (validActiveIds.length === 0 || reminderIds.length === 0) return;

    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted) return;

    for (const concert of concerts) {
      if (validActiveIds.includes(concert.id)) {
        await scheduleConcertNotifications(concert, reminderIds);
      }
    }
  });
}

export async function getReminderPreferences(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(REMINDER_PREFERENCES_KEY);
  if (!stored) return DEFAULT_REMINDER_PREFERENCES;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return DEFAULT_REMINDER_PREFERENCES;
    const preferences = parsed.filter(
      (id): id is string =>
        typeof id === "string" && Object.hasOwn(REMINDER_DAYS, id),
    );
    return preferences.length > 0 ? preferences : DEFAULT_REMINDER_PREFERENCES;
  } catch {
    return DEFAULT_REMINDER_PREFERENCES;
  }
}

export function setReminderPreference(
  reminderId: string,
  enabled: boolean,
  concerts: Concert[],
): Promise<string[]> {
  return enqueueNotificationMutation(async () => {
    if (!Object.hasOwn(REMINDER_DAYS, reminderId)) {
      throw new Error("unknown-reminder-preference");
    }

    const preferences = await getReminderPreferences();
    const nextPreferences = enabled
      ? preferences.includes(reminderId)
        ? preferences
        : [...preferences, reminderId]
      : preferences.filter((id) => id !== reminderId);

    if (nextPreferences.length === 0) {
      throw new Error("at-least-one-reminder-required");
    }
    if (nextPreferences.length === preferences.length &&
      nextPreferences.every((id) => preferences.includes(id))) {
      return preferences;
    }

    await AsyncStorage.setItem(
      REMINDER_PREFERENCES_KEY,
      JSON.stringify(nextPreferences),
    );

    try {
      for (const concert of concerts) {
        await scheduleConcertNotifications(concert, nextPreferences);
      }
    } catch (error) {
      await AsyncStorage.setItem(
        REMINDER_PREFERENCES_KEY,
        JSON.stringify(preferences),
      );

      for (const concert of concerts) {
        try {
          await scheduleConcertNotifications(concert, preferences);
        } catch {
          // Keep the stored preference consistent; the next focus sync will retry scheduling.
        }
      }

      throw error;
    }

    return nextPreferences;
  });
}

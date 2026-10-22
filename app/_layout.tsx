import { getStoredLanguage, setLanguage } from "@/lib/i18n";
import { getFavoriteConcerts } from "@/lib/favorites";
import "../global.css";

import * as Notifications from 'expo-notifications';
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export default function RootLayout() {
  useEffect(() => {
    void getStoredLanguage().then((language) => {
      if (language) {
        setLanguage(language);
      }
    });
  }, []);
  useEffect(() => {
    let isActive = true;
    let lastHandledKey = "";
    let lastHandledAt = 0;

    const handleNotificationResponse = async (
      response: Notifications.NotificationResponse,
    ) => {
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      const now = Date.now();
      if (key === lastHandledKey && now - lastHandledAt < 1_500) return;
      lastHandledKey = key;
      lastHandledAt = now;

      try {
        if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
          return;
        }

        const concertId = response.notification.request.content.data?.concertId;
        if (typeof concertId !== "string") return;

        const favorites = await getFavoriteConcerts();
        if (!isActive) return;

        const concert = favorites.find((favorite) => favorite.id === concertId);
        if (concert) {
          router.push({
            pathname: "/concert",
            params: { data: JSON.stringify(concert) },
          });
        }
      } catch {
        // Opening a notification should not crash the app if local data is unavailable.
      } finally {
        void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      }
    };

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => void handleNotificationResponse(response),
    );

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response && isActive) void handleNotificationResponse(response);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
      responseListener.remove();
    };
  }, []);
  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

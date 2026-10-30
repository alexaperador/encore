import { getFavoriteConcerts } from "@/lib/favorites";
import { getStoredLanguage, setLanguage } from "@/lib/i18n";
import "../global.css";

import * as Notifications from 'expo-notifications';
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastivaProvider } from "toastiva";
import { Platform } from "react-native";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const fontFiles = {
  "DMSans-Regular": require("../assets/fonts/DM_Sans/static/DMSans-Regular.ttf"),
  "DMSans-Medium": require("../assets/fonts/DM_Sans/static/DMSans-Medium.ttf"),
  "DMSans-SemiBold": require("../assets/fonts/DM_Sans/static/DMSans-SemiBold.ttf"),
  "DMSans-Bold": require("../assets/fonts/DM_Sans/static/DMSans-Bold.ttf"),
  "SpaceGrotesk-Regular": require("../assets/fonts/Space_Grotesk/static/SpaceGrotesk-Regular.ttf"),
  "SpaceGrotesk-Medium": require("../assets/fonts/Space_Grotesk/static/SpaceGrotesk-Medium.ttf"),
  "SpaceGrotesk-SemiBold": require("../assets/fonts/Space_Grotesk/static/SpaceGrotesk-SemiBold.ttf"),
  "SpaceGrotesk-Bold": require("../assets/fonts/Space_Grotesk/static/SpaceGrotesk-Bold.ttf"),
};


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    void getStoredLanguage().then((language) => {
      if (language) {
        setLanguage(language);
      }
    });
  }, []);
  useEffect(() => {
    if (Platform.OS === "web") return;

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
            pathname: "/concerts",
            params: { data: JSON.stringify(concert) },
          });
        }
      } catch {
      } finally {
        void Notifications.clearLastNotificationResponse();
      }
    };

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => void handleNotificationResponse(response),
    );

    void Promise.resolve(Notifications.getLastNotificationResponse())
      .then((response) => {
        if (!response || !isActive) return;
        void handleNotificationResponse(response);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
      responseListener.remove();
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="dark" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ToastivaProvider position="top-center">
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ToastivaProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
}

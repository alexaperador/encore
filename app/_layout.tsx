import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#F5F5F7",
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
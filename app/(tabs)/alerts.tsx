import ConcertCard from "@/components/ConcertCard";
import { Concert } from "@/lib/concerts";
import { getFavoriteConcerts, toggleFavoriteConcert } from "@/lib/favorites";
import {
  cancelConcertNotifications,
  getNotificationConcertIds,
  getReminderPreferences,
  scheduleConcertNotifications,
  toggleConcertNotification,
  toggleReminderPreference,
} from "@/lib/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { i18n } from "@/lib/i18n";


export default function Alerts() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alertsConcerts, setAlertsConcerts] = useState<Concert[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [favoriteConcerts, setFavoriteConcerts] = useState<Concert[]>([]);
  const [notificationIds, setNotificationIds] = useState<string[]>([]);
  const [activeReminders, setActiveReminders] = useState<string[]>([]);

  const reminderOptions = [
    {
      id: "30-days",
      title: i18n.t("alerts.reminderOptions.30.label"),
      icon: "date-range",
    },
    {
      id: "7-days",
      title: i18n.t("alerts.reminderOptions.7.label"),
      icon: "event",
    },
    {
      id: "1-day",
      title: i18n.t("alerts.reminderOptions.1.label"),
      icon: "event-available",
    },
    {
      id: "same-day",
      title: i18n.t("alerts.reminderOptions.0.label"),
      icon: "today",
    },
  ] as const;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      setIsNotificationsLoading(true);
      setErrorMessage(null);

      Promise.all([
        getFavoriteConcerts(),
        getNotificationConcertIds(),
        getReminderPreferences(),
      ])
        .then(([favorites, ids, reminders]) => {
          if (!isActive) return;

          setFavoriteConcerts(favorites);
          setNotificationIds(ids);
          setActiveReminders(reminders);
          setAlertsConcerts(
            favorites.filter((concert) => ids.includes(concert.id)),
          );
          setIsNotificationsLoading(false);
        })
        .catch(() => {
          if (!isActive) return;

          setErrorMessage(i18n.t("alerts.errorAlerts"));
          setIsNotificationsLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleToggleFavorite = async (concert: Concert) => {
    const nextFavorites = favoriteConcerts.filter(
      (favorite) => favorite.id !== concert.id,
    );

    setFavoriteConcerts(nextFavorites);
    setAlertsConcerts((currentAlerts) =>
      currentAlerts.filter((alert) => alert.id !== concert.id),
    );
    await toggleFavoriteConcert(concert);
  };

  const handleToggleNotification = async (concert: Concert) => {
    const nextNotificationIds = await toggleConcertNotification(concert.id);
    setNotificationIds(nextNotificationIds);
    if (nextNotificationIds.includes(concert.id)) {
      await scheduleConcertNotifications(concert, activeReminders);
    } else {
      await cancelConcertNotifications(concert.id);
      setAlertsConcerts((currentAlerts) =>
        currentAlerts.filter((alert) => alert.id !== concert.id),
      );
    }
  };

  const emptyMessage = isNotificationsLoading ? (
    <View className="items-center py-12">
      <ActivityIndicator color="#3E2C23" />
    </View>
  ) : errorMessage ? (
    <View className="items-center px-6 py-12">
      <MaterialIcons name="cloud-off" size={32} color="#A47148" />
      <Text className="mt-3 text-center text-background">{errorMessage}</Text>
    </View>
  ) : (
    <View className="items-center px-6 py-12 justify-center">
      <View className="items-center">
        <MaterialIcons
          name="notifications-none"
          size={32}
          color="#A47148"
        />
        <Text className="mt-3 text-center text-background">
          {i18n.t("alerts.emptyAlerts")}
        </Text>
      </View>
    </View>
  );

  const listHeader = (
    <View className="mb-6">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-4xl font-bold text-background">{i18n.t("alerts.title")}</Text>
      </View>
      <Text className="text-xl text-[#A47148]">
        {i18n.t("alerts.subtitle")}
      </Text>
    </View>
  );

  const listFooter = (
    <View className="mt-8">
      <View>
        <Text className="text-xl font-bold text-background">
          {i18n.t("alerts.titleConfiguration")}
        </Text>
        <Text className="text-sm text-[#A47148]">
          {i18n.t("alerts.subtitleConfiguration")}
        </Text>
      </View>
      <View className="mt-4 overflow-hidden rounded-2xl bg-background">
        {reminderOptions.map((reminder, index) => {
          const isActive = activeReminders.includes(reminder.id);

          return (
            <View key={reminder.id} className={`flex-row items-center px-4 py-3 ${index > 0 ? "border-t border-[#6F4E37]" : ""}`}>
              <View className={`rounded-2xl p-2 ${isActive ? "bg-[#6F4E37]" : "bg-[#4A3529]"}`}>
                <MaterialIcons
                  name={reminder.icon}
                  size={22}
                  color={isActive ? "#FFCD9F" : "#9CA3AF"}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-semibold ${isActive ? "text-[#FFCD9F]" : "text-[#9CA3AF]"}`}>
                  {reminder.title}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Activar"
                accessibilityHint="Toca para activar o desactivar las notificaciones"
                value={isActive}
                onValueChange={async () => {
                  const nextReminders = await toggleReminderPreference(reminder.id);
                  setActiveReminders(nextReminders);
                  for (const concert of alertsConcerts) {
                    await scheduleConcertNotifications(concert, nextReminders);
                  }
                }}
                trackColor={{ false: "#6F4E37", true: "#A47148" }}
                thumbColor={isActive ? "#FFCD9F" : "#C9A27E"}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <FlatList
        style={{ flex: 1 }}
        data={
          isNotificationsLoading || errorMessage ? [] : alertsConcerts
        }
        keyExtractor={(concert) => concert.id}
        renderItem={({ item: concert }) => (
          <ConcertCard
            concert={concert}
            isLiked={favoriteConcerts.some((fav) => fav.id === concert.id)}
            onToggleFavorite={handleToggleFavorite}
            children={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  notificationIds.includes(concert.id)
                    ? i18n.t("alerts.accessibilityLabelDisabled") + concert.title
                    : i18n.t("alerts.accessibilityLabelActive") + concert.title
                }
                accessibilityState={{
                  selected: notificationIds.includes(concert.id),
                }}
                hitSlop={8}
                onPress={() => handleToggleNotification(concert)}
                className="rounded-full active:opacity-70"
              >
                <MaterialIcons
                  name={
                    notificationIds.includes(concert.id)
                      ? "notifications-active"
                      : "notifications-none"
                  }
                  size={20}
                  color={notificationIds.includes(concert.id) ? "#FFCD9F" : "#9CA3AF"}
                />
              </Pressable>
            }
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyMessage}
        ListFooterComponent={listFooter}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 112,
          paddingHorizontal: 26,
          paddingTop: 16,
        }}
      />
    </SafeAreaView>
  );
}

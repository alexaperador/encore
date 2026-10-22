import {
  Concert,
  formatConcertDate,
  formatConcertTiming,
  getConcertDateTime,
  getConcertDaysRemaining,
} from "@/lib/concerts";
import { getFavoriteConcertIds } from "@/lib/favorites";
import {
  getNotificationConcertIds,
  setConcertNotificationEnabled,
} from "@/lib/notifications";
import { i18n } from "@/lib/i18n";
import { shareConcert } from "@/lib/share";
import { MaterialIcons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as Linking from 'expo-linking';
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatConcertDateLabel(date: string | null) {
  if (!date) return i18n.t("concertDetail.dateUnavailable");

  return (
    formatConcertDate(date, i18n.locale.startsWith("en") ? "en-US" : "es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) ?? i18n.t("concertDetail.dateUnavailable")
  );
}

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

type ConcertAction = {
  id: "add" | "reminder" | "tickets" | "share";
  label: string;
  icon: MaterialIconName;
  onPress?: () => void;
};

export default function ModalConcert({
  concert,
  onClose,
  isLiked,
}: {
  concert: Concert;
  onClose: () => void;
  isLiked?: boolean;
}) {
  const daysRemaining = getConcertDaysRemaining(concert.date);

  const [notificationIds, setNotificationIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const canShowReminder = isLiked ?? favoriteIds.includes(concert.id);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      Promise.all([
        getNotificationConcertIds(),
        getFavoriteConcertIds(),
      ])
        .then(([ids, idsOfFavorites]) => {
          if (!isActive) return;

          setNotificationIds(ids);
          setFavoriteIds(idsOfFavorites);
        })
        .catch(() => {
          if (!isActive) return;
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  const addConcertToCalendar = async () => {
    if (!concert.date) {
      Alert.alert(
        i18n.t("concertDetail.dateUnavailableTitle"),
        i18n.t("concertDetail.dateUnavailableMessage"),
      );
      return;
    }

    try {
      const { granted } = await Calendar.requestCalendarPermissions();
      if (!granted) {
        Alert.alert(
          i18n.t("concertDetail.calendarPermissionTitle"),
          i18n.t("concertDetail.calendarPermissionMessage"),
        );
        return;
      }

      const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
      const calendar = calendars.find((item) => item.allowsModifications);

      if (!calendar) {
        Alert.alert(
          i18n.t("concertDetail.calendarUnavailableTitle"),
          i18n.t("concertDetail.calendarUnavailableMessage"),
        );
        return;
      }

      const startDate = getConcertDateTime(concert, "20:00");

      if (!startDate || Number.isNaN(startDate.getTime())) {
        Alert.alert(
          i18n.t("concertDetail.invalidDateTitle"),
          i18n.t("concertDetail.invalidDateMessage"),
        );
        return;
      }

      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      const location = [concert.venue, concert.city]
        .filter(Boolean)
        .join(", ");

      await calendar.createEvent({
        title: `${concert.artist} - ${concert.title}`,
        startDate,
        endDate,
        location: location || undefined,
        notes: i18n.t("concertDetail.calendarNote"),
        url: concert.ticketUrl ?? undefined,
      });

      Alert.alert(
        i18n.t("concertDetail.addedTitle"),
        i18n.t("concertDetail.addedMessage"),
      );
    } catch {
      Alert.alert(
        i18n.t("concertDetail.addErrorTitle"),
        i18n.t("concertDetail.addErrorMessage"),
      );
    }
  };

  const openUrl = async () => {
    const url = concert.ticketUrl;
    if (!url) {
      Alert.alert(
        i18n.t("concertDetail.ticketsUnavailableTitle"),
        i18n.t("concertDetail.ticketsUnavailableMessage"),
      );
      return;
    }
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        i18n.t("concertDetail.cannotOpenUrl", { url }),
      );
    }
  };

  const toggleNotification = async () => {
    try {
      const nextNotificationIds = await setConcertNotificationEnabled(
        concert,
        !notificationIds.includes(concert.id),
      );
      setNotificationIds(nextNotificationIds);
    } catch {
      Alert.alert(
        i18n.t("alerts.scheduleErrorTitle"),
        i18n.t("alerts.scheduleErrorMessage"),
      );
    }
  };


  const actions = [
    {
      id: "add",
      label: i18n.t("concertDetail.actions.add"),
      icon: "calendar-month",
      onPress: addConcertToCalendar,
    },
    ...(canShowReminder
      ? [{
          id: "reminder" as const,
          label: i18n.t("concertDetail.actions.reminder"),
          icon: "notifications" as const,
          onPress: toggleNotification,
        }]
      : []),
    {
      id: "tickets",
      label: i18n.t("concertDetail.actions.tickets"),
      icon: "confirmation-number",
      onPress: openUrl,
    },
    {
      id: "share",
      label: i18n.t("concertDetail.actions.share"),
      icon: "ios-share",
      onPress: () => shareConcert(concert),
    },
  ] satisfies readonly ConcertAction[];

  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <SafeAreaView
        edges={["left", "right"]}
        style={{ flex: 1, backgroundColor: "#F8F4EF" }}
      >
        <ScrollView style={{ flex: 1 }}>
          <View className="w-full overflow-hidden bg-[#3E2C23]">
            {concert.imageUrl ? (
              <Image
                source={{ uri: concert.imageUrl }}
                accessibilityLabel={concert.title}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 justify-center bg-[#E5E7EB]">
                <MaterialIcons
                  name="image-not-supported"
                  size={60}
                  color="#9CA3AF"
                />
              </View>
            )}
            <View className="absolute inset-x-0 bottom-0" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18n.t("concertDetail.closeDetails")}
              onPress={onClose}
              className="absolute left-5 top-15 z-10 h-11 w-11 items-center justify-center rounded-full bg-black/35"
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View className="absolute bottom-5 left-5 right-5">
              <Text className="text-3xl font-bold text-white" numberOfLines={2}>
                {concert.artist || i18n.t("concertDetail.artistUnavailable")}
              </Text>
              <Text className="mt-1 text-base text-white/80" numberOfLines={1}>
                {concert.title || i18n.t("concertDetail.titleUnavailable")}
              </Text>
            </View>
          </View>
          <View className="px-5 pb-8 pt-5">
            <View className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <View className="flex-row items-center border-b border-[#EDE0D4] pb-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F3E7DB]">
                  <MaterialIcons name="calendar-today" size={21} color="#6F4E37" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-[#9B7A62]">
                    {i18n.t("concertDetail.dateAndTime")}
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-[#3E2C23]">
                    {formatConcertDateLabel(concert.date)}
                  </Text>
                  <Text className="mt-0.5 text-sm text-[#3E2C23]/60">
                    {concert.hour ?? i18n.t("concertDetail.timeUnavailable")}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center pt-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F3E7DB]">
                  <MaterialIcons name="location-on" size={21} color="#6F4E37" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-[#9B7A62]">
                    {i18n.t("concertDetail.location")}
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-[#3E2C23]">
                    {concert.venue ?? i18n.t("concertDetail.venueUnavailable")}
                  </Text>
                  <Text className="mt-0.5 text-sm text-[#3E2C23]/60">
                    {concert.city ?? i18n.t("concertDetail.cityUnavailable")}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="mb-3 mt-6 text-xs font-bold uppercase tracking-[2px] text-[#9B7A62]">
              {i18n.t("concertDetail.planExperience")}
            </Text>
            <View className="flex-row gap-2">
              {actions.map((action) => (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={action.onPress}
                  className="min-h-[82px] flex-1 items-center justify-center rounded-2xl border border-[#E7D8CA] bg-white px-1 py-3"
                  style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F3E7DB]">
                    <MaterialIcons
                      name={
                        action.id === "reminder"
                          ? notificationIds.includes(concert.id)
                            ? "notifications-active"
                            : "notifications-none"
                          : action.icon
                      }
                      size={20}
                      color="#6F4E37"
                    />
                  </View>
                  <Text className="mt-2 text-center text-[11px] font-semibold text-[#3E2C23]">
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-6 rounded-2xl bg-background px-5 py-4">
              {daysRemaining !== null && daysRemaining >= 0 ? (
                <View className="flex-row items-center justify-between">
                  <View>
                    {daysRemaining === 0 ? null : (
                      <Text className="text-sm font-semibold uppercase tracking-widest text-white/90">
                        {i18n.t("concertDetail.remainingLabel")}
                      </Text>
                    )}

                    <Text className="mt-1 text-3xl font-bold text-white">
                      {daysRemaining === 0
                        ? i18n.t("concertDetail.today")
                        : i18n.t(
                            daysRemaining === 1
                              ? "concertDetail.oneDayRemaining"
                              : "concertDetail.daysRemaining",
                            { count: daysRemaining },
                          )}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="event-available"
                    size={40}
                    color="white"
                  />
                </View>
              ) : (
                <Text className="text-base font-semibold text-white">
                  {formatConcertTiming(concert.date)}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

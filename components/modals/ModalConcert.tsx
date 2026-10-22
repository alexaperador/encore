import {
  Concert,
  formatConcertTiming,
  getConcertDaysRemaining,
} from "@/lib/concerts";
import { getFavoriteConcertIds } from "@/lib/favorites";
import { getNotificationConcertIds, toggleConcertNotification } from "@/lib/notifications";
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

function formatConcertDate(date: string | null) {
  if (!date) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

type ConcertAction = {
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
      Alert.alert("Fecha no disponible", "Este concierto no tiene una fecha válida.");
      return;
    }

    try {
      const { granted } = await Calendar.requestCalendarPermissions();
      if (!granted) {
        Alert.alert(
          "Permiso necesario",
          "Permite el acceso al calendario para añadir el concierto.",
        );
        return;
      }

      const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
      const calendar = calendars.find((item) => item.allowsModifications);

      if (!calendar) {
        Alert.alert(
          "Calendario no disponible",
          "No se encontró un calendario editable en este dispositivo.",
        );
        return;
      }

      const startDate = new Date(
        `${concert.date}T${concert.hour ?? "20:00"}:00`,
      );

      if (Number.isNaN(startDate.getTime())) {
        Alert.alert("Fecha no válida", "No se pudo crear el evento.");
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
        notes: "Añadido desde Encore",
        url: concert.ticketUrl ?? undefined,
      });

      Alert.alert("Añadido", "El concierto se ha añadido a tu calendario.");
    } catch {
      Alert.alert(
        "No se pudo añadir",
        "Ha ocurrido un error al crear el evento en el calendario.",
      );
    }
  };

  const openUrl = async () => {
    const url = concert.ticketUrl;
    if (!url) {
      Alert.alert("URL no disponible", "Este concierto no tiene un enlace de entradas.");
      return;
    }
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`No se puede abrir la URL: ${url}`);
    }
  };

  const toggleNotification = async () => {
    try {
      const nextNotificationIds = await toggleConcertNotification(concert.id);
      setNotificationIds(nextNotificationIds);
    } catch {
      Alert.alert(
        "No se pudo actualizar",
        "No se ha podido cambiar el recordatorio.",
      );
    }
  };


  const actions = [
    { label: "Añadir", icon: "calendar-month", onPress: addConcertToCalendar },
    ...(canShowReminder
      ? [{ label: "Recordatorio", icon: "notifications" as const, onPress: toggleNotification }]
      : []),
    { label: "Entradas", icon: "confirmation-number", onPress: openUrl },
    { label: "Compartir", icon: "ios-share", onPress: () => shareConcert(concert) },
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
              accessibilityLabel="Cerrar detalles"
              onPress={onClose}
              className="absolute left-5 top-15 z-10 h-11 w-11 items-center justify-center rounded-full bg-black/35"
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </Pressable>
            <View className="absolute bottom-5 left-5 right-5">
              <Text className="text-3xl font-bold text-white" numberOfLines={2}>
                {concert.artist ?? "Artista no disponible"}
              </Text>
              <Text className="mt-1 text-base text-white/80" numberOfLines={1}>
                {concert.title ?? "Título no disponible"}
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
                    Fecha y hora
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-[#3E2C23]">
                    {formatConcertDate(concert.date)}
                  </Text>
                  <Text className="mt-0.5 text-sm text-[#3E2C23]/60">
                    {concert.hour ?? "Hora no disponible"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center pt-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F3E7DB]">
                  <MaterialIcons name="location-on" size={21} color="#6F4E37" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-[#9B7A62]">
                    Ubicación
                  </Text>
                  <Text className="mt-1 text-base font-semibold text-[#3E2C23]">
                    {concert.venue ?? "Lugar no disponible"}
                  </Text>
                  <Text className="mt-0.5 text-sm text-[#3E2C23]/60">
                    {concert.city ?? "Ciudad no disponible"}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="mb-3 mt-6 text-xs font-bold uppercase tracking-[2px] text-[#9B7A62]">
              Planifica tu experiencia
            </Text>
            <View className="flex-row gap-2">
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={action.onPress}
                  className="min-h-[82px] flex-1 items-center justify-center rounded-2xl border border-[#E7D8CA] bg-white px-1 py-3"
                  style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F3E7DB]">
                    <MaterialIcons
                      name={
                        action.label === "Recordatorio"
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
                    {
                      daysRemaining === 0
                        ? null
                        : <Text className="text-sm font-semibold uppercase tracking-widest text-white/90">
                          Quedan
                        </Text>
                    }

                    <Text className="mt-1 text-3xl font-bold text-white">
                      {daysRemaining === 1 ? `${daysRemaining} día` : daysRemaining === 0 ? "Hoy" : `${daysRemaining} días`}
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

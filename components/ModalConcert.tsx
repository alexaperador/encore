import {
  Concert,
  formatConcertTiming,
  getConcertDaysRemaining,
} from "@/lib/concerts";
import { getNotificationConcertIds, toggleConcertNotification } from "@/lib/notifications";
import { shareConcert } from "@/lib/share";
import { MaterialIcons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as Linking from 'expo-linking';
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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
}: {
  concert: Concert;
  onClose: () => void;
}) {
  const daysRemaining = getConcertDaysRemaining(concert.date);

  const [notificationIds, setNotificationIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      Promise.all([
        getNotificationConcertIds(),
      ])
        .then(([ids]) => {
          if (!isActive) return;

          setNotificationIds(ids);
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
    { label: "Recordatorio", icon: "notifications", onPress: toggleNotification },
    { label: "Entradas", icon: "confirmation-number", onPress: openUrl },
    { label: "Compartir", icon: "ios-share", onPress: () => shareConcert(concert) },
  ] satisfies readonly ConcertAction[];

  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      >
        <ScrollView style={{ flex: 1 }}>
          <View className="relative h-[360px] w-full overflow-hidden bg-[#3E2C23]">
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar detalles"
              onPress={onClose}
              className="absolute left-7 top-20 z-10 rounded-2xl bg-[#C9A27E]/90 p-2"
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </Pressable>
          </View>
          <View className="px-4 py-6">
            <Text className="text-4xl font-bold text-[#3E2C23]">
              {concert.artist ?? "Artista no disponible"}
            </Text>
            <Text className="mb-2 text-lg text-[#3E2C23]">
              {concert.title ?? "Título no disponible"}
            </Text>
            <View className="flex-row items-center">
              <MaterialIcons name="calendar-today" size={30} color="#3E2C23" />
              <View>
                <Text className="ml-2 text-base text-[#3E2C23]">
                  {formatConcertDate(concert.date)}
                </Text>
                <Text className="ml-2 text-base text-[#3E2C23]/70">
                  {concert.hour ?? "Hora no disponible"}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="location-on" size={30} color="#3E2C23" />
              <View>
                <Text className="ml-2 text-base text-[#3E2C23]">
                  {concert.venue ?? "Lugar no disponible"}
                </Text>
                <Text className="ml-2 text-base text-[#3E2C23]/70">
                  {concert.city ?? "Ciudad no disponible"}
                </Text>
              </View>
            </View>
            <View className="mt-6 flex-row gap-2">
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={action.onPress}
                  className="min-h-[76px] flex-1 items-center justify-center rounded-2xl bg-[#C9A27E] px-1 py-3"
                  style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
                >
                  <MaterialIcons
                    name={
                      action.label === "Recordatorio"
                        ? notificationIds.includes(concert.id)
                          ? "notifications-active"
                          : "notifications-none"
                        : action.icon
                    }
                    size={22}
                    color="white"
                  />
                  <Text className="mt-1 text-center text-xs font-semibold text-white">
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-6 rounded-2xl bg-[#C9A27E] px-5 py-4">
              {daysRemaining !== null && daysRemaining >= 0 ? (
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold uppercase tracking-widest text-white/90">
                      Quedan
                    </Text>
                    <Text className="mt-1 text-3xl font-bold text-white">
                      {daysRemaining} {daysRemaining === 1 ? "día" : "días"}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="event-available"
                    size={40}
                    color="white"
                  />
                </View>
              ) : (
                <Text className="text-base font-semibold text-[#3E2C23]">
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

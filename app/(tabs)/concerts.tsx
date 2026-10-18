import AddConcert from "@/components/AddConcert";
import ConcertCard from "@/components/ConcertCard";
import type { Concert } from "@/lib/concerts";
import { getFavoriteConcerts, toggleFavoriteConcert } from "@/lib/favorites";
import {
  getNotificationConcertIds,
  toggleConcertNotification,
} from "@/lib/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React from "react";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


function formatConcertTiming(date: string | null) {
  if (!date) return "Fecha por confirmar";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const concertDate = new Date(`${date}T00:00:00`);
  const days = Math.round(
    (concertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days < 0) return `Finalizado hace ${Math.abs(days)} días`;
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

export default function Concerts() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [favoriteConcerts, setFavoriteConcerts] = useState<Concert[]>([]);
  const [notificationIds, setNotificationIds] = useState<string[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);

  const refreshFavorites = useCallback(async (isActive: () => boolean = () => true) => {
    const favorites = await getFavoriteConcerts();
    if (!isActive()) return;
    setFavoriteConcerts(favorites);
    setIsFavoritesLoading(false);
  }, []);
  
  const categories = [
    { label: "Próximos", icon: "event" },
    { label: "Pasados", icon: "history" },
    { label: "Todos", icon: "list" },
  ] as const;
  const [selectedCategorie, setSelectedCategorie] =
    useState<string>("Próximos");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      refreshFavorites(() => isActive);

      getNotificationConcertIds().then((ids: string[]) => {
        if (isActive) setNotificationIds(ids);
      });

      return () => {
        isActive = false;
      };
    }, [refreshFavorites]),
  );

  const handleToggleFavorite = async (concert: Concert) => {
    const nextFavorites = favoriteConcerts.filter(
      (favorite) => favorite.id !== concert.id,
    );

    setFavoriteConcerts(nextFavorites);
    await toggleFavoriteConcert(concert);
  };

  const handleToggleNotification = async (concert: Concert) => {
    const nextNotificationIds = await toggleConcertNotification(concert.id);
    setNotificationIds(nextNotificationIds);
  };

  const selectCategory = (category: string) => {
    setSelectedCategorie(category);
  };

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const visibleConcerts = favoriteConcerts.filter((concert) => {
    if (selectedCategorie === "Todos") return true;

    if (selectedCategorie === "Próximos") {
      return (
        !concert.date || new Date(`${concert.date}T00:00:00`) >= currentDate
      );
    }

    if (selectedCategorie === "Pasados") {
      return (
        Boolean(concert.date) &&
        new Date(`${concert.date}T00:00:00`) < currentDate
      );
    }

    return true;
  });

  const emptyMessage = isFavoritesLoading ? (
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
          name={favoriteConcerts.length === 0 ? "favorite-border" : "event-busy"}
          size={32}
          color="#A47148"
        />
        <Text className="mt-3 text-center text-background">
          {favoriteConcerts.length === 0
            ? "Aún no tienes conciertos guardados. Márcalos desde Explorar."
            : "No hay conciertos en esta categoría."
          }  </Text>
      </View>
      <AddConcert children={
        <View className="flex flex-row items-center justify-center rounded-2xl bg-background px-4 py-2 mt-4">
          <Text className="text-[#FFCD9F]">Añadir recordatorio</Text>
          <MaterialIcons name="add" size={32} color="#FFCD9F" />
        </View>
      } onConcertAdded={refreshFavorites} />
    </View>
  );

  const listHeader = (
    <>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-4xl font-bold text-background">Mis Conciertos</Text>
        <AddConcert children={
          <View className="flex-row items-center justify-center rounded-2xl bg-background px-3 py-2">
            <Text className="mr-1 font-semibold text-[#FFCD9F]">Añadir</Text>
            <MaterialIcons name="add" size={24} color="#FFCD9F" />
          </View>
        } onConcertAdded={refreshFavorites} />
      </View>
      <Text className="text-xl text-[#A47148]">
        Tus conciertos guardados, organizados por fecha.
      </Text>
      <View
        accessibilityRole="radiogroup"
        className="my-5 flex-row rounded-2xl bg-background p-2"
      >
        {categories.map((category) => {
          const isSelected = selectedCategorie === category.label;

          return (
            <Pressable
              key={category.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => selectCategory(category.label)}
              className={`min-h-16 flex-1 items-center justify-center rounded-2xl will-change-variable px-2 py-2 ${isSelected ? "bg-border shadow-sm" : ""
                }`}
            >
              <View className="flex-row items-center justify-center gap-1">
                <MaterialIcons
                  name={category.icon}
                  size={20}
                  color={isSelected ? "white" : "#FFCD9F"}
                />
                <Text
                  className={`mt-1 text-center text-xs ${isSelected ? "font-semibold text-white" : "text-[#FFCD9F]"}`}
                >
                  {category.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <FlatList
        style={{ flex: 1 }}
        data={
          isFavoritesLoading || errorMessage ? [] : visibleConcerts
        }
        keyExtractor={(concert) => concert.id}
        renderItem={({ item: concert }) => (
          <ConcertCard
            concert={concert}
            isLiked
            onToggleFavorite={handleToggleFavorite}
            children={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  notificationIds.includes(concert.id)
                    ? `Desactivar notificación para ${concert.title}`
                    : `Activar notificación para ${concert.title}`
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

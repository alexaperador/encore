import { getFavoriteConcerts } from "@/lib/favorites";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import type { Concert } from "@/lib/concerts";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
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
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
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

      getFavoriteConcerts().then((favorites) => {
        if (isActive) {
          setFavoriteConcerts(favorites);
          setIsFavoritesLoading(false);
        }
      });

      return () => {
        isActive = false;
      };
    }, []),
  );

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
    <View className="items-center px-6 py-12">
      <MaterialIcons
        name={favoriteConcerts.length === 0 ? "favorite-border" : "event-busy"}
        size={32}
        color="#A47148"
      />
      <Text className="mt-3 text-center text-background">
        {favoriteConcerts.length === 0
          ? "Aún no tienes conciertos guardados. Márcalos desde Explorar."
          : "No hay conciertos en esta categoría."}
      </Text>
    </View>
  );

  const listHeader = (
    <>
      <Text className="text-5xl font-bold text-background">Mis Conciertos</Text>
      <Text className="text-xl text-[#A47148]">
        Tus conciertos guardados, organizados por fecha.
      </Text>
      <View
        accessibilityRole="radiogroup"
        className="my-5 flex-row rounded-full border border-[#D9B99A] bg-background p-1"
      >
        {categories.map((category) => {
          const isSelected = selectedCategorie === category.label;

          return (
            <Pressable
              key={category.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => selectCategory(category.label)}
              className={`min-h-16 flex-1 items-center justify-center rounded-full px-2 py-2 ${isSelected ? "bg-border shadow-sm" : ""
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
          <Pressable className="mb-3 flex w-full flex-row gap-3 rounded-2xl bg-background">
            <View className="h-25 w-25 overflow-hidden rounded-tl-2xl rounded-bl-2xl">
              {concert.imageUrl ? (
                <Image
                  source={{ uri: concert.imageUrl }}
                  accessibilityLabel={concert.title}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-[#E5E7EB]">
                  <MaterialIcons name="image" size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View className="flex-1 justify-center py-3 pr-3">
              <Text className="text-base font-bold text-white" numberOfLines={2}>
                {concert.title}
              </Text>
              <Text className="mt-1 text-sm text-[#A47148]">
                {formatConcertTiming(concert.date)}
              </Text>
            </View>
          </Pressable>
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

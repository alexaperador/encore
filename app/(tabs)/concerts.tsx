import { fetchConcerts, type Concert } from "@/lib/concerts";
import { getFavoriteConcertIds } from "@/lib/favorites";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Concerts() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const categories = ["Próximos", "Pasados", "Favoritos"];
  const [selectedCategorie, setSelectedCategorie] =
    useState<string>("Próximos");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      getFavoriteConcertIds().then((ids) => {
        if (isActive) setFavoriteIds(ids);
      });

      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    let isCancelled = false;
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const results = await fetchConcerts({ keyword: searchText.trim() });
        if (!isCancelled) setConcerts(results);
      } catch {
        if (!isCancelled) {
          setErrorMessage("No se pudieron cargar los conciertos.");
          setConcerts([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [searchText]);

  const toggleCategory = (category: string) => {
    let newSelection: string = selectedCategorie;

    if (category === "Próximos") {
      newSelection = selectedCategorie === "Próximos" ? "" : "Próximos";
    } else if (category === "Pasados") {
      newSelection = selectedCategorie === "Pasados" ? "" : "Pasados";
    } else if (category === "Favoritos") {
      newSelection = selectedCategorie === "Favoritos" ? "" : "Favoritos";
    }

    setSelectedCategorie(newSelection);
  };

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const visibleConcerts = concerts.filter((concert) => {
    if (selectedCategorie === "Favoritos") {
      return favoriteIds.includes(concert.id);
    }

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

  const emptyMessage = isLoading ? (
    <ActivityIndicator color="#3E2C23" />
  ) : errorMessage ? (
    <Text className="text-background">{errorMessage}</Text>
  ) : (
    <Text className="text-background">
      {selectedCategorie === "Favoritos"
        ? "No hay conciertos marcados como favoritos. Marca alguno desde Explorar."
        : "No hay conciertos en esta categoría."}
    </Text>
  );

  const listHeader = (
    <>
      <Text className="text-5xl font-bold text-background">Mis Conciertos</Text>
      <Text className="text-xl text-[#A47148]">
        Mi lista de conciertos favoritos. Marca los que quieras seguir y recibir
        notificaciones.
      </Text>
      <View className="my-5 flex-row flex-wrap gap-2 bg-background/80 rounded-full w-fit">
        {categories.map((category) => {
          const isSelected = selectedCategorie === category;

          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => toggleCategory(category)}
              className={`rounded-full py-2 will-change-variable w-32 ${
                isSelected ? "bg-background" : ""
              }`}
            >
              <Text
                className={`${isSelected ? "font-semibold text-[#ffcd9f]" : "text-inactive-icon"} text-center`}
              >
                {category}
              </Text>
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
        data={isLoading || errorMessage ? [] : visibleConcerts}
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
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">
                {concert.title}
              </Text>
              <Text className="text-sm text-[#A47148]">
                Quedan
                {Math.round(
                  (new Date(`${concert.date}T00:00:00`).getTime() -
                    currentDate.getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                días, {concert.city}
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

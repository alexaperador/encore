import ModalConcert from "@/components/ModalConcert";
import AddConcert from "@/components/AddConcert";
import { fetchConcerts, type Concert } from "@/lib/concerts";
import { getFavoriteConcertIds, toggleFavoriteConcert } from "@/lib/favorites";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatConcertDate(date: string | null) {
  if (!date) return "Fecha no disponible";

}

function LikeButton({
  concert,
  isLiked,
  onToggle,
}: {
  concert: Concert;
  isLiked: boolean;
  onToggle: (concert: Concert) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isLiked ? "Quitar de favoritos" : "Añadir a favoritos"
      }
      onPress={() => onToggle(concert)}
      hitSlop={8}
    >
      <MaterialIcons
        name={isLiked ? "favorite" : "favorite-border"}
        size={20}
        color={isLiked ? "#C65D5D" : "#A3ABB5"}
      />
    </Pressable>
  );
}

export default function Explore() {
  const categories = [
    { label: "Todos", icon: "apps" },
    { label: "Pop", icon: "music-note" },
    { label: "Rock", icon: "album" },
    { label: "Urbano", icon: "mic" },
    { label: "Indie", icon: "headphones" },
  ] as const;
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [searchText, setSearchText] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getFavoriteConcertIds().then(setFavoriteIds);
  }, []);

  const handleToggleFavorite = async (concert: Concert) => {
    const nextFavoriteIds = await toggleFavoriteConcert(concert);
    setFavoriteIds(nextFavoriteIds);
  };

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

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredItems =
    selectedCategory === "Todos"
      ? concerts
      : concerts.filter((item) =>
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()),
      );

  const listHeader = (
    <>
      <View>
        <Text className="text-5xl font-bold text-background">Explorar</Text>
        <Text className="text-xl text-[#A47148]">
          Descubre conciertos cerca de ti
        </Text>
      </View>
      <View className="relative mt-4">
        <MaterialIcons
          name="search"
          size={20}
          color="#C9A27E"
          className="absolute left-4 top-3 z-10"
        />
        <View className="flex-row items-center rounded-full border border-[#6f4e3783] bg-active justify-between pr-4">
          <TextInput
            className="h-12 rounded-full border border-[#6f4e3783] bg-active pl-12 pr-4 text-white"
            placeholder="Buscar conciertos"
            placeholderTextColor="#C9A27E"
            value={searchText}
            onChangeText={setSearchText}
          />
          <MaterialIcons
            name="close"
            size={20}
            color="#C9A27E"
            onPress={() => {
              setSearchText("");
            }}
          />
        </View>
      </View>
      <View className="mt-5">
        <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#A47148]">
          Filtrar por género
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.label;

            return (
              <Pressable
                key={category.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => selectCategory(category.label)}
                className={`w-[18%] items-center rounded-2xl border px-2 py-3 ${isSelected
                  ? "border-[#F3E1CE] bg-[#F3E1CE]"
                  : "border-[#A47148] bg-[#6F4E37]"
                  }`}
              >
                <MaterialIcons
                  name={category.icon}
                  size={20}
                  color={isSelected ? "#3E2C23" : "#F3E1CE"}
                />
                <Text
                  className={`mt-1 text-sm ${isSelected
                    ? "font-bold text-[#3E2C23]"
                    : "font-medium text-[#F3E1CE]"
                    }`}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text className="mt-5 pb-2 text-lg font-bold text-background">
        {selectedCategory === "Todos"
          ? "Próximos conciertos"
          : `Conciertos de ${selectedCategory}`}
      </Text>
    </>
  );

  const emptyMessage = isLoading ? (
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
      <MaterialIcons name="event-busy" size={32} color="#A47148" />
      <Text className="mt-3 text-center text-background">
        No hay conciertos disponibles en esta categoría.
      </Text>
          <AddConcert />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <FlatList
        style={{ flex: 1 }}
        data={isLoading || errorMessage ? [] : filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedConcert(item)}
            className="mb-3 flex w-full flex-row gap-3 rounded-2xl bg-background"
          >
            <View className="h-25 w-25 overflow-hidden rounded-tl-2xl rounded-bl-2xl">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  accessibilityLabel={item.title}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-[#E5E7EB]">
                  <MaterialIcons name="image" size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View className="min-w-0 flex-1 justify-between p-3">
              <View className="flex-row items-start justify-between gap-2">
                <Text
                  className="flex-1 text-base font-bold text-inactive-icon"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <LikeButton
                  concert={item}
                  isLiked={favoriteIds.includes(item.id)}
                  onToggle={handleToggleFavorite}
                />
              </View>
              {item.venue || item.city ? (
                <Text className="text-sm text-shadow" numberOfLines={1}>
                  {[item.city, item.venue].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              <Text className="text-xs text-shadow">
                {formatConcertDate(item.date)}
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
      {selectedConcert ? (
        <ModalConcert
          concert={selectedConcert}
          onClose={() => setSelectedConcert(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

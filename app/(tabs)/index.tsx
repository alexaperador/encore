import ModalConcert from "@/components/ModalConcer";
import { fetchConcerts, type Concert } from "@/lib/concerts";
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

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function LikeButton() {
  const [liked, setLiked] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={liked ? "Quitar de favoritos" : "Añadir a favoritos"}
      onPress={() => setLiked((v) => !v)}
      hitSlop={8}
    >
      <MaterialIcons
        name={liked ? "favorite" : "favorite-border"}
        size={20}
        color={liked ? "#C65D5D" : "#A3ABB5"}
      />
    </Pressable>
  );
}

export default function Explore() {
  const categories = ["Todos", "Pop", "Rock", "Urbano", "Indie"];
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Todos",
  ]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    let newSelection: string[];

    if (category === "Todos") {
      newSelection = selectedCategories.includes("Todos") ? [] : ["Todos"];
    } else {
      newSelection = selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories.filter((c) => c !== "Todos"), category];
    }

    setSelectedCategories(newSelection);
  };

  const filteredItems =
    selectedCategories.length === 0 || selectedCategories.includes("Todos")
      ? concerts
      : concerts.filter((item) =>
          selectedCategories.some((category) =>
            item.category.toLowerCase().includes(category.toLowerCase()),
          ),
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
        <TextInput
          className="h-12 rounded-full border border-[#6f4e3783] bg-active pl-12 pr-4 text-white"
          placeholder="Buscar conciertos"
          placeholderTextColor="#C9A27E"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <View className="mt-5 flex-row flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category);

          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => toggleCategory(category)}
              className={`rounded-full border px-4 py-2 ${
                isSelected
                  ? "border-background bg-background"
                  : "border-transparent bg-background/40"
              }`}
            >
              <Text
                className={
                  isSelected ? "font-semibold text-white" : "text-background"
                }
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-background">
          Conciertos destacados
        </Text>
        <Text className="text-sm text-[#A47148]">Ver todos</Text>
      </View>
      <Text className="mt-4 pb-2 text-lg font-bold text-background">
        Próximos conciertos
      </Text>
    </>
  );

  const emptyMessage = isLoading ? (
    <ActivityIndicator color="#3E2C23" />
  ) : errorMessage ? (
    <Text className="text-background">{errorMessage}</Text>
  ) : (
    <Text className="text-background">
      No hay conciertos disponibles en esta categoría.
    </Text>
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
                <LikeButton />
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

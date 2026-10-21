import AddConcert from "@/components/AddConcert";
import ConcertCard from "@/components/ConcertCard";
import { fetchConcerts, type Concert } from "@/lib/concerts";
import { getStoredCountry, subscribeToCountry, type CountryCode } from "@/lib/country";
import { getFavoriteConcertIds, toggleFavoriteConcert } from "@/lib/favorites";
import { i18n } from "@/lib/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONCERTS_PER_PAGE = 20;

export default function Explore() {
  const categories = [
    { label: i18n.t("explore.filter.all"), icon: "apps" },
    { label: "Pop", icon: "music-note" },
    { label: "Rock", icon: "album" },
    { label: "R&B", icon: "mic" },
    { label: "Latin", icon: "headphones" },
  ] as const;
  const [selectedCategory, setSelectedCategory] = useState(categories[0].label);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [searchText, setSearchText] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreConcerts, setHasMoreConcerts] = useState(true);
  const [countryCode, setCountryCode] = useState<CountryCode>("ES");

  useEffect(() => {
    getStoredCountry().then(setCountryCode);
    return subscribeToCountry(() => {
      getStoredCountry().then(setCountryCode);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getFavoriteConcertIds().then(setFavoriteIds);
    }, []),
  );

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
        const results = await fetchConcerts({
          keyword: searchText.trim(),
          countryCode,
          limit: CONCERTS_PER_PAGE,
          offset: 0,
        });
        if (!isCancelled) {
          setConcerts(results);
          setHasMoreConcerts(results.length === CONCERTS_PER_PAGE);
        }
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
  }, [countryCode, searchText]);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredItems =
    selectedCategory === i18n.t("explore.filter.all")
      ? concerts
      : concerts.filter((item) =>
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
  const loadMoreConcerts = async () => {
    if (isLoadingMore || !hasMoreConcerts) return;

    setIsLoadingMore(true);
    try {
      const results = await fetchConcerts({
        keyword: searchText.trim(),
        countryCode,
        limit: CONCERTS_PER_PAGE,
        offset: concerts.length,
      });
      setConcerts((currentConcerts) => [...currentConcerts, ...results]);
      setHasMoreConcerts(results.length === CONCERTS_PER_PAGE);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const listHeader = (
    <>
      <View>
        <Text className="text-5xl font-bold text-background">{i18n.t("explore.title")}</Text>
        <Text className="text-xl text-[#A47148]">
          {i18n.t("explore.subtitle")}
        </Text>
      </View>
      <View className="relative mt-4">
        <MaterialIcons
          name="search"
          size={20}
          color="#C9A27E"
          className="absolute left-4 top-3 z-10"
        />
        <View className="flex-row items-center rounded-2xl border border-[#6f4e3783] bg-background justify-between pr-10">
          <TextInput
            className="h-12 pl-12 w-full pr-4 text-white"
            placeholder={i18n.t("explore.search")}
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
          {i18n.t("explore.filterGenre")}
        </Text>
        <View className="flex-row flex-wrap gap-2 bg-background p-2 rounded-2xl">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.label;

            return (
              <Pressable
                key={category.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => selectCategory(category.label)}
                className={`w-[18%] items-center rounded-2xl p-2 ${isSelected ? "bg-[#6F4E37]" : ""}`}
              >
                <MaterialIcons
                  name={category.icon}
                  size={20}
                  color={isSelected ? "white" : "#FFCD9F"}
                />
                <Text
                  className={`mt-1 text-sm ${isSelected
                    ? "font-bold text-white"
                    : "font-medium text-[#FFCD9F]"
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
        {selectedCategory === i18n.t("explore.filter.all")
          ? i18n.t("explore.nextConcerts")
          : i18n.t("explore.concertsOf") + selectedCategory}
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
        {i18n.t("explore.emptyCategory")}
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
          <ConcertCard
            concert={item}
            isLiked={favoriteIds.includes(item.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        )
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyMessage}
        ListFooterComponent={
          !isLoading &&
            !errorMessage &&
            filteredItems.length > 0 &&
            hasMoreConcerts ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={i18n.t("explore.loadMoreConcerts")}
              disabled={isLoadingMore}
              onPress={loadMoreConcerts}
              className="mt-2 mb-4 flex-row items-center justify-center rounded-2xl bg-background px-5 py-3"
            >
              {isLoadingMore ? (
                <ActivityIndicator color="#F3E1CE" />
              ) : (
                <>
                  <Text className="font-semibold text-[#F3E1CE]">{i18n.t("explore.loadMoreConcerts")}</Text>
                  <MaterialIcons name="expand-more" size={20} color="#F3E1CE" />
                </>
              )}
            </Pressable>
          ) : null
        }
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
    </SafeAreaView >
  );
}

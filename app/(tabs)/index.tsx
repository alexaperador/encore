import AddConcert from "@/components/AddConcert";
import ConcertCard from "@/components/ConcertCard";
import Text, { EncoreTextInput as TextInput } from "@/components/EncoreText";
import { fetchConcerts, type Concert } from "@/lib/concerts";
import { getStoredCountry, subscribeToCountry, type CountryCode } from "@/lib/country";
import { getFavoriteConcertIds, toggleFavoriteConcert } from "@/lib/favorites";
import { i18n } from "@/lib/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toastiva } from "toastiva";

const CONCERTS_PER_PAGE = 20;
const MAX_CONCERT_OFFSET = 500;

export default function Explore() {
  const categories = [
    { key: "all", label: i18n.t("explore.filter.all"), icon: "apps" },
    { key: "Pop", label: "Pop", icon: "music-note" },
    { key: "Rock", label: "Rock", icon: "album" },
    { key: "R&B", label: "R&B", icon: "mic" },
    { key: "Latin", label: "Latin", icon: "headphones" },
  ] as const;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [searchText, setSearchText] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasMoreConcerts, setHasMoreConcerts] = useState(true);
  const [countryCode, setCountryCode] = useState<CountryCode>("ES");
  const [retryCount, setRetryCount] = useState(0);
  const queryKey = JSON.stringify([
    countryCode,
    searchText.trim(),
    selectedCategory,
  ]);
  const queryKeyRef = useRef(queryKey);
  const pageControllerRef = useRef<AbortController | null>(null);
  queryKeyRef.current = queryKey;

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
    try {
      const nextFavoriteIds = await toggleFavoriteConcert(concert);
      setFavoriteIds(nextFavoriteIds);
      const wasAdded = nextFavoriteIds.includes(concert.id);
      const messageKey = wasAdded
        ? "concertcard.favoriteAdded"
        : "concertcard.favoriteRemoved";
      const descriptionKey = wasAdded
        ? "concertcard.favoriteAddedDescription"
        : "concertcard.favoriteRemovedDescription";

      toastiva[wasAdded ? "success" : "info"](i18n.t(messageKey), {
        description: i18n.t(descriptionKey, { title: concert.title }),
      });
    } catch {
      toastiva.error(
        i18n.t("alerts.updateErrorTitle"),
        { description: i18n.t("alerts.updateErrorMessage") },
      );
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage(null);
    setLoadMoreError(null);
    setHasMoreConcerts(true);
    pageControllerRef.current?.abort();
    pageControllerRef.current = null;
    setIsLoadingMore(false);

    const timeout = setTimeout(async () => {
      try {
        const results = await fetchConcerts({
          keyword: searchText.trim(),
          countryCode,
          category: selectedCategory === "all" ? undefined : selectedCategory,
          limit: CONCERTS_PER_PAGE,
          offset: 0,
          signal: controller.signal,
        });
        if (!isCancelled) {
          setConcerts(results);
          setHasMoreConcerts(results.length === CONCERTS_PER_PAGE);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage(i18n.t("concerts.fetchError"));
          setConcerts([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [countryCode, searchText, selectedCategory, retryCount]);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const selectedCategoryLabel =
    categories.find((category) => category.key === selectedCategory)?.label ??
    categories[0].label;
  const filteredItems = concerts;
  const loadMoreConcerts = async () => {
    if (isLoadingMore || !hasMoreConcerts) return;

    const requestedQueryKey = queryKey;
    const controller = new AbortController();
    pageControllerRef.current = controller;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const results = await fetchConcerts({
        keyword: searchText.trim(),
        countryCode,
        category: selectedCategory === "all" ? undefined : selectedCategory,
        limit: CONCERTS_PER_PAGE,
        offset: concerts.length,
        signal: controller.signal,
      });
      if (queryKeyRef.current !== requestedQueryKey) return;

      setConcerts((currentConcerts) => {
        const knownIds = new Set(currentConcerts.map((concert) => concert.id));
        return [
          ...currentConcerts,
          ...results.filter((concert) => !knownIds.has(concert.id)),
        ];
      });
      setHasMoreConcerts(
        results.length === CONCERTS_PER_PAGE &&
          concerts.length + results.length < MAX_CONCERT_OFFSET + CONCERTS_PER_PAGE,
      );
    } catch {
      if (
        !controller.signal.aborted &&
        queryKeyRef.current === requestedQueryKey
      ) {
        setLoadMoreError(i18n.t("explore.loadMoreError"));
      }
    } finally {
      if (pageControllerRef.current === controller) {
        pageControllerRef.current = null;
        setIsLoadingMore(false);
      }
    }
  };

  const listHeader = (
    <>
      <View>
        <Text typeface="display" className="text-5xl font-bold text-background">{i18n.t("explore.title")}</Text>
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
            const isSelected = selectedCategory === category.key;

            return (
              <Pressable
                key={category.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => selectCategory(category.key)}
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
        {selectedCategory === "all"
          ? i18n.t("explore.nextConcerts")
          : i18n.t("explore.concertsOf") + selectedCategoryLabel}
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={i18n.t("explore.retry")}
        onPress={() => setRetryCount((current) => current + 1)}
        className="mt-4 rounded-2xl bg-background px-5 py-3"
      >
        <Text className="font-semibold text-[#F3E1CE]">{i18n.t("explore.retry")}</Text>
      </Pressable>
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
            <View className="mb-4 mt-2 items-center">
              {loadMoreError ? (
                <Text className="mb-2 text-center text-background">{loadMoreError}</Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18n.t(
                  loadMoreError ? "explore.retry" : "explore.loadMoreConcerts",
                )}
                disabled={isLoadingMore}
                onPress={loadMoreConcerts}
                className="flex-row items-center justify-center rounded-2xl bg-background px-5 py-3"
              >
                {isLoadingMore ? (
                  <ActivityIndicator color="#F3E1CE" />
                ) : (
                  <>
                    <Text className="font-semibold text-[#F3E1CE]">
                      {i18n.t(loadMoreError ? "explore.retry" : "explore.loadMoreConcerts")}
                    </Text>
                    <MaterialIcons
                      name={loadMoreError ? "refresh" : "expand-more"}
                      size={20}
                      color="#F3E1CE"
                    />
                  </>
                )}
              </Pressable>
            </View>
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

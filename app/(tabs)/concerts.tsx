import AddConcert from "@/components/AddConcert";
import ConcertCard from "@/components/ConcertCard";
import Text from "@/components/EncoreText";
import { getConcertDateTime, getConcertDaysRemaining, type Concert } from "@/lib/concerts";
import {
  getFavoriteConcerts,
  subscribeToFavorites,
  toggleFavoriteConcert,
} from "@/lib/favorites";
import { i18n } from "@/lib/i18n";
import {
  getNotificationConcertIds,
  setConcertNotificationEnabled,
} from "@/lib/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toastiva } from "toastiva";

export default function Concerts() {
  const [favoriteConcerts, setFavoriteConcerts] = useState<Concert[]>([]);
  const [notificationIds, setNotificationIds] = useState<string[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);

  const refreshFavorites = useCallback(async (isActive: () => boolean = () => true) => {
    const favorites = await getFavoriteConcerts();
    if (!isActive()) return;
    setFavoriteConcerts(favorites);
    setIsFavoritesLoading(false);
  }, []);

  useEffect(() => {
    let isActive = true;
    const unsubscribe = subscribeToFavorites(() => {
      void refreshFavorites(() => isActive);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [refreshFavorites]);

  const categories = [
    { key: "upcoming", label: i18n.t("concerts.categories.upcoming"), icon: "event" },
    { key: "past", label: i18n.t("concerts.categories.past"), icon: "history" },
    { key: "all", label: i18n.t("concerts.categories.all"), icon: "list" },
  ] as const;
  const [selectedCategory, setSelectedCategory] = useState("upcoming");

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

    try {
      await toggleFavoriteConcert(concert);
      setFavoriteConcerts(nextFavorites);
      setNotificationIds((currentIds) => currentIds.filter((id) => id !== concert.id));
      toastiva.info(
        i18n.t("concertcard.favoriteRemoved"),
        {
          description: i18n.t("concertcard.favoriteRemovedDescription", {
            title: concert.title,
          }),
        },
      );
    } catch {
      toastiva.error(
        i18n.t("alerts.updateErrorTitle"),
        { description: i18n.t("alerts.updateErrorMessage") },
      );
    }
  };

  const handleToggleNotification = async (concert: Concert) => {
    const isEnabled = notificationIds.includes(concert.id);
    try {
      const nextNotificationIds = await setConcertNotificationEnabled(
        concert,
        !isEnabled,
      );
      setNotificationIds(nextNotificationIds);
      const messageKey = isEnabled
        ? "concertDetail.notificationToggledOff"
        : "concertDetail.notificationToggledOn";
      const descriptionKey = isEnabled
        ? "concertDetail.notificationToggledDescriptionOff"
        : "concertDetail.notificationToggledDescriptionOn";

      toastiva[isEnabled ? "info" : "success"](i18n.t(messageKey), {
        description: i18n.t(descriptionKey),
      });
    } catch {
      toastiva.error(
        i18n.t("alerts.scheduleErrorTitle"),
        { description: i18n.t("alerts.scheduleErrorMessage") },
      );
    }
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const visibleConcerts = favoriteConcerts
    .filter((concert) => {
      const daysRemaining = getConcertDaysRemaining(concert.date);
      if (selectedCategory === "all") return true;
      if (selectedCategory === "upcoming") {
        return daysRemaining === null || daysRemaining >= 0;
      }
      return daysRemaining !== null && daysRemaining < 0;
    })
    .map((concert) => ({
      concert,
      timestamp: concert.date
        ? getConcertDateTime(concert, "12:00")?.getTime() ?? Number.POSITIVE_INFINITY
        : Number.POSITIVE_INFINITY,
    }))
    .sort((first, second) => {
      const firstHasDate = Number.isFinite(first.timestamp);
      const secondHasDate = Number.isFinite(second.timestamp);
      if (firstHasDate !== secondHasDate) return firstHasDate ? -1 : 1;

      return selectedCategory === "past"
        ? second.timestamp - first.timestamp
        : first.timestamp - second.timestamp;
    })
    .map(({ concert }) => concert);

  const emptyMessage = isFavoritesLoading ? (
    <View className="items-center py-12">
      <ActivityIndicator color="#3E2C23" />
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
            ? i18n.t("concerts.emptyConcerts")
            : i18n.t("concerts.emptyCategory")
          }  </Text>
      </View>
      <AddConcert children={
        <View className="flex flex-row items-center justify-center rounded-2xl bg-background px-4 py-2 mt-4">
          <Text className="text-[#FFCD9F]">{i18n.t("concerts.addReminder")}</Text>
          <MaterialIcons name="add" size={32} color="#FFCD9F" />
        </View>
      } />
    </View>
  );

  const listHeader = (
    <>
      <View className="flex-row items-center justify-between gap-3">
        <Text typeface="display" className="flex-1 text-5xl font-bold text-background">{i18n.t("concerts.title")}</Text>
      </View>
      <Text className="text-xl text-[#A47148]">
        {i18n.t("concerts.subtitle")}
      </Text>
      <View
        accessibilityRole="radiogroup"
        className="my-5 flex-row rounded-2xl bg-background p-2"
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.key;

          return (
            <Pressable
              key={category.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => selectCategory(category.key)}
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
      {emptyMessage ? null : <AddConcert children={
        <View className="flex flex-row items-center justify-center rounded-2xl bg-background px-4 py-2 mt-4">
          <Text className="text-[#FFCD9F]">{i18n.t("concerts.addReminder")}</Text>
          <MaterialIcons name="add" size={32} color="#FFCD9F" />
        </View>
      } />}
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <FlatList
        style={{ flex: 1 }}
        data={
          isFavoritesLoading ? [] : visibleConcerts
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
                    ? i18n.t("alerts.accessibilityLabelDisabled") + concert.title
                    : i18n.t("alerts.accessibilityLabelActive") + concert.title
                }
                accessibilityState={{
                  selected: notificationIds.includes(concert.id),
                }}
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  void handleToggleNotification(concert);
                }}
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

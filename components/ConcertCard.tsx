import { Concert, formatConcertDate, formatConcertTiming } from "@/lib/concerts";
import { getFavoriteConcertIds, toggleFavoriteConcert } from "@/lib/favorites";
import { i18n } from "@/lib/i18n";
import { shareConcert } from "@/lib/share";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import LikeButton from "./LikedButton";
import ModalConcert from "./modals/ModalConcert";

export default function ConcertCard({
    concert,
    isLiked,
    onToggleFavorite,
    children,
}: {
    concert: Concert;
    isLiked?: boolean;
    onToggleFavorite?: (concert: Concert) => void | Promise<void>;
    children?: React.ReactNode;
}) {
    const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

    useEffect(() => {
        getFavoriteConcertIds().then(setFavoriteIds);
    }, []);

    const handleToggleFavorite = async (concert: Concert) => {
        if (onToggleFavorite) {
            await onToggleFavorite(concert);
            return;
        }

        const nextFavoriteIds = await toggleFavoriteConcert(concert);
        setFavoriteIds(nextFavoriteIds);
    };

    const concertIsLiked = isLiked ?? favoriteIds.includes(concert.id);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${concert.artist || concert.title}, ${concert.city || ""}`}
            onPress={() => setSelectedConcert(concert)}
            className="mb-3 flex h-30 w-full flex-row gap-3 rounded-2xl bg-background"
        >
            <View className="w-30 overflow-hidden rounded-tl-2xl rounded-bl-2xl">
                {concert.imageUrl ? (
                    <Image
                        source={{ uri: concert.imageUrl }}
                        accessibilityLabel={concert.title}
                        className="h-full w-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="flex-1 justify-center bg-[#E5E7EB]">
                        <MaterialIcons name="image" size={24} color="#9CA3AF" />
                    </View>
                )}
            </View>
            <View className="min-w-0 flex-1 justify-between p-3">
                <View className="flex-row concerts-start justify-between gap-2">
                    <Text
                        className="flex-1 text-base font-bold text-[#FFCD9F]"
                        numberOfLines={1}
                    >
                        {concert.title}
                    </Text>
                    <LikeButton
                        concert={concert}
                        isLiked={concertIsLiked}
                        onToggle={handleToggleFavorite}
                    />
                </View>
                {concert.venue || concert.city ? (
                    <Text className="text-sm text-shadow" numberOfLines={1}>
                        {[concert.city, concert.venue].filter(Boolean).join(" · ")}
                    </Text>
                ) : null}
                <Text className="text-xs text-shadow">
                    {formatConcertDate(concert.date, i18n.locale.startsWith("en") ? "en-US" : "es-ES", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        }) ?? i18n.t("concertcard.dateNotAvailable")}
                    {concert.hour ? ` · ${concert.hour}` : ""}
                </Text>
                <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-[#FFCD9F] bg-active px-2 py-1 rounded font-semibold">
                        {formatConcertTiming(concert.date)}
                    </Text>

                    <View className="flex-row items-center gap-x-2">
                        {children}
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={i18n.t(
                                "concertcard.accessibilityLabelShare",
                                { title: concert.title },
                            )}
                            hitSlop={8}
                            onPress={(event) => {
                                event.stopPropagation();
                                void shareConcert(concert);
                            }}
                            className="rounded-full active:opacity-70"
                        >
                            <MaterialIcons name="ios-share" size={24} color="#9CA3AF" />
                        </Pressable>
                    </View>
                </View>
            </View>
            {
                selectedConcert ? (
                    <ModalConcert
                        concert={selectedConcert}
                        isLiked={concertIsLiked}
                        onClose={() => setSelectedConcert(null)}
                    />
                ) : null
            }
        </Pressable>

    );
}

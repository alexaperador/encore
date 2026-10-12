import { Concert } from "@/lib/concerts";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import LikeButton from "./LikedButton";
import { getFavoriteConcertIds, toggleFavoriteConcert } from "@/lib/favorites";
import ModalConcert from "./ModalConcert";

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
    return (
        <Pressable
            onPress={() => setSelectedConcert(concert)}
            className="mb-3 flex h-30 w-full flex-row gap-3 rounded-2xl bg-background"
        >
            <View className="w-25 overflow-hidden rounded-tl-2xl rounded-bl-2xl">
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
                        isLiked={isLiked ?? favoriteIds.includes(concert.id)}
                        onToggle={handleToggleFavorite}
                    />
                </View>
                {concert.venue || concert.city ? (
                    <Text className="text-sm text-shadow" numberOfLines={1}>
                        {[concert.city, concert.venue].filter(Boolean).join(" · ")}
                    </Text>
                ) : null}
                <Text className="text-xs text-shadow">
                    {concert.date
                        ? new Date(concert.date).toLocaleString("es-ES", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        })
                        : "Fecha no disponible"}
                    {concert.hour ? ` · ${concert.hour}` : ""}
                </Text>
                <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-[#FFCD9F] bg-active px-2 py-1 rounded font-semibold">
                        {formatConcertTiming(concert.date)}
                    </Text>

                    <View className="flex-row items-center gap-x-2">
                        {children}
                        <Pressable>
                            <MaterialIcons name="ios-share" size={24} color="#9CA3AF" />
                        </Pressable>
                    </View>
                </View>
            </View>
            {
                selectedConcert ? (
                    <ModalConcert
                        concert={selectedConcert}
                        onClose={() => setSelectedConcert(null)}
                    />
                ) : null
            }
        </Pressable>

    );
}
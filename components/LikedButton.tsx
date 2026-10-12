import { Concert } from "@/lib/concerts";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export default function LikeButton({
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
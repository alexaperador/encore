import { Concert } from "@/lib/concerts";
import { i18n } from "@/lib/i18n";
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
                isLiked ? i18n.t("concertcard.accessibilityLabelLiked") : i18n.t("concertcard.accessibilityLabelUnliked")
            }
            onPress={(event) => {
                event.stopPropagation();
                onToggle(concert);
            }}
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

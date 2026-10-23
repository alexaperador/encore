import { i18n } from "@/lib/i18n";
import Text from "@/components/EncoreText";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";
import app from "../../app.json";

export default function ModalAbout({
    isVisible,
    onClose,
}: {
    isVisible: boolean;
    onClose: () => void;
}) {
    return (
        <Modal
            animationType="slide"
            transparent
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
                <Pressable
                    className="rounded-t-[32px] bg-[#F3E1CE] px-6 pb-10 pt-4"
                    onPress={(event) => event.stopPropagation()}
                >
                    <View className="mb-6 items-center">
                        <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-background shadow-lg">
                            <MaterialIcons name="music-note" size={42} color="#FFCD9F" />
                        </View>
                        <Text typeface="display" className="mt-4 text-4xl font-bold tracking-[1px] text-background">
                            Encore
                        </Text>
                        <Text className="mt-1 text-center text-sm text-[#A47148]">
                            {i18n.t("settings.aboutTagline")}
                        </Text>
                        <View className="mt-4 rounded-full bg-[#FFCD9F] px-3 py-1">
                            <Text className="text-xs font-bold uppercase tracking-[1.5px] text-background">
                                {i18n.t("settings.aboutVersion")} {app.expo.version}
                            </Text>
                        </View>
                    </View>

                    <View className="rounded-3xl bg-[#E8CFB8] px-5 py-1">
                        <AboutRow
                            icon="person-outline"
                            title={i18n.t("settings.developedBy")}
                            value="Alex Aperador"
                        />
                        <AboutDivider />
                        <AboutRow
                            icon="code"
                            title={i18n.t("settings.technologies")}
                            value="Expo  ·  React Native  ·  TypeScript"
                        />
                        <AboutDivider />
                        <AboutRow
                            icon="lock-outline"
                            title={i18n.t("settings.privacy")}
                            value={i18n.t("settings.privacyDescription")}
                        />
                        <AboutDivider />
                        <AboutRow
                            icon="favorite-border"
                            title={i18n.t("settings.openSource")}
                            value={i18n.t("settings.openSourceDescription")}
                        />
                    </View>

                    <Text className="mt-6 text-center text-xs font-semibold text-[#A47148]">
                        {i18n.t("settings.copyright", { year: new Date().getFullYear() })}
                    </Text>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={i18n.t("settings.close")}
                        className="absolute right-6 top-5 h-10 w-10 items-center justify-center rounded-full bg-[#FFCD9F]"
                        onPress={onClose}
                    >
                        <MaterialIcons name="close" size={22} color="#3E2C23" />
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function AboutDivider() {
    return <View className="ml-9 h-px bg-[#D6B99C]" />;
}

function AboutRow({
    icon,
    title,
    value,
}: {
    icon: React.ComponentProps<typeof MaterialIcons>["name"];
    title: string;
    value: string;
}) {
    return (
        <View className="flex-row items-center py-4">
            <MaterialIcons name={icon} size={21} color="#A47148" />
            <View className="ml-3 flex-1">
                <Text className="text-xs font-bold uppercase tracking-[1.5px] text-[#A47148]">
                    {title}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-background">{value}</Text>
            </View>
        </View>
    );
}

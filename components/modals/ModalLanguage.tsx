import { getStoredLanguage, i18n, setLanguage, type Language } from "@/lib/i18n";
import Text from "@/components/EncoreText";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";

export default function ModalLanguage({
    isVisible,
    onClose,
    onLanguageChange,
}: {
    isVisible: boolean;
    onClose: () => void;
    onLanguageChange?: (language: Language) => void;
}) {
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(
        i18n.locale.startsWith("en") ? "en" : "es",
    );

    useEffect(() => {
        getStoredLanguage().then((language) => {
            if (!language) return;

            setLanguage(language);
            setSelectedLanguage(language);
        });
    }, []);

    const selectLanguage = (language: Language) => {
        setLanguage(language);
        setSelectedLanguage(language);
        onLanguageChange?.(language);
        onClose();
    };


    return (
        <Modal
            animationType="slide"
            transparent
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 justify-end bg-black/40"
                onPress={onClose}
            >
                <Pressable
                    className="rounded-t-3xl bg-[#F3E1CE] px-6 pb-10 pt-6"
                    onPress={(event) => event.stopPropagation()}
                >
                    <View className="mb-5 flex-row items-center justify-between">
                        <Text typeface="display" className="text-2xl font-bold text-background">
                            {i18n.t("settings.changeLanguage")}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={i18n.t("settings.close")}
                            className="h-10 w-10 items-center justify-center rounded-full bg-[#FFCD9F]"
                            onPress={onClose}
                        >
                            <MaterialIcons name="close" size={22} color="#3E2C23" />
                        </Pressable>
                    </View>
                    {(["es", "en"] as const).map((language) => {
                        const isSelected = selectedLanguage === language;

                        return (
                            <Pressable
                                key={language}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isSelected }}
                                className={`mb-3 flex-row items-center justify-between rounded-2xl px-4 py-4 ${isSelected ? "bg-background" : "bg-[#E8CFB8]"}`}
                                onPress={() => selectLanguage(language)}
                            >
                                <View className="flex-row items-center">
                                    <Text
                                        className={`mr-3 text-sm font-bold ${isSelected ? "text-[#FFCD9F]" : "text-[#A47148]"}`}
                                    >
                                        {language.toUpperCase()}
                                    </Text>
                                    <Text
                                        className={`text-base font-semibold ${isSelected ? "text-white" : "text-background"}`}
                                    >
                                        {language === "es"
                                            ? i18n.t("settings.languageSpanish")
                                            : i18n.t("settings.languageEnglish")}
                                    </Text>
                                </View>
                                {isSelected ? (
                                    <MaterialIcons name="check" size={22} color="#FFCD9F" />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </Pressable>
            </Pressable>
        </Modal>
    )
}

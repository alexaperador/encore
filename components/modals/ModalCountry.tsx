import {
    COUNTRIES,
    getStoredCountry,
    setCountry,
    type CountryCode,
} from "@/lib/country";
import Text from "@/components/EncoreText";
import { i18n } from "@/lib/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";

export default function ModalCountry({
    isVisible,
    onClose,
    onCountryChange,
}: {
    isVisible: boolean;
    onClose: () => void;
    onCountryChange?: (country: CountryCode) => void;
}) {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ES");

    useEffect(() => {
        getStoredCountry().then(setSelectedCountry);
    }, []);

    const selectCountry = (country: CountryCode) => {
        setCountry(country);
        setSelectedCountry(country);
        onCountryChange?.(country);
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
                            {i18n.t("settings.changeCountry")}
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
                    {COUNTRIES.map((country) => {
                        const isSelected = selectedCountry === country.code;

                        return (
                            <Pressable
                                key={country.code}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isSelected }}
                                className={`mb-3 flex-row items-center justify-between rounded-2xl px-4 py-4 ${isSelected ? "bg-background" : "bg-[#E8CFB8]"}`}
                                onPress={() => selectCountry(country.code)}
                            >
                                <View className="flex-row items-center">
                                    <Text
                                        className={`mr-3 text-sm font-bold ${isSelected ? "text-[#FFCD9F]" : "text-[#A47148]"}`}
                                    >
                                        {country.code}
                                    </Text>
                                    <Text
                                        className={`text-base font-semibold ${isSelected ? "text-white" : "text-background"}`}
                                    >
                                        {i18n.t(country.nameKey)}
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

import ModalConcert from "@/components/ModalConcert";
import type { Concert } from "@/lib/concerts";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

function parseConcert(value: string | string[] | undefined): Concert | null {
    if (typeof value !== "string") return null;

    try {
        let parsed: unknown;

        try {
            parsed = JSON.parse(value);
        } catch {
            parsed = JSON.parse(decodeURIComponent(value));
        }

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            typeof (parsed as Concert).id !== "string" ||
            typeof (parsed as Concert).title !== "string"
        ) {
            return null;
        }

        return parsed as Concert;
    } catch {
        return null;
    }
}

export default function SharedConcert() {
    const { data } = useLocalSearchParams<{ data?: string }>();
    const concert = parseConcert(data);

    if (!concert) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-8">
                <Text className="text-center text-xl font-bold text-[#3E2C23]">
                    No se pudo abrir este concierto
                </Text>
                <Text className="mt-2 text-center text-base text-[#6B7280]">
                    El enlace no contiene un concierto válido.
                </Text>
            </View>
        );
    }

    return (
        <ModalConcert
            concert={concert}
            onClose={() => router.back()}
        />
    );
}

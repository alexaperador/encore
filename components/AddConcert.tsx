import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import ModalAddConcert from "./ModalAddConcert";

export default function AddConcert() {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Añadir recordatorio"
                onPress={() => setIsVisible(true)}
                className="mt-4"
            >
                <View className="flex items-center justify-center rounded-full bg-background px-4 py-2">
                    <Text className="text-white">Añadir recordatorio</Text>
                </View>
            </Pressable>
            {isVisible ? (
                <ModalAddConcert onClose={() => setIsVisible(false)} />
            ) : null}
        </>
    );
}
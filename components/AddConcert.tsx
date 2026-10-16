import { useState } from "react";
import { Pressable } from "react-native";
import ModalAddConcert from "./ModalAddConcert";

export default function AddConcert({
    children,
    onConcertAdded,
}: {
    children?: React.ReactNode;
    onConcertAdded?: () => void;
}) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Añadir recordatorio"
                onPress={() => setIsVisible(true)}
            >
                {children}
            </Pressable>
            {isVisible ? (
                <ModalAddConcert
                    onClose={() => setIsVisible(false)}
                    onSaved={onConcertAdded}
                />
            ) : null}
        </>
    );
}
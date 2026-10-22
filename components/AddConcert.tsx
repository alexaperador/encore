import { useState, ReactNode } from "react";
import { Pressable } from "react-native";
import ModalAddConcert from "./modals/ModalAddConcert";
import { i18n } from "@/lib/i18n";

export default function AddConcert({
    children,
    onConcertAdded,
}: {
    children?: ReactNode;
    onConcertAdded?: () => void;
}) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18n.t("concerts.addReminder")}
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
import { i18n } from "@/lib/i18n";
import Text from "@/components/EncoreText";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal, TouchableOpacity, View } from "react-native";

export default function ModalConfirm({
    isVisible,
    onClose,
    onConfirm,
    title,
    message,
}: {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) {
    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View className="flex-1 items-center justify-center bg-black/50">
                <View className="w-11/12 rounded-3xl bg-background p-6">
                    <View className="flex-row items-center gap-2 mb-4 ">
                        <MaterialIcons name="delete" size={24} color="#ff4d4d" />
                        <Text className="text-lg font-bold text-[#ff4d4d]">{title}</Text>
                    </View>
                    <Text className="mb-6 text-base text-white">{message}</Text>
                    <View className="flex-row justify-end gap-4">
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={i18n.t("common.cancel")}
                            onPress={onClose}
                            className="rounded-2xl bg-[#6F4E37] px-4 py-2"
                        >
                            <Text className="text-sm font-semibold text-white">
                                {i18n.t("common.cancel")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={i18n.t("common.confirm")}
                            onPress={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="rounded-2xl bg-[#FFCD9F] px-4 py-2"
                        >
                            <Text className="text-sm font-semibold text-background">
                                {i18n.t("common.confirm")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

import { COLORS } from "@/constants/Colors";
import { Text, View } from "react-native";

export default function Test() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className={`text-4xl font-bold text-[${COLORS.background}]`}>
        Explorar
      </Text>
    </View>
  );
}
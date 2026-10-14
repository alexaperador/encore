import { Concert } from "@/lib/concerts";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatConcertDate(date: string | null) {
  if (!date) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function ModalConcert({
  concert,
  onClose,
}: {
  concert: Concert;
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <ScrollView style={{ flex: 1 }}>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar detalles"
              onPress={onClose}
              className="mb-4 self-start rounded-full bg-[#F3F4F6] p-2 absolute top-20 left-4 z-10"
            >
              <MaterialIcons name="arrow-back" size={24} color="#3E2C23" />
            </Pressable>
            {concert.imageUrl ? (
              <Image
                source={{ uri: concert.imageUrl }}
                accessibilityLabel={concert.title}
                className="h-100 w-full"
                resizeMode="cover"
              />
            ) : null}
          </View>
          <View className="px-4 py-6">
            <Text className="mb-2 text-2xl font-bold text-[#3E2C23]">
              {concert.title}
            </Text>
            <Text className="mb-2 text-base text-[#3E2C23]">
              {formatConcertDate(concert.date)}
            </Text>
            <Text className="mb-2 text-base text-[#3E2C23]">
              {concert.hour ?? "Hora no disponible"}
            </Text>
            <Text className="mb-2 text-base text-[#3E2C23]">
              {concert.venue ?? "Lugar no disponible"}
            </Text>
            <Text className="mb-2 text-base text-[#3E2C23]">
              {concert.city ?? "Ciudad no disponible"}
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Abrir página de tickets"
              onPress={() => {
                if (concert.ticketUrl) {
                  window.open(concert.ticketUrl, "_blank");
                }
              }}
              className="rounded bg-[#3E2C23] px-4 py-2"
            >
              <Text className="text-base font-bold text-[#F3F4F6]">
                Comprar Tickets
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

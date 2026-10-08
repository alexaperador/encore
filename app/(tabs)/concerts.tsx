import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Notificar from "./components/Notificar";
import { Button } from "react-native";


export default function TabTwoScreen() {
  const concerts = [
    { id: 1, name: "Quevedo", date: "2027-07-02", location: "Santiago Bernabeu", city: "Madrid" },
    { id: 2, name: "Lucho RK", date: "2027-08-20", location: "Palau Sant Jordi", city: "Barcelona" },
    { id: 3, name: "La Pantera", date: "2027-03-10", location: "Ciudad Real", city: "Valencia" },
    { id: 4, name: "La Pantera", date: "2027-03-10", location: "Ciudad Real", city: "Valencia" },
    { id: 5, name: "La Pantera", date: "2027-03-10", location: "Ciudad Real", city: "Valencia" },
    { id: 6, name: "La Pantera", date: "2027-03-10", location: "Ciudad Real", city: "Valencia" },
    { id: 7, name: "La Pantera", date: "2027-03-10", location: "Ciudad Real", city: "Valencia" },
  ];

  const activar = () => {
    Notificar.start(
      { local: 'Barça', visitante: 'Madrid', hora: '21:00', estado: 'Hoy' },
      'miapp://partido/1'
    );
  };

  const [favorites, setFavorites] = useState<number[]>([]);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  return (
    <SafeAreaView edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} className="h-full">
        {concerts.map((concert) => (
          <View key={concert.id} className="bg-[#6F4E37] p-4 m-2 rounded-lg shadow-md">
            <View className="flex flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-white">{concert.name}</Text>
              <Pressable onPress={() => {
                setFavorites(favorites => favorites.includes(concert.id) ? favorites.filter(id => id !== concert.id) : [...favorites, concert.id]);
              }}>
                <MaterialIcons name={favorites.includes(concert.id) ? "favorite" : "favorite-border"} size={22} color={"white"} />
              </Pressable>
            </View>
            <Text className="text-sm text-white">Date: {concert.date}</Text>
            <Text className="text-sm text-white">{concert.location} · {concert.city}</Text>
            <View className="mt-2 flex justify-between flex-row">
              <Text className="text-sm text-white bg-[#A47148] p-2 rounded-full">Quedan {Math.round((new Date(`${concert.date}T00:00:00`).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))} días</Text>
              <View className="flex flex-row gap-x-4">
                <Pressable onPress={activar}>
                  <MaterialIcons name={"notifications"} size={22} color={"white"} />
                </Pressable>
                <Pressable onPress={() => {

                }
                }>
                  <MaterialIcons name={"more-horiz"} size={22} color={"white"} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

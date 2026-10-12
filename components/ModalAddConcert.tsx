import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

function toCalendarDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatTime(date: Date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes(),
    ).padStart(2, "0")}`;
}

export default function ModalAddConcert({
    onClose,
}: {
    onClose: () => void;
}) {

    const [image, setImage] = useState<string | null>(null);
    const [artist, setArtist] = useState<string>("");
    const [eventName, setEventName] = useState<string>("");
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [timeText, setTimeText] = useState(formatTime(new Date()));
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

    const formattedDate = new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
    const formattedTime = formatTime(time);

    const changeTime = (part: "hours" | "minutes", amount: number) => {
        const nextTime = new Date(time);
        if (part === "hours") {
            nextTime.setHours((nextTime.getHours() + amount + 24) % 24);
        } else {
            nextTime.setMinutes((nextTime.getMinutes() + amount + 60) % 60);
        }
        setTime(nextTime);
        setTimeText(formatTime(nextTime));
    };

    const updateTimeFromText = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        const nextText = digits.length > 2
            ? `${digits.slice(0, 2)}:${digits.slice(2)}`
            : digits;
        setTimeText(nextText);

        if (digits.length !== 4) return;

        const hours = Number(digits.slice(0, 2));
        const minutes = Number(digits.slice(2));
        if (hours > 23 || minutes > 59) return;

        const nextTime = new Date(time);
        nextTime.setHours(hours, minutes, 0, 0);
        setTime(nextTime);
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert(
                "Permiso necesario",
                "Necesitamos acceso a tus fotos para elegir una portada.",
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    return (
        <Modal animationType="slide" visible onRequestClose={onClose}>
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 180 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="relative flex-row items-center justify-center px-6 py-5">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Cerrar añadir concierto"
                                onPress={onClose}
                                className="absolute left-5 rounded-full bg-[#EADACA] p-2"
                            >
                                <MaterialIcons name="close" size={22} color="#3E2C23" />
                            </Pressable>
                            <Text className="text-xl font-bold text-[#3E2C23]">
                                Añadir concierto
                            </Text>
                        </View>
                        <View className="px-6 pt-7">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={image ? "Cambiar portada" : "Elegir portada"}
                                onPress={pickImage}
                                className="h-56 overflow-hidden rounded-3xl border border-[#D9B99A] bg-[#EADACA]"
                            >
                                {image ? (
                                    <Image
                                        source={{ uri: image }}
                                        accessibilityLabel="Portada seleccionada"
                                        className="h-full w-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="flex-1 items-center justify-center px-8">
                                        <View className="rounded-full bg-[#F8F1EA] p-4">
                                            <MaterialIcons
                                                name="add-photo-alternate"
                                                size={30}
                                                color="#6F4E37"
                                            />
                                        </View>
                                        <Text className="mt-4 text-center text-base font-semibold text-[#3E2C23]">
                                            Elige una imagen
                                        </Text>
                                        <Text className="mt-1 text-center text-sm text-[#8A684E]">
                                            Toca para abrir tu galería
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                            <View className="mt-6">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    Artista *
                                </Text>
                                <TextInput
                                    placeholder="Nombre del artista"
                                    className="h-12 rounded-2xl border border-[#D9B99A] bg-[#EADACA] px-4 py-3 text-base font-semibold text-[#8A684E] placeholder:text-[#8A684E]/50"
                                    onChangeText={(text) => {
                                        setArtist(text);
                                    }}
                                    value={artist}
                                />
                            </View>
                            <View className="mt-6">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    Nombre del evento
                                </Text>
                                <TextInput
                                    placeholder="Ej: El Baifo Tour"
                                    className="h-12 rounded-2xl border border-[#D9B99A] bg-[#EADACA] px-4 py-3 text-base font-semibold text-[#8A684E] placeholder:text-[#8A684E]/50"
                                    onChangeText={(text) => {
                                        setEventName(text);
                                    }}
                                    value={eventName}
                                />
                            </View>
                            <View className="mt-6">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    Fecha *
                                </Text>
                                <View className="overflow-hidden rounded-2xl border border-[#D9B99A] bg-[#EADACA]">
                                    <View className="flex-row items-center px-4 py-3">
                                        <MaterialIcons name="event" size={20} color="#6F4E37" />
                                        <Text className="ml-3 text-base font-semibold text-[#3E2C23]">
                                            {formattedDate}
                                        </Text>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Cambiar fecha"
                                            onPress={() => setIsCalendarVisible(!isCalendarVisible)}
                                            className="ml-auto rounded-full bg-[#F8F1EA] p-2"
                                        >
                                            <MaterialIcons
                                                name={isCalendarVisible ? "close" : "edit"}
                                                size={20}
                                                color="#6F4E37"
                                            />
                                        </Pressable>
                                    </View>
                                    {isCalendarVisible && (
                                        <Calendar
                                            current={toCalendarDate(date)}
                                            minDate={toCalendarDate(new Date())}
                                            onDayPress={({ dateString }) => {
                                                setDate(new Date(`${dateString}T12:00:00`));
                                            }}
                                            markedDates={{
                                                [toCalendarDate(date)]: {
                                                    selected: true,
                                                    selectedColor: "#6F4E37",
                                                    selectedTextColor: "#F8F1EA",
                                                },
                                            }}
                                            theme={{
                                                backgroundColor: "#EADACA",
                                                calendarBackground: "#EADACA",
                                                textSectionTitleColor: "#8A684E",
                                                selectedDayBackgroundColor: "#6F4E37",
                                                selectedDayTextColor: "#F8F1EA",
                                                todayTextColor: "#C65D5D",
                                                dayTextColor: "#3E2C23",
                                                textDisabledColor: "#C9A27E",
                                                monthTextColor: "#3E2C23",
                                                arrowColor: "#6F4E37",
                                                textDayFontWeight: "600",
                                                textMonthFontWeight: "700",
                                                textDayHeaderFontWeight: "600",
                                            }}
                                        />)
                                    }
                                </View>
                            </View>
                            <View className="mt-6">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    Hora
                                </Text>
                                <View className="overflow-hidden rounded-2xl border border-[#D9B99A] bg-[#EADACA]">
                                    <View className="flex-row items-center px-4 py-3">
                                        <MaterialIcons name="schedule" size={20} color="#6F4E37" />
                                        <TextInput
                                            accessibilityLabel="Hora del concierto"
                                            className="ml-3 flex-1 py-0 text-base font-semibold text-[#3E2C23]"
                                            keyboardType="number-pad"
                                            maxLength={5}
                                            onChangeText={updateTimeFromText}
                                            onBlur={() => {
                                                const isValidTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeText);
                                                if (!isValidTime) setTimeText(formattedTime);
                                            }}
                                            placeholder="HH:mm"
                                            placeholderTextColor="#8A684E"
                                            value={timeText}
                                        />
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={isTimePickerVisible ? "Ocultar selector de hora" : "Mostrar selector de hora"}
                                            onPress={() => setIsTimePickerVisible((visible) => !visible)}
                                            className="rounded-full bg-[#F8F1EA] p-2"
                                        >
                                            <MaterialIcons
                                                name={isTimePickerVisible ? "close" : "edit"}
                                                size={20}
                                                color="#6F4E37"
                                            />
                                        </Pressable>
                                    </View>
                                    {isTimePickerVisible ? (
                                        <View className="flex-row justify-center gap-5 border-t border-[#D9B99A] px-6 py-4">
                                            {[
                                                { label: "Hora", part: "hours" as const, value: time.getHours() },
                                                { label: "Min", part: "minutes" as const, value: time.getMinutes() },
                                            ].map(({ label, part, value }) => (
                                                <View key={part} className="items-center">
                                                    <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-[#8A684E]">
                                                        {label}
                                                    </Text>
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={`Aumentar ${label.toLowerCase()}`}
                                                        onPress={() => changeTime(part, 1)}
                                                        className="rounded-full p-1"
                                                    >
                                                        <MaterialIcons name="keyboard-arrow-up" size={26} color="#6F4E37" />
                                                    </Pressable>
                                                    <View className="min-w-[72px] items-center rounded-xl border border-[#C9A27E] bg-[#F8F1EA] px-3 py-2">
                                                        <Text className="text-2xl font-bold tracking-widest text-[#3E2C23]">
                                                            {String(value).padStart(2, "0")}
                                                        </Text>
                                                    </View>
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={`Reducir ${label.toLowerCase()}`}
                                                        onPress={() => changeTime(part, -1)}
                                                        className="rounded-full p-1"
                                                    >
                                                        <MaterialIcons name="keyboard-arrow-down" size={26} color="#6F4E37" />
                                                    </Pressable>
                                                </View>
                                            ))}
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal >
    );
}
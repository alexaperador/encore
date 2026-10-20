import type { Concert } from "@/lib/concerts";
import { toggleFavoriteConcert } from "@/lib/favorites";
import { i18n } from "@/lib/i18n";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
    onSaved,
}: {
    onClose: () => void;
    onSaved?: () => void;
}) {
    const insets = useSafeAreaInsets();

    const [image, setImage] = useState<string | null>(null);
    const [artist, setArtist] = useState<string>("");
    const [eventName, setEventName] = useState<string>("");
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [timeText, setTimeText] = useState(formatTime(new Date()));
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
    const [city, setCity] = useState<string>("");
    const [venue, setVenue] = useState<string>("");

    const formattedDate = new Intl.DateTimeFormat(i18n.locale === "en" ? "en-US" : "es-ES", {
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
                i18n.t("modalAddConcert.permissionTitle"),
                i18n.t("modalAddConcert.permissionMessage"),
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

    const saveConcert = async () => {
        const trimmedArtist = artist.trim();
        const trimmedCity = city.trim();

        if (!trimmedArtist || !trimmedCity) {
            Alert.alert(
                i18n.t("modalAddConcert.missingDataTitle"),
                i18n.t("modalAddConcert.missingDataMessage"),
            );
            return;
        }

        const concert: Concert = {
            id: `local-${Date.now()}`,
            title: eventName.trim() || trimmedArtist,
            artist: trimmedArtist,
            category: "manual",
            date: toCalendarDate(date),
            hour: timeText,
            venue: venue.trim() || null,
            city: trimmedCity,
            imageUrl: image,
            ticketUrl: null,
            image: {
                url: image,
                width: null,
                height: null,
            },
        };

        try {
            await toggleFavoriteConcert(concert);
            onSaved?.();
            onClose();
        } catch {
            Alert.alert(
                i18n.t("modalAddConcert.saveErrorTitle"),
                i18n.t("modalAddConcert.saveErrorMessage"),
            );
        }
    };

    return (
        <Modal
            animationType="slide"
            statusBarTranslucent
            visible
            onRequestClose={onClose}
        >
            <SafeAreaView
                edges={[]}
                style={{
                    flex: 1,
                    backgroundColor: "#F8F1EA",
                    paddingTop: insets.top,
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, backgroundColor: "#F8F1EA" }}
                >
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="flex-row items-center justify-between border-b border-[#EADACA] px-6 pb-4 pt-4">
                            <View className="flex-1 pr-4">
                                <Text className="text-2xl font-bold text-[#3E2C23]">
                                    {i18n.t("modalAddConcert.title")}
                                </Text>
                                <Text className="mt-1 text-sm text-[#8A684E]">
                                    {i18n.t("modalAddConcert.subtitle")}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={i18n.t("modalAddConcert.close")}
                                onPress={onClose}
                                className="rounded-full bg-[#EADACA] p-2"
                            >
                                <MaterialIcons name="close" size={22} color="#3E2C23" />
                            </Pressable>
                        </View>
                        <View className="px-6 pt-6">
                            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8A684E]">
                                {i18n.t("modalAddConcert.cover")}
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={image ? i18n.t("modalAddConcert.changeCover") : i18n.t("modalAddConcert.chooseCover")}
                                onPress={pickImage}
                                className="h-80 overflow-hidden rounded-3xl w-full items-center border border-[#D9B99A] bg-[#EADACA]"
                            >
                                {image ? (
                                    <Image
                                        source={{ uri: image }}
                                        accessibilityLabel={i18n.t("modalAddConcert.selectedCover")}
                                        className="h-full w-80"
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
                                            {i18n.t("modalAddConcert.chooseImage")}
                                        </Text>
                                        <Text className="mt-1 text-center text-sm text-[#8A684E]">
                                            {i18n.t("modalAddConcert.galleryHint")}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                            <Text className="mb-1 mt-8 text-xs font-bold uppercase tracking-widest text-[#8A684E]">
                                {i18n.t("modalAddConcert.concertInfo")}
                            </Text>
                            <View className="mt-4">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    {i18n.t("modalAddConcert.artist")} *
                                </Text>
                                <TextInput
                                    placeholder={i18n.t("modalAddConcert.artistPlaceholder")}
                                    className="rounded-2xl border border-[#D9B99A] bg-[#EADACA] px-4 py-3  font-semibold text-[#3E2C23]"
                                    placeholderTextColor="#8A684E"
                                    onChangeText={(text) => {
                                        setArtist(text);
                                    }}
                                    value={artist}
                                />
                            </View>
                            <View className="mt-5">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    {i18n.t("modalAddConcert.eventName")}
                                </Text>
                                <TextInput
                                    placeholder={i18n.t("modalAddConcert.eventNamePlaceholder")}
                                    placeholderTextColor="#8A684E"
                                    className="rounded-2xl border border-[#D9B99A] bg-[#EADACA] px-4 py-3 font-semibold text-[#3E2C23]"
                                    onChangeText={(text) => {
                                        setEventName(text);
                                    }}
                                    value={eventName}
                                />
                            </View>
                            <Text className="mb-1 mt-8 text-xs font-bold uppercase tracking-widest text-[#8A684E]">
                                {i18n.t("modalAddConcert.when")}
                            </Text>
                            <View className="mt-4">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    {i18n.t("modalAddConcert.date")} *
                                </Text>
                                <View className="overflow-hidden rounded-2xl border border-[#D9B99A] bg-[#EADACA]">
                                    <View className="flex-row items-center px-4 py-2">
                                        <MaterialIcons name="event" size={20} color="#6F4E37" />
                                        <Text className="ml-3 font-semibold text-[#3E2C23]">
                                            {formattedDate}
                                        </Text>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel={i18n.t("modalAddConcert.changeDate")}
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
                                    {i18n.t("modalAddConcert.hour")}
                                </Text>
                                <View className="overflow-hidden rounded-2xl border border-[#D9B99A] bg-[#EADACA]">
                                    <View className="flex-row items-center px-4 py-2">
                                        <MaterialIcons name="schedule" size={20} color="#6F4E37" />
                                        <TextInput
                                            accessibilityLabel={i18n.t("modalAddConcert.concertTime")}
                                            className="ml-3 flex-1 py-0  font-semibold text-[#3E2C23]"
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
                                            accessibilityLabel={isTimePickerVisible ? i18n.t("modalAddConcert.hideTimePicker") : i18n.t("modalAddConcert.showTimePicker")}
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
                                                { label: i18n.t("modalAddConcert.hours"), part: "hours" as const, value: time.getHours() },
                                                { label: i18n.t("modalAddConcert.minutes"), part: "minutes" as const, value: time.getMinutes() },
                                            ].map(({ label, part, value }) => (
                                                <View key={part} className="items-center">
                                                    <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-[#8A684E]">
                                                        {label}
                                                    </Text>
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={i18n.t("modalAddConcert.increase", { label: label.toLowerCase() })}
                                                        onPress={() => changeTime(part, 1)}
                                                        className="rounded-full p-1"
                                                    >
                                                        <MaterialIcons name="keyboard-arrow-up" size={26} color="#6F4E37" />
                                                    </Pressable>
                                                    <View className="min-w-[72px] items-center rounded-2xl border border-[#C9A27E] bg-[#F8F1EA] px-3 py-2">
                                                        <Text className="text-2xl font-bold tracking-widest text-[#3E2C23]">
                                                            {String(value).padStart(2, "0")}
                                                        </Text>
                                                    </View>
                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={i18n.t("modalAddConcert.decrease", { label: label.toLowerCase() })}
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
                            <Text className="mb-1 mt-8 text-xs font-bold uppercase tracking-widest text-[#8A684E]">
                                {i18n.t("modalAddConcert.location")}
                            </Text>
                            <View className="mt-6">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    {i18n.t("modalAddConcert.city")} *
                                </Text>
                                <View className="flex-row items-center overflow-hidden rounded-2xl border border-[#D9B99A] bg-[#EADACA] px-4 py-3">
                                    <MaterialIcons name="location-city" size={20} color="#6F4E37" />
                                    <TextInput
                                        accessibilityLabel={i18n.t("modalAddConcert.city")}
                                        className="ml-3 flex-1 py-1 font-semibold text-[#3E2C23]"
                                        placeholder={i18n.t("modalAddConcert.cityPlaceholder")}
                                        placeholderTextColor="#8A684E"
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                            </View>
                            <View className="mt-6">
                                <Text className="mb-2 text-base font-semibold text-[#3E2C23]">
                                    {i18n.t("modalAddConcert.venue")}
                                </Text>
                                <View className="flex-row items-center overflow-hidden rounded-2xl border border-[#D9B99A] bg-[#EADACA] px-4 py-3">
                                    <MaterialIcons name="place" size={20} color="#6F4E37" />
                                    <TextInput
                                        accessibilityLabel={i18n.t("modalAddConcert.venue")}
                                        className="ml-3 flex-1 py-1 font-semibold text-[#3E2C23]"
                                        placeholder={i18n.t("modalAddConcert.venuePlaceholder")}
                                        placeholderTextColor="#8A684E"
                                        value={venue}
                                        onChangeText={setVenue}
                                    />
                                </View>
                            </View>
                        </View>
                        <View className="mt-10 px-6">
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={i18n.t("modalAddConcert.save")}
                                onPress={saveConcert}
                                className="items-center rounded-2xl bg-[#6F4E37] px-6 py-3"
                            >
                                <Text className="text-base font-bold text-[#F8F1EA]">
                                    {i18n.t("modalAddConcert.save")}
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal >
    );
}
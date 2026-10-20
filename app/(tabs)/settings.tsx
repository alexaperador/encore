import { getStoredLanguage, i18n, setLanguage, type Language } from "@/lib/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState, type ComponentProps } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

function SettingRow({
  icon,
  label,
  description,
  children,
}: {
  icon: IconName;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center px-4 py-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#6F4E37]">
        <MaterialIcons name={icon} size={21} color="#FFCD9F" />
      </View>
      <View className="mr-3 flex-1">
        <Text className="text-base font-semibold text-white">{label}</Text>
        {description ? (
          <Text className="mt-0.5 text-sm text-[#C9A27E]">{description}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-8">
      <Text className="mb-3 px-1 text-xs font-bold uppercase tracking-[2px] text-[#A47148]">
        {title}
      </Text>
      <View className="overflow-hidden rounded-3xl bg-background">
        {children}
      </View>
    </View>
  );
}

export default function Settings() {
  return <SettingsContent />;
}

function SettingsContent() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderAlertsEnabled, setReminderAlertsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    i18n.locale.startsWith("en") ? "en" : "es",
  );

  useEffect(() => {
    getStoredLanguage().then((language) => {
      if (!language) return;

      setLanguage(language);
      setSelectedLanguage(language);
    });
  }, []);

  const selectLanguage = (language: Language) => {
    setLanguage(language);
    setSelectedLanguage(language);
    setLanguageModalVisible(false);
  };

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 132, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4">
          <Text className="text-5xl font-bold text-background">{i18n.t("settings.title")}</Text>
          <Text className="mt-1 text-lg text-[#A47148]">
            {i18n.t("settings.subtitle")}
          </Text>
        </View>

        <Section title={i18n.t("settings.notifications")}>
          <SettingRow
            icon="notifications-none"
            label={i18n.t("settings.pushNotifications")}
            description={i18n.t("settings.pushNotificationsDescription")}
          >
            <Switch
              accessibilityLabel={i18n.t("settings.enablePushNotifications")}
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#6F4E37", true: "#A47148" }}
              thumbColor={notificationsEnabled ? "#FFCD9F" : "#C9A27E"}
            />
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow
            icon="event"
            label={i18n.t("settings.reminders")}
            description={i18n.t("settings.remindersDescription")}
          >
            <Switch
              accessibilityLabel={i18n.t("settings.enableReminders")}
              value={reminderAlertsEnabled}
              onValueChange={setReminderAlertsEnabled}
              trackColor={{ false: "#6F4E37", true: "#A47148" }}
              thumbColor={reminderAlertsEnabled ? "#FFCD9F" : "#C9A27E"}
            />
          </SettingRow>
        </Section>

        <Section title={i18n.t("settings.preferences")}>
          <SettingRow
            icon="translate"
            label={i18n.t("settings.language")}
            description={i18n.t("settings.appLanguage")}
          >
            <Pressable
              accessibilityRole="button"
              className="rounded-xl bg-[#FFCD9F] px-3 py-2 flex-row items-center"
              onPress={() => setLanguageModalVisible(true)}
            >
              <Text className="text-sm font-bold text-background">
                {selectedLanguage === "en"
                  ? i18n.t("settings.languageEnglish")
                  : i18n.t("settings.languageSpanish")}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#3E2C23" />
            </Pressable>
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow
            icon="public"
            label={i18n.t("settings.country")}
            description={i18n.t("settings.countryDescription")}
          >
            <Pressable
              accessibilityRole="button"
              className="rounded-xl bg-[#FFCD9F] px-3 py-2 flex-row items-center"
            >
              <Text className="text-sm font-bold text-background">{i18n.t("settings.spain")}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#3E2C23" />
            </Pressable>
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow
            icon="dark-mode"
            label={i18n.t("settings.darkMode")}
            description={i18n.t("settings.darkModeDescription")}
          >
            <Switch
              accessibilityLabel="Activar modo oscuro"
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#6F4E37", true: "#A47148" }}
              thumbColor={darkModeEnabled ? "#FFCD9F" : "#C9A27E"}
            />
          </SettingRow>
        </Section>

        <Section title={i18n.t("settings.information")}>
          <SettingRow
            icon="info-outline"
            label={i18n.t("settings.version")}
            description={i18n.t("settings.versionDescription")}
          >
            <Text className="text-sm font-semibold text-[#FFCD9F]">1.0.0</Text>
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow
            icon="auto-awesome"
            label={i18n.t("settings.about")}
            description={i18n.t("settings.aboutDescription")}
          >
            <Pressable
              accessibilityRole="button"
              className="rounded-xl border border-[#A47148] px-3 py-2"
            >
              <Text className="text-sm font-bold text-[#FFCD9F]">{i18n.t("settings.seeMore")}</Text>
            </Pressable>
          </SettingRow>
        </Section>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18n.t("settings.deleteReminders")}
          className="mt-8 flex-row items-center justify-center rounded-2xl border border-red-900 bg-[#ce3c3cb9] px-4 py-4"
        >
          <MaterialIcons name="delete-outline" size={21} color="white" />
          <Text className="ml-2 text-sm font-semibold text-white">
            {i18n.t("settings.deleteReminders")}
          </Text>
        </Pressable>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={isLanguageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-[#F3E1CE] px-6 pb-10 pt-6"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-background">
                {i18n.t("settings.changeLanguage")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={i18n.t("settings.close")}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#FFCD9F]"
                onPress={() => setLanguageModalVisible(false)}
              >
                <MaterialIcons name="close" size={22} color="#3E2C23" />
              </Pressable>
            </View>
            {(["es", "en"] as const).map((language) => {
              const isSelected = selectedLanguage === language;

              return (
                <Pressable
                  key={language}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className={`mb-3 flex-row items-center justify-between rounded-2xl px-4 py-4 ${isSelected ? "bg-background" : "bg-[#E8CFB8]"}`}
                  onPress={() => selectLanguage(language)}
                >
                  <View className="flex-row items-center">
                    <Text
                      className={`mr-3 text-sm font-bold ${isSelected ? "text-[#FFCD9F]" : "text-[#A47148]"}`}
                    >
                      {language.toUpperCase()}
                    </Text>
                    <Text
                      className={`text-base font-semibold ${isSelected ? "text-white" : "text-background"}`}
                    >
                      {language === "es"
                        ? i18n.t("settings.languageSpanish")
                        : i18n.t("settings.languageEnglish")}
                    </Text>
                  </View>
                  {isSelected ? (
                    <MaterialIcons name="check" size={22} color="#FFCD9F" />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

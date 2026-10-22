import ModalConfirm from "@/components/modals/ModalConfirm";
import ModalCountry from "@/components/modals/ModalCountry";
import ModalLanguage from "@/components/modals/ModalLanguage";
import ModalAbout from "@/components/modals/ModalAbout";
import { COUNTRIES, getStoredCountry, type CountryCode } from "@/lib/country";
import { removeAppKeys } from "@/lib/favorites";
import { i18n, type Language } from "@/lib/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState, type ComponentProps } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import app from "../../app.json";

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
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#6F4E37]">
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
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [isCountryModalVisible, setCountryModalVisible] = useState(false);
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);
  const [isDeleteRemindersModalVisible, setDeleteRemindersModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ES");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    i18n.locale.startsWith("en") ? "en" : "es",
  );

  useEffect(() => {
    getStoredCountry().then(setSelectedCountry);
  }, []);

  const selectedCountryName = COUNTRIES.find(
    (country) => country.code === selectedCountry,
  )?.nameKey;

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

        <Section title={i18n.t("settings.preferences")}>
          <SettingRow
            icon="translate"
            label={i18n.t("settings.language")}
            description={i18n.t("settings.appLanguage")}
          >
            <Pressable
              accessibilityRole="button"
              className="rounded-2xl bg-[#FFCD9F] px-3 py-2 flex-row items-center"
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
              className="rounded-2xl bg-[#FFCD9F] px-3 py-2 flex-row items-center"
              onPress={() => setCountryModalVisible(true)}
            >
              <Text className="text-sm font-bold text-background">
                {selectedCountryName ? i18n.t(selectedCountryName) : ""}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#3E2C23" />
            </Pressable>
          </SettingRow>
        </Section>

        <Section title={i18n.t("settings.information")}>
          <SettingRow
            icon="info-outline"
            label={i18n.t("settings.version")}
            description={i18n.t("settings.versionDescription")}
          >
            <Text className="text-sm font-semibold text-[#FFCD9F]">{app.expo.version}</Text>
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow
            icon="auto-awesome"
            label={i18n.t("settings.about")}
            description={i18n.t("settings.aboutDescription")}
          >
            <Pressable
              accessibilityRole="button"
              className="rounded-2xl border border-[#A47148] px-3 py-2"
              onPress={() => setAboutModalVisible(true)}
            >
              <Text className="text-sm font-bold text-[#FFCD9F]">{i18n.t("settings.seeMore")}</Text>
            </Pressable>
          </SettingRow>
        </Section>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18n.t("settings.deleteData")}
          className="mt-8 flex-row items-center justify-center rounded-2xl bg-red-600 px-4 py-4"
          onPress={() => setDeleteRemindersModalVisible(true)}
        >
          <MaterialIcons name="delete-outline" size={21} color="white" />
          <Text className="ml-2 text-sm font-semibold text-white">
            {i18n.t("settings.deleteData")}
          </Text>
        </Pressable>
      </ScrollView>
      <ModalLanguage
        isVisible={isLanguageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        onLanguageChange={setSelectedLanguage}
      />
      <ModalCountry
        isVisible={isCountryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        onCountryChange={setSelectedCountry}
      />
      <ModalAbout
        isVisible={isAboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
      />
      <ModalConfirm
        isVisible={isDeleteRemindersModalVisible}
        onClose={() => setDeleteRemindersModalVisible(false)}
        onConfirm={() => {
          removeAppKeys();
        }}
        title={i18n.t("settings.deleteData")}
        message={i18n.t("settings.deleteDataConfirmation")}
      />
    </SafeAreaView>
  );
}

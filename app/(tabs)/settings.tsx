import { MaterialIcons } from "@expo/vector-icons";
import { useState, type ComponentProps } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
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
  return (
    <SettingsContent />
  );
}

function SettingsContent() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderAlertsEnabled, setReminderAlertsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 132, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4">
          <Text className="text-5xl font-bold text-background">Ajustes</Text>
          <Text className="mt-1 text-lg text-[#A47148]">
            Personaliza tu experiencia en Encore
          </Text>
        </View>

        <Section title="Notificaciones">
          <SettingRow
            icon="notifications-none"
            label="Notificaciones push"
            description="Recibe novedades de tus conciertos"
          >
            <Switch
              accessibilityLabel="Activar notificaciones push"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#6F4E37", true: "#A47148" }}
              thumbColor={notificationsEnabled ? "#FFCD9F" : "#C9A27E"}
            />
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow
            icon="event"
            label="Recordatorios"
            description="Te avisamos antes de cada evento"
          >
            <Switch
              accessibilityLabel="Activar recordatorios"
              value={reminderAlertsEnabled}
              onValueChange={setReminderAlertsEnabled}
              trackColor={{ false: "#6F4E37", true: "#A47148" }}
              thumbColor={reminderAlertsEnabled ? "#FFCD9F" : "#C9A27E"}
            />
          </SettingRow>
        </Section>

        <Section title="Preferencias">
          <SettingRow icon="translate" label="Idioma" description="Idioma de la aplicación">
            <Pressable
              accessibilityRole="button"
              className="rounded-xl bg-[#FFCD9F] px-3 py-2 flex-row items-center"
            >
              <Text className="text-sm font-bold text-background">Español</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#3E2C23" />
            </Pressable>
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow icon="translate" label="País preferido" description="Elige el país para mostrar conciertos">
            <Pressable
              accessibilityRole="button"
              className="rounded-xl bg-[#FFCD9F] px-3 py-2 flex-row items-center"
            >
              <Text className="text-sm font-bold text-background">España</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#3E2C23" />
            </Pressable>
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow icon="dark-mode" label="Modo oscuro" description="Ajusta el aspecto de Encore">
            <Switch
              accessibilityLabel="Activar modo oscuro"
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#6F4E37", true: "#A47148" }}
              thumbColor={darkModeEnabled ? "#FFCD9F" : "#C9A27E"}
            />
          </SettingRow>
        </Section>

        <Section title="Información">
          <SettingRow icon="info-outline" label="Versión" description="Tu versión actual de Encore">
            <Text className="text-sm font-semibold text-[#FFCD9F]">1.0.0</Text>
          </SettingRow>
          <View className="ml-[68px] h-px bg-[#6F4E37]" />
          <SettingRow icon="auto-awesome" label="Sobre la app" description="Conoce más sobre Encore">
            <Pressable
              accessibilityRole="button"
              className="rounded-xl border border-[#A47148] px-3 py-2"
            >
              <Text className="text-sm font-bold text-[#FFCD9F]">Ver más</Text>
            </Pressable>
          </SettingRow>
        </Section>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar todos los recordatorios"
          className="mt-8 flex-row items-center justify-center rounded-2xl border border-red-900 bg-[#ce3c3cb9] px-4 py-4"
        >
          <MaterialIcons name="delete-outline" size={21} color="white" />
          <Text className="ml-2 text-sm font-semibold text-white">
            Eliminar todos los recordatorios
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

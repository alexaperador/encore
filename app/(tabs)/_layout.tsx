import { COLORS } from "@/constants/Colors";
import { i18n, subscribeToLanguage } from "@/lib/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_HEIGHT = 46 + 16 + 12;

const SPRING = { damping: 16, stiffness: 190, mass: 0.8 } as const;

const icons = {
  index: { ios: "magnifyingglass", android: "search" },
  concerts: { ios: "heart.fill", android: "favorite" },
  alerts: { ios: "bell.fill", android: "notifications" },
  settings: { ios: "gearshape.fill", android: "settings" },
} as const;

type RouteName = keyof typeof icons;

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

function TabIcon({ name, color }: { name: RouteName; color: string }) {
  const icon = icons[name] ?? icons.index;

  return (
    <SymbolView
      name={icon.ios}
      size={21}
      tintColor={color}
      fallback={<MaterialIcons name={icon.android} size={22} color={color} />}
    />
  );
}

function TabItem({
  route,
  isFocused,
  options,
  navigation,
}: {
  route: TabBarProps["state"]["routes"][number];
  isFocused: boolean;
  options: TabBarProps["descriptors"][string]["options"];
  navigation: TabBarProps["navigation"];
}) {
  const progress = useSharedValue(isFocused ? 1 : 0);
  const pressed = useSharedValue(0);

  const name = (route.name in icons ? route.name : "index") as RouteName;
  const label =
    (typeof options.title === "string" && options.title) ||
    route.name;

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING);
  }, [isFocused, progress]);

  const itemStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(17,17,17,0)", COLORS.active],
    ),
    paddingHorizontal: interpolate(progress.value, [0, 1], [13, 16]),
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.94]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    maxWidth: interpolate(progress.value, [0, 1], [0, 90]),
    marginLeft: interpolate(progress.value, [0, 1], [0, 7]),
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]),
  }));

  const onPress = () => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <Pressable
      accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      testID={options.tabBarButtonTestID}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
      }}
      onLongPress={() =>
        navigation.emit({ type: "tabLongPress", target: route.key })
      }
      style={styles.pressable}
    >
      <Animated.View className="rounded-2xl" style={[styles.item, itemStyle]}>
        <TabIcon
          name={name}
          color={isFocused ? COLORS.activeIcon : COLORS.inactiveIcon}
        />

        <Animated.Text
          numberOfLines={1}
          style={[styles.label, labelStyle]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.bar} className="rounded-2xl" accessibilityRole="tablist">
        {state.routes.map((route, index) => (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === index}
            options={descriptors[route.key].options}
            navigation={navigation}
          />
        ))}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const [, refreshLanguage] = useState(0);

  useEffect(
    () => subscribeToLanguage(() => refreshLanguage((value) => value + 1)),
    [refreshLanguage],
  );

  const labels: Record<RouteName, string> = {
    index: i18n.t("navbar.explore"),
    concerts: i18n.t("navbar.concerts"),
    alerts: i18n.t("navbar.alerts"),
    settings: i18n.t("navbar.settings"),
  };

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: labels.index }} />
      <Tabs.Screen name="concerts" options={{ title: labels.concerts }} />
      <Tabs.Screen name="alerts" options={{ title: labels.alerts }} />
      <Tabs.Screen name="settings" options={{ title: labels.settings }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },

  bar: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 10,
    flexDirection: "row",
    gap: 4,
    maxWidth: "92%",
    padding: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },

  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },

  item: {
    alignItems: "center",
    flexDirection: "row",
    height: 46,
    justifyContent: "center",
    minWidth: 46,
  },

  label: {
    color: COLORS.activeIcon,
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
});
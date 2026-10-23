import type { TextInputProps, TextProps } from "react-native";
import { Text as NativeText, TextInput as NativeTextInput } from "react-native";

type Typeface = "body" | "display";

type EncoreTextProps = TextProps & {
  className?: string;
  typeface?: Typeface;
};

function getFontFamily(className: string, typeface: Typeface) {
  const weight = className.split(/\s+/).find((name) =>
    ["font-medium", "font-semibold", "font-bold", "font-extrabold", "font-black"].includes(name),
  );

  const suffix =
    weight === "font-medium"
      ? "Medium"
      : weight === "font-semibold"
        ? "SemiBold"
        : weight
          ? "Bold"
          : "Regular";

  return `${typeface === "display" ? "SpaceGrotesk" : "DMSans"}-${suffix}`;
}

export default function EncoreText({
  className = "",
  typeface = "body",
  style,
  ...props
}: EncoreTextProps) {
  return (
    <NativeText
      {...props}
      className={className}
      style={[{ fontFamily: getFontFamily(className, typeface) }, style]}
    />
  );
}

type EncoreTextInputProps = TextInputProps & {
  className?: string;
};

export function EncoreTextInput({ className = "", style, ...props }: EncoreTextInputProps) {
  return (
    <NativeTextInput
      {...props}
      className={className}
      style={[{ fontFamily: getFontFamily(className, "body") }, style]}
    />
  );
}

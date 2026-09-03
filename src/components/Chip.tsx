import { StyleSheet, Text, View } from "react-native";
import { colors, font, radius, spacing } from "../theme/theme";

interface Props {
  label: string;
  tone?: "have" | "missing" | "neutral";
}

export default function Chip({ label, tone = "neutral" }: Props) {
  const palette =
    tone === "have"
      ? { bg: colors.chipHave, fg: colors.chipHaveText }
      : tone === "missing"
        ? { bg: colors.chipMissing, fg: colors.chipMissingText }
        : { bg: colors.surfaceAlt, fg: colors.textMuted };

  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>
        {tone === "have" ? "✓ " : tone === "missing" ? "+ " : ""}
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
  },
  text: {
    fontSize: font.small,
    fontWeight: "600",
  },
});

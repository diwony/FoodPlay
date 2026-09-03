import { StyleSheet, Text, View } from "react-native";
import { formatCookTime, formatDifficulty, type Recipe } from "@foodplay/core";
import { colors, font, radius, spacing } from "../theme/theme";

interface Props {
  recipe: Recipe;
}

/** 조리시간 · 난이도 · 추가 재료 수를 한 줄로 */
export default function MetaRow({ recipe }: Props) {
  const items = [
    { icon: "⏱", label: formatCookTime(recipe.cookMinutes) },
    { icon: "🔥", label: formatDifficulty(recipe.difficulty) },
    { icon: "🧺", label: `추가 재료 ${recipe.extraIngredients.length}개` },
  ];

  return (
    <View style={styles.row}>
      {items.map((it) => (
        <View key={it.label} style={styles.pill}>
          <Text style={styles.icon}>{it.icon}</Text>
          <Text style={styles.label}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
  },
  icon: { fontSize: font.small },
  label: { fontSize: font.small, color: colors.text, fontWeight: "600" },
});

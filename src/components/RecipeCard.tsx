import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { formatCookTime, formatDifficulty, vibeLabel, type RecipeMatch } from "@foodplay/core";
import { colors, font, radius, spacing } from "../theme/theme";
import Chip from "./Chip";

interface Props {
  match: RecipeMatch;
}

export default function RecipeCard({ match }: Props) {
  const { recipe, have, missing, score, matchedVibes } = match;

  return (
    <Link href={`/recipe/${recipe.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${recipe.title} 레시피 열기`}
      >
        <View style={styles.thumbWrap}>
          {/* 유튜브 기본 썸네일 — API 키 불필요 */}
          <Image
            source={{
              uri: `https://img.youtube.com/vi/${recipe.youtubeId}/hqdefault.jpg`,
            }}
            style={styles.thumb}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(score * 100)}%</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.sub}>
            {recipe.channel} · {formatCookTime(recipe.cookMinutes)} ·{" "}
            {formatDifficulty(recipe.difficulty)}
          </Text>

          <View style={styles.chips}>
            {have.map((h) => (
              <Chip key={h} label={h} tone="have" />
            ))}
            {missing.map((m) => (
              <Chip key={m} label={m} tone="missing" />
            ))}
          </View>

          {missing.length > 0 ? (
            <Text style={styles.missingNote}>
              {missing.length}개만 더 있으면 완성
            </Text>
          ) : (
            <Text style={styles.readyNote}>지금 재료로 바로 가능</Text>
          )}

          {matchedVibes.length > 0 && (
            <Text style={styles.vibeNote}>
              {matchedVibes.map((v) => `#${vibeLabel(v)}`).join("  ")}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
    gap: spacing(3),
  },
  pressed: { opacity: 0.7 },
  thumbWrap: { width: 84 },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  scoreBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
  },
  scoreText: { color: colors.primaryText, fontSize: font.tiny, fontWeight: "800" },
  body: { flex: 1, gap: spacing(1.5) },
  title: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  sub: { fontSize: font.tiny, color: colors.textMuted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5), marginTop: spacing(1) },
  missingNote: { fontSize: font.small, color: colors.primary, fontWeight: "700", marginTop: spacing(1) },
  readyNote: { fontSize: font.small, color: colors.accent, fontWeight: "700", marginTop: spacing(1) },
  vibeNote: { fontSize: font.tiny, color: colors.accent, fontWeight: "700" },
});

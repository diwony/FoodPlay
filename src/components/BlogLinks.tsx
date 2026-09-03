import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { blogSourceLabel, type BlogLink } from "@foodplay/core";
import { colors, font, radius, spacing } from "../theme/theme";

interface Props {
  blogs: BlogLink[];
}

/**
 * "블로그 레시피" 칸 — 영상과 별개로 글로 된 레시피를 곁들인다.
 * 탭하면 원본 사이트(네이버 블로그·티스토리·만개의레시피 등)를 브라우저로 연다.
 */
export default function BlogLinks({ blogs }: Props) {
  if (blogs.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>블로그 레시피</Text>
      <Text style={styles.hint}>
        영상 말고 글로 보고 싶을 때. 다른 사이트로 이동해요.
      </Text>

      {blogs.map((b) => {
        const label = blogSourceLabel(b.source);
        const showAuthor = b.author && b.author !== label;
        return (
          <Pressable
            key={b.url}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => Linking.openURL(b.url)}
            accessibilityRole="link"
            accessibilityLabel={`${b.title} — ${label}에서 열기`}
          >
            <View style={styles.tag}>
              <Text style={styles.tagText}>{label}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {b.title}
              </Text>
              {showAuthor && (
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {b.author}
                </Text>
              )}
            </View>
            <Text style={styles.arrow}>↗</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing(2), marginTop: spacing(2) },
  title: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(3),
  },
  pressed: { opacity: 0.7 },
  tag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
  },
  tagText: { fontSize: font.tiny, fontWeight: "800", color: colors.accent },
  body: { flex: 1, gap: spacing(0.5) },
  rowTitle: { fontSize: font.small, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: font.tiny, color: colors.textMuted },
  arrow: { fontSize: font.body, fontWeight: "800", color: colors.accent },
});

import { StyleSheet, Text, View } from "react-native";
import type { Reception as ReceptionData } from "@foodplay/core";
import { colors, font, radius, spacing } from "../theme/theme";

interface Props {
  reception: ReceptionData;
}

/** 유튜브 댓글 반응 요약 + 대표 댓글 몇 개 */
export default function Reception({ reception }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>영상 댓글 반응</Text>
      <Text style={styles.summary}>{reception.summary}</Text>

      <View style={styles.quotes}>
        {reception.quotes.map((q, i) => (
          <View key={i} style={styles.quote}>
            <Text style={styles.quoteText}>"{q.text}"</Text>
            {typeof q.likes === "number" && q.likes > 0 && (
              <Text style={styles.likes}>👍 {q.likes.toLocaleString()}</Text>
            )}
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        유튜브 공개 댓글에서 발췌 · 파이프라인이 상위 댓글을 요약
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing(2), marginTop: spacing(2) },
  title: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  summary: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  quotes: { gap: spacing(2) },
  quote: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing(3),
    gap: spacing(1),
  },
  quoteText: { fontSize: font.small, color: colors.text, lineHeight: 20 },
  likes: { fontSize: font.tiny, color: colors.textMuted, fontWeight: "700" },
  disclaimer: { fontSize: font.tiny, color: colors.textMuted },
});

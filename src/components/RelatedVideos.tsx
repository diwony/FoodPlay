import { router } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatCookTime, type Recipe } from "@foodplay/core";
import { colors, font, radius, spacing } from "../theme/theme";

interface Props {
  recipes: Recipe[];
}

/**
 * "추천 영상" 가로 캐러셀. 손가락으로 좌우 스와이프.
 * 탭하면 해당 레시피로 이동한다(같은 화면 재사용 → 플레이어는 새 영상으로 교체).
 */
export default function RelatedVideos({ recipes }: Props) {
  if (recipes.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>추천 영상</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={CARD_W + spacing(3)}
        snapToAlignment="start"
      >
        {recipes.map((r) => (
          <Pressable
            key={r.id}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => router.push(`/recipe/${r.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${r.title} 레시피로 이동`}
          >
            <Image
              source={{
                uri: `https://img.youtube.com/vi/${r.long.youtubeId}/mqdefault.jpg`,
              }}
              style={styles.thumb}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.cardTitle} numberOfLines={2}>
              {r.title}
            </Text>
            <Text style={styles.cardMeta}>
              {r.long.channel} · {formatCookTime(r.cookMinutes)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_W = 168;

const styles = StyleSheet.create({
  section: { gap: spacing(2), marginTop: spacing(2) },
  title: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  row: { gap: spacing(3), paddingRight: spacing(4) },
  card: { width: CARD_W, gap: spacing(1.5) },
  pressed: { opacity: 0.7 },
  thumb: {
    width: CARD_W,
    height: Math.round((CARD_W * 9) / 16),
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  cardTitle: { fontSize: font.small, fontWeight: "700", color: colors.text },
  cardMeta: { fontSize: font.tiny, color: colors.textMuted },
});

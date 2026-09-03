import { Stack, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Chip from "../../src/components/Chip";
import MetaRow from "../../src/components/MetaRow";
import YouTubePlayer, {
  type YouTubePlayerHandle,
} from "../../src/components/YouTubePlayer";
import { formatTimestamp } from "../../src/lib/format";
import { getRecipe } from "../../src/lib/match";
import { CONTENT_MAX_WIDTH, colors, font, radius, spacing } from "../../src/theme/theme";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = getRecipe(id);
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  if (!recipe) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>레시피를 찾을 수 없어요.</Text>
      </View>
    );
  }

  const playerWidth = Math.min(winWidth, CONTENT_MAX_WIDTH) - spacing(8);

  const jumpTo = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const openInYouTube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${recipe.youtubeId}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing(10) },
        ]}
      >
        {/* 영상: 화면 위 */}
        <YouTubePlayer ref={playerRef} youtubeId={recipe.youtubeId} width={playerWidth} />

        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.channel}>{recipe.channel}</Text>

        <MetaRow recipe={recipe} />

        {/* 추가로 필요한 재료 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추가로 필요한 재료</Text>
          <View style={styles.chipRow}>
            {recipe.extraIngredients.map((ing) => (
              <Chip key={ing} label={ing} tone="missing" />
            ))}
          </View>
        </View>

        {/* 조리 스텝: 영상 아래 텍스트, 타임스탬프 클릭 시 해당 구간 이동 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>조리 순서</Text>
          <Text style={styles.hint}>시간을 누르면 영상의 그 장면으로 이동해요.</Text>

          {recipe.steps.map((step) => (
            <View key={step.order} style={styles.step}>
              <Pressable
                onPress={() => jumpTo(step.start)}
                style={({ pressed }) => [
                  styles.timeBtn,
                  pressed && styles.timeBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${step.order}번 스텝, 영상 ${formatTimestamp(
                  step.start,
                )} 지점으로 이동`}
              >
                <Text style={styles.timeText}>
                  ▶ {formatTimestamp(step.start)}
                </Text>
              </Pressable>
              <View style={styles.stepBody}>
                <Text style={styles.stepOrder}>STEP {step.order}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable onPress={openInYouTube} style={styles.ytLink}>
          <Text style={styles.ytLinkText}>유튜브에서 전체 영상 보기 ↗</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing(4),
    gap: spacing(3),
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  title: { fontSize: font.h1, fontWeight: "800", color: colors.text, marginTop: spacing(1) },
  channel: { fontSize: font.small, color: colors.textMuted, marginTop: -spacing(1) },
  section: { gap: spacing(2), marginTop: spacing(2) },
  sectionTitle: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  step: {
    flexDirection: "row",
    gap: spacing(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(3),
  },
  timeBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
  },
  timeBtnPressed: { backgroundColor: colors.primary },
  timeText: { fontSize: font.small, fontWeight: "800", color: colors.primary },
  stepBody: { flex: 1, gap: spacing(1) },
  stepOrder: { fontSize: font.tiny, fontWeight: "800", color: colors.textMuted, letterSpacing: 1 },
  stepText: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  ytLink: {
    marginTop: spacing(4),
    alignItems: "center",
    paddingVertical: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ytLinkText: { fontSize: font.body, fontWeight: "700", color: colors.accent },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  missingText: { fontSize: font.body, color: colors.textMuted },
});

import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
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
import Reception from "../../src/components/Reception";
import RelatedVideos from "../../src/components/RelatedVideos";
import YouTubePlayer, {
  type YouTubePlayerHandle,
} from "../../src/components/YouTubePlayer";
import { formatTimestamp, getRecipe, relatedRecipes } from "@foodplay/core";
import { CONTENT_MAX_WIDTH, colors, font, radius, spacing } from "../../src/theme/theme";

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = getRecipe(id);
  const related = useMemo(() => relatedRecipes(id), [id]);

  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [mini, setMini] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // ── 레이아웃 계산 ──────────────────────────────────────────
  const PAD = spacing(4);
  const contentW = Math.min(winWidth, CONTENT_MAX_WIDTH);
  const dockedW = contentW - PAD * 2;
  const dockedH = Math.round((dockedW * 9) / 16);
  const dockedLeft = (winWidth - dockedW) / 2;

  const miniW = Math.min(Math.round(dockedW * 0.5), 190);
  const miniH = Math.round((miniW * 9) / 16);
  const DOCK_TOP = PAD;
  const FLOAT_TOP = insets.top + spacing(2);
  const SHRINK_END = dockedH * 1.05; // 이만큼 스크롤하면 미니 완료

  // 스크롤에 따라 top/left/width/height 를 보간 (transform 미사용 → 히트영역 정확)
  const clamp = { extrapolate: "clamp" as const };
  const range = [0, SHRINK_END];
  const aTop = scrollY.interpolate({ inputRange: range, outputRange: [DOCK_TOP, FLOAT_TOP], ...clamp });
  const aLeft = scrollY.interpolate({
    inputRange: range,
    outputRange: [dockedLeft, winWidth - miniW - spacing(3)],
    ...clamp,
  });
  const aWidth = scrollY.interpolate({ inputRange: range, outputRange: [dockedW, miniW], ...clamp });
  const aHeight = scrollY.interpolate({ inputRange: range, outputRange: [dockedH, miniH], ...clamp });
  const aScale = scrollY.interpolate({ inputRange: range, outputRange: [1, miniW / dockedW], ...clamp });
  const aShadow = scrollY.interpolate({ inputRange: range, outputRange: [0, 0.28], ...clamp });

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      setMini((prev) => {
        const next = y > SHRINK_END * 0.6;
        if (!next && dismissed) setDismissed(false); // 위로 오면 다시 표시
        return next === prev ? prev : next;
      });
    },
    [SHRINK_END, dismissed],
  );

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  if (!recipe) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>레시피를 찾을 수 없어요.</Text>
      </View>
    );
  }

  const jumpTo = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
    if (mini) scrollToTop();
  };

  const openInYouTube = () =>
    Linking.openURL(`https://www.youtube.com/watch?v=${recipe.youtubeId}`);

  const showPlayer = !(mini && dismissed);

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <View style={styles.screen}>
        <Animated.ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing(10) },
          ]}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: onScroll },
          )}
        >
          {/* 영상이 차지하는 자리 (플레이어는 아래 오버레이로 항상 떠 있음) */}
          <View style={{ height: dockedH, marginBottom: spacing(3) }} />

          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.channel}>{recipe.channel}</Text>

          <MetaRow recipe={recipe} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추가로 필요한 재료</Text>
            <View style={styles.chipRow}>
              {recipe.extraIngredients.map((ing) => (
                <Chip key={ing} label={ing} tone="missing" />
              ))}
            </View>
          </View>

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
                  <Text style={styles.timeText}>▶ {formatTimestamp(step.start)}</Text>
                </Pressable>
                <View style={styles.stepBody}>
                  <Text style={styles.stepOrder}>STEP {step.order}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {recipe.reception && <Reception reception={recipe.reception} />}

          <RelatedVideos recipes={related} />

          <Pressable onPress={openInYouTube} style={styles.ytLink}>
            <Text style={styles.ytLinkText}>유튜브에서 전체 영상 보기 ↗</Text>
          </Pressable>
        </Animated.ScrollView>

        {/* 항상 살아있는 단일 플레이어 오버레이 (스크롤 시 미니로 축소) */}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.playerLayer,
              {
                top: aTop,
                left: aLeft,
                width: aWidth,
                height: aHeight,
                opacity: showPlayer ? 1 : 0,
                shadowOpacity: aShadow,
              },
            ]}
            pointerEvents={showPlayer ? "auto" : "none"}
          >
            <Animated.View
              style={{
                width: dockedW,
                height: dockedH,
                transformOrigin: "top left",
                transform: [{ scale: aScale }],
              }}
            >
              <YouTubePlayer
                ref={playerRef}
                youtubeId={recipe.youtubeId}
                width={dockedW}
              />
            </Animated.View>

            {/* 미니 모드일 때만: 탭하면 펼치기, ✕ 로 닫기 */}
            {mini && showPlayer && (
              <>
                <Pressable
                  style={styles.miniExpand}
                  onPress={scrollToTop}
                  accessibilityRole="button"
                  accessibilityLabel="영상 펼치기"
                />
                <Pressable
                  style={styles.miniClose}
                  onPress={() => {
                    playerRef.current?.pause?.();
                    setDismissed(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="미니 영상 닫기"
                  hitSlop={8}
                >
                  <Text style={styles.miniCloseText}>✕</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing(4),
    paddingTop: spacing(4),
    gap: spacing(3),
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  playerLayer: {
    position: "absolute",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "#000",
    // 그림자 (미니일 때 진해짐)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  miniExpand: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  miniClose: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCloseText: { color: "#fff", fontSize: 12, fontWeight: "800" },
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

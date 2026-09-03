import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RecipeCard from "../src/components/RecipeCard";
import {
  INGREDIENT_GROUPS,
  matchRecipes,
  parseIngredients,
  QUICK_ADD_SET,
  VIBE_CHIPS,
  type Vibe,
} from "@foodplay/core";
import { CONTENT_MAX_WIDTH, colors, font, radius, spacing } from "../src/theme/theme";
import { useMyIngredients } from "../src/lib/myIngredients";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [raw, setRaw] = useState("");
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [draft, setDraft] = useState("");
  const myIngredients = useMyIngredients();

  const ingredients = useMemo(() => parseIngredients(raw), [raw]);
  const matches = useMemo(
    () => matchRecipes(ingredients, { vibes }),
    [ingredients, vibes],
  );

  // "더보기" — 처음엔 조금만, 누를 때마다 늘린다.
  const PAGE = 6;
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    setShown(PAGE);
  }, [raw, vibes]);
  const visible = useMemo(() => matches.slice(0, shown), [matches, shown]);
  const more = matches.length - visible.length;

  const toggleQuick = (item: string) => {
    const has = ingredients.includes(item);
    setRaw(
      (has ? ingredients.filter((i) => i !== item) : [...ingredients, item]).join(
        ", ",
      ),
    );
    Keyboard.dismiss();
  };

  const submitDraft = () => {
    const name = draft.trim();
    if (!name) return;
    myIngredients.add(name);
    if (!ingredients.includes(name)) {
      setRaw([...ingredients, name].join(", "));
    }
    setDraft("");
    Keyboard.dismiss();
  };

  const myChips = myIngredients.items.filter((i) => !QUICK_ADD_SET.has(i));

  const toggleVibe = (v: Vibe) => {
    setVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(m) => m.recipe.id}
        renderItem={({ item }) => <RecipeCard match={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing(6) },
        ]}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          more > 0 ? (
            <Pressable
              onPress={() => setShown((n) => n + PAGE)}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`더보기 ${more}개`}
            >
              <Text style={styles.moreText}>＋ 더보기 {more}개</Text>
            </Pressable>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.h1}>냉장고에 뭐 있어요?</Text>
            <Text style={styles.lead}>
              가진 재료를 적으면 만들 수 있는 요리 영상을 찾아드려요. 재료 1개만
              골라도 추천이 떠요.
            </Text>

            <TextInput
              value={raw}
              onChangeText={setRaw}
              placeholder="예: 김치, 계란, 대파, 두부"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              accessibilityLabel="냉장고 재료 입력"
            />

            <View style={styles.groupList}>
              {INGREDIENT_GROUPS.map((group) => (
                <View key={group.key} style={styles.group}>
                  <Text style={styles.vibeTitle}>
                    {group.emoji} {group.label}
                  </Text>
                  {group.hint ? (
                    <Text style={styles.groupHint}>{group.hint}</Text>
                  ) : null}
                  <View style={styles.quickWrap}>
                    {group.items.map((item) => {
                      const active = ingredients.includes(item);
                      return (
                        <Pressable
                          key={item}
                          onPress={() => toggleQuick(item)}
                          style={[styles.quick, active && styles.quickActive]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                        >
                          <Text
                            style={[
                              styles.quickText,
                              active && styles.quickTextActive,
                            ]}
                          >
                            {active ? "✓ " : "+ "}
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.mineBlock}>
              <Text style={styles.vibeTitle}>내가 자주 쓰는 재료</Text>
              <View style={styles.quickWrap}>
                {myChips.map((item) => {
                  const active = ingredients.includes(item);
                  return (
                    <View
                      key={item}
                      style={[styles.mineChip, active && styles.mineChipActive]}
                    >
                      <Pressable
                        onPress={() => toggleQuick(item)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text
                          style={[
                            styles.quickText,
                            active && styles.quickTextActive,
                          ]}
                        >
                          {active ? "✓ " : "+ "}
                          {item}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => myIngredients.remove(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`${item} 삭제`}
                        hitSlop={8}
                      >
                        <Text
                          style={[
                            styles.mineRemove,
                            active && styles.quickTextActive,
                          ]}
                        >
                          ×
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
                <View style={styles.mineAdd}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={submitDraft}
                    placeholder="직접 추가"
                    placeholderTextColor={colors.textMuted}
                    style={styles.mineAddInput}
                    returnKeyType="done"
                    accessibilityLabel="자주 쓰는 재료 추가"
                  />
                  <Pressable
                    onPress={submitDraft}
                    accessibilityRole="button"
                    accessibilityLabel="추가"
                    hitSlop={8}
                  >
                    <Text style={styles.mineAddPlus}>＋</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.vibeBlock}>
              <Text style={styles.vibeTitle}>오늘 기분 · 상황 (선택)</Text>
              <View style={styles.quickWrap}>
                {VIBE_CHIPS.map((c) => {
                  const active = vibes.includes(c.vibe);
                  return (
                    <Pressable
                      key={c.vibe}
                      onPress={() => toggleVibe(c.vibe)}
                      style={[styles.vibe, active && styles.vibeActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          styles.vibeText,
                          active && styles.vibeTextActive,
                        ]}
                      >
                        {c.emoji} {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {(ingredients.length > 0 || vibes.length > 0) && (
              <Text style={styles.count}>
                재료 {ingredients.length}개
                {vibes.length > 0 ? ` · 기분 ${vibes.length}개` : ""} · 레시피{" "}
                {matches.length}개 매칭
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              {ingredients.length === 0 ? "🧊" : "🤔"}
            </Text>
            <Text style={styles.emptyText}>
              {ingredients.length === 0
                ? "위에 재료를 입력하거나 아래 버튼으로 골라보세요."
                : "매칭되는 레시피가 없어요. 재료를 더 추가해 보세요."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: {
    padding: spacing(4),
    gap: spacing(3),
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  header: { gap: spacing(3), marginBottom: spacing(1) },
  h1: { fontSize: font.h1, fontWeight: "800", color: colors.text },
  lead: { fontSize: font.body, color: colors.textMuted, lineHeight: 21 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(3.5),
    fontSize: font.body,
    color: colors.text,
    minHeight: 56,
  },
  groupList: { gap: spacing(3) },
  group: { gap: spacing(1.5) },
  groupHint: { fontSize: font.small, color: colors.textMuted, lineHeight: 18 },
  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  quick: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickText: { fontSize: font.small, color: colors.text, fontWeight: "600" },
  quickTextActive: { color: colors.primaryText },
  vibeBlock: { gap: spacing(2) },
  mineBlock: { gap: spacing(2) },
  mineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mineChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  mineRemove: { fontSize: font.body, color: colors.textMuted, fontWeight: "700" },
  mineAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  mineAddInput: {
    minWidth: 72,
    fontSize: font.small,
    color: colors.text,
    paddingVertical: spacing(1),
  },
  mineAddPlus: { fontSize: font.body, color: colors.textMuted, fontWeight: "700" },
  vibeTitle: { fontSize: font.small, fontWeight: "800", color: colors.textMuted },
  vibe: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vibeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  vibeText: { fontSize: font.small, color: colors.text, fontWeight: "600" },
  vibeTextActive: { color: "#FFFFFF" },
  count: { fontSize: font.small, color: colors.textMuted, fontWeight: "600" },
  more: {
    marginTop: spacing(3),
    paddingVertical: spacing(3.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  pressed: { opacity: 0.7 },
  moreText: { fontSize: font.small, color: colors.textMuted, fontWeight: "700" },
  empty: { alignItems: "center", gap: spacing(3), paddingVertical: spacing(12) },
  emptyEmoji: { fontSize: 44 },
  emptyText: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 21,
  },
});

import {
  emptyOrganState,
  organDisplayText,
  setOrganNegative,
  setOrganText,
  toggleOrganTarget,
  type Organ,
} from '@ct-buddy/core';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, Input, Row, Segmented, T } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDraft } from '@/state/draft';

export const OrganRow = memo(function OrganRow({ organ }: { organ: Organ }) {
  const t = useTheme();
  const st = useDraft((s) => s.organs[organ.id]) ?? emptyOrganState();
  const mdc = useDraft((s) => s.config.mdc);
  const numeric = useDraft((s) => s.numericFields[organ.id]);
  const updateOrgan = useDraft((s) => s.updateOrgan);
  const setNumericField = useDraft((s) => s.setNumericField);
  const update = (fn: Parameters<typeof updateOrgan>[1]) => updateOrgan(organ.id, fn);

  const examples = [
    ...(organ.examples ?? []),
    ...(organ.example ? [{ label: 'esempio pre-scritto', text: organ.example }] : []),
  ];
  const showPositive = st.positive && st.text.trim() !== '';
  const words = st.text.trim().split(/\s+/).filter(Boolean);
  const nf = organ.compact?.numericField;

  return (
    <View
      style={[
        styles.row,
        { borderColor: t.border, backgroundColor: t.surface, opacity: st.yeeted ? 0.5 : 1 },
      ]}
    >
      <View style={styles.head}>
        <Text style={[styles.label, { color: t.text }]}>
          {st.isTarget ? '🎯 ' : ''}
          {st.flagged ? '🚩 ' : ''}
          {organ.label}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={st.yeeted ? 'Includi nel referto' : 'Escludi dal referto'}
          onPress={() => update((s) => ({ ...s, yeeted: !s.yeeted }))}
          hitSlop={8}
        >
          <Text style={[styles.yeet, { color: st.yeeted ? t.primary : t.textMuted }]}>
            {st.yeeted ? 'Includi' : 'Escludi'}
          </Text>
        </Pressable>
      </View>

      {st.yeeted ? (
        <T variant="muted">Escluso dal referto</T>
      ) : (
        <>
          <Text style={[styles.preview, { color: showPositive ? t.positive : t.textSecondary }]}>
            {organDisplayText(organ, st, { mdc })}
          </Text>

          <Segmented
            value={st.positive ? 'positivo' : 'negativo'}
            onChange={(v) =>
              update((s) => (v === 'positivo' ? { ...s, positive: true } : setOrganNegative(s)))
            }
            colors={{ negativo: t.negative, positivo: t.positive }}
            options={[
              { value: 'negativo', label: 'Negativo' },
              { value: 'positivo', label: 'Positivo' },
            ]}
          />

          {st.positive ? (
            <View style={styles.positive}>
              <Input
                multiline
                placeholder="Descrivi il reperto…"
                value={st.text}
                onChangeText={(text) => update((s) => setOrganText(s, text))}
              />
              {examples.length ? (
                <Row>
                  {examples.map((ex) => (
                    <Chip
                      key={ex.label}
                      label={`＋ ${ex.label}`}
                      onPress={() => update((s) => setOrganText({ ...s, positive: true }, ex.text))}
                    />
                  ))}
                </Row>
              ) : null}
              <Row>
                <Chip
                  label="🎯 Quesito"
                  tone="warning"
                  active={st.isTarget}
                  onPress={() => update(toggleOrganTarget)}
                />
                <Chip
                  label="🚩 Nelle conclusioni"
                  tone="positive"
                  active={st.flagged}
                  onPress={() => update((s) => ({ ...s, flagged: !s.flagged, wordPicks: [] }))}
                />
              </Row>
              {st.flagged && words.length ? (
                <View style={styles.words}>
                  <T variant="muted">Tocca le parole da riportare nelle conclusioni:</T>
                  <Row gap={6}>
                    {words.map((w, i) => {
                      const picked = st.wordPicks.includes(i);
                      return (
                        <Pressable
                          key={i}
                          onPress={() =>
                            update((s) => ({
                              ...s,
                              wordPicks: picked
                                ? s.wordPicks.filter((x) => x !== i)
                                : [...s.wordPicks, i],
                            }))
                          }
                          style={[
                            styles.word,
                            {
                              backgroundColor: picked ? t.positive : t.surfaceAlt,
                            },
                          ]}
                        >
                          <Text style={{ color: picked ? t.primaryText : t.text, fontSize: 14 }}>
                            {w}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Row>
                </View>
              ) : null}
            </View>
          ) : null}

          {nf ? (
            <Row>
              <T variant="muted">{nf.label} (referto breve):</T>
              <Input
                keyboardType="decimal-pad"
                value={String(numeric ?? nf.default)}
                onChangeText={(v) => setNumericField(organ.id, v.replace(',', '.'))}
                style={{ width: 72, paddingVertical: 6 }}
              />
              <T variant="muted">{nf.unit}</T>
            </Row>
          ) : null}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { flex: 1, fontSize: 15, fontWeight: '700' },
  yeet: { fontSize: 13, fontWeight: '600' },
  preview: { fontSize: 14, lineHeight: 20 },
  positive: { gap: Spacing.two },
  words: { gap: Spacing.two },
  word: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
});

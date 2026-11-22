import { examLabel } from '@ct-buddy/core';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TemplateRecord } from '@/library/types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function TemplateItem({ template }: { template: TemplateRecord }) {
  const t = useTheme();
  return (
    <Link href={{ pathname: '/libreria/[id]', params: { id: template.id } }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.item,
          { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={styles.head}>
          <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
            {template.isFavorite ? '★ ' : ''}
            {template.title}
          </Text>
          <Text style={[styles.date, { color: t.textMuted }]}>
            {formatDate(template.updatedAt)}
          </Text>
        </View>
        <Text style={[styles.sub, { color: t.textSecondary }]} numberOfLines={1}>
          {examLabel(template.examConfig)} ·{' '}
          {template.setting === 'urgenza' ? 'Pronto soccorso' : 'Elettiva'}
        </Text>
        {template.tags.length ? (
          <View style={styles.tags}>
            {template.tags.map((tag) => (
              <Text
                key={tag}
                style={[styles.tag, { backgroundColor: t.surfaceAlt, color: t.textSecondary }]}
              >
                {tag}
              </Text>
            ))}
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  item: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
  date: { fontSize: 12 },
  sub: { fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, marginTop: Spacing.one },
  tag: {
    fontSize: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
});

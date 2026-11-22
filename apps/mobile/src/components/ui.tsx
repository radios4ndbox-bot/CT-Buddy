/** componenti di base dell'interfaccia di CT Buddy */
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ---------- layout ----------

export function Screen({
  children,
  footer,
  scroll = true,
}: {
  children: ReactNode;
  /** barra fissa in fondo (es. pulsanti Avanti/Indietro) */
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const t = useTheme();
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: t.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {footer ? (
        <View style={[styles.footer, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <View style={[styles.footerInner]}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, style]}>
      {children}
    </View>
  );
}

export function Row({
  children,
  style,
  gap = Spacing.two,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

// ---------- testo ----------

type TextVariant = 'title' | 'heading' | 'body' | 'label' | 'small' | 'muted';

export function T({
  children,
  variant = 'body',
  color,
  style,
  selectable,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  selectable?: boolean;
  numberOfLines?: number;
}) {
  const t = useTheme();
  const base = textStyles[variant];
  const defaultColor =
    variant === 'muted' ? t.textMuted : variant === 'label' ? t.textSecondary : t.text;
  return (
    <Text
      selectable={selectable}
      numberOfLines={numberOfLines}
      style={[base, { color: color ?? defaultColor }, style]}
    >
      {children}
    </Text>
  );
}

// ---------- controlli ----------

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg =
    variant === 'primary'
      ? t.primary
      : variant === 'secondary'
        ? t.primarySoft
        : variant === 'danger'
          ? t.positiveSoft
          : 'transparent';
  const fg = variant === 'primary' ? t.primaryText : variant === 'danger' ? t.positive : t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>
        {icon ? `${icon}  ` : ''}
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'primary',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'primary' | 'positive' | 'warning';
}) {
  const t = useTheme();
  const activeBg = tone === 'positive' ? t.positive : tone === 'warning' ? t.warning : t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? activeBg : t.surfaceAlt,
          borderColor: active ? activeBg : t.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? t.primaryText : t.text }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup<V extends string | number>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: V; label: string }[];
  /** singolo valore oppure insieme di valori (selezione multipla) */
  value: V | readonly V[];
  onChange: (v: V) => void;
}) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <View style={styles.chipGroup}>
      {options.map((o) => (
        <Chip
          key={String(o.value)}
          label={o.label}
          active={selected.includes(o.value)}
          onPress={() => onChange(o.value)}
        />
      ))}
    </View>
  );
}

/** selettore a due o tre opzioni affiancate */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  colors,
}: {
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
  /** colore per opzione quando selezionata (default: primario) */
  colors?: Partial<Record<V, string>>;
}) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: colors?.[o.value] ?? t.primary }]}
          >
            <Text style={[styles.segmentText, { color: active ? t.primaryText : t.textSecondary }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      {label ? <T variant="label">{label}</T> : null}
      {children}
      {hint ? <T variant="muted">{hint}</T> : null}
    </View>
  );
}

export function Input(props: TextInputProps & { mono?: boolean }) {
  const t = useTheme();
  const { style, mono, multiline, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={t.textMuted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...rest}
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        { color: t.text, backgroundColor: t.surface, borderColor: t.border },
        style,
      ]}
    />
  );
}

export function Banner({
  children,
  tone = 'warning',
}: {
  children: ReactNode;
  tone?: 'warning' | 'info';
}) {
  const t = useTheme();
  const bg = tone === 'warning' ? t.warningSoft : t.primarySoft;
  const fg = tone === 'warning' ? t.warning : t.primary;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={[textStyles.small, { color: fg }]}>{children}</Text>
    </View>
  );
}

/** indicatore dei passi del percorso di refertazione */
export function Steps({ current, labels }: { current: number; labels: readonly string[] }) {
  const t = useTheme();
  return (
    <View style={styles.steps}>
      {labels.map((l, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <View key={l} style={styles.step}>
            <View
              style={[styles.stepBar, { backgroundColor: state === 'todo' ? t.border : t.primary }]}
            />
            <Text
              style={[
                textStyles.small,
                {
                  color: state === 'current' ? t.text : t.textMuted,
                  fontWeight: state === 'current' ? '700' : '500',
                },
              ]}
            >
              {i + 1}. {l}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const textStyles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  small: { fontSize: 13, lineHeight: 18 },
  muted: { fontSize: 13, lineHeight: 18 },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.three },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  button: {
    minHeight: 46,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, borderWidth: 1, padding: 3 },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  segmentText: { fontSize: 14, fontWeight: '700' },
  field: { gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 96, lineHeight: 21 },
  banner: { borderRadius: Radius.md, padding: Spacing.three },
  steps: { flexDirection: 'row', gap: Spacing.two },
  step: { flex: 1, gap: Spacing.one },
  stepBar: { height: 4, borderRadius: 2 },
});

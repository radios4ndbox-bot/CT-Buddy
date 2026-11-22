import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// NB: i TabTrigger devono essere figli diretti del componente passato a TabList, altrimenti
// expo-router non li trova ("No screens are declared"). Gli stili passati ai figli di uno
// Slot (asChild) vanno appiattiti con StyleSheet.flatten.
export default function AppTabs() {
  return (
    <Tabs>
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="referto" href="/referto" asChild>
            <TabButton>Referto</TabButton>
          </TabTrigger>
          <TabTrigger name="libreria" href="/libreria" asChild>
            <TabButton>Libreria</TabButton>
          </TabTrigger>
          <TabTrigger name="ordine" href="/ordine" asChild>
            <TabButton>Ordine</TabButton>
          </TabTrigger>
        </TabBar>
      </TabList>
      <TabSlot style={{ flex: 1 }} />
    </Tabs>
  );
}

function TabBar({ children, ...props }: TabListProps) {
  const t = useTheme();
  return (
    <View
      {...props}
      style={StyleSheet.flatten([
        styles.bar,
        { backgroundColor: t.surface, borderBottomColor: t.border },
      ])}
    >
      <View style={styles.inner}>
        <Text numberOfLines={1} style={[styles.brand, { color: t.primary }]}>
          CT Buddy
        </Text>
        {children}
      </View>
    </View>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const t = useTheme();
  return (
    <Pressable
      {...(props as PressableProps)}
      style={StyleSheet.flatten([styles.tab, isFocused && { backgroundColor: t.primarySoft }])}
    >
      <Text style={[styles.tabText, { color: isFocused ? t.primary : t.textSecondary }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  brand: { fontSize: 17, fontWeight: '800', marginRight: 'auto', flexShrink: 0 },
  tab: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: Radius.pill },
  tabText: { fontSize: 14, fontWeight: '600' },
});

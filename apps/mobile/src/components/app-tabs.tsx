import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const t = useTheme();
  return (
    <NativeTabs
      backgroundColor={t.surface}
      indicatorColor={t.primarySoft}
      labelStyle={{ selected: { color: t.primary } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="referto">
        <NativeTabs.Trigger.Label>Referto</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          md="description"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="libreria">
        <NativeTabs.Trigger.Label>Libreria</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }}
          md="library_books"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ordine">
        <NativeTabs.Trigger.Label>Ordine</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.number" md="format_list_numbered" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

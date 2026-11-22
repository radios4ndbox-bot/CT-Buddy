import {
  ORDINE_MENTALE_PRINCIPLES,
  ORDINE_MENTALE_PS_NOTES,
  ORDINE_MENTALE_TIPS,
  PS_EXAMS,
  REGIONS,
  REGION_ORDER,
  type Organ,
} from '@ct-buddy/core';
import { useState } from 'react';
import { View } from 'react-native';

import { Card, Screen, Segmented, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function OrganList({ organs }: { organs: readonly Organ[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: Spacing.two }}>
      {organs.map((o, i) => (
        <View key={o.id} style={{ gap: 2 }}>
          <T>
            {i + 1}. {o.label}
            {o.sex ? (o.sex === 'F' ? ' (donna)' : ' (uomo)') : ''}
          </T>
          {ORDINE_MENTALE_TIPS[o.id] ? (
            <T variant="small" color={t.textSecondary} style={{ paddingLeft: Spacing.four }}>
              {ORDINE_MENTALE_TIPS[o.id]}
            </T>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function OrdineMentale() {
  const [view, setView] = useState<'regioni' | 'ps'>('regioni');
  return (
    <Screen>
      <T variant="title">Ordine mentale</T>
      <T variant="muted">
        Promemoria di metodo per tenere un ordine costante in refertazione. È lo stesso ordine usato
        dal referto generato.
      </T>

      <Card>
        <T variant="heading">Principi generali</T>
        {ORDINE_MENTALE_PRINCIPLES.map((p, i) => (
          <T key={i}>
            {i + 1}. {p}
          </T>
        ))}
      </Card>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'regioni', label: 'Per regione' },
          { value: 'ps', label: 'Protocolli PS' },
        ]}
      />

      {view === 'regioni'
        ? REGION_ORDER.map((k) => (
            <Card key={k}>
              <T variant="heading">{REGIONS[k].title}</T>
              <OrganList organs={REGIONS[k].organs} />
            </Card>
          ))
        : Object.entries(PS_EXAMS).map(([id, e]) => (
            <Card key={id}>
              <T variant="heading">{e.label}</T>
              {ORDINE_MENTALE_PS_NOTES[id] ? (
                <T variant="muted">{ORDINE_MENTALE_PS_NOTES[id]}</T>
              ) : null}
              <OrganList organs={e.organs} />
            </Card>
          ))}
    </Screen>
  );
}

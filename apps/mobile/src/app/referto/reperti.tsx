import { reportRegions } from '@ct-buddy/core';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { OrganRow } from '@/components/organ-row';
import { Button, Screen, Steps, T } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { STEP_LABELS } from '@/constants/steps';
import { useDraft } from '@/state/draft';

export default function RepertiStep() {
  const config = useDraft((s) => s.config);
  const regions = useMemo(() => reportRegions(config), [config]);
  const positives = useDraft(
    (s) => Object.values(s.organs).filter((o) => o.positive && o.text.trim()).length,
  );

  return (
    <Screen
      footer={
        <>
          <Button title="← Esame" variant="secondary" onPress={() => router.back()} />
          <Button title="Avanti →" onPress={() => router.push('/referto/conclusioni')} />
        </>
      }
    >
      <Steps current={1} labels={STEP_LABELS} />
      <T variant="muted">
        Ogni organo è negativo di default: segna come positivi solo quelli con reperti.{' '}
        {positives ? `${positives} positivi finora.` : ''}
      </T>
      {regions.length === 0 ? (
        <T variant="muted">Seleziona almeno una regione nel passo Esame.</T>
      ) : (
        regions.map((r) => (
          <View key={r.title} style={{ gap: Spacing.two }}>
            <T variant="label">{r.title}</T>
            {r.organs.map((o) => (
              <OrganRow key={o.id} organ={o} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

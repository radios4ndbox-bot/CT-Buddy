import { router } from 'expo-router';

import { Button, Card, Field, Input, Screen, Segmented, Steps, T } from '@/components/ui';
import { STEP_LABELS } from '@/constants/steps';
import { useDraft } from '@/state/draft';

export default function ConclusioniStep() {
  const conclusioni = useDraft((s) => s.conclusioni);
  const included = useDraft((s) => s.conclusioniIncluded);
  const flaggedWithWords = useDraft(
    (s) => Object.values(s.organs).filter((o) => o.flagged && o.wordPicks.length).length,
  );
  const { setConclusioni, setConclusioniIncluded, generateConclusioni } = useDraft.getState();

  return (
    <Screen
      footer={
        <>
          <Button title="← Reperti" variant="secondary" onPress={() => router.back()} />
          <Button title="Vedi referto →" onPress={() => router.push('/referto/anteprima')} />
        </>
      }
    >
      <Steps current={2} labels={STEP_LABELS} />
      <Card>
        <Field label="Conclusioni nel referto">
          <Segmented
            value={included ? 'si' : 'no'}
            onChange={(v) => setConclusioniIncluded(v === 'si')}
            options={[
              { value: 'no', label: 'Senza conclusioni' },
              { value: 'si', label: 'Con conclusioni' },
            ]}
          />
        </Field>
        <T variant="muted">
          Le conclusioni sono facoltative: aggiungile quando sintetizzano un dato utile
          (correlazione clinica, follow-up, diagnosi differenziale).
        </T>
        <Input
          multiline
          placeholder="Scrivi le conclusioni, una per riga…"
          value={conclusioni}
          onChangeText={(v) => {
            setConclusioni(v);
            if (v.trim() && !included) setConclusioniIncluded(true);
          }}
        />
        <Button
          title={`Genera bozza dai reperti con 🚩 (${flaggedWithWords})`}
          variant="secondary"
          disabled={!flaggedWithWords}
          onPress={generateConclusioni}
        />
        {!flaggedWithWords ? (
          <T variant="muted">
            Per la bozza: nei Reperti segna un positivo con 🚩 e tocca le parole da riportare.
          </T>
        ) : null}
      </Card>
    </Screen>
  );
}

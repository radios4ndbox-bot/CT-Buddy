import {
  AGENTI_MDC,
  AGENTI_MDC_CONCENTRAZIONI,
  FASI_MDC,
  FLUSSI_MDC,
  PS_EXAMS,
  PS_FREE_ID,
  REGIONS,
  REGION_ORDER,
  examLabel,
  isFixedPsProtocol,
  titleCaseRegion,
} from '@ct-buddy/core';
import { router } from 'expo-router';

import {
  Button,
  Card,
  ChipGroup,
  Field,
  Input,
  Row,
  Screen,
  Segmented,
  Steps,
  T,
} from '@/components/ui';
import { STEP_LABELS } from '@/constants/steps';
import { tecnicaText, useDraft } from '@/state/draft';

const PS_OPTIONS = [
  { value: PS_FREE_ID, label: 'Composizione libera' },
  ...Object.entries(PS_EXAMS).map(([id, e]) => ({ value: id, label: e.label })),
];
const REGION_OPTIONS = REGION_ORDER.map((k) => ({
  value: k,
  label: titleCaseRegion(REGIONS[k].title),
}));

function toInt(text: string, fallback: number): number {
  const n = parseInt(text.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function EsameStep() {
  const draft = useDraft();
  const { config, setConfig } = draft;
  const fixedPs = isFixedPsProtocol(config);
  const canProceed = fixedPs || config.regions.length > 0;
  const concentrazioni = AGENTI_MDC_CONCENTRAZIONI[config.agente] ?? [];

  return (
    <Screen
      footer={
        <Button
          title="Avanti: reperti →"
          disabled={!canProceed}
          onPress={() => router.push('/referto/reperti')}
        />
      }
    >
      <Steps current={0} labels={STEP_LABELS} />
      <T variant="heading">{examLabel(config)}</T>

      <Card>
        <Field label="Sesso">
          <Segmented
            value={config.sesso}
            onChange={(sesso) => setConfig({ sesso })}
            options={[
              { value: 'F', label: 'Donna' },
              { value: 'M', label: 'Uomo' },
            ]}
          />
        </Field>
        <Field label="Modalità">
          <Segmented
            value={config.modalita}
            onChange={(modalita) => setConfig({ modalita })}
            options={[
              { value: 'elettiva', label: 'TC elettiva' },
              { value: 'urgenza', label: 'Pronto soccorso' },
            ]}
          />
        </Field>

        {config.modalita === 'urgenza' ? (
          <Field label="Protocollo">
            <ChipGroup options={PS_OPTIONS} value={config.psExam} onChange={draft.selectPsExam} />
          </Field>
        ) : null}

        {fixedPs ? (
          <Field label="Tecnica da usare">
            <Segmented
              value={config.tecnicaModalita}
              onChange={(tecnicaModalita) => setConfig({ tecnicaModalita })}
              options={[
                { value: 'generale', label: 'Impostazioni generali' },
                { value: 'specifica', label: 'Protocollo SIRM' },
              ]}
            />
          </Field>
        ) : (
          <Field label="Regioni incluse" hint="Collo e Torace insieme diventano COLLO-TORACE.">
            <ChipGroup
              options={REGION_OPTIONS}
              value={config.regions}
              onChange={draft.toggleRegion}
            />
          </Field>
        )}
      </Card>

      <Card>
        <Field label="Mezzo di contrasto">
          <Segmented
            value={config.mdc}
            onChange={(mdc) => setConfig({ mdc })}
            options={[
              { value: 'si', label: 'Con contrasto' },
              { value: 'no', label: 'Senza contrasto' },
            ]}
          />
        </Field>
        {config.mdc === 'si' ? (
          <>
            <Field label="Agente">
              <ChipGroup
                options={AGENTI_MDC.map((a) => ({ value: a, label: a }))}
                value={config.agente}
                onChange={(agente) => {
                  const list = AGENTI_MDC_CONCENTRAZIONI[agente] ?? [];
                  const concentrazione = list.includes(config.concentrazione)
                    ? config.concentrazione
                    : (list[list.length - 1] ?? config.concentrazione);
                  setConfig({ agente, concentrazione });
                }}
              />
            </Field>
            <Field label="Concentrazione (mgI/mL)">
              <ChipGroup
                options={concentrazioni.map((c) => ({ value: c, label: String(c) }))}
                value={config.concentrazione}
                onChange={(concentrazione) => setConfig({ concentrazione })}
              />
            </Field>
            <Row gap={16} style={{ alignItems: 'flex-start' }}>
              <Field label="Quantità (mL)">
                <Input
                  keyboardType="number-pad"
                  value={String(config.quantita)}
                  onChangeText={(v) => setConfig({ quantita: toInt(v, 0) })}
                  style={{ width: 100 }}
                />
              </Field>
              <Field label="Flusso (mL/sec)">
                <ChipGroup
                  options={FLUSSI_MDC.map((f) => ({ value: f, label: String(f) }))}
                  value={config.flusso}
                  onChange={(flusso) => setConfig({ flusso })}
                />
              </Field>
            </Row>
            <Field label="Fasi di acquisizione">
              <ChipGroup
                options={FASI_MDC.map((f) => ({ value: f.id, label: f.label }))}
                value={config.fasi}
                onChange={draft.toggleFase}
              />
            </Field>
          </>
        ) : null}
      </Card>

      <Card>
        <Field label="Confronto con TC precedente">
          <Segmented
            value={config.confronto ? 'si' : 'no'}
            onChange={(v) =>
              setConfig({
                confronto: v === 'si' ? { gg: 1, mm: 1, aaaa: new Date().getFullYear() } : null,
              })
            }
            options={[
              { value: 'no', label: 'No' },
              { value: 'si', label: 'Sì' },
            ]}
          />
        </Field>
        {config.confronto ? (
          <Row>
            {(['gg', 'mm', 'aaaa'] as const).map((k) => (
              <Field key={k} label={k === 'gg' ? 'Giorno' : k === 'mm' ? 'Mese' : 'Anno'}>
                <Input
                  keyboardType="number-pad"
                  maxLength={k === 'aaaa' ? 4 : 2}
                  value={String(config.confronto![k])}
                  onChangeText={(v) =>
                    setConfig({ confronto: { ...config.confronto!, [k]: toInt(v, 0) } })
                  }
                  style={{ width: k === 'aaaa' ? 90 : 64 }}
                />
              </Field>
            ))}
          </Row>
        ) : null}
      </Card>

      <Card>
        <Field
          label="Tecnica"
          hint={
            draft.tecnicaOverride == null
              ? 'Generata dalle impostazioni: puoi modificarla liberamente.'
              : 'Modificata a mano: non segue più le impostazioni.'
          }
        >
          <Input multiline value={tecnicaText(draft)} onChangeText={(v) => draft.setTecnica(v)} />
        </Field>
        {draft.tecnicaOverride != null ? (
          <Button
            title="Rigenera dalle impostazioni"
            variant="ghost"
            onPress={() => draft.setTecnica(null)}
          />
        ) : null}
      </Card>
    </Screen>
  );
}

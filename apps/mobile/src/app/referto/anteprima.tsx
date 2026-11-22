import { buildReport } from '@ct-buddy/core';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text } from 'react-native';

import {
  Banner,
  Button,
  Card,
  Field,
  Input,
  Row,
  Screen,
  Segmented,
  Steps,
  T,
} from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { STEP_LABELS } from '@/constants/steps';
import { useTheme } from '@/hooks/use-theme';
import {
  parseTags,
  templateFromDraft,
  templateWarnings,
  useTemplate,
  useTemplateActions,
} from '@/library/hooks';
import { confirm, notify } from '@/lib/confirm';
import { toReportInput, useDraft } from '@/state/draft';

export default function AnteprimaStep() {
  const t = useTheme();
  const draft = useDraft();
  const text = useMemo(() => buildReport(toReportInput(draft)), [draft]);
  const { template: source } = useTemplate(draft.sourceTemplateId ?? undefined);
  const { create, update } = useTemplateActions();
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');

  async function copy() {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function checkPrivacy(t: ReturnType<typeof templateFromDraft>): Promise<boolean> {
    const warnings = templateWarnings(t);
    if (!warnings.length) return true;
    return confirm(
      'Possibili dati del paziente',
      'La libreria deve contenere solo modelli anonimi. Ho trovato:\n\n' +
        warnings.map((w) => `• ${w.label}: «${w.match}»`).join('\n') +
        '\n\nSalvare comunque?',
      'Salva comunque',
    );
  }

  async function saveNew() {
    const tpl = templateFromDraft(draft, { title, tags: parseTags(tags) });
    if (!(await checkPrivacy(tpl))) return;
    const rec = await create(tpl);
    useDraft.setState({ sourceTemplateId: rec.id });
    setTitle('');
    setTags('');
    notify('Modello salvato', `«${rec.title}» è nella tua libreria.`);
  }

  async function saveOver() {
    if (!source) return;
    const tpl = templateFromDraft(draft, { title: source.title, tags: source.tags });
    if (!(await checkPrivacy(tpl))) return;
    const ok = await confirm(
      'Aggiornare il modello?',
      `«${source.title}» verrà sovrascritto.`,
      'Aggiorna',
    );
    if (!ok) return;
    const { isFavorite: _keepFavorite, ...patch } = tpl;
    await update(source.id, patch);
    notify('Modello aggiornato');
  }

  return (
    <Screen
      footer={
        <>
          <Button title="← Conclusioni" variant="secondary" onPress={() => router.back()} />
          <Button title={copied ? 'Copiato ✓' : 'Copia referto'} onPress={copy} />
        </>
      }
    >
      <Steps current={3} labels={STEP_LABELS} />
      <Segmented
        value={draft.compact ? 'breve' : 'esteso'}
        onChange={(v) => draft.setCompact(v === 'breve')}
        options={[
          { value: 'esteso', label: 'Esteso' },
          { value: 'breve', label: 'Breve' },
        ]}
      />
      <Card>
        <Text
          selectable
          style={{ color: t.text, fontFamily: Fonts.mono, fontSize: 13, lineHeight: 20 }}
        >
          {text}
        </Text>
      </Card>

      <Card>
        <T variant="heading">Salva come modello</T>
        <Banner>
          Nella libreria vanno solo modelli anonimi: niente nomi, date di nascita, codici fiscali o
          date reali di esami precedenti.
        </Banner>
        <Field label="Titolo">
          <Input
            placeholder="es. TC torace-addome stadiazione, controllo"
            value={title}
            onChangeText={setTitle}
          />
        </Field>
        <Field label="Tag" hint="Separati da virgola">
          <Input placeholder="es. oncologia, follow-up" value={tags} onChangeText={setTags} />
        </Field>
        <Row>
          <Button title="Salva nuovo modello" disabled={!title.trim()} onPress={saveNew} />
          {source ? (
            <Button title={`Aggiorna «${source.title}»`} variant="secondary" onPress={saveOver} />
          ) : null}
        </Row>
      </Card>
    </Screen>
  );
}

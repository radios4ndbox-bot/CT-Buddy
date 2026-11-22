import { DATA_VERSION, examLabel } from '@ct-buddy/core';
import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { formatDate } from '@/components/template-item';
import { Banner, Button, Card, Field, Input, Row, Screen, Segmented, T } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseTags, useTemplate, useTemplateActions } from '@/library/hooks';
import { confirm } from '@/lib/confirm';
import { useDraft } from '@/state/draft';

export default function ModelloDettaglio() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { template, loading } = useTemplate(id);
  const { update, remove } = useTemplateActions();
  const [forma, setForma] = useState<'esteso' | 'breve'>('esteso');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');

  if (loading) return <Screen>{null}</Screen>;
  if (!template)
    return (
      <Screen>
        <T variant="muted">Modello non trovato: potrebbe essere stato eliminato.</T>
      </Screen>
    );

  const text = forma === 'breve' ? template.renderedBreve : template.renderedEsteso;

  return (
    <Screen
      footer={
        <>
          <Button
            title="Usa come base"
            variant="secondary"
            onPress={() => {
              useDraft.getState().loadTemplate(template);
              router.push('/referto');
            }}
          />
          <Button
            title={copied ? 'Copiato ✓' : 'Copia testo'}
            onPress={async () => {
              await Clipboard.setStringAsync(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          />
        </>
      }
    >
      <Stack.Screen options={{ title: template.title }} />

      {editing ? (
        <Card>
          <Field label="Titolo">
            <Input value={title} onChangeText={setTitle} />
          </Field>
          <Field label="Tag" hint="Separati da virgola">
            <Input value={tags} onChangeText={setTags} />
          </Field>
          <Row>
            <Button title="Annulla" variant="ghost" onPress={() => setEditing(false)} />
            <Button
              title="Salva"
              disabled={!title.trim()}
              onPress={async () => {
                await update(template.id, { title: title.trim(), tags: parseTags(tags) });
                setEditing(false);
              }}
            />
          </Row>
        </Card>
      ) : (
        <Card>
          <T variant="heading">{template.title}</T>
          <T variant="muted">
            {examLabel(template.examConfig)} · aggiornato il {formatDate(template.updatedAt)}
            {template.tags.length ? ` · ${template.tags.join(', ')}` : ''}
          </T>
          <Row>
            <Button
              title={template.isFavorite ? '★ Preferito' : '☆ Aggiungi ai preferiti'}
              variant="secondary"
              onPress={() => update(template.id, { isFavorite: !template.isFavorite })}
            />
            <Button
              title="Rinomina"
              variant="ghost"
              onPress={() => {
                setTitle(template.title);
                setTags(template.tags.join(', '));
                setEditing(true);
              }}
            />
          </Row>
        </Card>
      )}

      {template.dataVersion !== DATA_VERSION ? (
        <Banner>
          Questo modello è stato creato con una versione precedente del catalogo. Usalo come base
          per rigenerare il testo con le frasi aggiornate.
        </Banner>
      ) : null}

      <Segmented
        value={forma}
        onChange={setForma}
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

      <Button
        title="Elimina modello"
        variant="danger"
        onPress={async () => {
          const ok = await confirm(
            'Eliminare il modello?',
            `«${template.title}» verrà rimosso dalla libreria.`,
            'Elimina',
          );
          if (!ok) return;
          await remove(template.id);
          router.back();
        }}
      />
    </Screen>
  );
}

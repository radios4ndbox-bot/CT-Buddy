import { examLabel } from '@ct-buddy/core';
import { useMemo, useState } from 'react';

import { SyncCard } from '@/components/sync-card';
import { TemplateItem } from '@/components/template-item';
import { ChipGroup, Input, Screen, T } from '@/components/ui';
import { useTemplates } from '@/library/hooks';

type Filter = 'tutti' | 'preferiti' | 'elettiva' | 'urgenza';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'tutti', label: 'Tutti' },
  { value: 'preferiti', label: '★ Preferiti' },
  { value: 'elettiva', label: 'Elettiva' },
  { value: 'urgenza', label: 'Pronto soccorso' },
];

export default function Libreria() {
  const { templates, loading } = useTemplates();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('tutti');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (filter === 'preferiti' && !t.isFavorite) return false;
      if ((filter === 'elettiva' || filter === 'urgenza') && t.setting !== filter) return false;
      if (!q) return true;
      return [t.title, examLabel(t.examConfig), ...t.tags].join(' ').toLowerCase().includes(q);
    });
  }, [templates, query, filter]);

  return (
    <Screen>
      <SyncCard />
      <Input
        placeholder="Cerca per titolo, esame o tag…"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
      {loading ? null : shown.length ? (
        shown.map((t) => <TemplateItem key={t.id} template={t} />)
      ) : (
        <T variant="muted">
          {templates.length
            ? 'Nessun modello corrisponde alla ricerca.'
            : 'La libreria è vuota. Salva un referto come modello dall’ultimo passo del percorso.'}
        </T>
      )}
    </Screen>
  );
}

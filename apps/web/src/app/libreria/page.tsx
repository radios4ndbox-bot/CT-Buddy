'use client';

import { examLabel } from '@ct-buddy/core';
import { deleteTemplate, listTemplates, saveTemplate, type TemplateRecord } from '@ct-buddy/db';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Shell } from '@/components/shell';
import { getSupabase } from '@/lib/supabase';

type Filter = 'tutti' | 'preferiti' | 'elettiva' | 'urgenza';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'tutti', label: 'Tutti' },
  { value: 'preferiti', label: '★ Preferiti' },
  { value: 'elettiva', label: 'Elettiva' },
  { value: 'urgenza', label: 'Pronto soccorso' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Libreria() {
  const [templates, setTemplates] = useState<TemplateRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('tutti');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      setTemplates(await listTemplates(sb));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void reload());
    // aggiorna quando si torna sulla scheda (es. dopo aver salvato un modello dal telefono)
    const onFocus = () => void reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (templates ?? []).filter((t) => {
      if (filter === 'preferiti' && !t.isFavorite) return false;
      if ((filter === 'elettiva' || filter === 'urgenza') && t.setting !== filter) return false;
      if (!q) return true;
      return [t.title, examLabel(t.examConfig), ...t.tags].join(' ').toLowerCase().includes(q);
    });
  }, [templates, query, filter]);

  const selected = shown.find((t) => t.id === selectedId) ?? shown[0] ?? null;

  return (
    <main className="page">
      <h1>Libreria</h1>
      {error ? <div className="banner">Impossibile caricare la libreria: {error}</div> : null}
      <div className="split">
        <section className="list">
          <input
            className="input"
            placeholder="Cerca per titolo, esame o tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="row">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                className={`chip${filter === f.value ? ' active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {templates === null ? (
            <p className="muted">Caricamento…</p>
          ) : shown.length ? (
            shown.map((t) => (
              <button
                key={t.id}
                className={`item${selected?.id === t.id ? ' selected' : ''}`}
                onClick={() => setSelectedId(t.id)}
              >
                <span className="item-title">
                  {t.isFavorite ? '★ ' : ''}
                  {t.title}
                </span>
                <span className="muted">
                  {examLabel(t.examConfig)} · {formatDate(t.updatedAt)}
                </span>
                {t.tags.length ? (
                  <span>
                    {t.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="muted">
              {templates.length
                ? 'Nessun modello corrisponde alla ricerca.'
                : 'La libreria è vuota. Salva un referto come modello dall’app: comparirà qui dopo la sincronizzazione.'}
            </p>
          )}
        </section>

        {selected ? <Dettaglio key={selected.id} template={selected} onChanged={reload} /> : null}
      </div>
    </main>
  );
}

function Dettaglio({
  template,
  onChanged,
}: {
  template: TemplateRecord;
  onChanged: () => Promise<void>;
}) {
  const [forma, setForma] = useState<'esteso' | 'breve'>('esteso');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(template.title);
  const [tags, setTags] = useState(template.tags.join(', '));
  const text = forma === 'breve' ? template.renderedBreve : template.renderedEsteso;

  async function save(patch: Partial<TemplateRecord>) {
    const sb = getSupabase();
    if (!sb) return;
    await saveTemplate(sb, { ...template, ...patch });
    await onChanged();
  }

  return (
    <section className="card">
      {editing ? (
        <>
          <label className="label">Titolo</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="label">Tag (separati da virgola)</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
          <div className="row">
            <button className="btn ghost" onClick={() => setEditing(false)}>
              Annulla
            </button>
            <button
              className="btn"
              disabled={!title.trim()}
              onClick={async () => {
                const parsed = Array.from(
                  new Set(
                    tags
                      .split(',')
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean),
                  ),
                );
                await save({ title: title.trim(), tags: parsed });
                setEditing(false);
              }}
            >
              Salva
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>{template.title}</h2>
          <p className="muted">
            {examLabel(template.examConfig)} ·{' '}
            {template.setting === 'urgenza' ? 'Pronto soccorso' : 'Elettiva'} · aggiornato il{' '}
            {formatDate(template.updatedAt)}
          </p>
          <div className="row">
            <button
              className="btn secondary"
              onClick={() => void save({ isFavorite: !template.isFavorite })}
            >
              {template.isFavorite ? '★ Preferito' : '☆ Aggiungi ai preferiti'}
            </button>
            <button className="btn ghost" onClick={() => setEditing(true)}>
              Rinomina
            </button>
          </div>
        </>
      )}

      <div className="row">
        <button
          className={`chip${forma === 'esteso' ? ' active' : ''}`}
          onClick={() => setForma('esteso')}
        >
          Esteso
        </button>
        <button
          className={`chip${forma === 'breve' ? ' active' : ''}`}
          onClick={() => setForma('breve')}
        >
          Breve
        </button>
        <button
          className="btn"
          style={{ marginLeft: 'auto' }}
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
        >
          {copied ? 'Copiato ✓' : 'Copia testo'}
        </button>
      </div>
      <pre className="report">{text}</pre>

      <div className="row">
        <button
          className="btn danger"
          onClick={async () => {
            if (!window.confirm(`Eliminare «${template.title}» dalla libreria?`)) return;
            const sb = getSupabase();
            if (!sb) return;
            await deleteTemplate(sb, template);
            await onChanged();
          }}
        >
          Elimina modello
        </button>
      </div>
    </section>
  );
}

export default function LibreriaPage() {
  return <Shell>{() => <Libreria />}</Shell>;
}

import { examLabel } from '@ct-buddy/core';
import { router } from 'expo-router';

import { TemplateItem } from '@/components/template-item';
import { Banner, Button, Card, Screen, T } from '@/components/ui';
import { useTemplates } from '@/library/hooks';
import { useDraft } from '@/state/draft';

export default function Home() {
  const { templates, loading } = useTemplates();
  const reset = useDraft((s) => s.reset);
  const config = useDraft((s) => s.config);
  const favorites = templates.filter((t) => t.isFavorite).slice(0, 5);
  const recent = templates.filter((t) => !t.isFavorite).slice(0, 5);

  return (
    <Screen>
      <T variant="title">CT Buddy</T>
      <T variant="muted">
        Configura l&apos;esame, scrivi solo i reperti positivi: il resto resta negativo di default.
      </T>

      <Card>
        <Button
          title="Nuovo referto"
          icon="＋"
          onPress={() => {
            reset();
            router.push('/referto');
          }}
        />
        <Button
          title={`Continua la bozza · ${examLabel(config)}`}
          variant="secondary"
          onPress={() => router.push('/referto')}
        />
      </Card>

      {favorites.length ? (
        <>
          <T variant="label">Preferiti</T>
          {favorites.map((t) => (
            <TemplateItem key={t.id} template={t} />
          ))}
        </>
      ) : null}

      <T variant="label">Modelli recenti</T>
      {loading ? null : recent.length ? (
        recent.map((t) => <TemplateItem key={t.id} template={t} />)
      ) : (
        <T variant="muted">
          Nessun modello salvato. Componi un referto e, dall&apos;anteprima, salvalo come modello
          per ritrovarlo qui.
        </T>
      )}

      <Banner>
        CT Buddy è uno strumento di supporto alla redazione del testo: la responsabilità clinica
        resta del medico. Nei modelli non inserire mai dati che identificano il paziente.
      </Banner>
    </Screen>
  );
}

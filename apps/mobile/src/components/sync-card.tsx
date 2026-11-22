import { router } from 'expo-router';

import { Button, Card, Row, T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/confirm';
import { syncNow, unlink, useSync } from '@/sync/engine';

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

/** stato del collegamento al sito e della sincronizzazione della libreria */
export function SyncCard() {
  const t = useTheme();
  const { status, email, lastSyncAt, error } = useSync();

  if (status === 'disabled') {
    return (
      <T variant="muted">
        Sincronizzazione non disponibile: il server non è ancora configurato in questa versione
        dell’app. I modelli restano salvati su questo dispositivo.
      </T>
    );
  }

  if (!email) {
    return (
      <Card>
        <T variant="heading">Libreria sempre con te</T>
        <T variant="muted">
          Collega l’app al sito di CT Buddy: inquadra il QR code che trovi nella pagina «Collega il
          telefono» e la tua libreria sarà la stessa su telefono e computer.
        </T>
        <Button
          title="Collega con QR code"
          icon="▣"
          onPress={() => router.push('/libreria/collega')}
        />
      </Card>
    );
  }

  const statusText =
    status === 'syncing'
      ? 'Sincronizzazione in corso…'
      : status === 'error'
        ? 'Ultima sincronizzazione non riuscita'
        : lastSyncAt
          ? `Sincronizzata alle ${time(lastSyncAt)}`
          : 'In attesa di sincronizzazione';

  return (
    <Card>
      <T variant="label">Collegata al sito</T>
      <T>{email}</T>
      <T variant="muted" color={status === 'error' ? t.positive : undefined}>
        {statusText}
        {status === 'error' && error ? ` — ${error}` : ''}
      </T>
      <Row>
        <Button
          title="Sincronizza ora"
          variant="secondary"
          disabled={status === 'syncing'}
          onPress={() => void syncNow()}
        />
        <Button
          title="Scollega"
          variant="ghost"
          onPress={async () => {
            const ok = await confirm(
              'Scollegare il telefono?',
              'I modelli restano su questo telefono ma non verranno più sincronizzati con il sito.',
              'Scollega',
            );
            if (ok) await unlink();
          }}
        />
      </Row>
    </Card>
  );
}

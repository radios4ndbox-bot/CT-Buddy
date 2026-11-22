import {
  claimErrorMessage,
  formatPairingCode,
  isValidPairingCode,
  parsePairingPayload,
} from '@ct-buddy/db';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Banner, Button, Card, Field, Input, Screen, T } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/confirm';
import { linkWithCode, useSync } from '@/sync/engine';

/**
 * Collega l'app all'account: il sito mostra un QR code monouso (valido pochi minuti);
 * inquadrandolo il telefono riceve la sessione dell'utente, senza password.
 * Raggiungibile anche dal link ctbuddy://libreria/collega?code=… contenuto nel QR.
 */
export default function Collega() {
  const t = useTheme();
  const params = useLocalSearchParams<{ code?: string }>();
  const syncStatus = useSync((s) => s.status);
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef<string | null>(null);

  async function link(code: string) {
    if (busy || handled.current === code) return;
    handled.current = code;
    setBusy(true);
    setError(null);
    const res = await linkWithCode(code);
    setBusy(false);
    if (res.ok) {
      notify(
        'Telefono collegato',
        `La libreria è ora sincronizzata con ${res.email || 'il tuo account'}.`,
      );
      router.back();
    } else {
      setError(claimErrorMessage(res.error));
      // permette di riprovare con un nuovo QR
      handled.current = null;
    }
  }

  // aperto dal link contenuto nel QR (fotocamera di sistema)
  useEffect(() => {
    const code = params.code ? parsePairingPayload(params.code) : null;
    if (!code) return;
    const id = setTimeout(() => void link(code), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  function onScanned(result: BarcodeScanningResult) {
    const code = parsePairingPayload(result.data);
    if (code) void link(code);
    else if (!busy) setError('Questo QR code non è un codice di collegamento di CT Buddy.');
  }

  if (syncStatus === 'disabled') {
    return (
      <Screen>
        <Banner>
          Il server di sincronizzazione non è configurato in questa versione dell’app (manca il file
          .env con l’indirizzo Supabase).
        </Banner>
      </Screen>
    );
  }

  return (
    <Screen>
      <T variant="muted">
        Sul computer apri il sito di CT Buddy, accedi e vai su «Collega il telefono»: inquadra il QR
        code che compare. Il codice vale pochi minuti e si può usare una sola volta.
      </T>

      <View style={[styles.cameraBox, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
        {busy ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.primary} />
            <T variant="muted">Collegamento in corso…</T>
          </View>
        ) : !permission ? null : permission.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScanned}
          />
        ) : (
          <View style={styles.center}>
            <T variant="muted" style={{ textAlign: 'center' }}>
              Serve l’accesso alla fotocamera per leggere il QR code.
            </T>
            {permission.canAskAgain ? (
              <Button
                title="Consenti fotocamera"
                onPress={requestPermission}
                style={{ flexGrow: 0 }}
              />
            ) : (
              <T variant="muted" style={{ textAlign: 'center' }}>
                Abilitala dalle impostazioni del telefono, oppure digita il codice qui sotto.
              </T>
            )}
          </View>
        )}
      </View>

      {error ? <Banner>{error}</Banner> : null}

      <Card>
        <Field label="Oppure digita il codice" hint="Lo trovi sotto il QR code, es. AB23-CD45-EF67">
          <Input
            value={manual}
            onChangeText={(v) => setManual(formatPairingCode(v))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={14}
            placeholder="XXXX-XXXX-XXXX"
          />
        </Field>
        <Button
          title="Collega"
          disabled={!isValidPairingCode(manual) || busy}
          onPress={() => void link(parsePairingPayload(manual)!)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraBox: {
    aspectRatio: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});

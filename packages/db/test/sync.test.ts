import { describe, expect, it } from 'vitest';

import { fromRow, remoteToApply, syncTemplates, toRow } from '../src';
import { FakeDevice, FakeServer } from './fakes';

describe('sincronizzazione', () => {
  it('telefono e sito convergono sulla stessa libreria', async () => {
    const server = new FakeServer();
    const phone = new FakeDevice();
    const web = new FakeDevice();
    phone.create('TC addome colica');
    phone.create('TC torace stadiazione');
    expect(await syncTemplates(phone, server.api())).toEqual({ pushed: 2, pulled: 0 });

    const r = await syncTemplates(web, server.api());
    expect(r.pulled).toBe(2);
    expect(web.titles()).toEqual(phone.titles());
    expect(await web.listDirty()).toEqual([]);
  });

  it('una seconda sincronizzazione senza modifiche non trasferisce nulla', async () => {
    const server = new FakeServer();
    const phone = new FakeDevice();
    phone.create('A');
    await syncTemplates(phone, server.api());
    expect(await syncTemplates(phone, server.api())).toEqual({ pushed: 0, pulled: 0 });
  });

  it('modifiche e cancellazioni si propagano', async () => {
    const server = new FakeServer();
    const phone = new FakeDevice();
    const web = new FakeDevice();
    const a = phone.create('A');
    const b = phone.create('B');
    await syncTemplates(phone, server.api());
    await syncTemplates(web, server.api());

    web.edit(a.id, { title: 'A rinominato', isFavorite: true });
    web.remove(b.id);
    await syncTemplates(web, server.api());
    await syncTemplates(phone, server.api());

    expect(phone.titles()).toEqual(['A rinominato']);
    expect(phone.entries.get(a.id)!.record.isFavorite).toBe(true);
    expect(phone.entries.get(b.id)!.record.deletedAt).not.toBeNull();
  });

  it('conflitto: vince la modifica più recente, su entrambi i dispositivi', async () => {
    const server = new FakeServer();
    const phone = new FakeDevice('2026-11-23T09:00:00.000Z');
    const web = new FakeDevice('2026-11-23T09:00:00.000Z');
    const a = phone.create('A');
    await syncTemplates(phone, server.api());
    await syncTemplates(web, server.api());

    phone.edit(a.id, { title: 'dal telefono' }); // 09:00:02
    web.edit(a.id, { title: 'dal sito' }); // 09:00:01 → più vecchia
    web.edit(a.id, { title: 'dal sito (2)' }); // 09:00:02 → pari: resta chi è arrivato prima
    phone.edit(a.id, { title: 'dal telefono (2)' }); // 09:00:03 → la più recente

    await syncTemplates(web, server.api());
    await syncTemplates(phone, server.api());
    await syncTemplates(web, server.api());
    expect(phone.titles()).toEqual(['dal telefono (2)']);
    expect(web.titles()).toEqual(['dal telefono (2)']);
  });

  it("un dispositivo con l'orologio indietro non perde le sue modifiche", async () => {
    const server = new FakeServer();
    const phone = new FakeDevice('2026-11-23T09:00:00.000Z');
    const laggingPc = new FakeDevice('2026-11-23T07:00:00.000Z'); // due ore indietro
    const a = phone.create('A');
    await syncTemplates(phone, server.api());
    await syncTemplates(laggingPc, server.api());

    laggingPc.edit(a.id, { title: 'modificato dal PC' });
    await syncTemplates(laggingPc, server.api());
    await syncTemplates(phone, server.api());
    expect(phone.titles()).toEqual(['modificato dal PC']);
  });

  it('modifiche fatte offline vengono inviate al ritorno della rete', async () => {
    const server = new FakeServer();
    const phone = new FakeDevice();
    phone.create('A');
    server.offline = true;
    await expect(syncTemplates(phone, server.api())).rejects.toThrow('offline');
    expect((await phone.listDirty()).length).toBe(1);

    server.offline = false;
    phone.create('B');
    expect((await syncTemplates(phone, server.api())).pushed).toBe(2);
    expect(server.rows.size).toBe(2);
  });

  it('una modifica locale fatta durante il push resta da inviare', async () => {
    const server = new FakeServer();
    const phone = new FakeDevice();
    const a = phone.create('A');
    const api = server.api();
    const slowApi = {
      ...api,
      push: async (records: Parameters<typeof api.push>[0]) => {
        await api.push(records);
        phone.edit(a.id, { title: 'A modificato durante il push' });
      },
    };
    await syncTemplates(phone, slowApi);
    expect((await phone.listDirty()).map((r) => r.title)).toEqual(['A modificato durante il push']);
    await syncTemplates(phone, server.api());
    expect(server.rows.get(a.id)!.record.title).toBe('A modificato durante il push');
  });

  it('più pagine di download', async () => {
    const server = new FakeServer();
    const phone = new FakeDevice();
    for (let i = 0; i < 1203; i++) phone.create(`M${i}`);
    await syncTemplates(phone, server.api());
    const web = new FakeDevice();
    expect((await syncTemplates(web, server.api())).pulled).toBe(1203);
  });

  it('remoteToApply: tiene la versione locale se è più recente', () => {
    const phone = new FakeDevice();
    const a = phone.create('A');
    const older = { ...a, title: 'vecchia', updatedAt: '2020-01-01T00:00:00.000Z' };
    expect(remoteToApply(phone.entries, [older])).toEqual([]);
    const newer = { ...a, title: 'nuova', updatedAt: '2030-01-01T00:00:00.000Z' };
    expect(remoteToApply(phone.entries, [older, newer])).toEqual([newer]);
  });
});

describe('mappatura righe Supabase', () => {
  it('andata e ritorno, con timestamp nel formato di Postgres', () => {
    const t = new FakeDevice().create('A');
    const row = toRow(t);
    expect(row.owner_id).toBeUndefined();
    const pg = {
      ...row,
      created_at: t.createdAt.replace('Z', '+00:00'),
      updated_at: t.updatedAt.replace('Z', '+00:00'),
    };
    expect(fromRow(pg)).toEqual(t);
  });
});

/**
 * @ct-buddy/core — dati clinici e motore di composizione del referto TC.
 * TypeScript puro: nessuna dipendenza da DOM, React o storage. Condiviso da app mobile e sito.
 */

/**
 * Versione del catalogo clinico (organi, frasi, protocolli). Va incrementata a ogni modifica
 * dei dati in src/data: i modelli salvati la registrano in `data_version`.
 */
export const DATA_VERSION = 1;

export * from './types';

export * from './data/regions';
export * from './data/mdc';
export * from './data/acquisizione';
export * from './data/keywords';
export * from './data/ordine-mentale';

export * from './text';
export * from './exam';
export * from './tecnica';
export * from './report';
export * from './pacs';
export * from './acquisizione';
export * from './defaults';

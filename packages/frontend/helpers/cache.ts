import { FinancialsResponse } from '@x-fuji/sdk';

export const CACHE_LIMIT = 1000 * 60 * 15; // Fifteen minutes

let dbPromise: Promise<IDBDatabase> | null = null;

function init(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('llama_cache', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('pools', { autoIncrement: true });
      db.createObjectStore('lendBorrows', { autoIncrement: true });
      db.createObjectStore('metaData', { keyPath: 'name' });
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function setLlamaCache(data: FinancialsResponse): Promise<void> {
  const db = await init();
  const transaction = db.transaction(
    ['pools', 'lendBorrows', 'metaData'],
    'readwrite'
  );

  transaction.objectStore('pools').put(data.pools);
  transaction.objectStore('lendBorrows').put(data.lendBorrows);
  transaction
    .objectStore('metaData')
    .put({ name: 'lastUpdated', date: new Date() });
}

export async function getLlamaCache(): Promise<FinancialsResponse> {
  return new Promise(async (resolve, reject) => {
    const db = await init();
    const transaction = db.transaction(['pools', 'lendBorrows'], 'readonly');

    const poolsRequest = transaction.objectStore('pools').get(1);
    const lendBorrowsRequest = transaction.objectStore('lendBorrows').get(1);

    transaction.oncomplete = () => {
      resolve({
        pools: poolsRequest.result,
        lendBorrows: lendBorrowsRequest.result,
      });
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCacheLastUpdatedDate(): Promise<Date | undefined> {
  return new Promise(async (resolve) => {
    const db = await init();
    const transaction = db.transaction(['metaData'], 'readonly');
    const request = transaction.objectStore('metaData').get('lastUpdated');

    transaction.oncomplete = () => {
      if (request.result) resolve(request.result.date);
      resolve(undefined);
    };
    transaction.onerror = () => resolve(undefined);
  });
}

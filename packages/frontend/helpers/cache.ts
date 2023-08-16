import { GetLLamaFinancialsResponse } from '@x-fuji/sdk';

let dbPromise: Promise<IDBDatabase> | null = null;

function init(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('myDatabase', 1);

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

const HALF_AN_HOUR = 1800000; // 30 minutes in milliseconds

export async function setLlamaCache(
  data: GetLLamaFinancialsResponse
): Promise<void> {
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

export async function getLlamaCache(): Promise<GetLLamaFinancialsResponse> {
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

export async function getLastUpdatedDate(): Promise<Date> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['metaData'], 'readonly');
    const request = transaction.objectStore('metaData').get('lastUpdated');

    request.onsuccess = () => resolve(request.result.date);
    request.onerror = () => reject(request.error);
  });
}

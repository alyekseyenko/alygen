import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage();

export function getRequestId() {
  const store = asyncLocalStorage.getStore();
  return store?.requestId || null;
}

import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import {
  Customer,
  Product,
  ProductVariant,
  StockMovement,
  Design,
  Order,
  Payment,
  Expense,
} from '../types';

export interface AppData {
  products: Product[];
  variants: ProductVariant[];
  customers: Customer[];
  designs: Design[];
  orders: Order[];
  payments: Payment[];
  stockMovements: StockMovement[];
  expenses: Expense[];
}

export type CollectionKey = keyof AppData;

export const COLLECTION_KEYS: CollectionKey[] = [
  'products',
  'variants',
  'customers',
  'designs',
  'orders',
  'payments',
  'stockMovements',
  'expenses',
];

// Collection de l'application -> table Supabase
export const TABLES: Record<CollectionKey, string> = {
  products: 'products',
  variants: 'product_variants',
  customers: 'customers',
  designs: 'designs',
  orders: 'orders',
  payments: 'payments',
  stockMovements: 'stock_movements',
  expenses: 'expenses',
};

export const EMPTY_DATA: AppData = {
  products: [],
  variants: [],
  customers: [],
  designs: [],
  orders: [],
  payments: [],
  stockMovements: [],
  expenses: [],
};

export const isDataEmpty = (data: AppData): boolean =>
  COLLECTION_KEYS.every(k => data[k].length === 0);

const PAGE_SIZE = 1000;

async function fetchTable(table: string, userId: string): Promise<any[]> {
  if (!supabase) return [];
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('data')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []).map(r => r.data));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function loadAllFromCloud(userId: string): Promise<AppData> {
  const results = await Promise.all(COLLECTION_KEYS.map(k => fetchTable(TABLES[k], userId)));
  const data = { ...EMPTY_DATA } as Record<CollectionKey, any[]>;
  COLLECTION_KEYS.forEach((k, i) => {
    data[k] = results[i];
  });
  return data as AppData;
}

// Les designs contiennent des images encodées : on les envoie par petits lots.
const chunkSizeFor = (key: CollectionKey) => (key === 'designs' ? 5 : 200);

async function pushDiff(
  key: CollectionKey,
  userId: string,
  synced: Map<string, unknown>,
  next: { id: string }[]
): Promise<void> {
  if (!supabase) return;
  const table = TABLES[key];

  const nextIds = new Set<string>();
  const toUpsert: { id: string }[] = [];
  for (const item of next) {
    nextIds.add(item.id);
    if (synced.get(item.id) !== item) toUpsert.push(item);
  }
  const toDelete: string[] = [];
  for (const id of synced.keys()) {
    if (!nextIds.has(id)) toDelete.push(id);
  }

  const size = chunkSizeFor(key);
  for (let i = 0; i < toUpsert.length; i += size) {
    const chunk = toUpsert.slice(i, i + size);
    const { error } = await supabase.from(table).upsert(
      chunk.map(item => ({
        user_id: userId,
        id: item.id,
        data: item,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,id' }
    );
    if (error) throw error;
    chunk.forEach(item => synced.set(item.id, item));
  }

  for (let i = 0; i < toDelete.length; i += 200) {
    const chunk = toDelete.slice(i, i + 200);
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', chunk);
    if (error) throw error;
    chunk.forEach(id => synced.delete(id));
  }
}

export type SyncStatus = 'local' | 'saved' | 'saving' | 'error';

/**
 * Enregistre en continu l'état de l'application dans Supabase.
 * Seules les lignes modifiées, ajoutées ou supprimées sont envoyées.
 * "syncedData" = ce qui est déjà présent dans la base au démarrage.
 */
export function useCloudSync(
  userId: string | null,
  data: AppData,
  syncedData: AppData | null
): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(userId ? 'saved' : 'local');

  const latest = useRef(data);
  latest.current = data;

  const synced = useRef<Record<CollectionKey, Map<string, unknown>> | null>(null);
  if (synced.current === null) {
    const maps = {} as Record<CollectionKey, Map<string, unknown>>;
    COLLECTION_KEYS.forEach(k => {
      maps[k] = new Map((syncedData?.[k] ?? []).map((item: { id: string }) => [item.id, item]));
    });
    synced.current = maps;
  }

  const running = useRef(false);
  const rerun = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const flush = async () => {
    if (!userId || !supabase) return;
    if (running.current) {
      rerun.current = true;
      return;
    }
    running.current = true;
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    let failed = false;
    try {
      for (;;) {
        rerun.current = false;
        const snapshot = latest.current;
        const pending = COLLECTION_KEYS.filter(k => {
          const map = synced.current![k];
          const list = snapshot[k] as { id: string }[];
          return list.length !== map.size || list.some(item => map.get(item.id) !== item);
        });
        if (pending.length === 0) break;
        if (alive.current) setStatus('saving');
        for (const k of pending) {
          await pushDiff(k, userId, synced.current![k], snapshot[k] as { id: string }[]);
        }
      }
    } catch (err) {
      failed = true;
      console.error('Sauvegarde Supabase échouée :', err);
    } finally {
      running.current = false;
    }
    if (!alive.current) return;
    if (failed) {
      setStatus('error');
      retryTimer.current = setTimeout(flush, 5000);
    } else {
      setStatus('saved');
    }
  };

  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    flushRef.current();
  }, [
    data.products,
    data.variants,
    data.customers,
    data.designs,
    data.orders,
    data.payments,
    data.stockMovements,
    data.expenses,
  ]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  // Empêche de fermer l'onglet tant que tout n'est pas enregistré en ligne.
  useEffect(() => {
    if (status !== 'saving' && status !== 'error') return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  return status;
}

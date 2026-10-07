-- InkoraStock — schéma Supabase
-- Une table par collection. Chaque ligne appartient à un utilisateur (user_id)
-- et contient l'enregistrement complet dans la colonne "data" (JSON).
-- La sécurité par ligne (RLS) garantit que chaque compte ne voit que ses données.

do $$
declare
  t text;
begin
  foreach t in array array[
    'products',
    'product_variants',
    'customers',
    'designs',
    'orders',
    'payments',
    'stock_movements',
    'expenses'
  ]
  loop
    execute format(
      'create table if not exists public.%I (
         user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
         id         text        not null,
         data       jsonb       not null,
         updated_at timestamptz not null default now(),
         primary key (user_id, id)
       )',
      t
    );

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "owner_all" on public.%I', t);
    execute format(
      'create policy "owner_all" on public.%I
         for all
         to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)',
      t
    );

    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end
$$;

create table if not exists public.wallet_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('credit', 'debit')),
  reason text not null,
  created_by uuid references auth.users(id) on delete set null,
  settlement_id uuid, -- will be linked when shift is closed
  created_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id),
  total_amount numeric not null,
  settled_at timestamptz not null default now(),
  settled_by uuid not null references auth.users(id)
);

alter table public.transactions add constraint fk_transactions_settlement foreign key (settlement_id) references public.settlements(id);

alter table public.wallet_balances enable row level security;
alter table public.transactions enable row level security;
alter table public.settlements enable row level security;

-- Admin policies
create policy "wallet_balances_admin_all" on public.wallet_balances for all using (public.is_admin_user());
create policy "transactions_admin_all" on public.transactions for all using (public.is_admin_user());
create policy "settlements_admin_all" on public.settlements for all using (public.is_admin_user());

-- Users read their own
create policy "wallet_balances_user_select" on public.wallet_balances for select using (auth.uid() is not null and user_id = auth.uid());
create policy "transactions_user_select" on public.transactions for select using (auth.uid() is not null and user_id = auth.uid());

-- Triggers for wallet balance update
create or replace function public.update_wallet_balance()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'credit' then
      insert into public.wallet_balances (user_id, balance)
      values (NEW.user_id, NEW.amount)
      on conflict (user_id) do update set balance = public.wallet_balances.balance + NEW.amount, updated_at = now();
    elsif NEW.type = 'debit' then
      insert into public.wallet_balances (user_id, balance)
      values (NEW.user_id, -NEW.amount)
      on conflict (user_id) do update set balance = public.wallet_balances.balance - NEW.amount, updated_at = now();
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists update_wallet_balance_trigger on public.transactions;
create trigger update_wallet_balance_trigger
after insert on public.transactions
for each row execute function public.update_wallet_balance();

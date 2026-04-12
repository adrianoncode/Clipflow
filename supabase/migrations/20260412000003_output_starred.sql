-- M9: Performance feedback — star strong outputs
alter table public.outputs add column if not exists is_starred boolean not null default false;

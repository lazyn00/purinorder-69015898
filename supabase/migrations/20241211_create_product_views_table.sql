-- 1. Tạo bảng product_views
create table if not exists public.product_views (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  product_id bigint not null,
  constraint product_views_pkey primary key (id),
  constraint product_views_product_id_fkey foreign key (product_id) references public.products (id) on delete cascade
);

-- 2. Bật Row Level Security (RLS) để bảo mật
alter table public.product_views enable row level security;

-- 3. Tạo Policy cho phép MỌI NGƯỜI (kể cả khách vãng lai) được xem số liệu
create policy "Enable read access for all users"
on public.product_views
for select
to public
using (true);

-- 4. Tạo Policy cho phép MỌI NGƯỜI (kể cả khách vãng lai) được GHI lượt xem
-- Quan trọng: Nếu không có dòng này, lệnh insert từ code sẽ bị lỗi 403
create policy "Enable insert for everyone"
on public.product_views
for insert
to public
with check (true);

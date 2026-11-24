alter table public.profiles
  add column onboarding_done boolean not null default false,
  add column oficio text;

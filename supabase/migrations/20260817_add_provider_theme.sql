-- PREPARED ONLY — DO NOT APPLY WITHOUT GINI'S EXPLICIT APPROVAL.
-- providers.theme is the nullable AA field used by the eight-theme whitelist.

alter table public.providers
  add column if not exists theme text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_theme_allowed'
      and conrelid = 'public.providers'::regclass
  ) then
    alter table public.providers
      add constraint providers_theme_allowed
      check (
        theme is null or theme in (
          'bali-stone',
          'ubud-slow',
          'quiet-luxury',
          'moolah-gold',
          'rainforest-jade',
          'terracotta-sunset',
          'indigo-tides',
          'orchid-dusk'
        )
      );
  end if;
end
$$;

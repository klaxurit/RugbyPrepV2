-- Capture des emails saisis sur la modale "Continuer sur mobile" (desktop landing).
-- Pas de signup desktop : on stocke juste le contact pour un envoi de lien d'install ultérieur.

create table public.mobile_install_leads (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  user_agent text,
  created_at timestamptz default now() not null
);

alter table public.mobile_install_leads enable row level security;

-- Insert anonyme autorisé (la landing est publique, l'utilisateur n'est pas authentifié).
create policy "Anyone can submit a mobile install lead"
  on public.mobile_install_leads
  for insert
  with check (true);

-- Aucune lecture exposée à l'anon — seul le service_role lira la table côté admin.

create index mobile_install_leads_created_at on public.mobile_install_leads (created_at desc);
create index mobile_install_leads_email on public.mobile_install_leads (lower(email));

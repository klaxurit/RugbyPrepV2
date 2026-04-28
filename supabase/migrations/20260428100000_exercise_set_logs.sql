-- exercise_set_logs : log par série/tour pour les séances mother sessions premium.
-- Une ligne par (utilisateur × créneau × bloc × exercice × tour).
-- L'idempotence est garantie par slot_signature (motherSessionId:weekLabel:sessionIndex:dateYMD)
-- qui permet de ré-écrire sans dupliquer si l'utilisateur ré-ouvre une séance le même jour.

create table public.exercise_set_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- slot_signature stable : "motherSessionId:weekLabel:sessionIndex:dateYMD"
  -- Permet l'upsert sans connaître le session_log_id (créé seulement à la fin).
  slot_signature text not null,

  -- Contexte (utile pour requêtes/affichage sans jointure)
  mother_session_id text,
  week_label text not null,
  session_index int not null,
  block_number int not null,
  exercise_id text not null,
  tour_index int not null,

  -- Lien optionnel vers le session_log (rempli à la fin de séance)
  session_log_id uuid references public.session_logs(id) on delete cascade,

  -- Données saisies
  load_kg numeric,
  reps int,
  seconds int,
  meters int,
  rir int,
  completed boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (user_id, slot_signature, block_number, exercise_id, tour_index)
);

create index exercise_set_logs_user_slot
  on public.exercise_set_logs(user_id, slot_signature);

create index exercise_set_logs_user_exercise_date
  on public.exercise_set_logs(user_id, exercise_id, created_at desc);

alter table public.exercise_set_logs enable row level security;

create policy "Users see own set logs"
  on public.exercise_set_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.exercise_set_logs is
  'Log par série pour les séances mother sessions. Idempotent via slot_signature.';
comment on column public.exercise_set_logs.slot_signature is
  'Format : motherSessionId:weekLabel:sessionIndex:dateYMD. Stable au sein d''un jour.';

-- Ajout de slot_signature sur session_logs pour permettre l'upsert idempotent
-- côté completion ("Terminer la séance" ne crée plus de doublon).
alter table public.session_logs
  add column if not exists slot_signature text;

create unique index if not exists session_logs_user_slot_unique
  on public.session_logs(user_id, slot_signature)
  where slot_signature is not null;

comment on column public.session_logs.slot_signature is
  'Identifiant idempotent du créneau (motherSessionId:weekLabel:sessionIndex:dateYMD). Unique par utilisateur.';

-- Synchronise club_athlete_memberships quand profiles.club_code change.
-- Le backfill initial (20260321) ne couvrait que les profils existants à ce moment-là.

create or replace function public.sync_club_athlete_membership_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_club text;
  old_club text;
begin
  new_club := case
    when new.club_code is not null and length(trim(new.club_code)) > 0 then trim(new.club_code)
    else null
  end;

  if tg_op = 'UPDATE' then
    old_club := case
      when old.club_code is not null and length(trim(old.club_code)) > 0 then trim(old.club_code)
      else null
    end;
  else
    old_club := null;
  end if;

  -- Changement ou retrait de club : désactiver l'ancienne adhésion auto (squad null).
  if old_club is not null and (new_club is null or new_club <> old_club) then
    update public.club_athlete_memberships
    set status = 'inactive', updated_at = now()
    where athlete_user_id = new.id
      and club_id = old_club
      and squad_id is null
      and status = 'active';
  end if;

  -- Nouveau club : activer ou créer l'adhésion athlète.
  if new_club is not null then
    update public.club_athlete_memberships
    set status = 'active',
        source = 'profile_backfill',
        updated_at = now()
    where athlete_user_id = new.id
      and club_id = new_club
      and squad_id is null;

    if not found then
      insert into public.club_athlete_memberships (
        athlete_user_id,
        club_id,
        squad_id,
        status,
        source
      )
      values (new.id, new_club, null, 'active', 'profile_backfill');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_sync_club_athlete_membership on public.profiles;
create trigger profiles_sync_club_athlete_membership
  after insert or update of club_code on public.profiles
  for each row
  execute function public.sync_club_athlete_membership_from_profile();

-- Re-backfill : profils avec club_code mais sans membership active correspondante.
insert into public.club_athlete_memberships (
  athlete_user_id,
  club_id,
  squad_id,
  status,
  source
)
select
  p.id,
  trim(p.club_code),
  null,
  'active',
  'profile_backfill'
from public.profiles p
where p.club_code is not null
  and length(trim(p.club_code)) > 0
  and not exists (
    select 1
    from public.club_athlete_memberships m
    where m.athlete_user_id = p.id
      and m.club_id = trim(p.club_code)
      and m.squad_id is null
      and m.status = 'active'
  );

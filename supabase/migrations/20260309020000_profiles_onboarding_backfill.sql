update public.profiles
set onboarding_complete = true
where onboarding_complete = false
  and coalesce(position, rugby_position) is not null
  and training_level is not null;

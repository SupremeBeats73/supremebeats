-- Elite setup: Master_Supreme$ (jadelaceco25@gmail.com) and Jasmine (jasmine1x05@gmail.com).
-- Run in Supabase SQL Editor. Profiles are matched by auth.users.email.

-- Master_Supreme$: set display_name, mic_tier, credits for jadelaceco25@gmail.com
update public.profiles
set
  display_name = 'Master_Supreme$',
  mic_tier = 'Elite',
  credits = 999999,
  updated_at = now()
where id = (
  select id from auth.users
  where email = 'jadelaceco25@gmail.com'
  limit 1
);

-- Jasmine: set mic_tier and credits for jasmine1x05@gmail.com (display_name unchanged)
update public.profiles
set
  mic_tier = 'Elite',
  credits = 999999,
  updated_at = now()
where id = (
  select id from auth.users
  where email = 'jasmine1x05@gmail.com'
  limit 1
);

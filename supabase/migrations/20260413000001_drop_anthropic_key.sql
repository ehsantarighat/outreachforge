-- Switch to platform key model: remove per-user Anthropic key storage
alter table public.user_settings drop column if exists anthropic_api_key;

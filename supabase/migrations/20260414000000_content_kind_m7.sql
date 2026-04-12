-- M7: Add 'youtube' and 'url' to the content_kind enum so we can track
-- where content was sourced from. No data migration needed — all existing
-- rows stay as 'video' or 'text'.

alter type public.content_kind add value if not exists 'youtube';
alter type public.content_kind add value if not exists 'url';

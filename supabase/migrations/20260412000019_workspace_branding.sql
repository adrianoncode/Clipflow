-- Feature 9: White-Label Client Portal — workspace branding
alter table workspaces add column if not exists branding jsonb not null default '{}'::jsonb;

comment on column workspaces.branding is 'JSON shape: {logoUrl?, accentColor?, companyName?, customDomain?}';

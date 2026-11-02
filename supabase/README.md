# Supabase (cloud storage for templates)

Project: `gelzopnjdlucizxpootg` — dedicated to Magnet Frame Studio, shares nothing with any other project.

- `migrations/` — database changes. The Supabase GitHub integration applies new files here
  automatically when they are pushed to the production branch (`claude/hopeful-feynman-ohyurh`).
  Never edit a migration that was already applied; add a new file instead.
- `checks/rls_isolation.sql` — run in the SQL Editor after a migration that touches access rules.
  It must end with `ALL ISOLATION CHECKS PASSED`. It rolls itself back and leaves no data.

## Data model

| Where | What | Who can reach it |
|---|---|---|
| `public.templates` | one row per template: `id`, `owner_id`, `name`, `doc` (the template.json), `revision`, timestamps | only the owner (row level security); signed-out visitors have no access |
| bucket `template-files` (private) | `{owner_id}/{template_id}/assets/<file>` and `{owner_id}/{template_id}/thumbnail.png` | only the owner: the first folder of the path must be their user id |

`owner_id`, `created_at`, `revision` and `updated_at` are set by the database. Each save sends the
`revision` it last saw; if another tab or computer saved in between, the save matches no row and the
app reports a conflict instead of overwriting.

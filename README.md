# Pull Up

Pull Up is a UIUC campus nightlife coordination product focused on one student
question:

> What's the move tonight?

The current app is a Vinext/Next 16 product shell deployed with Sites. It uses a
student-first public Tonight preview, demo authentication, separate role routes,
Supabase-ready APIs, and typed mock data until production credentials are added.

## Product Surfaces

- `/` shows the public, privacy-safe Tonight preview and acquisition flow.
- `/student` is the student product for momentum, crew intent, plans, and
  profile/privacy controls.
- `/host` is the host product for event submission and factual operational
  reports. Student accounts with unofficial hosting enabled can access this
  path for house-party hosting.
- `/admin` is the admin product for review queues, evidence replay, and source
  reliability decisions.

The architecture is separate doors, shared data spine. Students, hosts, and
admins share event evidence, but they do not share the same user interface or
private data.

## Backend Shape

- `supabase/schema.sql` defines the production Supabase schema and RLS policies.
- `app/api/supabase/*` contains Supabase-backed profile, event, attendance,
  host, and admin routes.
- `app/api/ai/recommendations` contains the server-side OpenAI recommendation
  endpoint.
- `.env.example` lists the runtime variables needed for real data:
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
  `OPENAI_API_KEY`.

The hosted demo does not include real Supabase or OpenAI credentials yet, so UI
actions that would write data are demo behavior unless those variables are set
in Sites.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm test
```

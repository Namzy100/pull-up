# Pull Up

Pull Up is a UIUC campus nightlife coordination product. The student app answers
one Friday-night question quickly:

> What's the move tonight?

The current source includes the latest student-facing visual redesign, the
single responsive app shell, Supabase-backed authentication and persistence,
role-separated student/host/admin routes, RLS-focused migrations, local
end-to-end Supabase verification, and Sites deployment configuration.

## Product Surfaces

- `/` is the public preview and sign-in entry.
- `/student` is the student product for Tonight, Crew, Plans, and Profile.
- `/host` is the host product for venue/frat/pub/party event management and
  factual condition reports.
- `/admin` is the admin product for review queues and trust decisions.

Students, hosts, and admins have separate doors. A student can use unofficial
hosting flows when enabled, but a standalone host account is not the same as a
student account, and admin review routes are protected separately.

## Stack

- Vinext / Next 16 app router
- React client app shell in `app/components/PullUpClientApp.tsx`
- Supabase Auth, REST APIs, Postgres schema, and RLS
- Sites hosting metadata in `.openai/hosting.json`
- Optional OpenAI recommendation endpoint, disabled unless `OPENAI_API_KEY` is
  provided

## Environment

Copy `.env.example` to `.env.local` and fill the values locally. Do not commit
`.env.local`.

```bash
cp .env.example .env.local
```

Required for Supabase-backed local journeys:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional, currently safe to leave blank:

```bash
OPENAI_API_KEY=
```

The service-role key must stay server-only. Do not expose it through client
components, browser responses, public-prefixed variables, logs, or committed
files.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by the dev server, usually:

```bash
http://127.0.0.1:5173
```

## Supabase Migration

Apply the schema before running persisted journeys:

```bash
supabase/migrations/0001_pull_up_schema.sql
```

You can apply it with the Supabase SQL Editor, a Supabase CLI database session,
or any trusted Postgres connection for the target Supabase project.

The migration creates the app tables, policies, triggers, and helper functions
used by:

- profile creation and role separation
- student attendance and check-in persistence
- privacy-safe signal/event review
- host reports that cannot directly manipulate momentum
- admin review access

Do not weaken RLS to make a UI flow pass. Fix the route, role, or query instead.

## Testing

Run the standard verification set:

```bash
npm run lint
npm test
npm run build
```

For the persisted Supabase journey, keep the local app server running with
`.env.local` loaded, then run:

```bash
LOCAL_APP_URL=http://127.0.0.1:5173 npm run test:supabase
```

The Supabase verifier creates temporary users and validates:

- environment wiring
- schema availability
- Auth sign-in
- profile creation
- student-only profile visibility
- attendance/check-in persistence
- condition report persistence
- aggregate signal privacy
- admin route blocking for students
- expired-session rejection
- host report boundaries

## Deployment

The project is configured for Sites with:

```bash
.openai/hosting.json
```

Build before saving or deploying:

```bash
npm run build
```

For Sites deployment, use the existing project in `.openai/hosting.json`.
Do not create a duplicate Site. Runtime environment variables are managed in
Sites, not committed to this repository.

## Source Safety

Committed source should include application code, migrations, tests, package
files, and documentation. It should exclude:

- `.env.local` and all real secrets
- `node_modules`
- `dist`, `.next`, `.vinext`, `.wrangler`, and other build output
- temporary screenshots, archives, and local QA files


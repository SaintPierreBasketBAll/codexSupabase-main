# AGENTS - Project Guidance for Codex

## Project Summary
SvelteKit app integrated with Supabase for authentication and data. Basic auth flow (login, signup, session state) with French UI.

## Stack
- Frontend: SvelteKit with file-based routing in `src/routes/`
- Backend: Supabase (auth + database)
- Styling: Plain component-level CSS

## Key Files
- `src/lib/supabase.js`: Supabase client initialization (uses env vars)
- `src/lib/auth.js`: Auth helpers (signIn, signUp, signOut, getUser)
- `src/routes/+page.svelte`: Main auth state UI
- `src/routes/login/+page.svelte`, `src/routes/signup/+page.svelte`: Auth forms

## Environment
Use `.env` (see `.env.example`) with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Conventions
- UI text and comments are in French.
- Use `$lib/` alias for `src/lib/`.
- Auth functions throw errors; catch and show messages in components.
- Prefer minimal, clear Svelte components (avoid over-abstraction).

## Scripts
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- Preview: `npm run preview`

## Notes
- npm is the default package manager; pnpm is ok if chosen, but avoid mixing lockfiles.
- Keep `README.md` aligned with the actual project setup (not the default Svelte template).

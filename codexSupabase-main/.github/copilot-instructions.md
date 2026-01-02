# Codex Supabase - AI Coding Instructions

## Project Overview
This is a SvelteKit application integrated with Supabase for authentication and data management. The app provides a basic auth flow with login, signup, and user session management. Currently, it's a foundation for a "Codex" (knowledge base) app, with UI in French.

## Architecture
- **Frontend**: SvelteKit with file-based routing (`src/routes/`)
- **Backend**: Supabase (auth, database via REST API)
- **State Management**: Reactive Svelte components, auth state via Supabase listeners
- **Styling**: Plain CSS in components

Key files:
- `src/lib/supabase.js`: Supabase client initialization (requires env vars)
- `src/lib/auth.js`: Auth utility functions (signIn, signUp, etc.)
- `src/routes/+page.svelte`: Main page displaying auth state
- `src/routes/login/+page.svelte` & `signup/+page.svelte`: Auth forms

## Authentication Patterns
Use Supabase auth for user management. Example in components:
```javascript
import { signIn } from '$lib/auth.js'
try {
  await signIn(email, password)
  goto('/')
} catch (err) {
  error = err.message
}
```
Listen to auth state changes:
```javascript
import { onAuthStateChange } from '$lib/auth.js'
onAuthStateChange((event, session) => {
  user = session?.user || null
})
```

## Data Access Patterns
Use Supabase client for database operations. Example:
```javascript
import { supabase } from '$lib/supabase.js'
const { data, error } = await supabase.from('table').select('*')
if (error) throw error
```

## Developer Workflows
- **Development**: `npm run dev` (start dev server)
- **Build**: `npm run build` (production build)
- **Lint & Format**: `npm run lint` (check), `npm run format` (auto-fix)
- **Preview**: `npm run preview` (preview build)
- **Package Manager**: npm by default; pnpm is acceptable if you choose it, but avoid mixing lockfiles.

Requires `.env` (see `.env.example`) with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Conventions
- **Language**: French for UI text and comments
- **Routing**: Standard SvelteKit (+page.svelte for routes)
- **Imports**: Use `$lib/` alias for `src/lib/`
- **Error Handling**: Auth functions throw errors; catch and display in components
- **No Tests**: Add Vitest + @testing-library/svelte if implementing tests
- **Supabase Client**: Use `createClient` in `src/lib/supabase.js` and `supabase.auth` in `src/lib/auth.js`
- **README**: Keep `README.md` aligned with this project's actual setup (not the default Svelte template)

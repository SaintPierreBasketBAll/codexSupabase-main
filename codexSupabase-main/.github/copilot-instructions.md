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
- **Development**: `pnpm dev` (start dev server)
- **Build**: `pnpm build` (production build)
- **Lint & Format**: `pnpm lint` (check), `pnpm format` (auto-fix)
- **Preview**: `pnpm preview` (preview build)

Requires `.env.local` with:
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
- **Package Manager**: pnpm (use `pnpm install` for deps)</content>
<parameter name="filePath">c:\Users\sgspb\Documents\web files spbb\codexSupabase-main\codexSupabase-main\.github\copilot-instructions.md
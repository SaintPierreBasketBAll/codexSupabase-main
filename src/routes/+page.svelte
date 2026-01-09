<script>
  import { onMount } from 'svelte'
  import { getUser, signOut, onAuthStateChange } from '$lib/auth.js'

  let user = null

  onMount(async () => {
    const { data } = await getUser()
    user = data.user

    onAuthStateChange((event, session) => {
      user = session?.user || null
    })
  })

  async function handleSignOut() {
    await signOut()
  }
</script>

<h1>Bienvenue sur Codex Supabase</h1>

{#if user}
  <p>Connecté en tant que {user.email}</p>
  <button on:click={handleSignOut}>Se déconnecter</button>
{:else}
  <p><a href="/login">Se connecter</a> | <a href="/signup">S'inscrire</a></p>
{/if}

<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<script>
  import { signUp } from '$lib/auth.js'
  import { goto } from '$app/navigation'

  let email = ''
  let password = ''
  let error = ''
  let success = false

  async function handleSubmit() {
    try {
      await signUp(email, password)
      success = true
    } catch (err) {
      error = err.message
    }
  }
</script>

<h1>Inscription</h1>

{#if success}
  <p>Vérifiez votre email pour confirmer votre inscription.</p>
  <p><a href="/login">Se connecter</a></p>
{:else}
  <form on:submit|preventDefault={handleSubmit}>
    <label for="email">Email:</label>
    <input type="email" id="email" bind:value={email} required />

    <label for="password">Mot de passe:</label>
    <input type="password" id="password" bind:value={password} required />

    <button type="submit">S'inscrire</button>
  </form>

  {#if error}
    <p style="color: red;">{error}</p>
  {/if}

  <p><a href="/login">Déjà un compte ? Se connecter</a></p>
{/if}
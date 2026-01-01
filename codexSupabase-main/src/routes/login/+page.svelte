<script>
  import { signIn } from '$lib/auth.js'
  import { goto } from '$app/navigation'

  let email = ''
  let password = ''
  let error = ''

  async function handleSubmit() {
    try {
      await signIn(email, password)
      goto('/')
    } catch (err) {
      error = err.message
    }
  }
</script>

<h1>Connexion</h1>

<form on:submit|preventDefault={handleSubmit}>
  <label for="email">Email:</label>
  <input type="email" id="email" bind:value={email} required />

  <label for="password">Mot de passe:</label>
  <input type="password" id="password" bind:value={password} required />

  <button type="submit">Se connecter</button>
</form>

{#if error}
  <p style="color: red;">{error}</p>
{/if}

<p><a href="/signup">Pas de compte ? S'inscrire</a></p>
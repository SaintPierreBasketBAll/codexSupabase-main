<script>
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { form } = $props();
</script>

<section class="auth">
	<h1 class="auth__title">Creer un compte</h1>
	<p class="auth__subtitle">Inscription en ligne SPBB 2026-2027.</p>

	{#if form?.success}
		<p class="auth__success">Compte cree. Verifiez votre email pour confirmer votre inscription.</p>
		<p class="auth__hint"><a href={resolve('/login')}>Aller a la connexion</a></p>
	{:else}
		<form class="auth__form" method="POST" use:enhance>
			<label class="auth__label" for="email">Email</label>
			<input
				class="auth__input"
				type="email"
				id="email"
				name="email"
				required
				autocomplete="email"
				value={form?.values?.email ?? ''}
			/>

			<label class="auth__label" for="password">Mot de passe</label>
			<input
				class="auth__input"
				type="password"
				id="password"
				name="password"
				required
				minlength="8"
				autocomplete="new-password"
			/>

			<button class="auth__button" type="submit">Creer mon compte</button>
		</form>

		{#if form?.error}
			<p class="auth__error">{form.error}</p>
		{/if}

		<p class="auth__hint">
			Deja inscrit ? <a href={resolve('/login')}>Se connecter</a>
		</p>
	{/if}
</section>

<style>
	.auth {
		max-width: 460px;
		margin: 0 auto;
		background: #ffffff;
		border: 1px solid #d9e5df;
		border-radius: 18px;
		padding: 1.5rem;
	}

	.auth__title {
		margin: 0;
	}

	.auth__subtitle {
		margin-top: 0.5rem;
		color: #36594d;
	}

	.auth__form {
		margin-top: 1rem;
		display: grid;
		gap: 0.65rem;
	}

	.auth__label {
		font-weight: 700;
	}

	.auth__input {
		padding: 0.65rem;
		border-radius: 10px;
		border: 1px solid #b9cec5;
	}

	.auth__button {
		margin-top: 0.5rem;
		border: 0;
		border-radius: 12px;
		padding: 0.7rem 0.95rem;
		background: #114d3b;
		color: #ffffff;
		font-weight: 700;
		cursor: pointer;
	}

	.auth__error {
		margin-top: 1rem;
		padding: 0.65rem 0.75rem;
		border-radius: 10px;
		background: #fde8e8;
		color: #8a2626;
		font-weight: 600;
	}

	.auth__success {
		margin-top: 1rem;
		padding: 0.65rem 0.75rem;
		border-radius: 10px;
		background: #e4f6ea;
		color: #1f6a3c;
		font-weight: 600;
	}

	.auth__hint {
		margin-top: 1rem;
	}
</style>

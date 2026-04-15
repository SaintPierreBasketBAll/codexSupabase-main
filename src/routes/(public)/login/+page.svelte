<script>
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data, form } = $props();
	let next = $derived(form?.next ?? data.next ?? '/mon-dossier');
</script>

<section class="auth">
	<h1 class="auth__title">Connexion</h1>
	<p class="auth__subtitle">Accedez a votre espace SPBB.</p>

	<form class="auth__form" method="POST" use:enhance>
		<input type="hidden" name="next" value={next} />

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
			autocomplete="current-password"
		/>

		<button class="auth__button" type="submit">Se connecter</button>
	</form>

	{#if form?.error}
		<p class="auth__error">{form.error}</p>
	{/if}

	<p class="auth__hint">
		Pas encore de compte ? <a href={resolve('/signup')}>Creer un compte</a>
	</p>
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

	.auth__hint {
		margin-top: 1rem;
	}
</style>

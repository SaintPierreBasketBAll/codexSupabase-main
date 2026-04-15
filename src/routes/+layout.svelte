<script>
	import { resolve } from '$app/paths';
	import favicon from '/favicon.png'; 

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SPBB Inscriptions</title>
</svelte:head>

<div class="app">
	<header class="app__header">
		<a class="app__brand" href={resolve('/')}>SPBB 2026-2027</a>

		<nav class="app__nav" aria-label="Navigation principale">
			{#if data.user}
				<a href={resolve('/inscription')}>Inscription</a>
				<a href={resolve('/mon-dossier')}>Mon dossier</a>
				<a href={resolve('/messagerie')}>Messagerie</a>
				{#if data.profile?.role === 'admin'}
					<a href={resolve('/admin/licencies')}>Admin dossiers</a>
					<a href={resolve('/admin/users')}>Admin users</a>
					<a href={resolve('/admin/referentiels')}>Referentiels</a>
				{/if}
				<form method="POST" action="/logout">
					<button type="submit">Se deconnecter</button>
				</form>
			{:else}
				<a href={resolve('/login')}>Connexion</a>
				<a href={resolve('/signup')}>Inscription</a>
			{/if}
		</nav>
	</header>

	<main class="app__main">
		{@render children?.()}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		background: linear-gradient(180deg, #f7faf8 0%, #ffffff 55%, #eef5f1 100%);
		color: #0f2a22;
	}

	.app__header {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #d9e5df;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(6px);
	}

	.app__brand {
		font-weight: 700;
		font-size: 1.1rem;
		color: #114d3b;
		text-decoration: none;
	}

	.app__nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.app__nav a {
		color: #0f2a22;
		text-decoration: none;
		font-weight: 600;
	}

	.app__nav a:hover {
		text-decoration: underline;
	}

	.app__nav form {
		margin: 0;
	}

	.app__nav button {
		border: 0;
		border-radius: 999px;
		padding: 0.5rem 0.9rem;
		background: #114d3b;
		color: #ffffff;
		cursor: pointer;
	}

	.app__main {
		width: min(100%, 1000px);
		margin: 0 auto;
		padding: 1.5rem;
	}
</style>

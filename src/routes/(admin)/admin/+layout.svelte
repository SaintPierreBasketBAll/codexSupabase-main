<script>
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<section class="admin-shell">
	<nav class="admin-nav" aria-label="Navigation administration">
		<a href={resolve('/admin/licencies')}>Licencies</a>
		<a href={resolve('/admin/users')}>Utilisateurs</a>
		<a href={resolve('/admin/referentiels')}>Referentiels</a>
	</nav>

	<div class="admin-content">
		{@render children?.()}
	</div>
</section>

<style>
	.admin-shell {
		display: grid;
		gap: 1rem;
	}

	.admin-nav {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.admin-nav a {
		text-decoration: none;
		font-weight: 700;
		padding: 0.48rem 0.75rem;
		border-radius: 999px;
		background: #e8f3ee;
		color: #114d3b;
	}

	.admin-content {
		min-width: 0;
	}
</style>

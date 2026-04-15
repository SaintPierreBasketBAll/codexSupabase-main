<script>
	import { resolve } from '$app/paths';
</script>

<section class="home">
	<h1 class="home__title">Gestion des inscriptions SPBB</h1>
	<p class="home__lead">
		Plateforme de suivi des licences pour la saison 2026-2027. Connectez-vous pour gerer votre
		dossier, vos documents et vos echanges avec le club.
	</p>

	<div class="home__actions">
		<a class="home__cta home__cta--primary" href={resolve('/login')}>Se connecter</a>
		<a class="home__cta home__cta--secondary" href={resolve('/signup')}>Creer un compte</a>
	</div>
</section>

<style>
	.home {
		background: #ffffff;
		border: 1px solid #d9e5df;
		border-radius: 18px;
		padding: 1.5rem;
		box-shadow: 0 16px 30px -25px rgba(17, 77, 59, 0.5);
	}

	.home__title {
		margin: 0;
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.home__lead {
		margin-top: 0.9rem;
		line-height: 1.5;
		max-width: 70ch;
	}

	.home__actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
		flex-wrap: wrap;
	}

	.home__cta {
		text-decoration: none;
		font-weight: 700;
		border-radius: 12px;
		padding: 0.7rem 1rem;
	}

	.home__cta--primary {
		background: #114d3b;
		color: #ffffff;
	}

	.home__cta--secondary {
		border: 1px solid #114d3b;
		color: #114d3b;
		background: #ffffff;
	}
</style>

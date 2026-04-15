<script>
	let { data, form } = $props();
</script>

<section class="panel">
	<h1 class="panel__title">Messagerie interne</h1>
	<p class="panel__lead">Echanges entre vous et les administrateurs du club.</p>

	{#if form?.error}
		<p class="panel__message panel__message--error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="panel__message panel__message--success">{form.success}</p>
	{/if}

	{#if !data.registration}
		<div class="card">
			<p>Vous devez d'abord creer un dossier d'inscription pour utiliser la messagerie.</p>
		</div>
	{:else}
		<div class="card">
			<p><strong>Dossier:</strong> {data.registration.last_name} {data.registration.first_names}</p>
			{#if data.messages.length === 0}
				<p>Aucune conversation pour le moment.</p>
			{:else}
				<ul class="messages">
					{#each data.messages as message (message.id)}
						<li class:messages__admin={message.is_admin_message}>
							<header>
								<strong>{message.sender_profile?.email ?? 'Inconnu'}</strong>
								<time>{new Date(message.created_at).toLocaleString('fr-FR')}</time>
							</header>
							{#if message.is_payment_request}
								<p class="badge-inline">Demande de paiement</p>
							{/if}
							{#if message.subject}
								<p><strong>{message.subject}</strong></p>
							{/if}
							<p>{message.body}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<form class="card form" method="POST" action="?/send">
			<label>
				Sujet
				<input name="subject" />
			</label>
			<label>
				Message
				<textarea name="body" rows="4" required></textarea>
			</label>
			<label class="inline-check">
				<input type="checkbox" name="is_payment_request" />
				Ce message est une demande de paiement manuel au club
			</label>
			<button class="button button--primary" type="submit">Envoyer</button>
		</form>
	{/if}
</section>

<style>
	.panel {
		background: #ffffff;
		border: 1px solid #d9e5df;
		border-radius: 18px;
		padding: 1.5rem;
	}

	.panel__title {
		margin: 0;
	}

	.panel__lead {
		margin-top: 0.4rem;
		color: #36594d;
	}

	.panel__message {
		margin-top: 1rem;
		padding: 0.7rem;
		border-radius: 10px;
		font-weight: 600;
	}

	.panel__message--error {
		background: #fde8e8;
		color: #8a2626;
	}

	.panel__message--success {
		background: #e4f6ea;
		color: #1f6a3c;
	}

	.card {
		margin-top: 1rem;
		border: 1px solid #d9e5df;
		border-radius: 14px;
		padding: 1rem;
	}

	.messages {
		list-style: none;
		padding: 0;
		margin: 0.7rem 0 0;
		display: grid;
		gap: 0.6rem;
	}

	.messages li {
		padding: 0.6rem;
		border-radius: 10px;
		background: #f5fbf8;
		border: 1px solid #dbeae3;
	}

	.messages li.messages__admin {
		background: #eef5ff;
		border-color: #d7e4ff;
	}

	.messages header {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.form {
		display: grid;
		gap: 0.7rem;
	}

	.inline-check {
		display: flex;
		gap: 0.45rem;
		align-items: center;
		font-weight: 600;
	}

	.badge-inline {
		display: inline-block;
		margin: 0.25rem 0;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		background: #fff2d6;
		color: #7a4b00;
		font-weight: 700;
		font-size: 0.8rem;
	}

	.form label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}

	.form input,
	.form textarea {
		border: 1px solid #b9cec5;
		border-radius: 10px;
		padding: 0.58rem;
		font: inherit;
	}

	.button {
		border: 0;
		border-radius: 10px;
		padding: 0.6rem 0.9rem;
		font-weight: 700;
		cursor: pointer;
	}

	.button--primary {
		background: #114d3b;
		color: #ffffff;
	}
</style>

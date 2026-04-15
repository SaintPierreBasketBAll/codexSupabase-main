<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	const isSubmitted = $derived(Boolean(data.registration?.registration_submitted_at));

	const requiredDocumentByType = $derived(
		new Map(
			data.requiredDocuments.map((item) => [item.document_types?.id, item]).filter((entry) => entry[0])
		)
	);
</script>

<section class="panel">
	<h1 class="panel__title">Mon dossier</h1>
	<p class="panel__lead">Suivi de votre inscription SPBB saison {data.season}.</p>

	{#if form?.error}
		<p class="panel__message panel__message--error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="panel__message panel__message--success">{form.success}</p>
	{/if}

	{#if !data.registration}
		<div class="card">
			<p>Aucun dossier en cours pour cette saison.</p>
			<a class="button button--primary" href={resolve('/inscription')}>Creer mon dossier</a>
		</div>
	{:else}
		<div class="grid">
			<article class="card">
				<h2>Etat du dossier</h2>
				<p><strong>Nom:</strong> {data.registration.last_name} {data.registration.first_names}</p>
				<p><strong>Email:</strong> {data.registration.email || data.email || '-'}</p>
				<p><strong>Type de licence:</strong> {data.registration.license_types?.label ?? '-'}</p>
				<p><strong>Section:</strong> {data.registration.sections?.label ?? '-'}</p>
				<p><strong>Statut:</strong> {data.registration.registration_statuses?.label ?? 'Non defini'}</p>
				{#if isSubmitted}
					<p class="badge badge--locked">
						Soumis le {new Date(data.registration.registration_submitted_at).toLocaleString('fr-FR')}
					</p>
				{:else}
					<p class="badge">Brouillon modifiable</p>
				{/if}
				<div class="card__actions">
					<a class="button button--secondary" href={resolve('/inscription')}>
						{isSubmitted ? 'Voir le formulaire' : 'Modifier le formulaire'}
					</a>
					<a class="button button--secondary" href={resolve('/messagerie')}>Contacter le club</a>
				</div>
			</article>

			<article class="card">
				<h2>Paiement</h2>
				{#if !data.payment}
					<p>Aucune information de paiement pour le moment.</p>
				{:else}
					<p><strong>Total:</strong> {data.payment.total_amount_eur} EUR</p>
					<p><strong>Regle:</strong> {data.payment.amount_paid_eur} EUR</p>
					<p><strong>Restant:</strong> {data.payment.amount_remaining_eur} EUR</p>
					<p>
						<strong>Mode:</strong>
						{#if data.payment.manual_club_payment}Manuel club{:else}FFBB{/if}
					</p>
					<p>
						<strong>Demande paiement manuel:</strong>
						{data.payment.is_manual_payment_requested ? 'En attente' : 'Aucune'}
					</p>
					<p><strong>Echeances:</strong> {data.payment.installment_count}</p>
					{#if data.payment.payment_statuses}
						<p><strong>Statut:</strong> {data.payment.payment_statuses.label}</p>
					{/if}
					{#if data.installments.length > 0}
						<table>
							<thead>
								<tr>
									<th>#</th>
									<th>Echeance</th>
									<th>Du</th>
									<th>Regle</th>
									<th>Etat</th>
								</tr>
							</thead>
							<tbody>
								{#each data.installments as installment (installment.id)}
									<tr>
										<td>{installment.installment_number}</td>
										<td>{installment.due_date ?? '-'}</td>
										<td>{installment.amount_due_eur}</td>
										<td>{installment.amount_paid_eur}</td>
										<td>{installment.is_paid ? 'Paye' : 'En attente'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				{/if}
			</article>
		</div>

		<article class="card card--full">
			<h2>Documents</h2>
			<p class="hint">Formats autorises: PDF, JPG, JPEG. Taille maximale: 4MB.</p>

			{#if !isSubmitted}
				<form method="POST" action="?/uploadDocument" enctype="multipart/form-data" class="upload-form">
					<input type="hidden" name="registration_id" value={data.registration.id} />

					<label>
						Type de document
						<select name="document_type_id" required>
							<option value="">Selectionner</option>
							{#each data.documentTypes as documentType (documentType.id)}
								<option value={documentType.id}>{documentType.label}</option>
							{/each}
						</select>
					</label>

					<label>
						Fichier
						<input type="file" name="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" required />
					</label>

					<button class="button button--primary" type="submit">Televerser</button>
				</form>
			{/if}

			{#if data.documents.length === 0}
				<p>Aucun document televerse.</p>
			{:else}
				<table>
					<thead>
						<tr>
							<th>Document</th>
							<th>Statut</th>
							<th>Date</th>
							<th>Taille</th>
							<th>Requis</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{#each data.documents as document (document.id)}
							<tr>
								<td>{document.document_types?.label ?? document.file_name}</td>
								<td>{document.document_statuses?.label ?? 'A traiter'}</td>
								<td>{new Date(document.uploaded_at).toLocaleDateString('fr-FR')}</td>
								<td>{Math.round((document.file_size ?? 0) / 1024)} KB</td>
								<td>{requiredDocumentByType.has(document.document_type_id) ? 'Oui' : 'Optionnel'}</td>
								<td>
									{#if !isSubmitted}
										<form method="POST" action="?/deleteDocument">
											<input type="hidden" name="document_id" value={document.id} />
											<button class="button button--danger" type="submit">Supprimer</button>
										</form>
									{:else}
										-
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</article>
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
		margin-top: 0.5rem;
		color: #36594d;
	}

	.panel__message {
		margin-top: 1rem;
		padding: 0.75rem;
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

	.grid {
		margin-top: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.card {
		border: 1px solid #d9e5df;
		border-radius: 14px;
		padding: 1rem;
		background: #ffffff;
	}

	.card--full {
		margin-top: 1rem;
	}

	.card h2 {
		margin: 0 0 0.6rem;
		font-size: 1.05rem;
	}

	.card p {
		margin: 0.35rem 0;
	}

	.badge {
		display: inline-block;
		margin-top: 0.6rem;
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		background: #e8f3ee;
		font-weight: 700;
		color: #114d3b;
	}

	.badge--locked {
		background: #fde8e8;
		color: #8a2626;
	}

	.card__actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.9rem;
		flex-wrap: wrap;
	}

	.button {
		border: 0;
		border-radius: 12px;
		padding: 0.62rem 0.9rem;
		font-weight: 700;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.button--primary {
		background: #114d3b;
		color: #ffffff;
	}

	.button--secondary {
		background: #eef5f1;
		color: #114d3b;
	}

	.button--danger {
		background: #fde8e8;
		color: #8a2626;
	}

	.hint {
		color: #36594d;
		margin-top: 0;
	}

	.upload-form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
		align-items: end;
		margin-bottom: 1rem;
	}

	.upload-form label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}

	.upload-form input,
	.upload-form select {
		padding: 0.6rem;
		border: 1px solid #b9cec5;
		border-radius: 10px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.55rem;
		border-bottom: 1px solid #e0ece6;
		text-align: left;
		vertical-align: top;
		font-size: 0.95rem;
	}

	th {
		font-weight: 700;
		background: #f6fbf8;
	}
</style>

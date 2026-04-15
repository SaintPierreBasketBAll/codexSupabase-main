<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();
</script>

<section class="panel">
	<div class="panel__header">
		<div>
			<h1 class="panel__title">Admin - Fiche licencie</h1>
			<p class="panel__subtitle">
				{data.registration.last_name} {data.registration.first_names} ({data.registration.profiles?.email ?? '-'})
			</p>
		</div>
		<a class="button button--secondary" href={resolve('/admin/licencies')}>Retour liste</a>
	</div>

	{#if form?.error}
		<p class="panel__message panel__message--error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="panel__message panel__message--success">{form.success}</p>
	{/if}

	<div class="grid">
		<article class="card">
			<h2>Dossier</h2>
			<p><strong>ID:</strong> {data.registration.id}</p>
			<p><strong>Saison:</strong> {data.registration.season}</p>
			<p><strong>Soumis:</strong> {data.registration.registration_submitted_at ? 'Oui' : 'Non'}</p>
			<p><strong>Licence:</strong> {data.registration.license_types?.label ?? '-'}</p>
			<p><strong>Section:</strong> {data.registration.sections?.label ?? '-'}</p>
			<p><strong>Pays:</strong> {data.registration.countries?.name ?? '-'}</p>
			<p><strong>Situation:</strong> {data.registration.situation}</p>
			<p><strong>Telephone:</strong> {data.registration.phone ?? '-'}</p>
			<p><strong>Adresse:</strong> {data.registration.full_address ?? '-'}</p>
		</article>

		<article class="card">
			<h2>Workflow FFBB</h2>
			<div class="actions">
				<form method="POST" action="?/sendFfbbLink">
					<input type="hidden" name="registration_id" value={data.registration.id} />
					<button class="button button--primary" type="submit">Envoyer lien FFBB</button>
				</form>
				<form method="POST" action="?/markFfbbRegistrationCompleted">
					<input type="hidden" name="registration_id" value={data.registration.id} />
					<button class="button button--primary" type="submit">Marquer FFBB complet</button>
				</form>
				<form method="POST" action="?/markFfbbPaymentConfirmed">
					<input type="hidden" name="registration_id" value={data.registration.id} />
					<button class="button button--primary" type="submit">Confirmer paiement FFBB</button>
				</form>
			</div>
			<p><strong>Lien envoye:</strong> {data.registration.ffbb_link_sent ? 'Oui' : 'Non'}</p>
			<p><strong>Inscription FFBB:</strong> {data.registration.ffbb_registration_completed ? 'Complete' : 'En cours'}</p>
			<p><strong>Paiement FFBB:</strong> {data.registration.ffbb_payment_confirmed ? 'Confirme' : 'Non confirme'}</p>
		</article>
	</div>

	<article class="card card--full">
		<h2>Pilotage admin</h2>
		<div class="grid">
			<form class="card" method="POST" action="?/setStatus">
				<input type="hidden" name="registration_id" value={data.registration.id} />
				<label>
					Statut
					<select name="status_id">
						{#each data.statusOptions as status (status.id)}
							<option value={status.id} selected={data.registration.registration_statuses?.id === status.id}>
								{status.label}
							</option>
						{/each}
					</select>
				</label>
				<button class="button button--secondary" type="submit">Mettre a jour</button>
			</form>

			<form class="card" method="POST" action="?/updateNote">
				<input type="hidden" name="registration_id" value={data.registration.id} />
				<label>
					Note admin interne
					<textarea name="admin_notes" rows="4">{data.registration.admin_notes ?? ''}</textarea>
				</label>
				<button class="button button--secondary" type="submit">Enregistrer la note</button>
			</form>
		</div>
	</article>

	<article class="card card--full">
		<h2>Documents</h2>
		{#if data.documents.length === 0}
			<p>Aucun document.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Type</th>
						<th>Fichier</th>
						<th>Statut</th>
						<th>Date upload</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each data.documents as document (document.id)}
						<tr>
							<td>{document.document_types?.label ?? '-'}</td>
							<td>{document.file_name}</td>
							<td>{document.document_statuses?.label ?? 'A traiter'}</td>
							<td>{new Date(document.uploaded_at).toLocaleString('fr-FR')}</td>
							<td>
								<div class="actions actions--row">
									<form method="POST" action="?/validateDocument">
										<input type="hidden" name="registration_id" value={data.registration.id} />
										<input type="hidden" name="document_id" value={document.id} />
										<input type="text" name="note" placeholder="Note (optionnel)" />
										<button class="button button--primary button--small" type="submit">Valider</button>
									</form>
									<form method="POST" action="?/rejectDocument">
										<input type="hidden" name="registration_id" value={data.registration.id} />
										<input type="hidden" name="document_id" value={document.id} />
										<input type="text" name="note" placeholder="Motif du rejet" />
										<button class="button button--danger button--small" type="submit">Rejeter</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</article>

	<div class="grid">
		<article class="card">
			<h2>Contacts d'urgence</h2>
			{#if data.emergencyContacts.length === 0}
				<p>Aucun contact.</p>
			{:else}
				<ul>
					{#each data.emergencyContacts as contact (contact.id)}
						<li>
							<strong>{contact.last_name} {contact.first_name}</strong>
							<div>{contact.phone ?? '-'} - {contact.email ?? '-'}</div>
						</li>
					{/each}
				</ul>
			{/if}
		</article>

		<article class="card">
			<h2>Representants legaux</h2>
			{#if data.legalGuardians.length === 0}
				<p>Aucun representant.</p>
			{:else}
				<ul>
					{#each data.legalGuardians as guardian (guardian.id)}
						<li>
							<strong>{guardian.guardian_order}. {guardian.last_name} {guardian.first_names}</strong>
							<div>{guardian.phone ?? '-'} - {guardian.email ?? '-'}</div>
						</li>
					{/each}
				</ul>
			{/if}
		</article>
	</div>

	<div class="grid">
		<article class="card">
			<h2>Paiement</h2>
			{#if !data.payment}
				<p>Aucune donnee paiement.</p>
			{:else}
				<p><strong>Total:</strong> {data.payment.total_amount_eur} EUR</p>
				<p><strong>Regle:</strong> {data.payment.amount_paid_eur} EUR</p>
				<p><strong>Restant:</strong> {data.payment.amount_remaining_eur} EUR</p>
				<p><strong>Mode:</strong> {data.payment.manual_club_payment ? 'Manuel' : 'FFBB'}</p>
				<p><strong>Statut:</strong> {data.payment.payment_statuses?.label ?? '-'}</p>
				<p>
					<strong>Demande paiement manuel:</strong>
					{data.payment.is_manual_payment_requested ? 'Oui' : 'Non'}
				</p>
				<form method="POST" action="?/recordManualPayment" class="payment-form">
					<input type="hidden" name="registration_id" value={data.registration.id} />
					<label>
						Montant encaisse (EUR)
						<input name="amount_paid_eur" type="number" min="0.01" step="0.01" required />
					</label>
					<label>
						Echeance
						<select name="installment_number">
							<option value="1" selected={data.nextInstallmentNumber === 1}>1</option>
							<option value="2" selected={data.nextInstallmentNumber === 2}>2</option>
							<option value="3" selected={data.nextInstallmentNumber === 3}>3</option>
						</select>
					</label>
					<label>
						Methode de paiement
						<select name="payment_method_id">
							<option value="">Non renseignee</option>
							{#each data.paymentMethods as method (method.id)}
								<option value={method.id}>{method.label}</option>
							{/each}
						</select>
					</label>
					<label>
						Date encaissement
						<input name="paid_at" type="datetime-local" />
					</label>
					<label>
						Date echeance
						<input name="due_date" type="date" />
					</label>
					<label>
						Note
						<textarea name="note" rows="2"></textarea>
					</label>
					<button class="button button--primary" type="submit">Enregistrer encaissement</button>
				</form>
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

		<article class="card">
			<h2>Messagerie</h2>
			{#if data.messages.length === 0}
				<p>Aucun message.</p>
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
			<form method="POST" action="?/sendMessage" class="message-form">
				<input type="hidden" name="registration_id" value={data.registration.id} />
				<label>
					Sujet
					<input name="subject" />
				</label>
				<label>
					Message
					<textarea name="body" rows="3" required></textarea>
				</label>
				<label class="inline-check">
					<input type="checkbox" name="is_payment_request" />
					Marquer ce message comme demande de paiement manuel
				</label>
				<button class="button button--primary" type="submit">Envoyer</button>
			</form>
		</article>
	</div>

	<article class="card card--full">
		<h2>Historique</h2>
		{#if data.timeline.length === 0}
			<p>Aucun evenement pour le moment.</p>
		{:else}
			<ul class="timeline">
				{#each data.timeline as event (event.id)}
					<li>
						<strong>{event.event_label}</strong>
						<div>{event.description ?? '-'}</div>
						<small>
							{new Date(event.created_at).toLocaleString('fr-FR')} - {event.actor_profile?.email ?? 'systeme'}
						</small>
					</li>
				{/each}
			</ul>
		{/if}
	</article>
</section>

<style>
	.panel {
		background: #ffffff;
		border: 1px solid #d9e5df;
		border-radius: 18px;
		padding: 1.5rem;
	}

	.panel__header {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: flex-start;
	}

	.panel__title {
		margin: 0;
	}

	.panel__subtitle {
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

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
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

	.actions {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 0.8rem;
	}

	.actions--row {
		grid-template-columns: 1fr;
	}

	.actions--row form {
		display: grid;
		gap: 0.35rem;
	}

	.button {
		border: 0;
		border-radius: 10px;
		padding: 0.58rem 0.85rem;
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

	.button--small {
		padding: 0.42rem 0.55rem;
		font-size: 0.85rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}

	input,
	select,
	textarea {
		padding: 0.58rem;
		border: 1px solid #b9cec5;
		border-radius: 10px;
		font: inherit;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.5rem;
	}

	th,
	td {
		border-bottom: 1px solid #e0ece6;
		padding: 0.5rem;
		text-align: left;
		vertical-align: top;
		font-size: 0.9rem;
	}

	th {
		background: #f6fbf8;
		font-weight: 700;
	}

	ul {
		margin: 0.3rem 0 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.55rem;
	}

	.messages {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.65rem;
	}

	.messages li {
		padding: 0.55rem;
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

	.message-form {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.55rem;
	}

	.payment-form {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.5rem;
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

	.timeline {
		list-style: none;
		padding: 0;
		margin: 0.35rem 0 0;
		display: grid;
		gap: 0.65rem;
	}

	.timeline li {
		border-left: 3px solid #c7ddd3;
		padding-left: 0.6rem;
	}

	.timeline small {
		color: #5a7267;
	}
</style>

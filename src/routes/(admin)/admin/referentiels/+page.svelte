<script>
	let { data, form } = $props();
</script>

<section class="panel">
	<h1 class="panel__title">Admin - Referentiels</h1>
	<p class="panel__lead">Gestion des tables de reference utilisees par les formulaires et workflows.</p>

	{#if form?.error}
		<p class="panel__message panel__message--error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="panel__message panel__message--success">{form.success}</p>
	{/if}

	<div class="grid">
		<article class="card">
			<h2>Pays</h2>
			<form method="POST" action="?/addCountry" class="inline-form">
				<input name="name" placeholder="Nom du pays" required />
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.countries as item (item.id)}
					<li>{item.name}</li>
				{/each}
			</ul>
		</article>

		<article class="card">
			<h2>Types de licence</h2>
			<form method="POST" action="?/addLicenseType" class="stack-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<label class="checkbox">
					<input type="checkbox" name="is_active" checked />
					Actif
				</label>
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<table>
				<thead>
					<tr>
						<th>Code</th>
						<th>Libelle</th>
						<th>Actif</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each data.licenseTypes as item (item.id)}
						<tr>
							<td>{item.code}</td>
							<td>{item.label}</td>
							<td>{item.is_active ? 'Oui' : 'Non'}</td>
							<td>
								<form method="POST" action="?/toggleLicenseType">
									<input type="hidden" name="id" value={item.id} />
									<input type="hidden" name="is_active" value={item.is_active} />
									<button class="button button--small button--secondary" type="submit">
										{item.is_active ? 'Desactiver' : 'Activer'}
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</article>
	</div>

	<div class="grid">
		<article class="card">
			<h2>Types de document</h2>
			<form method="POST" action="?/addDocumentType" class="stack-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<textarea name="description" rows="2" placeholder="description (optionnelle)"></textarea>
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.documentTypes as item (item.id)}
					<li><strong>{item.code}</strong> - {item.label}</li>
				{/each}
			</ul>
		</article>

		<article class="card">
			<h2>Sections</h2>
			<form method="POST" action="?/addSection" class="stack-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<input name="sort_order" type="number" value="0" />
				<label class="checkbox">
					<input type="checkbox" name="is_active" checked />
					Actif
				</label>
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<table>
				<thead>
					<tr>
						<th>Code</th>
						<th>Libelle</th>
						<th>Ordre</th>
						<th>Actif</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{#each data.sections as item (item.id)}
						<tr>
							<td>{item.code}</td>
							<td>{item.label}</td>
							<td>{item.sort_order}</td>
							<td>{item.is_active ? 'Oui' : 'Non'}</td>
							<td>
								<form method="POST" action="?/toggleSection">
									<input type="hidden" name="id" value={item.id} />
									<input type="hidden" name="is_active" value={item.is_active} />
									<button class="button button--small button--secondary" type="submit">
										{item.is_active ? 'Desactiver' : 'Activer'}
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</article>
	</div>

	<div class="grid">
		<article class="card">
			<h2>Methodes de paiement</h2>
			<form method="POST" action="?/addPaymentMethod" class="inline-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.paymentMethods as item (item.id)}
					<li><strong>{item.code}</strong> - {item.label}</li>
				{/each}
			</ul>
		</article>

		<article class="card">
			<h2>Roles utilisateur</h2>
			<form method="POST" action="?/addUserRole" class="inline-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.userRoles as item (item.id)}
					<li><strong>{item.code}</strong> - {item.label}</li>
				{/each}
			</ul>
		</article>
	</div>

	<div class="grid">
		<article class="card">
			<h2>Statuts dossier</h2>
			<form method="POST" action="?/addRegistrationStatus" class="inline-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<input name="sort_order" type="number" value="0" />
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.registrationStatuses as item (item.id)}
					<li><strong>{item.code}</strong> - {item.label} (ordre {item.sort_order})</li>
				{/each}
			</ul>
		</article>

		<article class="card">
			<h2>Statuts document</h2>
			<form method="POST" action="?/addDocumentStatus" class="inline-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.documentStatuses as item (item.id)}
					<li><strong>{item.code}</strong> - {item.label}</li>
				{/each}
			</ul>
		</article>
	</div>

	<div class="grid">
		<article class="card">
			<h2>Statuts message</h2>
			<form method="POST" action="?/addMessageStatus" class="inline-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.messageStatuses as item (item.id)}
					<li><strong>{item.code}</strong> - {item.label}</li>
				{/each}
			</ul>
		</article>

		<article class="card">
			<h2>Statuts paiement</h2>
			<form method="POST" action="?/addPaymentStatus" class="inline-form">
				<input name="code" placeholder="code" required />
				<input name="label" placeholder="libelle" required />
				<button class="button button--primary" type="submit">Ajouter</button>
			</form>
			<ul>
				{#each data.paymentStatuses as item (item.id)}
					<li><strong>{item.code}</strong> - {item.label}</li>
				{/each}
			</ul>
		</article>
	</div>
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
		margin-top: 0.45rem;
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
		margin-top: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1rem;
	}

	.card {
		border: 1px solid #d9e5df;
		border-radius: 14px;
		padding: 1rem;
	}

	.card h2 {
		margin: 0 0 0.6rem;
		font-size: 1.05rem;
	}

	.inline-form,
	.stack-form {
		display: grid;
		gap: 0.45rem;
		margin-bottom: 0.7rem;
	}

	.inline-form {
		grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
		align-items: end;
	}

	input,
	textarea {
		padding: 0.55rem;
		border: 1px solid #b9cec5;
		border-radius: 10px;
		font: inherit;
	}

	.checkbox {
		display: flex;
		gap: 0.45rem;
		align-items: center;
		font-weight: 600;
	}

	.button {
		border: 0;
		border-radius: 10px;
		padding: 0.55rem 0.8rem;
		font-weight: 700;
		cursor: pointer;
	}

	.button--primary {
		background: #114d3b;
		color: #ffffff;
	}

	.button--secondary {
		background: #eef5f1;
		color: #114d3b;
	}

	.button--small {
		padding: 0.4rem 0.58rem;
		font-size: 0.85rem;
	}

	ul {
		margin: 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.35rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.45rem;
		border-bottom: 1px solid #e0ece6;
		font-size: 0.9rem;
		text-align: left;
	}

	th {
		background: #f6fbf8;
		font-weight: 700;
	}
</style>

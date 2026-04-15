<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.filters.pageSize)));
</script>

<section class="panel">
	<h1 class="panel__title">Admin - Liste des licencies ({data.season})</h1>

	{#if form?.error}
		<p class="panel__message panel__message--error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="panel__message panel__message--success">{form.success}</p>
	{/if}

	<form class="filters" method="GET">
		<label>
			Recherche (nom/prenoms)
			<input name="search" value={data.filters.search} />
		</label>

		<label>
			Statut
			<select name="status_id">
				<option value="">Tous</option>
				{#each data.statusOptions as status (status.id)}
					<option value={status.id} selected={data.filters.status_id === status.id}>{status.label}</option>
				{/each}
			</select>
		</label>

		<input type="hidden" name="page" value="1" />
		<button class="button button--primary" type="submit">Filtrer</button>
	</form>

	{#if data.registrations.length === 0}
		<p class="empty">Aucun dossier trouve avec ces filtres.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Licencie</th>
					<th>Email</th>
					<th>Licence</th>
					<th>Section</th>
					<th>Soumis</th>
					<th>FFBB</th>
					<th>Paiement</th>
					<th>Statut</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.registrations as row (row.id)}
					<tr>
						<td>{row.last_name} {row.first_names}</td>
						<td>{row.profiles?.email ?? '-'}</td>
						<td>{row.license_types?.label ?? '-'}</td>
						<td>{row.sections?.label ?? '-'}</td>
						<td>{row.registration_submitted_at ? 'Oui' : 'Non'}</td>
						<td>{row.ffbb_registration_completed ? 'Complete' : 'En cours'}</td>
						<td>{row.ffbb_payment_confirmed ? 'Confirme' : 'Non confirme'}</td>
						<td>
							<form class="inline-form" method="POST" action="?/setStatus">
								<input type="hidden" name="registration_id" value={row.id} />
								<select name="status_id">
									{#each data.statusOptions as status (status.id)}
										<option value={status.id} selected={row.registration_statuses?.id === status.id}>
											{status.label}
										</option>
									{/each}
								</select>
								<button class="button button--small" type="submit">OK</button>
							</form>
						</td>
						<td>
							<a class="button button--secondary button--small" href={resolve(`/admin/licencies/${row.id}`)}
								>Ouvrir</a
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<nav class="pagination" aria-label="Pagination">
		{#if data.filters.page > 1}
			<form method="GET" action={resolve('/admin/licencies')}>
				<input type="hidden" name="search" value={data.filters.search} />
				<input type="hidden" name="status_id" value={data.filters.status_id} />
				<input type="hidden" name="page" value={data.filters.page - 1} />
				<button class="link-button" type="submit">Page precedente</button>
			</form>
		{/if}
		<span>Page {data.filters.page} / {totalPages}</span>
		{#if data.filters.page < totalPages}
			<form method="GET" action={resolve('/admin/licencies')}>
				<input type="hidden" name="search" value={data.filters.search} />
				<input type="hidden" name="status_id" value={data.filters.status_id} />
				<input type="hidden" name="page" value={data.filters.page + 1} />
				<button class="link-button" type="submit">Page suivante</button>
			</form>
		{/if}
	</nav>
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

	.filters {
		margin-top: 1rem;
		display: grid;
		gap: 0.7rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		align-items: end;
	}

	.filters label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}

	.filters input,
	.filters select {
		border: 1px solid #b9cec5;
		border-radius: 10px;
		padding: 0.58rem;
	}

	.button {
		border: 0;
		border-radius: 10px;
		padding: 0.58rem 0.8rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		display: inline-flex;
		justify-content: center;
		align-items: center;
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
		padding: 0.4rem 0.55rem;
		font-size: 0.85rem;
	}

	.inline-form {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th,
	td {
		border-bottom: 1px solid #e0ece6;
		padding: 0.52rem;
		text-align: left;
		vertical-align: top;
		font-size: 0.92rem;
	}

	th {
		background: #f6fbf8;
		font-weight: 700;
	}

	.empty {
		margin-top: 1rem;
		color: #36594d;
	}

	.pagination {
		margin-top: 1rem;
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.link-button {
		border: 0;
		background: transparent;
		padding: 0;
		font: inherit;
		cursor: pointer;
		color: #114d3b;
		font-weight: 600;
	}
</style>

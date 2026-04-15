<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
</script>

<section class="panel">
	<h1 class="panel__title">Admin - Utilisateurs</h1>
	<p class="panel__lead">Promotion et gestion des roles (source: profiles.role).</p>

	{#if form?.error}
		<p class="panel__message panel__message--error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="panel__message panel__message--success">{form.success}</p>
	{/if}

	<form method="GET" class="filters">
		<label>
			Recherche email
			<input name="search" value={data.search} />
		</label>
		<input type="hidden" name="page" value="1" />
		<button class="button button--primary" type="submit">Filtrer</button>
	</form>

	{#if data.rows.length === 0}
		<p class="empty">Aucun utilisateur trouve.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Email</th>
					<th>Role actuel</th>
					<th>Creation</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as row (row.id)}
					<tr>
						<td>{row.email ?? '-'}</td>
						<td><strong>{row.role}</strong></td>
						<td>{new Date(row.created_at).toLocaleDateString('fr-FR')}</td>
						<td>
							<form method="POST" action="?/setRole" class="inline">
								<input type="hidden" name="profile_id" value={row.id} />
								<select name="role">
									<option value="user" selected={row.role === 'user'}>user</option>
									<option value="admin" selected={row.role === 'admin'}>admin</option>
								</select>
								<button class="button button--secondary button--small" type="submit">
									Enregistrer
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<nav class="pagination">
		{#if data.page > 1}
			<form method="GET" action={resolve('/admin/users')}>
				<input type="hidden" name="search" value={data.search} />
				<input type="hidden" name="page" value={data.page - 1} />
				<button class="link-button" type="submit">Page precedente</button>
			</form>
		{/if}
		<span>Page {data.page} / {totalPages}</span>
		{#if data.page < totalPages}
			<form method="GET" action={resolve('/admin/users')}>
				<input type="hidden" name="search" value={data.search} />
				<input type="hidden" name="page" value={data.page + 1} />
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

	.filters {
		margin-top: 1rem;
		display: flex;
		gap: 0.65rem;
		flex-wrap: wrap;
		align-items: end;
	}

	.filters label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}

	.filters input,
	select {
		border: 1px solid #b9cec5;
		border-radius: 10px;
		padding: 0.55rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th,
	td {
		padding: 0.5rem;
		border-bottom: 1px solid #e0ece6;
		text-align: left;
	}

	th {
		font-weight: 700;
		background: #f6fbf8;
	}

	.inline {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.button {
		border: 0;
		border-radius: 10px;
		padding: 0.55rem 0.8rem;
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

	.button--small {
		padding: 0.4rem 0.55rem;
		font-size: 0.85rem;
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

<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	const values = $derived({
		...data.formDefaults,
		...(form?.values ?? {})
	});

	const isSubmitted = $derived(data.registrationMeta?.isSubmitted ?? false);
</script>

<section class="panel">
	<div class="panel__header">
		<h1 class="panel__title">Formulaire d'inscription {data.season}</h1>
		{#if isSubmitted}
			<p class="panel__status panel__status--locked">
				Dossier soumis le {new Date(data.registrationMeta.submittedAt).toLocaleString('fr-FR')}
			</p>
		{:else}
			<p class="panel__status">Mode brouillon actif</p>
		{/if}
	</div>

	{#if form?.error}
		<p class="panel__message panel__message--error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="panel__message panel__message--success">{form.success}</p>
	{/if}

	<form class="form-grid" method="POST">
		<fieldset class="form-grid__section" disabled={isSubmitted}>
			<legend>Identite</legend>

			<label>
				Situation*
				<select name="situation" required value={values.situation}>
					<option value="">Selectionner</option>
					{#each data.situationOptions as option (option.value)}
						<option value={option.value} selected={values.situation === option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<label>
				Type de licence*
				<select name="license_type_id" required value={values.license_type_id}>
					<option value="">Selectionner</option>
					{#each data.referenceData.licenseTypes as item (item.id)}
						<option value={item.id} selected={values.license_type_id === item.id}>{item.label}</option>
					{/each}
				</select>
			</label>

			<label>
				Section
				<select name="section_id" value={values.section_id}>
					<option value="">Non renseigne</option>
					{#each data.referenceData.sections as item (item.id)}
						<option value={item.id} selected={values.section_id === item.id}>{item.label}</option>
					{/each}
				</select>
			</label>

			<label>
				Nom*
				<input name="last_name" required value={values.last_name} />
			</label>

			<label>
				Prenoms*
				<input name="first_names" required value={values.first_names} />
			</label>

			<label>
				Date de naissance*
				<input name="birth_date" type="date" required value={values.birth_date} />
			</label>

			<label>
				Sexe*
				<select name="sex" required value={values.sex}>
					<option value="">Selectionner</option>
					{#each data.sexOptions as option (option.value)}
						<option value={option.value} selected={values.sex === option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<label>
				Pays
				<select name="country_id" value={values.country_id}>
					<option value="">Non renseigne</option>
					{#each data.referenceData.countries as item (item.id)}
						<option value={item.id} selected={values.country_id === item.id}>{item.name}</option>
					{/each}
				</select>
			</label>
		</fieldset>

		<fieldset class="form-grid__section" disabled={isSubmitted}>
			<legend>Coordonnees</legend>

			<label>
				Email
				<input name="email" type="email" value={values.email} />
			</label>

			<label>
				Telephone
				<input name="phone" value={values.phone} />
			</label>

			<label class="form-grid__full">
				Adresse complete
				<textarea name="full_address" rows="2">{values.full_address}</textarea>
			</label>

			<label>
				Code postal
				<input name="postal_code" value={values.postal_code} />
			</label>

			<label>
				Ville
				<input name="city" value={values.city} />
			</label>
		</fieldset>

		<fieldset class="form-grid__section" disabled={isSubmitted}>
			<legend>Mensurations</legend>

			<label>
				Taille (cm)
				<input name="height_cm" type="number" min="50" max="250" value={values.height_cm} />
			</label>

			<label>
				Pointure
				<input name="shoe_size" type="number" min="20" max="60" step="0.5" value={values.shoe_size} />
			</label>

			<label>
				Taille haut
				<select name="top_size" value={values.top_size}>
					<option value="">Non renseigne</option>
					{#each data.sizeOptions as option (option)}
						<option value={option} selected={values.top_size === option}>{option}</option>
					{/each}
				</select>
			</label>

			<label>
				Taille bas
				<select name="bottom_size" value={values.bottom_size}>
					<option value="">Non renseigne</option>
					{#each data.sizeOptions as option (option)}
						<option value={option} selected={values.bottom_size === option}>{option}</option>
					{/each}
				</select>
			</label>
		</fieldset>

		<fieldset class="form-grid__section" disabled={isSubmitted}>
			<legend>Paiement</legend>

			<div class="radio-group">
				<label>
					<input
						type="radio"
						name="payment_mode"
						value="ffbb"
						checked={values.payment_mode !== 'manual'}
					/>
					Paiement FFBB
				</label>
				<label>
					<input
						type="radio"
						name="payment_mode"
						value="manual"
						checked={values.payment_mode === 'manual'}
					/>
					Paiement manuel club
				</label>
			</div>

			<label>
				Nombre d'echeances
				<select name="installment_count" value={values.installment_count}>
					{#each data.installmentOptions as count (count)}
						<option value={count} selected={Number(values.installment_count) === count}>{count}</option>
					{/each}
				</select>
			</label>
		</fieldset>

		<fieldset class="form-grid__section" disabled={isSubmitted}>
			<legend>Validation</legend>
			<label class="checkbox">
				<input
					type="checkbox"
					name="accepted_internal_rules"
					checked={Boolean(values.accepted_internal_rules)}
				/>
				Je reconnais avoir pris connaissance du reglement interieur du club.
			</label>
		</fieldset>

		{#if !isSubmitted}
			<div class="form-grid__actions">
				<button type="submit" formaction="?/save" class="button button--secondary">
					Enregistrer le brouillon
				</button>
				<button type="submit" formaction="?/submit" class="button button--primary">
					Soumettre le dossier
				</button>
			</div>
		{:else}
			<p class="panel__hint">
				Le dossier est verrouille. Pour toute correction, merci de passer par la
				<a href={resolve('/messagerie')}>messagerie</a>.
			</p>
		{/if}
	</form>

	<section class="docs">
		<h2 class="docs__title">Pieces demandees pour cette licence</h2>
		{#if data.requiredDocuments.length === 0}
			<p class="docs__empty">La liste s'affichera des qu'un type de licence est enregistre.</p>
		{:else}
			<ul class="docs__list">
				{#each data.requiredDocuments as item (item.id)}
					<li>
						<strong>{item.document_types?.label ?? 'Document'}</strong>
						{#if item.required_if_minor_only}
							<span>(Requis mineur uniquement)</span>
						{:else if item.is_required}
							<span>(Obligatoire)</span>
						{:else}
							<span>(Optionnel)</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
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
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.panel__title {
		margin: 0;
	}

	.panel__status {
		font-weight: 700;
		color: #0f6b4b;
	}

	.panel__status--locked {
		color: #8a2626;
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

	.form-grid {
		margin-top: 1.25rem;
		display: grid;
		gap: 1rem;
	}

	.form-grid__section {
		border: 1px solid #d9e5df;
		border-radius: 14px;
		padding: 1rem;
		display: grid;
		gap: 0.65rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.form-grid__section legend {
		font-weight: 700;
		padding: 0 0.35rem;
	}

	.form-grid__section label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}

	.form-grid__full {
		grid-column: 1 / -1;
	}

	.form-grid__section input,
	.form-grid__section select,
	.form-grid__section textarea {
		border: 1px solid #b9cec5;
		border-radius: 10px;
		padding: 0.6rem 0.65rem;
		font: inherit;
	}

	.radio-group {
		display: grid;
		gap: 0.45rem;
	}

	.radio-group label {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.checkbox {
		display: flex;
		gap: 0.55rem;
		align-items: flex-start;
	}

	.form-grid__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.button {
		border: 0;
		border-radius: 12px;
		padding: 0.72rem 1rem;
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

	.panel__hint {
		margin-top: 0;
		color: #36594d;
	}

	.docs {
		margin-top: 1.5rem;
		border-top: 1px solid #d9e5df;
		padding-top: 1rem;
	}

	.docs__title {
		margin: 0;
		font-size: 1rem;
	}

	.docs__empty {
		margin-top: 0.6rem;
		color: #36594d;
	}

	.docs__list {
		margin: 0.7rem 0 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.4rem;
	}

	.docs__list span {
		color: #36594d;
		margin-left: 0.3rem;
	}
</style>

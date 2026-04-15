import { error, fail } from '@sveltejs/kit';

function asText(value) {
	return String(value ?? '').trim();
}

function parseSortOrder(value, fallback = 0) {
	const parsed = Number.parseInt(asText(value), 10);
	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return parsed;
}

async function insertCodeLabel(locals, table, payload) {
	const { error: insertError } = await locals.supabase.from(table).insert(payload);
	if (insertError) {
		throw error(500, `Insertion impossible dans ${table}.`);
	}
}

export async function load({ locals }) {
	const [
		countriesResult,
		licenseTypesResult,
		documentTypesResult,
		sectionsResult,
		paymentMethodsResult,
		registrationStatusesResult,
		documentStatusesResult,
		messageStatusesResult,
		paymentStatusesResult,
		userRolesResult
	] = await Promise.all([
		locals.supabase.from('countries').select('id, name').order('name', { ascending: true }),
		locals.supabase
			.from('license_types')
			.select('id, code, label, is_active, created_at')
			.order('label', { ascending: true }),
		locals.supabase
			.from('document_types')
			.select('id, code, label, description, created_at')
			.order('label', { ascending: true }),
		locals.supabase
			.from('sections')
			.select('id, code, label, sort_order, is_active, created_at')
			.order('sort_order', { ascending: true })
			.order('label', { ascending: true }),
		locals.supabase
			.from('payment_methods')
			.select('id, code, label, created_at')
			.order('label', { ascending: true }),
		locals.supabase
			.from('registration_statuses')
			.select('id, code, label, sort_order, created_at')
			.order('sort_order', { ascending: true })
			.order('label', { ascending: true }),
		locals.supabase
			.from('document_statuses')
			.select('id, code, label, created_at')
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('message_statuses')
			.select('id, code, label, created_at')
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('payment_statuses')
			.select('id, code, label, created_at')
			.order('created_at', { ascending: true }),
		locals.supabase.from('user_roles').select('id, code, label, created_at').order('label', { ascending: true })
	]);

	if (
		countriesResult.error ||
		licenseTypesResult.error ||
		documentTypesResult.error ||
		sectionsResult.error ||
		paymentMethodsResult.error ||
		registrationStatusesResult.error ||
		documentStatusesResult.error ||
		messageStatusesResult.error ||
		paymentStatusesResult.error ||
		userRolesResult.error
	) {
		throw error(500, 'Impossible de charger les referentiels.');
	}

	return {
		countries: countriesResult.data ?? [],
		licenseTypes: licenseTypesResult.data ?? [],
		documentTypes: documentTypesResult.data ?? [],
		sections: sectionsResult.data ?? [],
		paymentMethods: paymentMethodsResult.data ?? [],
		registrationStatuses: registrationStatusesResult.data ?? [],
		documentStatuses: documentStatusesResult.data ?? [],
		messageStatuses: messageStatusesResult.data ?? [],
		paymentStatuses: paymentStatusesResult.data ?? [],
		userRoles: userRolesResult.data ?? []
	};
}

export const actions = {
	addCountry: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = asText(formData.get('name'));
		if (!name) {
			return fail(400, { error: 'Le nom du pays est obligatoire.' });
		}

		const { error: insertError } = await locals.supabase.from('countries').insert({ name });
		if (insertError) {
			throw error(500, "Impossible d'ajouter le pays.");
		}

		return { success: 'Pays ajoute.' };
	},
	addLicenseType: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));
		const isActive = formData.get('is_active') === 'on';

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'license_types', {
			code,
			label,
			is_active: isActive
		});

		return { success: 'Type de licence ajoute.' };
	},
	toggleLicenseType: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = asText(formData.get('id'));
		const isActive = formData.get('is_active') === 'true';

		if (!id) {
			return fail(400, { error: 'Type de licence introuvable.' });
		}

		const { error: updateError } = await locals.supabase
			.from('license_types')
			.update({ is_active: !isActive })
			.eq('id', id);

		if (updateError) {
			throw error(500, 'Mise a jour impossible.');
		}

		return { success: 'Type de licence mis a jour.' };
	},
	addDocumentType: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));
		const description = asText(formData.get('description'));

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'document_types', {
			code,
			label,
			description: description || null
		});

		return { success: 'Type de document ajoute.' };
	},
	addSection: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));
		const sortOrder = parseSortOrder(formData.get('sort_order'));
		const isActive = formData.get('is_active') === 'on';

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'sections', {
			code,
			label,
			sort_order: sortOrder,
			is_active: isActive
		});

		return { success: 'Section ajoutee.' };
	},
	toggleSection: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = asText(formData.get('id'));
		const isActive = formData.get('is_active') === 'true';

		if (!id) {
			return fail(400, { error: 'Section introuvable.' });
		}

		const { error: updateError } = await locals.supabase
			.from('sections')
			.update({ is_active: !isActive })
			.eq('id', id);

		if (updateError) {
			throw error(500, 'Mise a jour de section impossible.');
		}

		return { success: 'Section mise a jour.' };
	},
	addPaymentMethod: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'payment_methods', { code, label });
		return { success: 'Methode de paiement ajoutee.' };
	},
	addRegistrationStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));
		const sortOrder = parseSortOrder(formData.get('sort_order'));

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'registration_statuses', {
			code,
			label,
			sort_order: sortOrder
		});
		return { success: 'Statut dossier ajoute.' };
	},
	addDocumentStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'document_statuses', { code, label });
		return { success: 'Statut document ajoute.' };
	},
	addMessageStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'message_statuses', { code, label });
		return { success: 'Statut message ajoute.' };
	},
	addPaymentStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'payment_statuses', { code, label });
		return { success: 'Statut paiement ajoute.' };
	},
	addUserRole: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = asText(formData.get('code')).toLowerCase();
		const label = asText(formData.get('label'));

		if (!code || !label) {
			return fail(400, { error: 'Code et libelle sont obligatoires.' });
		}

		await insertCodeLabel(locals, 'user_roles', { code, label });
		return { success: 'Role utilisateur ajoute.' };
	}
};

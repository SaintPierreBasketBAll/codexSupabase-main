import { error, fail } from '@sveltejs/kit';
import { CURRENT_SEASON } from '$lib/constants';

function readFilterValue(value) {
	return String(value ?? '').trim();
}

function applySearchFilter(query, search) {
	if (!search) {
		return query;
	}

	return query.or(`last_name.ilike.%${search}%,first_names.ilike.%${search}%`);
}

async function loadStatusOptions(locals) {
	const { data, error: statusesError } = await locals.supabase
		.from('registration_statuses')
		.select('id, code, label, sort_order')
		.order('sort_order', { ascending: true })
		.order('label', { ascending: true });

	if (statusesError) {
		throw error(500, 'Impossible de charger les statuts de dossier.');
	}

	return data ?? [];
}

async function loadRegistrations(locals, filters) {
	let query = locals.supabase
		.from('registrations')
		.select(
			'id, season, last_name, first_names, created_at, updated_at, registration_submitted_at, ffbb_link_sent, ffbb_registration_completed, ffbb_payment_confirmed, admin_notes, profiles:user_id(email), license_types:license_type_id(label), sections:section_id(label), registration_statuses:status_id(id, code, label)',
			{ count: 'exact' }
		)
		.eq('season', CURRENT_SEASON)
		.order('updated_at', { ascending: false })
		.range(filters.offset, filters.offset + filters.pageSize - 1);

	if (filters.statusId) {
		query = query.eq('status_id', filters.statusId);
	}

	query = applySearchFilter(query, filters.search);

	const { data, error: registrationsError, count } = await query;
	if (registrationsError) {
		throw error(500, 'Impossible de charger les dossiers licencies.');
	}

	return {
		rows: data ?? [],
		total: count ?? 0
	};
}

function parseFilters(url) {
	const search = readFilterValue(url.searchParams.get('search'));
	const statusId = readFilterValue(url.searchParams.get('status_id'));
	const pageRaw = Number.parseInt(readFilterValue(url.searchParams.get('page')), 10);
	const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
	const pageSize = 20;

	return {
		search,
		statusId,
		page,
		pageSize,
		offset: (page - 1) * pageSize
	};
}

export async function load({ locals, url }) {
	const filters = parseFilters(url);
	const [statusOptions, registrations] = await Promise.all([
		loadStatusOptions(locals),
		loadRegistrations(locals, filters)
	]);

	return {
		season: CURRENT_SEASON,
		statusOptions,
		registrations: registrations.rows,
		total: registrations.total,
		filters: {
			search: filters.search,
			status_id: filters.statusId,
			page: filters.page,
			pageSize: filters.pageSize
		}
	};
}

export const actions = {
	setStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = readFilterValue(formData.get('registration_id'));
		const statusId = readFilterValue(formData.get('status_id'));

		if (!registrationId) {
			return fail(400, { error: 'Dossier introuvable.' });
		}

		if (!statusId) {
			return fail(400, { error: 'Le statut est obligatoire.' });
		}

		const { error: updateError } = await locals.supabase
			.from('registrations')
			.update({
				status_id: statusId,
				updated_at: new Date().toISOString()
			})
			.eq('id', registrationId);

		if (updateError) {
			throw error(500, 'Impossible de mettre a jour le statut.');
		}

		await locals.supabase.from('registration_timeline').insert({
			registration_id: registrationId,
			event_code: 'status_updated',
			event_label: 'Statut mis a jour',
			description: 'Statut modifie par un administrateur.',
			actor_profile_id: locals.user.id
		});

		return {
			success: 'Statut mis a jour.'
		};
	}
};

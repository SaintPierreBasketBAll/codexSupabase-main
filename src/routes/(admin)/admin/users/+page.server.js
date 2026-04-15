import { error, fail } from '@sveltejs/kit';

function asText(value) {
	return String(value ?? '').trim();
}

function applySearch(query, search) {
	if (!search) {
		return query;
	}

	return query.ilike('email', `%${search}%`);
}

export async function load({ locals, url }) {
	const search = asText(url.searchParams.get('search'));
	const pageRaw = Number.parseInt(asText(url.searchParams.get('page')), 10);
	const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
	const pageSize = 30;
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	let query = locals.supabase
		.from('profiles')
		.select('id, email, role, created_at', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(from, to);

	query = applySearch(query, search);

	const { data, error: profilesError, count } = await query;
	if (profilesError) {
		throw error(500, 'Impossible de charger les utilisateurs.');
	}

	return {
		rows: data ?? [],
		total: count ?? 0,
		page,
		pageSize,
		search
	};
}

export const actions = {
	setRole: async ({ request, locals }) => {
		const formData = await request.formData();
		const profileId = asText(formData.get('profile_id'));
		const role = asText(formData.get('role'));

		if (!profileId || !['user', 'admin'].includes(role)) {
			return fail(400, { error: 'Parametres invalides.' });
		}

		if (profileId === locals.user.id && role !== 'admin') {
			return fail(400, { error: 'Vous ne pouvez pas retirer votre propre role admin.' });
		}

		const roleCode = role === 'admin' ? 'admin' : 'member';
		const { error: updateError } = await locals.supabase
			.from('profiles')
			.update({
				role,
				role_code: roleCode
			})
			.eq('id', profileId);

		if (updateError) {
			throw error(500, 'Impossible de mettre a jour le role utilisateur.');
		}

		return {
			success: role === 'admin' ? 'Utilisateur promu admin.' : 'Utilisateur repasse en role user.'
		};
	}
};

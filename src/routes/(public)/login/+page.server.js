import { fail, redirect } from '@sveltejs/kit';
import { normalizeNextPath } from '$lib/server/guards';
import { persistAuthSession } from '$lib/server/supabase';

export function load({ url }) {
	return {
		next: normalizeNextPath(url.searchParams.get('next'))
	};
}

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const password = String(formData.get('password') ?? '');
		const next = normalizeNextPath(String(formData.get('next') ?? ''), '/mon-dossier');

		if (!email || !password) {
			return fail(400, {
				error: 'Email et mot de passe requis.',
				values: { email },
				next
			});
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error || !data.session) {
			return fail(401, {
				error: 'Identifiants invalides.',
				values: { email },
				next
			});
		}

		persistAuthSession(cookies, data.session);
		throw redirect(303, next);
	}
};

import { fail, redirect } from '@sveltejs/kit';
import { persistAuthSession } from '$lib/server/supabase';

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, {
				error: 'Email et mot de passe requis.',
				values: { email }
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Le mot de passe doit contenir au moins 8 caracteres.',
				values: { email }
			});
		}

		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password
		});

		if (error) {
			return fail(400, {
				error: "Impossible de creer le compte avec ces informations.",
				values: { email }
			});
		}

		if (data.session) {
			persistAuthSession(cookies, data.session);
			throw redirect(303, '/mon-dossier');
		}

		return {
			success: true
		};
	}
};

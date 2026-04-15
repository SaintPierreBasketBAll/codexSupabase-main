import { redirect } from '@sveltejs/kit';
import { clearAuthSession } from '$lib/server/supabase';

export async function POST({ locals, cookies }) {
	if (locals.session) {
		await locals.supabase.auth.signOut();
	}

	clearAuthSession(cookies);
	throw redirect(303, '/login');
}

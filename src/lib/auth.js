import { getSupabaseBrowserClient } from '$lib/supabase.js';

export async function getUserFromBrowser() {
	const supabase = getSupabaseBrowserClient();
	const { data, error } = await supabase.auth.getUser();

	if (error) {
		throw error;
	}

	return data.user;
}

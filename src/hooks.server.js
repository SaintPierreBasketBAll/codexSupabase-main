import {
	createRequestSupabaseClient,
	createServiceRoleSupabaseClient,
	restoreAuthSession
} from '$lib/server/supabase';

async function loadUserProfile({ locals }) {
	if (!locals.user) {
		return null;
	}

	const profileSelect = 'id, role, email';
	const { data, error } = await locals.supabase
		.from('profiles')
		.select(profileSelect)
		.eq('id', locals.user.id)
		.maybeSingle();

	if (!error && data) {
		return data;
	}

	const profileInput = {
		id: locals.user.id,
		email: locals.user.email ?? null,
		role: 'user'
	};

	const { data: insertedWithAnon } = await locals.supabase
		.from('profiles')
		.upsert(profileInput, { onConflict: 'id' })
		.select(profileSelect)
		.maybeSingle();

	if (insertedWithAnon) {
		return insertedWithAnon;
	}

	try {
		const serviceClient = createServiceRoleSupabaseClient();
		const { data: insertedWithService } = await serviceClient
			.from('profiles')
			.upsert(profileInput, { onConflict: 'id' })
			.select(profileSelect)
			.maybeSingle();

		if (insertedWithService) {
			return insertedWithService;
		}
	} catch {
		// Fallback when service role key is not configured.
	}

	if (error) {
		return null;
	}

	return {
		id: locals.user.id,
		role: 'user',
		email: locals.user.email ?? null
	};
}

export async function handle({ event, resolve }) {
	event.locals.supabase = createRequestSupabaseClient();
	event.locals.session = null;
	event.locals.user = null;
	event.locals.profile = null;

	const { session, user } = await restoreAuthSession({
		supabase: event.locals.supabase,
		cookies: event.cookies
	});

	event.locals.session = session;
	event.locals.user = user;
	event.locals.profile = await loadUserProfile({ locals: event.locals });

	return resolve(event);
}

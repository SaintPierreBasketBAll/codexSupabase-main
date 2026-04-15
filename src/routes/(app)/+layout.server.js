import { requireAuth } from '$lib/server/guards';

export function load({ locals, url }) {
	requireAuth(locals, url);

	return {
		user: locals.user,
		profile: locals.profile
	};
}

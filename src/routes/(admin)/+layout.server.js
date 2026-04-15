import { requireAdmin } from '$lib/server/guards';

export function load({ locals, url }) {
	requireAdmin(locals, url);
}

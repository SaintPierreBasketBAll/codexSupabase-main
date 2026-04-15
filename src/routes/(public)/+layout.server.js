import { requireGuest } from '$lib/server/guards';

export function load({ locals }) {
	requireGuest(locals);
}

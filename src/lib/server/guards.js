import { redirect } from '@sveltejs/kit';

export function normalizeNextPath(candidate, fallback = '/mon-dossier') {
	if (!candidate || typeof candidate !== 'string') {
		return fallback;
	}

	if (!candidate.startsWith('/')) {
		return fallback;
	}

	if (candidate.startsWith('//')) {
		return fallback;
	}

	return candidate;
}

export function requireGuest(locals) {
	if (locals.user) {
		throw redirect(303, '/mon-dossier');
	}
}

export function requireAuth(locals, url) {
	if (locals.user) {
		return locals.user;
	}

	const next = normalizeNextPath(`${url.pathname}${url.search}`, '/mon-dossier');
	throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
}

export function requireAdmin(locals, url) {
	requireAuth(locals, url);

	if (locals.profile?.role !== 'admin') {
		throw redirect(303, '/mon-dossier');
	}
}

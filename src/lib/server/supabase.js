import { dev } from '$app/environment';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		"Les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requises."
	);
}

export const ACCESS_TOKEN_COOKIE = 'spbb-access-token';
export const REFRESH_TOKEN_COOKIE = 'spbb-refresh-token';

const baseCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: !dev
};

function createBaseClient(apiKey) {
	return createClient(supabaseUrl, apiKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false
		}
	});
}

export function createRequestSupabaseClient() {
	return createBaseClient(supabaseAnonKey);
}

export function createServiceRoleSupabaseClient() {
	if (!supabaseServiceRoleKey) {
		throw new Error("La variable d'environnement SUPABASE_SERVICE_ROLE_KEY est requise.");
	}

	return createBaseClient(supabaseServiceRoleKey);
}

export function persistAuthSession(cookies, session) {
	const maxAge = Math.max(1, Number(session.expires_in ?? 60 * 60));

	cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
		...baseCookieOptions,
		maxAge
	});
	cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
		...baseCookieOptions,
		maxAge: 60 * 60 * 24 * 30
	});
}

export function clearAuthSession(cookies) {
	cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/' });
	cookies.delete(REFRESH_TOKEN_COOKIE, { path: '/' });
}

export async function restoreAuthSession({ supabase, cookies }) {
	const accessToken = cookies.get(ACCESS_TOKEN_COOKIE);
	const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE);

	if (!accessToken || !refreshToken) {
		return { session: null, user: null };
	}

	const { data, error } = await supabase.auth.setSession({
		access_token: accessToken,
		refresh_token: refreshToken
	});

	if (error || !data.session) {
		clearAuthSession(cookies);
		return { session: null, user: null };
	}

	persistAuthSession(cookies, data.session);
	return { session: data.session, user: data.session.user ?? null };
}

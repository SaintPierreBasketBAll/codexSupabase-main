import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

type UserRole = 'user' | 'admin' | null;

type UserProfile = {
	id: string;
	role: UserRole;
	email: string | null;
} | null;

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
			user: User | null;
			profile: UserProfile;
		}

		interface PageData {
			session: Session | null;
			user: User | null;
			profile: UserProfile;
		}
	}
}

export {};

import { error, fail } from '@sveltejs/kit';
import { CURRENT_SEASON } from '$lib/constants';

function asText(value) {
	return String(value ?? '').trim();
}

function asBoolean(value) {
	return value === 'on' || value === 'true' || value === true;
}

async function getCurrentRegistration(locals) {
	const { data, error: registrationError } = await locals.supabase
		.from('registrations')
		.select('id, season, last_name, first_names')
		.eq('user_id', locals.user.id)
		.eq('season', CURRENT_SEASON)
		.order('updated_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (registrationError) {
		throw error(500, "Impossible de charger votre dossier pour la messagerie.");
	}

	return data ?? null;
}

async function getThreadAndMessages(locals, registrationId) {
	const { data: thread, error: threadError } = await locals.supabase
		.from('registration_threads')
		.select('id, registration_id, created_at')
		.eq('registration_id', registrationId)
		.maybeSingle();

	if (threadError) {
		throw error(500, 'Impossible de charger la conversation.');
	}

	if (!thread) {
		return { thread: null, messages: [] };
	}

	const { data: messages, error: messagesError } = await locals.supabase
		.from('registration_messages')
		.select(
			'id, subject, body, is_admin_message, is_payment_request, created_at, read_at, sender_profile:sender_profile_id(email, role), message_statuses:status_id(code, label)'
		)
		.eq('thread_id', thread.id)
		.order('created_at', { ascending: true });

	if (messagesError) {
		throw error(500, 'Impossible de charger les messages.');
	}

	return {
		thread,
		messages: messages ?? []
	};
}

export async function load({ locals }) {
	const registration = await getCurrentRegistration(locals);
	if (!registration) {
		return {
			registration: null,
			thread: null,
			messages: []
		};
	}

	const { thread, messages } = await getThreadAndMessages(locals, registration.id);
	return {
		registration,
		thread,
		messages
	};
}

export const actions = {
	send: async ({ request, locals }) => {
		const formData = await request.formData();
		const subject = asText(formData.get('subject'));
		const body = asText(formData.get('body'));
		const isPaymentRequest = asBoolean(formData.get('is_payment_request'));

		if (!body) {
			return fail(400, { error: 'Le message est obligatoire.' });
		}

		const registration = await getCurrentRegistration(locals);
		if (!registration) {
			return fail(404, { error: 'Aucun dossier en cours pour cette saison.' });
		}

		const threadResult = await locals.supabase
			.from('registration_threads')
			.upsert({ registration_id: registration.id }, { onConflict: 'registration_id' })
			.select('id')
			.single();

		if (threadResult.error || !threadResult.data) {
			throw error(500, 'Impossible de preparer la conversation.');
		}

		const { error: messageError } = await locals.supabase.from('registration_messages').insert({
			thread_id: threadResult.data.id,
			sender_profile_id: locals.user.id,
			subject: subject || null,
			body,
			is_admin_message: false,
			is_payment_request: isPaymentRequest
		});

		if (messageError) {
			throw error(500, "Impossible d'envoyer le message.");
		}

		if (isPaymentRequest) {
			const { error: paymentUpdateError } = await locals.supabase
				.from('registration_payments')
				.upsert(
					{
						registration_id: registration.id,
						manual_club_payment: true,
						ffbb_payment: false,
						is_manual_payment_requested: true,
						manual_payment_requested_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					{ onConflict: 'registration_id' }
				);

			if (paymentUpdateError) {
				throw error(500, 'Le message est envoye mais la demande de paiement n a pas ete enregistree.');
			}

			await locals.supabase.from('registration_timeline').insert({
				registration_id: registration.id,
				event_code: 'user_manual_payment_request',
				event_label: 'Demande paiement manuel',
				description: 'Le licencie a demande un paiement manuel au club.',
				actor_profile_id: locals.user.id
			});
		}

		await locals.supabase.from('registration_timeline').insert({
			registration_id: registration.id,
			event_code: 'user_message_sent',
			event_label: 'Message licencie',
			description: 'Le licencie a envoye un message au club.',
			actor_profile_id: locals.user.id
		});

		return {
			success: 'Message envoye.'
		};
	}
};

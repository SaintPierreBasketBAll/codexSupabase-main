import { error, fail } from '@sveltejs/kit';
import { recordManualPaymentWithFallbacks } from '$lib/server/payments';

function asText(value) {
	return String(value ?? '').trim();
}

function asBoolean(value) {
	return value === 'on' || value === 'true' || value === true;
}

function asPositiveAmount(value) {
	const raw = asText(value).replace(',', '.');
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return Number.NaN;
	}

	return parsed;
}

function asInstallmentNumber(value, fallback = 1) {
	const parsed = Number.parseInt(asText(value), 10);
	if (!Number.isFinite(parsed) || parsed < 1 || parsed > 3) {
		return fallback;
	}

	return parsed;
}

function asNullableIsoDateTime(value) {
	const raw = asText(value);
	if (!raw) {
		return null;
	}

	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed.toISOString();
}

function asNullableDate(value) {
	const raw = asText(value);
	if (!raw) {
		return null;
	}

	return raw;
}

async function loadRegistration(locals, registrationId) {
	const { data, error: registrationError } = await locals.supabase
		.from('registrations')
		.select(
			'id, season, user_id, last_name, first_names, birth_date, sex, email, phone, city, postal_code, full_address, situation, top_size, bottom_size, shoe_size, accepted_internal_rules, admin_notes, registration_submitted_at, ffbb_link_sent, ffbb_link_sent_at, ffbb_registration_completed, ffbb_registration_completed_at, ffbb_payment_confirmed, ffbb_payment_confirmed_at, created_at, updated_at, profiles:user_id(id, email, role), license_types:license_type_id(id, code, label), sections:section_id(id, code, label), countries:country_id(id, name), registration_statuses:status_id(id, code, label)'
		)
		.eq('id', registrationId)
		.maybeSingle();

	if (registrationError) {
		throw error(500, 'Impossible de charger le dossier.');
	}

	if (!data) {
		throw error(404, 'Dossier introuvable.');
	}

	return data;
}

async function loadSupportData(locals, registrationId) {
	const [
		statusOptionsResult,
		documentsResult,
		emergencyContactsResult,
		legalGuardiansResult,
		paymentResult,
		paymentMethodsResult,
		timelineResult,
		threadResult
	] = await Promise.all([
		locals.supabase
			.from('registration_statuses')
			.select('id, code, label, sort_order')
			.order('sort_order', { ascending: true })
			.order('label', { ascending: true }),
		locals.supabase
			.from('registration_documents')
			.select(
				'id, registration_id, file_name, file_path, mime_type, file_size, uploaded_at, reviewed_at, review_note, document_types:document_type_id(id, code, label), document_statuses:status_id(id, code, label), uploaded_profile:uploaded_by(email), reviewed_profile:reviewed_by(email)'
			)
			.eq('registration_id', registrationId)
			.order('uploaded_at', { ascending: false }),
		locals.supabase
			.from('emergency_contacts')
			.select('id, last_name, first_name, email, phone, created_at')
			.eq('registration_id', registrationId)
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('legal_guardians')
			.select('id, guardian_order, last_name, first_names, phone, email, created_at')
			.eq('registration_id', registrationId)
			.order('guardian_order', { ascending: true }),
		locals.supabase
			.from('registration_payments')
			.select(
				'id, registration_id, total_amount_eur, amount_paid_eur, amount_remaining_eur, installment_count, ffbb_payment, manual_club_payment, is_manual_payment_requested, manual_payment_requested_at, notes, payment_statuses:payment_status_id(id, code, label), payment_methods:payment_method_id(id, code, label)'
			)
			.eq('registration_id', registrationId)
			.maybeSingle(),
		locals.supabase
			.from('payment_methods')
			.select('id, code, label')
			.order('label', { ascending: true }),
		locals.supabase
			.from('registration_timeline')
			.select('id, event_code, event_label, description, created_at, actor_profile:actor_profile_id(email)')
			.eq('registration_id', registrationId)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('registration_threads')
			.select('id, registration_id, created_at')
			.eq('registration_id', registrationId)
			.maybeSingle()
	]);

	if (
		statusOptionsResult.error ||
		documentsResult.error ||
		emergencyContactsResult.error ||
		legalGuardiansResult.error ||
		paymentResult.error ||
		paymentMethodsResult.error ||
		timelineResult.error ||
		threadResult.error
	) {
		throw error(500, 'Impossible de charger les details du dossier.');
	}

	let installments = [];
	if (paymentResult.data?.id) {
		const installmentsResult = await locals.supabase
			.from('payment_installments')
			.select(
				'id, installment_number, due_date, amount_due_eur, amount_paid_eur, paid_at, is_paid, note, payment_methods:payment_method_id(id, code, label), received_profile:received_by(email)'
			)
			.eq('registration_payment_id', paymentResult.data.id)
			.order('installment_number', { ascending: true });

		if (installmentsResult.error) {
			throw error(500, "Impossible de charger l'echeancier du dossier.");
		}

		installments = installmentsResult.data ?? [];
	}

	let messages = [];
	if (threadResult.data?.id) {
		const messagesResult = await locals.supabase
			.from('registration_messages')
			.select(
				'id, thread_id, sender_profile_id, subject, body, is_admin_message, is_payment_request, created_at, read_at, sender_profile:sender_profile_id(email, role), message_statuses:status_id(code, label)'
			)
			.eq('thread_id', threadResult.data.id)
			.order('created_at', { ascending: true });

		if (messagesResult.error) {
			throw error(500, 'Impossible de charger les messages du dossier.');
		}

		messages = messagesResult.data ?? [];
	}

	const firstUnpaidInstallment = installments.find((item) => !item.is_paid);
	const nextInstallmentNumber =
		firstUnpaidInstallment?.installment_number ??
		Math.max(1, Math.min(paymentResult.data?.installment_count ?? 1, 3));

	return {
		statusOptions: statusOptionsResult.data ?? [],
		documents: documentsResult.data ?? [],
		emergencyContacts: emergencyContactsResult.data ?? [],
		legalGuardians: legalGuardiansResult.data ?? [],
		payment: paymentResult.data ?? null,
		paymentMethods: paymentMethodsResult.data ?? [],
		installments,
		nextInstallmentNumber,
		timeline: timelineResult.data ?? [],
		thread: threadResult.data ?? null,
		messages
	};
}

export async function load({ locals, params }) {
	const registrationId = asText(params.registrationId);
	if (!registrationId) {
		throw error(400, 'Identifiant de dossier invalide.');
	}

	const [registration, supportData] = await Promise.all([
		loadRegistration(locals, registrationId),
		loadSupportData(locals, registrationId)
	]);

	return {
		registration,
		...supportData
	};
}

async function addTimelineEvent(locals, registrationId, eventCode, eventLabel, description) {
	await locals.supabase.from('registration_timeline').insert({
		registration_id: registrationId,
		event_code: eventCode,
		event_label: eventLabel,
		description,
		actor_profile_id: locals.user.id
	});
}

export const actions = {
	setStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));
		const statusId = asText(formData.get('status_id'));

		if (!registrationId || !statusId) {
			return fail(400, { error: 'Statut invalide.' });
		}

		const { error: updateError } = await locals.supabase
			.from('registrations')
			.update({
				status_id: statusId,
				updated_at: new Date().toISOString()
			})
			.eq('id', registrationId);

		if (updateError) {
			throw error(500, 'Impossible de mettre a jour le statut.');
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'admin_status_update',
			'Statut mis a jour',
			'Le statut du dossier a ete modifie par un administrateur.'
		);

		return { success: 'Statut mis a jour.' };
	},
	updateNote: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));
		const adminNote = asText(formData.get('admin_notes'));

		if (!registrationId) {
			return fail(400, { error: 'Dossier introuvable.' });
		}

		const { error: updateError } = await locals.supabase
			.from('registrations')
			.update({
				admin_notes: adminNote || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', registrationId);

		if (updateError) {
			throw error(500, 'Impossible de mettre a jour la note admin.');
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'admin_note_update',
			'Note admin mise a jour',
			'La note interne admin a ete modifiee.'
		);

		return { success: 'Note admin enregistree.' };
	},
	sendFfbbLink: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));

		if (!registrationId) {
			return fail(400, { error: 'Dossier introuvable.' });
		}

		const { error: rpcError } = await locals.supabase.rpc('send_ffbb_link', {
			p_registration_id: registrationId
		});

		if (rpcError) {
			throw error(500, "L'envoi du lien FFBB a echoue.");
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'ffbb_link_sent',
			'Lien FFBB envoye',
			'Lien FFBB envoye au licencie.'
		);

		return { success: 'Lien FFBB envoye.' };
	},
	markFfbbRegistrationCompleted: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));

		if (!registrationId) {
			return fail(400, { error: 'Dossier introuvable.' });
		}

		const { error: rpcError } = await locals.supabase.rpc('mark_ffbb_registration_completed', {
			p_registration_id: registrationId
		});

		if (rpcError) {
			throw error(500, "Impossible de marquer l'inscription FFBB comme complete.");
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'ffbb_registration_completed',
			'Inscription FFBB complete',
			"Le statut de l'inscription FFBB a ete confirme."
		);

		return { success: 'Inscription FFBB marquee comme complete.' };
	},
	markFfbbPaymentConfirmed: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));

		if (!registrationId) {
			return fail(400, { error: 'Dossier introuvable.' });
		}

		const { error: rpcError } = await locals.supabase.rpc('mark_ffbb_payment_confirmed', {
			p_registration_id: registrationId
		});

		if (rpcError) {
			throw error(500, 'Impossible de confirmer le paiement FFBB.');
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'ffbb_payment_confirmed',
			'Paiement FFBB confirme',
			'Le paiement FFBB a ete confirme.'
		);

		return { success: 'Paiement FFBB confirme.' };
	},
	recordManualPayment: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));
		const amountPaidEur = asPositiveAmount(formData.get('amount_paid_eur'));
		const installmentNumber = asInstallmentNumber(formData.get('installment_number'));
		const paymentMethodId = asText(formData.get('payment_method_id'));
		const note = asText(formData.get('note'));
		const paidAtRaw = asText(formData.get('paid_at'));
		const dueDateRaw = asText(formData.get('due_date'));
		const paidAt = asNullableIsoDateTime(paidAtRaw);
		const dueDate = asNullableDate(dueDateRaw);

		if (!registrationId) {
			return fail(400, { error: 'Dossier introuvable.' });
		}

		if (Number.isNaN(amountPaidEur)) {
			return fail(400, { error: 'Le montant encaisse doit etre strictement superieur a 0.' });
		}

		if (paidAtRaw && !paidAt) {
			return fail(400, { error: "La date d'encaissement est invalide." });
		}

		const [paymentResult, paymentMethodResult] = await Promise.all([
			locals.supabase
				.from('registration_payments')
				.select('id, registration_id')
				.eq('registration_id', registrationId)
				.maybeSingle(),
			paymentMethodId
				? locals.supabase
						.from('payment_methods')
						.select('id, code, label')
						.eq('id', paymentMethodId)
						.maybeSingle()
				: Promise.resolve({ data: null, error: null })
		]);

		if (paymentResult.error || !paymentResult.data) {
			return fail(404, { error: 'Aucune fiche paiement trouvee pour ce dossier.' });
		}

		if (paymentMethodId && (paymentMethodResult.error || !paymentMethodResult.data)) {
			return fail(400, { error: 'Methode de paiement invalide.' });
		}

		const rpcResult = await recordManualPaymentWithFallbacks({
			supabase: locals.supabase,
			registrationId,
			registrationPaymentId: paymentResult.data.id,
			installmentNumber,
			amountPaidEur,
			paymentMethodId: paymentMethodResult.data?.id ?? null,
			paymentMethodCode: paymentMethodResult.data?.code ?? null,
			paidAt,
			dueDate,
			receivedBy: locals.user.id,
			note: note || null
		});

		if (!rpcResult.success) {
			throw error(500, "L'enregistrement du paiement manuel a echoue.");
		}

		const { error: paymentFlagsError } = await locals.supabase
			.from('registration_payments')
			.update({
				manual_club_payment: true,
				ffbb_payment: false,
				is_manual_payment_requested: false,
				updated_at: new Date().toISOString()
			})
			.eq('id', paymentResult.data.id);

		if (paymentFlagsError) {
			throw error(500, "Le paiement est enregistre, mais la mise a jour de l'etat a echoue.");
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'manual_payment_recorded',
			'Paiement manuel enregistre',
			`Encaissement de ${amountPaidEur.toFixed(2)} EUR sur echeance ${installmentNumber}.`
		);

		return { success: 'Paiement manuel enregistre.' };
	},
	validateDocument: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));
		const documentId = asText(formData.get('document_id'));
		const note = asText(formData.get('note'));

		if (!registrationId || !documentId) {
			return fail(400, { error: 'Document introuvable.' });
		}

		const { error: rpcError } = await locals.supabase.rpc('validate_document', {
			p_document_id: documentId,
			p_note: note || null
		});

		if (rpcError) {
			throw error(500, 'Validation du document impossible.');
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'document_validated',
			'Document valide',
			'Un document a ete valide par un administrateur.'
		);

		return { success: 'Document valide.' };
	},
	rejectDocument: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));
		const documentId = asText(formData.get('document_id'));
		const note = asText(formData.get('note'));

		if (!registrationId || !documentId) {
			return fail(400, { error: 'Document introuvable.' });
		}

		const { error: rpcError } = await locals.supabase.rpc('reject_document', {
			p_document_id: documentId,
			p_note: note || null
		});

		if (rpcError) {
			throw error(500, 'Rejet du document impossible.');
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'document_rejected',
			'Document rejete',
			'Un document a ete rejete par un administrateur.'
		);

		return { success: 'Document rejete.' };
	},
	sendMessage: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = asText(formData.get('registration_id'));
		const subject = asText(formData.get('subject'));
		const body = asText(formData.get('body'));
		const isPaymentRequest = asBoolean(formData.get('is_payment_request'));

		if (!registrationId || !body) {
			return fail(400, { error: 'Le message est obligatoire.' });
		}

		const threadResult = await locals.supabase
			.from('registration_threads')
			.upsert(
				{
					registration_id: registrationId
				},
				{ onConflict: 'registration_id' }
			)
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
			is_admin_message: true,
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
						registration_id: registrationId,
						manual_club_payment: true,
						ffbb_payment: false,
						is_manual_payment_requested: true,
						manual_payment_requested_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					{ onConflict: 'registration_id' }
				);

			if (paymentUpdateError) {
				throw error(500, 'Le message a ete envoye mais la demande paiement n a pas ete mise a jour.');
			}

			await addTimelineEvent(
				locals,
				registrationId,
				'admin_payment_request',
				'Demande paiement manuel',
				'Un administrateur a emis une demande de paiement manuel.'
			);
		}

		await addTimelineEvent(
			locals,
			registrationId,
			'admin_message_sent',
			'Message admin envoye',
			'Un message a ete envoye au licencie.'
		);

		return { success: 'Message envoye.' };
	}
};

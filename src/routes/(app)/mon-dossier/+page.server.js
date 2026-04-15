import { error, fail } from '@sveltejs/kit';
import {
	ALLOWED_DOCUMENT_EXTENSIONS,
	ALLOWED_DOCUMENT_MIME_TYPES,
	CURRENT_SEASON,
	MAX_DOCUMENT_SIZE_BYTES
} from '$lib/constants';

const PENDING_DOCUMENT_STATUS_CODES = ['pending', 'a_verifier', 'to_review', 'uploaded', 'soumis'];

function getExtension(fileName) {
	const parts = String(fileName ?? '').toLowerCase().split('.');
	return parts.length > 1 ? parts.at(-1) : '';
}

async function loadRegistration(locals) {
	const { data, error: registrationError } = await locals.supabase
		.from('registrations')
		.select(
			'id, season, user_id, situation, registration_submitted_at, created_at, updated_at, last_name, first_names, birth_date, sex, email, phone, city, postal_code, full_address, top_size, bottom_size, shoe_size, accepted_internal_rules, admin_notes, ffbb_link_sent, ffbb_link_sent_at, ffbb_registration_completed, ffbb_registration_completed_at, ffbb_payment_confirmed, ffbb_payment_confirmed_at, license_types:license_type_id(id, code, label), sections:section_id(id, code, label), registration_statuses:status_id(id, code, label)'
		)
		.eq('user_id', locals.user.id)
		.eq('season', CURRENT_SEASON)
		.order('updated_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (registrationError) {
		throw error(500, "Impossible de charger votre dossier d'inscription.");
	}

	return data ?? null;
}

async function loadRequiredDocuments(locals, licenseTypeId) {
	if (!licenseTypeId) {
		return [];
	}

	const { data, error: requiredDocsError } = await locals.supabase
		.from('license_type_required_documents')
		.select(
			'id, is_required, required_if_minor_only, sort_order, document_types:document_type_id(id, code, label, description)'
		)
		.eq('license_type_id', licenseTypeId)
		.order('sort_order', { ascending: true });

	if (requiredDocsError) {
		return [];
	}

	return data ?? [];
}

async function loadDocuments(locals, registrationId) {
	const { data, error: documentsError } = await locals.supabase
		.from('registration_documents')
		.select(
			'id, registration_id, document_type_id, status_id, file_name, file_path, mime_type, file_size, uploaded_at, reviewed_at, review_note, document_types:document_type_id(id, code, label), document_statuses:status_id(id, code, label)'
		)
		.eq('registration_id', registrationId)
		.order('uploaded_at', { ascending: false });

	if (documentsError) {
		throw error(500, 'Impossible de charger vos documents.');
	}

	return data ?? [];
}

async function loadPayments(locals, registrationId) {
	const { data: payment, error: paymentError } = await locals.supabase
		.from('registration_payments')
		.select(
			'id, registration_id, total_amount_eur, amount_paid_eur, amount_remaining_eur, installment_count, ffbb_payment, manual_club_payment, is_manual_payment_requested, manual_payment_requested_at, notes, payment_statuses:payment_status_id(id, code, label), payment_methods:payment_method_id(id, code, label)'
		)
		.eq('registration_id', registrationId)
		.maybeSingle();

	if (paymentError) {
		throw error(500, 'Impossible de charger vos informations de paiement.');
	}

	if (!payment) {
		return { payment: null, installments: [] };
	}

	const { data: installments, error: installmentsError } = await locals.supabase
		.from('payment_installments')
		.select(
			'id, installment_number, due_date, amount_due_eur, amount_paid_eur, paid_at, is_paid, note, payment_methods:payment_method_id(id, code, label)'
		)
		.eq('registration_payment_id', payment.id)
		.order('installment_number', { ascending: true });

	if (installmentsError) {
		throw error(500, "Impossible de charger l'echeancier de paiement.");
	}

	return {
		payment,
		installments: installments ?? []
	};
}

async function loadDocumentTypes(locals) {
	const { data, error: documentTypesError } = await locals.supabase
		.from('document_types')
		.select('id, code, label')
		.order('label', { ascending: true });

	if (documentTypesError) {
		throw error(500, 'Impossible de charger la liste des types de documents.');
	}

	return data ?? [];
}

export async function load({ locals }) {
	const registration = await loadRegistration(locals);

	if (!registration) {
		const documentTypes = await loadDocumentTypes(locals);
		return {
			season: CURRENT_SEASON,
			email: locals.profile?.email ?? locals.user?.email ?? '',
			role: locals.profile?.role ?? 'user',
			registration: null,
			requiredDocuments: [],
			documents: [],
			documentTypes,
			payment: null,
			installments: []
		};
	}

	const [requiredDocuments, documents, payments, documentTypes] = await Promise.all([
		loadRequiredDocuments(locals, registration.license_types?.id ?? null),
		loadDocuments(locals, registration.id),
		loadPayments(locals, registration.id),
		loadDocumentTypes(locals)
	]);

	return {
		season: CURRENT_SEASON,
		email: locals.profile?.email ?? locals.user?.email ?? '',
		role: locals.profile?.role ?? 'user',
		registration,
		requiredDocuments,
		documents,
		documentTypes,
		payment: payments.payment,
		installments: payments.installments
	};
}

async function getPendingStatusId(locals) {
	const { data, error: statusesError } = await locals.supabase
		.from('document_statuses')
		.select('id, code')
		.in('code', PENDING_DOCUMENT_STATUS_CODES);

	if (statusesError || !data || data.length === 0) {
		return null;
	}

	const preferred = PENDING_DOCUMENT_STATUS_CODES.find((code) =>
		data.some((item) => item.code === code)
	);

	return data.find((item) => item.code === preferred)?.id ?? data[0].id;
}

async function getEditableRegistrationById(locals, registrationId) {
	const { data, error: registrationError } = await locals.supabase
		.from('registrations')
		.select('id, user_id, season, registration_submitted_at')
		.eq('id', registrationId)
		.eq('user_id', locals.user.id)
		.eq('season', CURRENT_SEASON)
		.maybeSingle();

	if (registrationError) {
		throw error(500, "Impossible de verifier l'etat de votre dossier.");
	}

	if (!data) {
		return { failResponse: fail(404, { error: 'Dossier introuvable.' }) };
	}

	if (data.registration_submitted_at) {
		return {
			failResponse: fail(409, {
				error: 'Le dossier est soumis. Les documents ne peuvent plus etre modifies.'
			})
		};
	}

	return { registration: data };
}

export const actions = {
	uploadDocument: async ({ request, locals }) => {
		const formData = await request.formData();
		const registrationId = String(formData.get('registration_id') ?? '').trim();
		const documentTypeId = String(formData.get('document_type_id') ?? '').trim();
		const file = formData.get('file');

		if (!registrationId || !documentTypeId) {
			return fail(400, { error: 'Le dossier et le type de document sont obligatoires.' });
		}

		if (!(file instanceof File)) {
			return fail(400, { error: 'Aucun fichier valide n a ete fourni.' });
		}

		const mimeType = String(file.type ?? '').toLowerCase();
		const extension = getExtension(file.name);

		if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType)) {
			return fail(400, { error: 'Formats autorises: PDF, JPG, JPEG.' });
		}

		if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
			return fail(400, { error: 'Extension de fichier invalide.' });
		}

		if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
			return fail(400, { error: 'Le fichier depasse la taille maximale de 4MB.' });
		}

		const editableRegistration = await getEditableRegistrationById(locals, registrationId);
		if (editableRegistration.failResponse) {
			return editableRegistration.failResponse;
		}

		const { data: documentType, error: documentTypeError } = await locals.supabase
			.from('document_types')
			.select('id, code, label')
			.eq('id', documentTypeId)
			.maybeSingle();

		if (documentTypeError || !documentType) {
			return fail(400, { error: 'Type de document invalide.' });
		}

		const generatedPath = `${registrationId}/${documentType.code}_${crypto.randomUUID()}.${extension}`;
		const { error: uploadError } = await locals.supabase.storage
			.from('documents-licences')
			.upload(generatedPath, file, {
				contentType: mimeType,
				upsert: false
			});

		if (uploadError) {
			throw error(500, 'Televersement impossible sur le stockage.');
		}

		const pendingStatusId = await getPendingStatusId(locals);
		const { error: insertError } = await locals.supabase.from('registration_documents').insert({
			registration_id: registrationId,
			document_type_id: documentType.id,
			status_id: pendingStatusId,
			file_name: file.name,
			file_path: generatedPath,
			mime_type: mimeType,
			file_size: file.size,
			uploaded_by: locals.user.id
		});

		if (insertError) {
			await locals.supabase.storage.from('documents-licences').remove([generatedPath]);
			throw error(500, "Impossible d'enregistrer le document.");
		}

		await locals.supabase.from('registration_timeline').insert({
			registration_id: registrationId,
			event_code: 'document_uploaded',
			event_label: 'Document televerse',
			description: `${documentType.label} ajoute au dossier.`,
			actor_profile_id: locals.user.id
		});

		return {
			success: 'Document televerse avec succes.'
		};
	},
	deleteDocument: async ({ request, locals }) => {
		const formData = await request.formData();
		const documentId = String(formData.get('document_id') ?? '').trim();

		if (!documentId) {
			return fail(400, { error: 'Document introuvable.' });
		}

		const { data: document, error: documentError } = await locals.supabase
			.from('registration_documents')
			.select('id, registration_id, file_path')
			.eq('id', documentId)
			.maybeSingle();

		if (documentError || !document) {
			return fail(404, { error: 'Document introuvable.' });
		}

		const editableRegistration = await getEditableRegistrationById(locals, document.registration_id);
		if (editableRegistration.failResponse) {
			return editableRegistration.failResponse;
		}

		const [storageResult, deleteResult] = await Promise.all([
			locals.supabase.storage.from('documents-licences').remove([document.file_path]),
			locals.supabase.from('registration_documents').delete().eq('id', document.id)
		]);

		if (storageResult.error || deleteResult.error) {
			throw error(500, 'Suppression du document impossible.');
		}

		return {
			success: 'Document supprime avec succes.'
		};
	}
};

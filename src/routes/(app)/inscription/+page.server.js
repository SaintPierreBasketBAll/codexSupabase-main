import { error, fail } from '@sveltejs/kit';
import {
	CURRENT_SEASON,
	INSTALLMENT_OPTIONS,
	SEX_OPTIONS,
	SITUATION_OPTIONS,
	SIZE_OPTIONS
} from '$lib/constants';

const DEFAULT_PAYMENT_MODE = 'ffbb';

function asOptionalText(value) {
	const text = String(value ?? '').trim();
	return text.length > 0 ? text : null;
}

function asRequiredText(value) {
	return String(value ?? '').trim();
}

function asOptionalInteger(value, min, max) {
	const raw = String(value ?? '').trim();
	if (!raw) {
		return null;
	}

	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
		return Number.NaN;
	}

	return parsed;
}

function asOptionalNumeric(value, min, max) {
	const raw = String(value ?? '').trim();
	if (!raw) {
		return null;
	}

	const parsed = Number(raw.replace(',', '.'));
	if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
		return Number.NaN;
	}

	return parsed;
}

function asBoolean(value) {
	return value === 'on' || value === 'true' || value === true;
}

function getSeasonRegistration(locals) {
	return locals.supabase
		.from('registrations')
		.select('*')
		.eq('user_id', locals.user.id)
		.eq('season', CURRENT_SEASON)
		.order('updated_at', { ascending: false })
		.limit(1)
		.maybeSingle();
}

function getPaymentModeFromRegistration(payment) {
	if (!payment) {
		return DEFAULT_PAYMENT_MODE;
	}

	if (payment.manual_club_payment) {
		return 'manual';
	}

	return 'ffbb';
}

function mapRegistrationToDefaults(registration, payment) {
	return {
		situation: registration?.situation ?? '',
		license_type_id: registration?.license_type_id ?? '',
		section_id: registration?.section_id ?? '',
		country_id: registration?.country_id ?? '',
		last_name: registration?.last_name ?? '',
		first_names: registration?.first_names ?? '',
		birth_date: registration?.birth_date ?? '',
		sex: registration?.sex ?? '',
		email: registration?.email ?? '',
		phone: registration?.phone ?? '',
		height_cm: registration?.height_cm ?? '',
		full_address: registration?.full_address ?? '',
		postal_code: registration?.postal_code ?? '',
		city: registration?.city ?? '',
		top_size: registration?.top_size ?? '',
		bottom_size: registration?.bottom_size ?? '',
		shoe_size: registration?.shoe_size ?? '',
		accepted_internal_rules: registration?.accepted_internal_rules ?? false,
		payment_mode: getPaymentModeFromRegistration(payment),
		installment_count: payment?.installment_count ?? 1
	};
}

function buildValuesFromFormData(formData) {
	return {
		situation: String(formData.get('situation') ?? '').trim(),
		license_type_id: String(formData.get('license_type_id') ?? '').trim(),
		section_id: String(formData.get('section_id') ?? '').trim(),
		country_id: String(formData.get('country_id') ?? '').trim(),
		last_name: String(formData.get('last_name') ?? '').trim(),
		first_names: String(formData.get('first_names') ?? '').trim(),
		birth_date: String(formData.get('birth_date') ?? '').trim(),
		sex: String(formData.get('sex') ?? '').trim(),
		email: String(formData.get('email') ?? '').trim(),
		phone: String(formData.get('phone') ?? '').trim(),
		height_cm: String(formData.get('height_cm') ?? '').trim(),
		full_address: String(formData.get('full_address') ?? '').trim(),
		postal_code: String(formData.get('postal_code') ?? '').trim(),
		city: String(formData.get('city') ?? '').trim(),
		top_size: String(formData.get('top_size') ?? '').trim(),
		bottom_size: String(formData.get('bottom_size') ?? '').trim(),
		shoe_size: String(formData.get('shoe_size') ?? '').trim(),
		accepted_internal_rules: asBoolean(formData.get('accepted_internal_rules')),
		payment_mode: String(formData.get('payment_mode') ?? DEFAULT_PAYMENT_MODE).trim(),
		installment_count: String(formData.get('installment_count') ?? '1').trim()
	};
}

function buildRegistrationPayload(values) {
	const situation = asRequiredText(values.situation);
	const licenseTypeId = asRequiredText(values.license_type_id);
	const lastName = asRequiredText(values.last_name);
	const firstNames = asRequiredText(values.first_names);
	const birthDate = asRequiredText(values.birth_date);
	const sex = asRequiredText(values.sex);

	if (!situation || !licenseTypeId || !lastName || !firstNames || !birthDate || !sex) {
		return { fieldError: 'Les champs obligatoires doivent etre renseignes.' };
	}

	const heightCm = asOptionalInteger(values.height_cm, 50, 250);
	if (Number.isNaN(heightCm)) {
		return { fieldError: 'La taille doit etre comprise entre 50 et 250 cm.' };
	}

	const shoeSize = asOptionalNumeric(values.shoe_size, 20, 60);
	if (Number.isNaN(shoeSize)) {
		return { fieldError: 'La pointure doit etre comprise entre 20 et 60.' };
	}

	return {
		payload: {
			situation,
			license_type_id: licenseTypeId,
			section_id: asOptionalText(values.section_id),
			country_id: asOptionalText(values.country_id),
			last_name: lastName,
			first_names: firstNames,
			birth_date: birthDate,
			sex,
			email: asOptionalText(values.email),
			phone: asOptionalText(values.phone),
			height_cm: heightCm,
			full_address: asOptionalText(values.full_address),
			postal_code: asOptionalText(values.postal_code),
			city: asOptionalText(values.city),
			top_size: asOptionalText(values.top_size),
			bottom_size: asOptionalText(values.bottom_size),
			shoe_size: shoeSize,
			accepted_internal_rules: Boolean(values.accepted_internal_rules),
			updated_at: new Date().toISOString()
		}
	};
}

function buildPaymentPayload(values, isSubmission, previousPayment) {
	const paymentMode = values.payment_mode === 'manual' ? 'manual' : DEFAULT_PAYMENT_MODE;
	const installmentCountRaw = Number.parseInt(String(values.installment_count ?? '1'), 10);
	const installmentCount = INSTALLMENT_OPTIONS.includes(installmentCountRaw) ? installmentCountRaw : 1;
	const alreadyRequested = previousPayment?.is_manual_payment_requested ?? false;
	const shouldRequestManualPayment = paymentMode === 'manual' && (isSubmission || alreadyRequested);

	return {
		installment_count: installmentCount,
		ffbb_payment: paymentMode === 'ffbb',
		manual_club_payment: paymentMode === 'manual',
		is_manual_payment_requested: shouldRequestManualPayment,
		manual_payment_requested_at: shouldRequestManualPayment
			? previousPayment?.manual_payment_requested_at ?? new Date().toISOString()
			: null,
		updated_at: new Date().toISOString()
	};
}

async function loadReferenceData(locals) {
	const [licenseTypesResult, sectionsResult, countriesResult] = await Promise.all([
		locals.supabase
			.from('license_types')
			.select('id, code, label, is_active')
			.eq('is_active', true)
			.order('label', { ascending: true }),
		locals.supabase
			.from('sections')
			.select('id, code, label, sort_order, is_active')
			.eq('is_active', true)
			.order('sort_order', { ascending: true })
			.order('label', { ascending: true }),
		locals.supabase.from('countries').select('id, name').order('name', { ascending: true })
	]);

	if (licenseTypesResult.error || sectionsResult.error || countriesResult.error) {
		throw error(500, "Impossible de charger les donnees de reference de l'inscription.");
	}

	return {
		licenseTypes: licenseTypesResult.data ?? [],
		sections: sectionsResult.data ?? [],
		countries: countriesResult.data ?? []
	};
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

async function loadRegistrationContext(locals) {
	const registrationResult = await getSeasonRegistration(locals);

	if (registrationResult.error) {
		throw error(500, "Impossible de charger votre dossier d'inscription.");
	}

	const registration = registrationResult.data ?? null;

	if (!registration) {
		return {
			registration: null,
			payment: null,
			requiredDocuments: []
		};
	}

	const [paymentResult, requiredDocuments] = await Promise.all([
		locals.supabase
			.from('registration_payments')
			.select(
				'id, registration_id, installment_count, ffbb_payment, manual_club_payment, is_manual_payment_requested, manual_payment_requested_at'
			)
			.eq('registration_id', registration.id)
			.maybeSingle(),
		loadRequiredDocuments(locals, registration.license_type_id)
	]);

	if (paymentResult.error) {
		throw error(500, "Impossible de charger les informations de paiement du dossier.");
	}

	return {
		registration,
		payment: paymentResult.data ?? null,
		requiredDocuments
	};
}

export async function load({ locals }) {
	const [referenceData, registrationContext] = await Promise.all([
		loadReferenceData(locals),
		loadRegistrationContext(locals)
	]);

	return {
		season: CURRENT_SEASON,
		situationOptions: SITUATION_OPTIONS,
		sexOptions: SEX_OPTIONS,
		sizeOptions: SIZE_OPTIONS,
		installmentOptions: INSTALLMENT_OPTIONS,
		referenceData,
		formDefaults: mapRegistrationToDefaults(
			registrationContext.registration,
			registrationContext.payment
		),
		requiredDocuments: registrationContext.requiredDocuments,
		registrationMeta: {
			id: registrationContext.registration?.id ?? null,
			isSubmitted: Boolean(registrationContext.registration?.registration_submitted_at),
			submittedAt: registrationContext.registration?.registration_submitted_at ?? null
		}
	};
}

async function saveRegistration({ locals, values, submissionMode }) {
	const existingRegistrationResult = await getSeasonRegistration(locals);
	if (existingRegistrationResult.error) {
		throw error(500, "Impossible de verifier l'etat de votre dossier.");
	}

	const existingRegistration = existingRegistrationResult.data ?? null;
	if (existingRegistration?.registration_submitted_at) {
		return {
			error: fail(409, {
				error: "Ce dossier est deja soumis et ne peut plus etre modifie.",
				values
			})
		};
	}

	const payloadResult = buildRegistrationPayload(values);
	if (payloadResult.fieldError) {
		return {
			error: fail(400, {
				error: payloadResult.fieldError,
				values
			})
		};
	}

	if (submissionMode && !values.accepted_internal_rules) {
		return {
			error: fail(400, {
				error: 'Vous devez accepter le reglement interieur avant de soumettre le dossier.',
				values
			})
		};
	}

	const nowIso = new Date().toISOString();
	const fullPayload = {
		...payloadResult.payload,
		user_id: locals.user.id,
		season: CURRENT_SEASON
	};

	if (submissionMode) {
		fullPayload.registration_submitted_at = nowIso;
	}

	let registration = existingRegistration;
	if (existingRegistration) {
		const { data, error: updateError } = await locals.supabase
			.from('registrations')
			.update(fullPayload)
			.eq('id', existingRegistration.id)
			.eq('user_id', locals.user.id)
			.select('*')
			.single();

		if (updateError) {
			throw error(500, "Impossible de mettre a jour le dossier d'inscription.");
		}

		registration = data;
	} else {
		const { data, error: insertError } = await locals.supabase
			.from('registrations')
			.insert(fullPayload)
			.select('*')
			.single();

		if (insertError) {
			throw error(500, "Impossible de creer le dossier d'inscription.");
		}

		registration = data;
	}

	const previousPaymentResult = await locals.supabase
		.from('registration_payments')
		.select(
			'id, registration_id, installment_count, ffbb_payment, manual_club_payment, is_manual_payment_requested, manual_payment_requested_at'
		)
		.eq('registration_id', registration.id)
		.maybeSingle();

	const paymentPayload = buildPaymentPayload(
		values,
		submissionMode,
		previousPaymentResult.data ?? null
	);

	const { error: paymentError } = await locals.supabase.from('registration_payments').upsert(
		{
			registration_id: registration.id,
			...paymentPayload
		},
		{ onConflict: 'registration_id' }
	);

	if (paymentError) {
		throw error(500, "Impossible d'enregistrer les informations de paiement.");
	}

	if (submissionMode) {
		const [threadResult, timelineResult] = await Promise.all([
			locals.supabase
				.from('registration_threads')
				.upsert(
					{
						registration_id: registration.id
					},
					{ onConflict: 'registration_id', ignoreDuplicates: true }
				),
			locals.supabase.from('registration_timeline').insert({
				registration_id: registration.id,
				event_code: 'registration_submitted',
				event_label: 'Dossier soumis',
				description: 'Le licencie a soumis son dossier.',
				actor_profile_id: locals.user.id
			})
		]);

		if (threadResult.error || timelineResult.error) {
			throw error(500, "Le dossier est enregistre, mais le workflow de soumission a echoue.");
		}
	}

	return {
		data: {
			success: submissionMode
				? 'Dossier soumis avec succes. Il est maintenant en lecture seule.'
				: 'Brouillon enregistre avec succes.',
			values
		}
	};
}

export const actions = {
	save: async ({ request, locals }) => {
		const formData = await request.formData();
		const values = buildValuesFromFormData(formData);
		const result = await saveRegistration({
			locals,
			values,
			submissionMode: false
		});

		if (result.error) {
			return result.error;
		}

		return result.data;
	},
	submit: async ({ request, locals }) => {
		const formData = await request.formData();
		const values = buildValuesFromFormData(formData);
		const result = await saveRegistration({
			locals,
			values,
			submissionMode: true
		});

		if (result.error) {
			return result.error;
		}

		return result.data;
	}
};

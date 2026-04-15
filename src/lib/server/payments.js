function pickDefinedEntries(object) {
	return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function isRpcSignatureMismatch(errorObject) {
	if (!errorObject) {
		return false;
	}

	const combined = `${errorObject.message ?? ''} ${errorObject.details ?? ''} ${errorObject.hint ?? ''}`.toLowerCase();
	return (
		errorObject.code === 'PGRST202' ||
		combined.includes('could not find the function') ||
		combined.includes('record_manual_payment(') ||
		combined.includes('no function matches')
	);
}

export async function recordManualPaymentWithFallbacks({
	supabase,
	registrationId,
	registrationPaymentId,
	installmentNumber,
	amountPaidEur,
	paymentMethodId,
	paymentMethodCode,
	paidAt,
	dueDate,
	receivedBy,
	note
}) {
	const candidates = [
		{
			p_registration_id: registrationId,
			p_installment_number: installmentNumber,
			p_amount_paid_eur: amountPaidEur,
			p_payment_method_id: paymentMethodId,
			p_paid_at: paidAt,
			p_due_date: dueDate,
			p_received_by: receivedBy,
			p_note: note
		},
		{
			p_registration_id: registrationId,
			p_installment_number: installmentNumber,
			p_amount_paid_eur: amountPaidEur,
			p_payment_method_code: paymentMethodCode,
			p_paid_at: paidAt,
			p_due_date: dueDate,
			p_received_by: receivedBy,
			p_note: note
		},
		{
			p_registration_payment_id: registrationPaymentId,
			p_installment_number: installmentNumber,
			p_amount_paid_eur: amountPaidEur,
			p_payment_method_id: paymentMethodId,
			p_paid_at: paidAt,
			p_due_date: dueDate,
			p_received_by: receivedBy,
			p_note: note
		},
		{
			registration_id: registrationId,
			installment_number: installmentNumber,
			amount_paid_eur: amountPaidEur,
			payment_method_id: paymentMethodId,
			paid_at: paidAt,
			due_date: dueDate,
			received_by: receivedBy,
			note
		},
		{
			registration_payment_id: registrationPaymentId,
			installment_number: installmentNumber,
			amount_paid_eur: amountPaidEur,
			payment_method_id: paymentMethodId,
			paid_at: paidAt,
			due_date: dueDate,
			received_by: receivedBy,
			note
		},
		{
			p_registration_id: registrationId,
			p_amount_paid_eur: amountPaidEur,
			p_installment_number: installmentNumber,
			p_note: note
		},
		{
			registration_id: registrationId,
			amount_paid_eur: amountPaidEur,
			installment_number: installmentNumber,
			note
		}
	];

	let lastError = null;
	for (const candidate of candidates) {
		const args = pickDefinedEntries(candidate);
		const { error, data } = await supabase.rpc('record_manual_payment', args);

		if (!error) {
			return {
				success: true,
				data
			};
		}

		lastError = error;
		if (!isRpcSignatureMismatch(error)) {
			break;
		}
	}

	return {
		success: false,
		error: lastError
	};
}

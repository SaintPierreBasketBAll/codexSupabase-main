export const CURRENT_SEASON = '2026-2027';

export const SITUATION_OPTIONS = [
	{ value: 'premiere_licence', label: 'Premiere licence' },
	{ value: 'renouvellement', label: 'Renouvellement' },
	{ value: 'mutation', label: 'Mutation' },
	{ value: 'retour_au_club', label: 'Retour au club' },
	{ value: 'autre', label: 'Autre' }
];

export const SEX_OPTIONS = [
	{ value: 'masculin', label: 'Masculin' },
	{ value: 'feminin', label: 'Feminin' },
	{ value: 'autre', label: 'Autre' }
];

export const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export const INSTALLMENT_OPTIONS = [1, 2, 3];

export const ALLOWED_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg'];

export const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'jpeg', 'jpg'];

export const MAX_DOCUMENT_SIZE_BYTES = 4 * 1024 * 1024;

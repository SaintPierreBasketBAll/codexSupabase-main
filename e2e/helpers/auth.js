import { expect } from '@playwright/test';

function readEnv(name) {
	return String(process.env[name] ?? '').trim();
}

export function getUserCredentials() {
	const email = readEnv('E2E_USER_EMAIL');
	const password = readEnv('E2E_USER_PASSWORD');
	return email && password ? { email, password } : null;
}

export function getAdminCredentials() {
	const email = readEnv('E2E_ADMIN_EMAIL');
	const password = readEnv('E2E_ADMIN_PASSWORD');
	return email && password ? { email, password } : null;
}

export async function loginWithCredentials(page, credentials) {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible();

	await page.getByLabel('Email').fill(credentials.email);
	await page.getByLabel('Mot de passe').fill(credentials.password);
	await page.getByRole('button', { name: /Se connecter/i }).click();

	await expect(page.getByRole('button', { name: /Se deconnecter/i })).toBeVisible();
}

export async function logout(page) {
	const logoutButton = page.getByRole('button', { name: /Se deconnecter/i });
	if (await logoutButton.count()) {
		await logoutButton.click();
	}

	await expect(page).toHaveURL(/\/login/);
}

import { expect, test } from '@playwright/test';
import { getUserCredentials, loginWithCredentials, logout } from './helpers/auth';

const userCredentials = getUserCredentials();

test.describe('Espace user', () => {
	test('acces aux routes user et blocage admin', async ({ page }) => {
		test.skip(!userCredentials, 'Variables E2E_USER_EMAIL/E2E_USER_PASSWORD absentes.');

		await loginWithCredentials(page, userCredentials);
		await expect(page.getByRole('link', { name: /Mon dossier/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Messagerie/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Inscription/i })).toBeVisible();

		await page.goto('/admin/licencies');
		await expect(page).toHaveURL(/\/mon-dossier/);

		await page.goto('/messagerie');
		await expect(page.getByRole('heading', { name: /Messagerie interne/i })).toBeVisible();

		await logout(page);
	});
});

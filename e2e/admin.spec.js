import { expect, test } from '@playwright/test';
import { getAdminCredentials, loginWithCredentials, logout } from './helpers/auth';

const adminCredentials = getAdminCredentials();

test.describe('Espace admin', () => {
	test('acces aux pages administration', async ({ page }) => {
		test.skip(!adminCredentials, 'Variables E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD absentes.');

		await loginWithCredentials(page, adminCredentials);
		await expect(page.getByRole('link', { name: /Admin dossiers/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Admin users/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Referentiels/i })).toBeVisible();

		await page.goto('/admin/licencies');
		await expect(page.getByRole('heading', { name: /Admin - Liste des licencies/i })).toBeVisible();

		await page.goto('/admin/users');
		await expect(page.getByRole('heading', { name: /Admin - Utilisateurs/i })).toBeVisible();

		await page.goto('/admin/referentiels');
		await expect(page.getByRole('heading', { name: /Admin - Referentiels/i })).toBeVisible();

		await logout(page);
	});
});

import { expect, test } from '@playwright/test';

test.describe('Espace public', () => {
	test('affiche la page d accueil', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('heading', { name: /Gestion des inscriptions SPBB/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Connexion/i })).toBeVisible();
		await expect(page.getByRole('link', { name: /Inscription/i })).toBeVisible();
	});

	test('redirige vers /login pour une page protegee', async ({ page }) => {
		await page.goto('/mon-dossier');

		await expect(page).toHaveURL(/\/login\?next=%2Fmon-dossier/);
		await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible();
	});
});

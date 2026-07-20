import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.join(import.meta.dirname, '.auth/user.json');

setup('authenticate with Auth0', async ({ page }) => {
  const email = process.env.E2E_AUTH0_EMAIL;
  const password = process.env.E2E_AUTH0_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_AUTH0_EMAIL and E2E_AUTH0_PASSWORD must be set. ' +
        'See e2e/README.md -- these belong to a dedicated Auth0 test user, not a real account.'
    );
  }

  await page.goto('/');
  await page.getByRole('button', { name: 'Log in' }).click();

  // Auth0's Classic Universal Login (the Lock widget) -- fields have no
  // useful `name` attribute, just an accessible name via aria-label.
  await page.waitForURL(/\/(u\/)?login/, { timeout: 15_000 });
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: /continue|log in/i }).click();

  // Back on the app, authenticated
  await page.waitForURL('http://localhost:5173/', { timeout: 15_000 });
  await expect(page.getByText('Your workspaces')).toBeVisible({ timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});

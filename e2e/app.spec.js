import { test, expect } from '@playwright/test';

test.describe('openshelf end-to-end', () => {
  test('redirects an unauthenticated visitor to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /openshelf/i })).toBeVisible();
  });

  test('logs in with the seeded demo user and sees real books', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5175/');
    await expect(page.locator('[data-testid^="book-card-"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('filters by a subject facet', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5175/');
    await page.getByRole('button', { name: /^Fiction \(\d+\)$/ }).click();
    await expect(page.locator('[data-testid^="book-card-"]').first()).toBeVisible();
  });

  test('searches by title text', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5175/');
    await page.getByPlaceholder(/search by title/i).fill('Foundation');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Foundation', { exact: false }).first()).toBeVisible();
  });

  test('opens a book, shelves it, and writes a review', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5175/');

    await page.locator('[data-testid^="book-card-"]').first().click();
    await page.waitForURL(/\/books\//);
    await expect(page.getByTestId('book-title')).toBeVisible();

    await page.getByRole('button', { name: 'Reading' }).click();
    await page.waitForTimeout(300);

    await page.locator('textarea').fill('E2E-authored review text.');
    await page.getByRole('button', { name: /post review|update review/i }).click();
    await expect(page.getByText('E2E-authored review text.')).toBeVisible();
  });

  test('shows seeded shelves grouped by status', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5175/');
    await page.getByRole('link', { name: 'My shelves' }).click();
    await expect(page).toHaveURL(/shelves/);
    await expect(page.getByTestId('shelf-reading')).toBeVisible();
  });

  test('follows a user and sees it reflected on their profile', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5175/');

    await page.getByRole('link', { name: 'Feed' }).click();
    await page.getByRole('button', { name: 'Following' }).click();
    await expect(page.getByText(/followed/i).first()).toBeVisible();
  });

  test('logs out and returns to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('http://localhost:5175/');
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

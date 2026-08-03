import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE_URL = 'http://localhost:5175';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function shoot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  console.log(`saved ${name}.png`);
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/login`);
  await shoot(page, '01-login');

  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(`${BASE_URL}/`);
  await page.waitForSelector('[data-testid^="book-card-"]');
  await page.waitForTimeout(400);
  await shoot(page, '02-browse');

  await page.locator('[data-testid^="book-card-"]').first().click();
  await page.waitForURL(/\/books\//);
  await page.waitForTimeout(300);
  await shoot(page, '03-book-detail');

  await page.getByRole('link', { name: 'My shelves' }).click();
  await page.waitForURL(/shelves/);
  await page.waitForTimeout(300);
  await shoot(page, '04-shelves');

  await page.getByRole('link', { name: 'Feed' }).click();
  await page.waitForURL(/feed/);
  await page.waitForTimeout(300);
  await shoot(page, '05-feed');

  await page.goto(`${BASE_URL}/api/docs`.replace('5175', '4002'));
  await page.waitForTimeout(500);
  await shoot(page, '06-api-docs');

  await ctx.close();

  const mobileCtx = await browser.newContext({ viewport: MOBILE });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${BASE_URL}/login`);
  await mobilePage.getByRole('button', { name: /sign in/i }).click();
  await mobilePage.waitForURL(`${BASE_URL}/`);
  await mobilePage.waitForSelector('[data-testid^="book-card-"]');
  await mobilePage.waitForTimeout(400);
  await shoot(mobilePage, '07-browse-mobile');
  await mobileCtx.close();

  await browser.close();
  console.log('Done. Screenshots in', OUT_DIR);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

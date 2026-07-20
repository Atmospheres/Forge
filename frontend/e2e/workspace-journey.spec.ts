import { test, expect, type Page } from '@playwright/test';

/**
 * The card containing `text` (a workspace/project name, or a task title).
 * Needed because these lists can have multiple items -- including leftovers
 * from a previous failed run -- so a page-wide getByRole('button', { name:
 * 'Delete' }) isn't reliably scoped to the one we actually want.
 */
function cardFor(page: Page, text: string) {
  return page
    .getByText(text, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "group")]')
    .first();
}

test.describe.serial('workspace -> project -> task journey', () => {
  const workspaceName = `E2E Workspace ${Date.now().toString()}`;
  const projectName = 'E2E Project';
  const taskName = 'E2E Task';

  test('creates a workspace', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Your workspaces')).toBeVisible();

    await page.getByPlaceholder('New workspace name').fill(workspaceName);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(workspaceName)).toBeVisible();
  });

  test('opens the workspace and creates a project', async ({ page }) => {
    await page.goto('/');
    await page.getByText(workspaceName, { exact: true }).click();

    await expect(page.getByText('Projects in this workspace.')).toBeVisible();
    await page.getByPlaceholder('New project name').fill(projectName);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(projectName)).toBeVisible();
  });

  test('opens the project board and creates a task', async ({ page }) => {
    await page.goto('/');
    await page.getByText(workspaceName, { exact: true }).click();
    await page.getByText(projectName, { exact: true }).click();

    await expect(page.getByText('Drag tasks between columns to update status.')).toBeVisible();
    await page.getByPlaceholder('New task title').fill(taskName);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(taskName)).toBeVisible();
  });

  test('drags the task from To Do into In Progress', async ({ page }) => {
    await page.goto('/');
    await page.getByText(workspaceName, { exact: true }).click();
    await page.getByText(projectName, { exact: true }).click();
    await expect(page.getByText(taskName)).toBeVisible();

    const card = page.getByText(taskName, { exact: true });
    // The column header ("In Progress" + its count badge) sits above the
    // drop area -- drag toward its empty column body, not the header text
    // itself, since that's not a droppable target.
    const inProgressColumn = page
      .locator('div')
      .filter({ has: page.getByText('In Progress', { exact: true }) })
      .last();

    const cardBox = await card.boundingBox();
    const columnBox = await inProgressColumn.boundingBox();
    if (!cardBox || !columnBox) throw new Error('could not measure drag source/target');

    const targetX = columnBox.x + columnBox.width / 2;
    const targetY = columnBox.y + columnBox.height - 20;

    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(
        cardBox.x + ((targetX - cardBox.x) * i) / 10,
        cardBox.y + ((targetY - cardBox.y) * i) / 10
      );
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(500);

    // The card is still the same element -- just confirm it ended up
    // positioned inside the In Progress column, not To Do.
    const taskBoxAfter = await card.boundingBox();
    expect(taskBoxAfter?.x).toBeGreaterThan(cardBox.x + 100);
  });

  test('cleans up: deletes the task, project, and workspace', async ({ page }) => {
    await page.goto('/');
    await page.getByText(workspaceName, { exact: true }).click();
    await page.getByText(projectName, { exact: true }).click();

    page.once('dialog', (d) => void d.accept());
    const taskCard = cardFor(page, taskName);
    await taskCard.hover();
    await taskCard.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(taskName)).not.toBeVisible();

    await page.goto('/');
    await page.getByText(workspaceName, { exact: true }).click();
    page.once('dialog', (d) => void d.accept());
    const projectCard = cardFor(page, projectName);
    await projectCard.hover();
    await projectCard.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(projectName)).not.toBeVisible();

    await page.goto('/');
    page.once('dialog', (d) => void d.accept());
    const workspaceCard = cardFor(page, workspaceName);
    await workspaceCard.hover();
    await workspaceCard.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(workspaceName)).not.toBeVisible();
  });
});

test.describe('dark mode', () => {
  test('toggling persists across a reload, then resets itself', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Your workspaces')).toBeVisible();

    await page.getByRole('button', { name: 'User menu' }).click();
    await expect(page.getByText('Dark mode')).toBeVisible();

    const wasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.getByRole('switch').click();
    await page.waitForTimeout(300); // let the PUT to /api/me/preferences land

    const isDarkNow = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkNow).toBe(!wasDark);

    await page.reload();
    await expect(page.getByText('Your workspaces')).toBeVisible();
    await page.waitForTimeout(500); // let the server-sync effect run
    const isDarkAfterReload = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDarkAfterReload).toBe(!wasDark);

    // Restore the original preference so reruns start from the same state.
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByRole('switch').click();
    await page.waitForTimeout(300);
  });
});

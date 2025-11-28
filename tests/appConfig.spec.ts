import { test, expect } from './fixtures';

test('should be possible to save app configuration', async ({
  appConfigPage,
  page,
}) => {
  // await page.getByRole('button', { name: /reset/i }).click();
  // await page.getByRole('textbox', { name: 'API Key' }).fill('secret-api-key');

  await page.getByRole('textbox', { name: 'Url' }).clear();
  await page
    .getByRole('textbox', { name: 'Url' })
    .fill('https://demo.backstage.io');

  const saveButton = page.getByRole('button', { name: /Save/i });
  await saveButton.click();

  const saveResponse = appConfigPage.waitForSettingsResponse();
  await expect(saveResponse).toBeOK();
});

import { test, expect } from './fixtures';
import { ROUTES } from '../src/constants';
import pluginJson from '../src/plugin.json';

test.describe('navigating app', () => {
  test('catalog page should render successfully', async ({
    gotoPage,
    page,
  }) => {
    await gotoPage(`/${ROUTES.Catalog}`);
    await expect(page.getByText(pluginJson.info.description)).toBeVisible();
  });
});

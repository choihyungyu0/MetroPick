import { expect, test } from '@playwright/test'

test('opens the landing page and navigates between MVP routes', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: /광주 2호선 개통 이후,\s*우리 상권은 어떻게 바뀔까요\?/,
    }),
  ).toBeVisible()

  await page.getByRole('link', { name: '상권 분석', exact: true }).click()
  await expect(page).toHaveURL(/\/scenario$/)
  await expect(page.getByRole('heading', { name: '개통 시나리오 분석' })).toBeVisible()

  await page.getByRole('link', { name: '상권 리포트' }).click()
  await expect(page).toHaveURL(/\/report$/)
  await expect(page.getByRole('heading', { name: '소상공인 상권 리포트' })).toBeVisible()
})

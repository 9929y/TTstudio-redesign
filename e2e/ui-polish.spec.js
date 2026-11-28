import { test, expect } from '@playwright/test';

// Reference desktop prototype and real mobile viewport widths. Keep the
// GitHub data/behavior as baseline and test only the UI parity invariants.
for (const width of [320, 360, 393, 430]) {
  test(`UI polish: score chart bounds, selection and existing Content filters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 852 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/TikTokStudio_prototype.html');
    await page.waitForFunction(() => typeof window.__studioGo === 'function');
    for (const [tab, act, count] of [['content', 'insight-b', 3]]) {
      await page.evaluate(tab => window.__studioGo({ tab: 'analytics', aTab: tab }), tab);
      const card = page.locator(`#phone-screen [data-insight="${act}"]:visible`);
      await expect(card).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      for (let i = -1; i < count; i++) {
        if (i >= 0) {
          await card.locator(`[data-act="${act}-area-${i}"]`).click();
          await expect(card).toHaveAttribute('data-tip', String(i));
          await page.waitForTimeout(350);
        }
        const issues = await card.evaluate(el => {
          const bounds = el.getBoundingClientRect();
          const chart = el.querySelector('.score-bar-rows');
          const buttons = [...chart.querySelectorAll('.bar-row')].map(button => ({
            name: button.textContent.trim(),
            rect: button.getBoundingClientRect(),
            label: button.querySelector('.bar-top').getBoundingClientRect(),
          }));
          const failures = [];
          for (const { name, rect, label } of buttons) {
            if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) failures.push(`${name}: outside card`);
            if (rect.width < 43.5 || rect.height < 43.5) failures.push(`${name}: small hit region`);
            if (label.left < rect.left - 1 || label.right > rect.right + 1 || label.height > 19) failures.push(`${name}: label no longer fits`);
          }
          for (let a = 0; a < buttons.length; a++) for (let b = a + 1; b < buttons.length; b++) {
            const x = buttons[a].rect, y = buttons[b].rect;
            if (Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1) failures.push(`${buttons[a].name}/${buttons[b].name}: overlapping hit regions`);
          }
          return failures;
        });
        expect(issues, `${width}px ${tab} state ${i}`).toEqual([]);
      }
      const info = card.locator(`[data-act="${act}-info"]`);
      const target = await info.boundingBox();
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
      if (tab === 'content') {
        const top = page.locator('#phone-screen .top-posts-section:visible');
        await expect(top.locator('[data-act="range-dd"]')).toContainText('Last 7 days');
        await expect(top.locator('[data-act="info-Top posts"]')).toBeVisible();
        const chip = top.locator('[data-act="pill-views"]');
        expect((await chip.boundingBox()).height).toBeGreaterThanOrEqual(44);
        expect((await chip.locator('.pill-visual').boundingBox()).height).toBe(31);
      }
    }
  });
}

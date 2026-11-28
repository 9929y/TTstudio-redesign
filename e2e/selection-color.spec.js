import {test, expect} from '@playwright/test';

test('Blue metric and filter pills share the deep-blue selection token', async ({page}) => {
  await page.setViewportSize({width:393,height:852});
  await page.goto('/TikTokStudio_prototype.html');
  await page.waitForFunction(()=>typeof window.__studioGo==='function');
  for (const spec of [{tab:'analytics',aTab:'content'},{tab:'analytics',aTab:'viewers'},{tab:'inbox'}]) {
    await page.evaluate(spec=>window.__studioGo(spec),spec);
    const pills=page.locator('#phone-screen .pills.blue:visible');
    await expect(pills.first()).toBeVisible();
    for (const rail of await pills.all()) {
      const buttons=rail.locator('.pill');
      if(await buttons.count()>1)await buttons.nth(1).click();
      const selected=rail.locator('.pill.on');
      await expect(selected).toHaveCount(1);
      const visual=selected.locator('.pill-visual');
      const target=await visual.count()?visual:selected;
      await expect(target).toHaveCSS('color','rgb(13, 74, 150)');
      await expect(target).toHaveCSS('background-color','rgb(232, 242, 254)');
    }
  }
});

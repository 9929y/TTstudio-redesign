import { test, expect } from '@playwright/test';

for (const width of [320, 360, 393, 430]) {
  test(`Peer radar: shared tabs, KPI styles and five selections at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:852});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/TikTokStudio_prototype.html');
    await page.waitForFunction(()=>typeof window.__studioGo==='function');
    for(const post of [false,true]){
      await page.evaluate(post=>window.__studioGo(post?{tab:'analytics',aTab:'content',push:[['videoAnalysis',{postId:'p44'}]]}:{tab:'analytics',aTab:'overview'}),post);
      const act=post?'insight-e':'insight-a';
      const card=page.locator(`#phone-screen [data-insight="${post?'E':act}"]:visible`);
      await expect(card).toBeVisible();
      await page.evaluate(()=>document.fonts.ready);
      const tabs=card.locator('.peer-radar-tabs [role=tab]');
      await expect(tabs).toHaveText(post?['Reach','Retention','Likes','Shares','New follows']:['Views','Engagement','Shares','Visits','Rewards']);
      for(let i=0;i<5;i++){
        await tabs.nth(i).click();
        await expect(card).toHaveAttribute('data-tip',String(i));
        await expect(tabs.nth(i)).toHaveAttribute('aria-selected','true');
        await expect(card.locator('.peer-radar-kpis .kpi-val')).toHaveCount(2);
        const issues=await card.evaluate(el=>{
          const bounds=el.getBoundingClientRect(), issues=[];
          for(const t of el.querySelectorAll('.peer-radar-label text')){
            const r=t.getBoundingClientRect(); if(r.left<bounds.left-1||r.right>bounds.right+1)issues.push(t.textContent+' outside card');
          }
          for(const t of el.querySelectorAll('.peer-radar-kpis .kpi-label')){
            if(t.scrollWidth>t.clientWidth+1)issues.push(t.textContent+' truncated');
          }
          for(const t of el.querySelectorAll('.peer-radar-tabs button')){
            const r=t.getBoundingClientRect();if(r.width<44||r.height<44)issues.push(t.textContent+' undersized');
          }
          return issues;
        });
        expect(issues).toEqual([]);
      }
      await expect(card.locator('.peer-radar-legend')).toContainText(post?'Similar videos':'Similar creators');
      await expect(card.locator('.peer-radar-kpis .kpi')).toHaveCount(2);
    }
  });
}

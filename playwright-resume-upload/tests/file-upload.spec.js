const { test, expect } = require('@playwright/test');

test('custom upload button can accept a PDF via file chooser', async ({ page }) => {
  await page.setContent(`<button id="upload">Click to upload your resume...</button><input id="resume" type="file" hidden><p id="filename"></p><script>document.querySelector('#upload').onclick=()=>document.querySelector('#resume').click();document.querySelector('#resume').onchange=()=>document.querySelector('#filename').textContent=document.querySelector('#resume').files[0]?.name||''</script>`);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /click to upload/i }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'sample.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nmock test PDF') });
  await expect(page.locator('#filename')).toHaveText('sample.pdf');
});

const { chromium } = require('@playwright/test');

function directDriveUrl(value) {
  const url = new URL(value);
  const id = url.hostname === 'drive.google.com' && url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
  return id ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}` : value;
}

(async () => {
  const targetUrl = process.env.TARGET_JOB_URL;
  const resumeUrl = process.env.RESUME_URL;
  if (!targetUrl || !resumeUrl) throw new Error('Set TARGET_JOB_URL and RESUME_URL.');
  const target = new URL(targetUrl);
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Target must be HTTP(S).');
  const response = await fetch(directDriveUrl(resumeUrl), { redirect: 'follow' });
  if (!response.ok) throw new Error(`Resume download failed: HTTP ${response.status}`);
  const pdf = Buffer.from(await response.arrayBuffer());
  if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('Resume URL did not return PDF bytes.');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const upload = page.getByText(/click to upload your resume/i).first();
    await upload.waitFor({ state: 'visible', timeout: 15000 });
    const chooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
    await upload.click();
    const chooser = await chooserPromise;
    if (chooser) {
      await chooser.setFiles({ name: 'Mohit_Dudhat.pdf', mimeType: 'application/pdf', buffer: pdf });
    } else {
      const input = page.locator('input[type=file]').first();
      if (await page.locator('input[type=file]').count() === 0) throw new Error('No filechooser event or input[type=file]; this custom widget needs a different interaction.');
      await input.setInputFiles({ name: 'Mohit_Dudhat.pdf', mimeType: 'application/pdf', buffer: pdf });
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'attachment-result.png', fullPage: true });
    const selected = await page.locator('input[type=file]').evaluateAll(els => els.some(el => [...(el.files || [])].some(f => f.name === 'Mohit_Dudhat.pdf'))).catch(() => false);
    const visible = (await page.locator('body').innerText().catch(() => '')).includes('Mohit_Dudhat.pdf');
    if (!selected && !visible) throw new Error('Could not verify the resume filename. See screenshot artifact.');
    console.log(JSON.stringify({ status: 'filename-verified', filename: 'Mohit_Dudhat.pdf', targetHost: target.hostname, submitted: false }, null, 2));
    console.log('Stopped before submission. No form fields or consent checkboxes were changed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

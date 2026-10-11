# Playwright Resume Upload

This isolated workflow tests attaching a resume PDF to a job form. It never fills personal details, changes consent, or clicks Apply/Submit.

## CI

The `Playwright Resume Upload CI` workflow runs a synthetic file-chooser test on pushes and pull requests. It verifies Playwright's file upload mechanism, not the employer's live widget.

## Manual live diagnostic

The `Attach Resume (Manual, Never Submit)` workflow takes a target application URL and a public Drive PDF URL. It downloads the PDF into memory, tries the page's upload trigger, verifies that the filename is selected, and saves a screenshot artifact. It does not submit the form. Review the employer site and terms before using this workflow.

## Local run

```bash
npm install
npx playwright install chromium
npm test
TARGET_JOB_URL='https://example.com/careers/role' RESUME_URL='https://drive.google.com/file/d/FILE_ID/view' npm run attach-resume
```

Notes: employer forms vary; this diagnostic fails clearly if no supported file chooser/input is available. The live job-site step requires a publicly downloadable PDF and does not retain login sessions by default.

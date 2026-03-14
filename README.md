# Registration Pass – ISKCON Pryj Regular

A **website** for registration pass generation and entry storage. **Main repo:** `iskcon-pryj-regular-pass`.

- **General users** — Can **only** visit the website to **view their own pass** by entering date of birth and mobile number. No other functionality.
- **Admins** — After login (username/password in Google Sheet), have **all other functionality**: register people, scan a pass QR to verify and see all registration details, etc.

**Pass content:** Heading “ISKCON PRAYAGRAJ REGULAR PASS”; fields on pass: Name, Gender, Photo, QR Code (admin scans QR to access full user details). Visitors open the site, register, and get a pass; entries are stored in a **Google Spreadsheet**. The site is built with **React (Vite)**.

- **Plan and execution steps:** See [PLAN.md](./PLAN.md). We implement step by step and can revert to any previous step.
- **Tech:** Vite + React, Google Apps Script (Web App) for sheet read/write, QR code for pass display.

## Status

Implementation follows the checklist in **PLAN.md**. Steps 0–9 done. Next: Step 10 (polish & deploy).

## Quick start

1. Clone the repo, then run:
   ```bash
   cd iskcon-pryj-regular-pass
   npm install
   npm run dev
   ```
2. Open the URL shown (e.g. http://localhost:5173) in the browser.
3. **View my pass:** Enter DOB and phone (form only; API in Step 5). **Admin login:** Click “Admin login” in the header; use any non-empty username/password for now (real auth in Step 6).
4. **Step 4 – Sheet + script:** Create the Google Sheet and deploy the Apps Script (see [docs/SETUP-SHEET-AND-SCRIPT.md](docs/SETUP-SHEET-AND-SCRIPT.md)). Add `VITE_SCRIPT_URL` to a `.env` file (copy from `.env.example`).

*(This README will be updated as we add env vars, deploy instructions, and script setup.)*

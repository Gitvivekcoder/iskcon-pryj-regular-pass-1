# Step 4: Google Sheet + Apps Script setup

Follow these steps to create the spreadsheet and deploy the Web App. The frontend will call this Web App URL in Steps 5 and 6.

## 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a **new blank spreadsheet**.
2. Name it (e.g. **ISKCON Prayagraj – Regular Pass**).

## 2. Set up the **Admin** sheet

1. The first sheet is named **Sheet1** by default. **Rename** it to **Admin** (right‑click the tab → Rename).
2. In row **1**, add headers:
   - **A1:** `Username`
   - **B1:** `Password`
3. In row **2**, add your admin credentials:
   - **A2:** your admin username (e.g. `admin`)
   - **B2:** your admin password (plain text; as per plan)

## 3. Set up the **Registrations** sheet

1. Add a **second sheet** (click **+** at the bottom left).
2. Rename it to **Registrations**.
3. In row **1**, add these headers (exact order):

   | A            | B        | C     | D      | E     | F             | G     | H     |
   |-------------|----------|-------|--------|-------|---------------|-------|-------|
   | Timestamp   | Pass ID  | Name  | Gender | Photo | Date of Birth | Phone | Email |

## 4. Add the Apps Script

1. In the spreadsheet menu: **Extensions** → **Apps Script** (so the script is **bound** to this sheet and `getActiveSpreadsheet()` works).  
   - If you use a **standalone** script (script.google.com) instead, you must set the spreadsheet ID: in the script editor go to **Project settings** (gear) → **Script properties** → Add property: `SPREADSHEET_ID` = the spreadsheet ID from the sheet URL (`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`).
2. Delete any default code in the editor.
3. Open the file **`scripts/apps-script/Code.gs`** from this repo and **copy its full contents** into the Apps Script editor.
4. **Save** (Ctrl/Cmd + S). Name the project if prompted (e.g. **Pass Backend**).

## 5. Deploy as Web App

1. In the Apps Script editor: **Deploy** → **New deployment**.
2. Click the gear icon next to **Select type** → choose **Web app**.
3. Set:
   - **Description:** e.g. `Pass API v1`
   - **Execute as:** **Me** (your Google account)
   - **Who has access:** **Anyone** (so the website can call it without login)
4. Click **Deploy**.
5. **Authorize** when asked: choose your Google account and allow access.
6. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`). You will need this in the frontend.

## 6. If you get "Invalid credentials" (Admin login)

1. **Sheet name:** The tab must be named exactly **Admin** (capital A). Right‑click the tab → Rename.
2. **Layout:** Row 1 = headers (`Username` in A1, `Password` in B1). Row 2 = your credentials (username in A2, password in B2). No extra spaces; the script trims values when comparing.
3. **Redeploy:** After changing `Code.gs`, create a **new version** (Deploy → Manage deployments → Edit → Version: New version → Deploy). The old deployment keeps running the old code until you deploy a new version.

## 7. If you get "Failed to fetch" (CORS)

The frontend sends POST with **Content-Type: text/plain** (and the body as a JSON string) so the browser does not send an OPTIONS preflight. Apps Script does not support `doOptions()`, so using `application/json` would cause the preflight to fail and you’d see "Failed to fetch". After updating `Code.gs`, **create a new deployment** (Deploy → Manage deployments → Edit → New version → Deploy) so the updated script is used.

## 8. Use the URL in the frontend

1. In the project root, create a file **`.env`** (and add `.env` to `.gitignore` if not already).
2. Add one line (replace with your actual URL):

   ```env
   VITE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

3. Restart the dev server after changing `.env` (`npm run dev`).

The frontend reads this as `import.meta.env.VITE_SCRIPT_URL` (see `src/lib/api.js`).

## Summary

- **Admin** sheet: one row of credentials (Username, Password).
- **Registrations** sheet: one row per pass; script generates **Pass ID** (8-character alphanumeric) and appends Timestamp, Pass ID, Name, Gender, Photo, DOB, Phone, Email.
- **Script URL** in `.env` as `VITE_SCRIPT_URL` so the app can call `adminLogin`, `getPass`, `register`, and `getPassById`.

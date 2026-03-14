# Registration Pass – Project Plan

**Project:** Registration pass generation and entry storage **website**  
**Repo (main/regular):** `iskcon-pryj-regular-pass/`  
**Last updated:** 2025-03-14

We are building a **public website** where visitors can register and get a pass; entries are stored in a Google Sheet. This doc is a **living document**—update it as we implement, change design decisions, or add steps. Each step is designed so we can revert (e.g. via git) and continue from there.

---

## 1. Overview & Goals

- **What we’re building:** A **website** with a strict split: general users can only view their own pass; all other functionality is admin-only.
- **General User (public):**
  - **Only** action: visit the website and **view their own pass** by entering **date of birth** and **mobile number**. No registration, no admin features, no verify/scan.
- **Admin (behind login):**
  - **All other functionality:** (1) register people, (2) scan QR to verify pass user details, (3) any future admin-only features. Access via **Admin login** (username/password in Google Sheet).
- **Outcomes:** Simple, maintainable website; no custom backend server; single Google Sheet for registrations + admin credentials.
- **Non-goals (for now):** Proper password hashing (we store admin password in sheet as requested; can harden later), payment, email, native app.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | **Vite + React** | Fast dev experience, component-by-component building, easy to add QR and form state. Simple to build and deploy as static (or with a small serverless API if we add one later). |
| **Styling** | **Plain CSS or CSS modules** | No extra framework; enough for a small, clear UI. Can switch to Tailwind later if we want. |
| **Storage** | **Google Spreadsheet** | Single source of truth; no DB setup; editable by non-devs; can export to CSV/Excel. |
| **Sheet access** | **Google Apps Script (Web App)** | Frontend calls a published Apps Script URL; script reads/writes the sheet. No API keys in frontend, no separate backend server. |
| **QR codes** | **`qrcode.react`** (or `qrcode` in vanilla) | Encode pass ID or verification URL in QR; user can print or save pass image. |

**Alternatives considered**

- **Backend:** Node/Express or serverless + Google Sheets API — more control but needs env vars and deployment; we can switch if Apps Script limits hit.
- **Frontend:** Vanilla HTML/JS — possible if we want zero build; we chose Vite+React for clearer component structure and easier QR/form handling.

---

## 3. Architecture (High Level)

**Landing (what visitors see):** The website’s **primary and only experience for general users** is **“View my pass”** — a form to enter date of birth and mobile number. A discrete **“Admin login”** link/button (e.g. corner or footer) is available for admins only; general users are not expected to use it.

---

**General User — only flow (view own pass)**

- General users **only** do this: open the website → enter DOB + mobile number → see their pass (or “No pass found”). No other pages or actions.

```
[User opens website]
     │
     │ Sees: Form — Date of birth + Mobile number (+ “Show my pass”)
     │       (Optional small “Admin login” link for staff)
     ▼
[User enters DOB + Phone] → Submit
     ▼
[Website] → POST to Apps Script (action: getPass, dob, phone)
     ▼
[Apps Script] → Look up row in Registrations where DOB + Phone match
     │
     │ If found: return pass data. If not: return error.
     ▼
[Website] → Show pass (with QR) or "No pass found"
```

---

**Admin — all other functionality (behind login)**

- **Entry:** Admin clicks “Admin login” and enters username/password (stored in sheet). After success, admin sees the **admin area**: Register people, Verify pass (scan QR), etc. General users never see this area.

**Flow B — Admin: Login then register people**

```
[User clicks "Admin login"] → Admin login page (username + password)
     │
     │ Submit credentials
     ▼
[Website] → POST to Apps Script (action: adminLogin, username, password)
     ▼
[Apps Script] → Read Admin sheet; compare with stored username/password
     │
     │ If match: return { success: true }. If not: return { success: false }.
     ▼
[Website] → If success: store "admin logged in" (e.g. sessionStorage); show Registration form.
            If fail: show "Invalid credentials".
```

```
[Admin sees Registration form] → Fills form for a visitor (Name, DOB, Phone, etc.) → Submit
     │
     ▼
[Website] → POST to Apps Script (action: register, formData)
     ▼
[Apps Script] → Append row to Registrations sheet; return passId + row data
     ▼
[Website] → Show success + pass (with QR) for the registered person
```

---

**Flow C — Admin: Scan QR and verify pass (admin only)**

```
[Admin logged in] → Clicks "Verify pass" (or similar) in admin area
     │
     │ Opens verify screen: camera to scan QR, or manual "Enter pass ID"
     ▼
[Website] → Scan QR → decode pass ID (or admin types pass ID)
     │
     │ POST to Apps Script (action: getPassById, passId) — only available to admin flow
     ▼
[Apps Script] → Find row in Registrations where Pass ID = passId; return full row (name, DOB, phone, etc.)
     ▼
[Website] → Show pass user details to admin (name, DOB, phone, pass ID, etc.) for verification
```

- Only the admin sees this flow; the verify screen is shown only when admin is logged in. General users cannot access it.

**Data flow summary**

- **General users** only ever call one action: **getPass** (with dob, phone). They cannot call adminLogin, register, or getPassById.
- **Admins** (after login) use: **adminLogin**, **register**, **getPassById** (verify). All of these are admin-only; the UI for them is only shown after successful admin login.
- **Admin credentials** live in a dedicated sheet (or tab) — username, password (plain text as per requirement; can move to hashed later).
- **Registrations** sheet: one row per pass; includes DOB and Phone so “View my pass” can look up by those two fields.
- Apps Script exposes one Web App URL and branches on `action` (e.g. `adminLogin`, `getPass`, `register`, `getPassById`).

---

## 4. Google Sheet Design

**Two tabs (or two sheets) in the same spreadsheet:**

---

**Tab 1: `Admin`** — Stores admin login credentials (used only by Apps Script).

| Column | Purpose |
|--------|--------|
| `Username` | Admin username (e.g. one row: `admin`) |
| `Password` | Admin password (plain text; as requested; can hash later) |

- Only one row needed (or one row per admin if we support multiple later). Script reads this tab to validate admin login.

---

**Tab 2: `Registrations`** — One row per pass. **DOB and Phone are required** so General Users can look up their pass. All fields below are shown on the pass and/or used for admin verification.

| Column | Purpose |
|--------|--------|
| `Timestamp` | When registered (script or sheet default) |
| `Pass ID` | Unique ID (e.g. `PASS-001`) — encoded in QR; admin scans to fetch full details |
| `Name` | Full name (on pass) |
| `Gender` | Gender (on pass) |
| `Photo` | Photo for pass — **captured on the spot** during registration (admin clicks/captures user’s photo via device camera); store as base64 or URL per §5.4 |
| `Date of Birth` | DOB (required for "View my pass" lookup; store consistent format e.g. DD/MM/YYYY) |
| `Phone` | Mobile number (required for "View my pass" lookup) |
| `Email` | Optional |
| *(Other)* | Event-specific fields if any (all returned by getPassById for admin verify) |

We will create both tabs and set up Apps Script in the Sheet setup step.

---

## 4.1 Pass layout (what appears on the pass)

Every pass (shown to general user after “View my pass” or to admin after registering someone) will look like this:

- **Heading:** **“ISKCON PRAYAGRAJ REGULAR PASS”** (fixed title at top of pass)
- **Fields on the pass:**
  - **Name**
  - **Gender**
  - **Photo** (image of the person)
  - **QR Code** — scanning this QR allows the **admin** to access **all user details** that were entered during registration (via getPassById → full row from Registrations sheet). General users do not use the QR for anything; it is for admin verification only.

All of these (name, gender, photo, pass ID for QR) are stored in the Registrations sheet and returned by getPass / getPassById so the pass can be rendered consistently.

---

## 5. Technical Details

### 5.1 Connecting to Google Sheet

- **Method:** Google Apps Script deployed as **Web App** (Execute as: Me; Who has access: Anyone so General Users can call "View my pass" without logging in).
- **Single entry point:** One `doPost(e)` (and optionally `doGet` for view-pass lookup if we use GET). Request body is JSON with an **action** field so the script branches:
  - **`action: "adminLogin"`** — Body: `{ username, password }`. Script checks `Admin` sheet; returns `{ success: true }` or `{ success: false }`.
  - **`action: "register"`** — Body: form data (name, dob, phone, ...). Script appends to `Registrations` sheet, generates Pass ID, returns `{ passId, ... }`. *Optional:* only allow if we add a simple token/session check for admin (or accept that anyone with the URL could POST; we can restrict by checking a secret or session in a later step).
  - **`action: "getPass"`** — Body: `{ dob, phone }`. Script finds row in `Registrations` where Date of Birth and Phone match (normalize format before compare); returns that row’s pass data (passId, name, gender, photo, dob, phone, email, …) so the pass can display Name, Gender, Photo, QR (from passId). Returns "not found" if no match.
  - **`action: "getPassById"`** — Body: `{ passId }`. Script finds row where Pass ID = passId; returns **all registration details** for that pass (name, gender, photo, dob, phone, email, etc.). Used when **admin scans the QR** on a pass — admin sees everything the user entered during registration.
- **Frontend:** All calls via `fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action, ... }) })`. No API keys in repo.
- **Security:** Validate input (required fields, trim/sanitize). Admin password stored in sheet as plain text per requirement. Do not expose sheet ID; only script URL is public.

### 5.2 QR Code on the pass

- **Content:** Encode **Pass ID** only (e.g. `PASS-12345`). When the **admin** scans this QR, the app uses the passId to call **getPassById** and shows all registration details (name, gender, photo, DOB, phone, email, etc.). So the QR is the key for admin to access full user details.
- **Library:** `qrcode.react` in React (component that renders QR to canvas/SVG).
- **Display:** QR appears on the pass (below heading “ISKCON PRAYAGRAJ REGULAR PASS”, with Name, Gender, Photo). Same pass is shown to general user (“View my pass”) and after admin registers someone; optional download/print.

### 5.3 Pass ID Strategy

- **Option A:** Row number (simple; stable if we don’t delete rows).
- **Option B:** Short unique code (e.g. 6–8 alphanumeric) generated in Apps Script and stored in sheet — better if we want non-sequential IDs.
- **Decision:** **Option B** — Apps Script generates a short unique alphanumeric Pass ID (e.g. 6–8 chars) and stores it in the sheet; QR encodes this ID.

### 5.4 Photo capture and storage (for pass)

- **Capture:** During registration, admin **captures the user’s photo on the spot** using the device camera (e.g. `getUserMedia` / video stream + canvas capture or a simple “Capture photo” button in the registration form). No file upload — photo is taken live.
- **Storage:** Frontend sends photo as **base64** in the register request. Options: (1) Store base64 in sheet (simple; sheet can get large); (2) Apps Script receives base64, saves image to Google Drive, stores the file URL in sheet (recommended to keep sheet light). We’ll implement (2) if Drive API is available from Apps Script, else (1).

---

## 6. Step-by-Step Execution Skeleton

Each step is a **single commit** (or a small set of commits) so we can revert to the previous step if needed. Check off when done and note any deviations in this doc.

- [x] **Step 0 — Repo & plan**  
  - Create/use repo, add this PLAN.md, optional README.  
  - *Rollback:* N/A (start).

- [x] **Step 1 — Website scaffold**  
  - Init Vite + React; run `npm run dev`. Landing = **View my pass** as the main page (form: DOB + phone); discrete **“Admin login”** link/button (e.g. corner) so general users only see “view my pass”. No backend yet.  
  - *Rollback:* Remove `node_modules` and revert to Step 0.
  - *Done:* Vite + React scaffold added; `Landing.jsx` with “View my pass” as main content and “Admin login” link in header; placeholder for form (Step 2) and admin login (Step 3).

- [x] **Step 2 — View my pass (General User) UI**  
  - Page/component: form with **Date of birth** and **Mobile number**; submit button “Show my pass”. No API yet; optional mock “not found” or static pass for UI check.  
  - *Rollback:* Revert component.
  - *Done:* `ViewMyPass.jsx` with DOB (DD/MM/YYYY) and Phone form; placeholder message after submit until Step 5.

- [x] **Step 3 — Admin login UI**  
  - “Admin login” page: username and password fields; submit. On success, redirect (or show) Registration form; on failure show “Invalid credentials”. No real auth yet (mock success for testing).  
  - *Rollback:* Revert admin login component.
  - *Done:* `AdminLogin.jsx` with username/password; on success show “Admin area” placeholder and hide “Admin login” link; mock accepts any non-empty for now. Step 6 will connect to sheet.

- [x] **Step 4 — Google Sheet + Apps Script**  
  - Create spreadsheet with **Admin** tab (Username, Password) and **Registrations** tab (Timestamp, Pass ID, Name, Gender, Photo, Date of Birth, Phone, Email, …). Apps Script: `doPost` with actions `adminLogin`, `getPass`, `register`, `getPassById`; deploy as Web App; document script URL.  
  - *Rollback:* Delete deployment; sheet can stay.
  - *Done:* `scripts/apps-script/Code.gs` with all four actions; Pass ID = Option B (8-char alphanumeric). `docs/SETUP-SHEET-AND-SCRIPT.md` for sheet + deploy steps. `src/lib/api.js` and `.env.example` for script URL.

- [x] **Step 5 — Connect View my pass to Sheet**  
  - Frontend: “View my pass” form POSTs `{ action: "getPass", dob, phone }` to script; on success show pass with **heading “ISKCON PRAYAGRAJ REGULAR PASS”**, name, gender, photo, QR code; on failure show “No pass found”. Normalize DOB format (e.g. DD/MM/YYYY) in frontend and script for matching.  
  - *Rollback:* Remove getPass fetch; keep UI only.
  - *Done:* ViewMyPass uses getPass; PassDisplay shows pass with QR.

- [x] **Step 6 — Connect Admin login to Sheet**  
  - Frontend: admin login POSTs `{ action: "adminLogin", username, password }`; on success set “admin logged in” (e.g. sessionStorage) and show **Admin area** (Register people, Verify pass); on fail show error. Admin area is the only place where Registration form and Verify pass are available.  
  - *Rollback:* Revert to mock login.
  - *Done:* AdminLogin uses adminLogin; AdminArea with Register & Verify.

- [x] **Step 7 — Registration form (Admin only) + connect to Sheet**  
  - Registration form: **Name, Gender, Photo** (capture on the spot via device camera — “Capture photo” button in form), DOB, Phone, Email, any extra fields; client-side validation. Only shown when admin is logged in. On submit: POST `{ action: "register", ...formData }` (photo as base64 per §5.4); script generates **Option B** Pass ID (short alphanumeric), appends row, returns passId + row data.  
  - *Rollback:* Remove register API; form stays local.
  - *Done:* RegistrationForm with camera capture; AdminArea Register tab.

- [x] **Step 8 — Pass display (layout + QR)**  
  - Reusable pass view with **heading “ISKCON PRAYAGRAJ REGULAR PASS”**; then **Name, Gender, Photo, QR code** (QR encodes passId so admin can scan to get all details). Use after “View my pass” success and after Admin registers someone. Add `qrcode.react`; optional “Download / Print pass”.  
  - *Rollback:* Remove QR; keep text-only pass.
  - *Done:* PassDisplay with heading, Name, Gender, Photo, QR; Print button.

- [x] **Step 9 — Admin: Scan QR and verify pass**  
  - **Admin-only** screen: “Verify pass” — scan the **QR on a pass** (camera) or enter pass ID manually. Decode QR to get passId → POST `{ action: "getPassById", passId }` → display **all user details** from registration (name, gender, photo, DOB, phone, email, etc.) for verification. Use a QR scanner library (e.g. `react-qr-reader` or browser `BarcodeDetector` / similar) for scan.  
  - *Rollback:* Remove verify screen and getPassById API usage.
  - *Done:* VerifyPass: enter pass ID → getPassById → show full details.

- [ ] **Step 10 — Polish & deploy website**  
  - Env config for script URL; clear error messages; responsive layout; deploy website.  
  - *Rollback:* Revert to local-only or previous deploy.

---

## 7. Design Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2025-03-14 | Use Vite + React for frontend | Fast setup, clear components, easy QR integration. |
| 2025-03-14 | Use Google Apps Script (not Sheets API + serverless) | No backend host or API keys; one script URL. |
| 2025-03-14 | Store pass ID in sheet; QR encodes ID (or verification URL) | Simple, verifiable, no PII in QR. |
| 2025-03-14 | One commit (or small set) per step | Easy to revert to “previous step” and re-implement. |
| 2025-03-14 | Two roles: Admin (register) + General User (view own pass by DOB + phone) | Matches requirement; simple flows. |
| 2025-03-14 | General user can only view own pass (enter DOB + phone); all other functionality is admin-only | Clear separation: public site = view pass only; register, verify, etc. behind admin login. |
| 2025-03-14 | Admin credentials (username + password) in Google Sheet | Single source of truth; no separate auth service. Stored plain text per requirement. |
| 2025-03-14 | Landing: “View my pass” as main page; “Admin login” as discrete link | General users see only view-pass; admins use Admin login to access register/verify. |
| 2025-03-14 | Only admin can scan QR and verify pass user details | Verify screen and getPassById are admin-only (shown after login). |
| 2025-03-14 | Pass layout: heading "ISKCON PRAYAGRAJ REGULAR PASS"; fields Name, Gender, Photo, QR | QR scan gives admin access to all registration details (getPassById). |

*(Add new rows as we change or add decisions.)*

---

## 8. File Structure (Target)

```
iskcon-pryj-regular-pass/
├── PLAN.md                 # This file
├── README.md               # How to run, env, deploy
├── package.json
├── vite.config.*
├── index.html
├── public/                 # Static assets if any
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── Landing.jsx            # Main page for general users: View my pass form (DOB + phone) + small "Admin login" link
    │   ├── ViewMyPass.jsx         # General user only: DOB + Phone form → show pass or "not found"
    │   ├── AdminLogin.jsx         # Admin only: username + password → admin area (register, verify)
    │   ├── AdminArea.jsx          # Admin-only: after login — nav to Register, Verify pass; contains RegistrationForm + VerifyPass
    │   ├── RegistrationForm.jsx   # Admin-only: register a person
    │   ├── PassDisplay.jsx        # Pass layout: heading "ISKCON PRAYAGRAJ REGULAR PASS", Name, Gender, Photo, QR (used for view my pass + after admin registers)
    │   └── VerifyPass.jsx         # Admin-only: scan QR or enter pass ID → show pass user details
    └── lib/
        └── api.js            # Apps Script fetch helper
```

Apps Script and Sheet live in Google’s ecosystem; we can keep a copy of the script in repo (e.g. `scripts/apps-script/Code.gs`) for version control.

---

## 9. How to Revert to a Previous Step

- **Git:** After each step, commit with message like `Step N: description`. To go back: `git log`, then `git checkout <commit-before-next-step>` or create a branch from that commit and continue from there.
- **Optional:** Tag steps, e.g. `git tag step-4`, so you can `git checkout step-4` anytime.
- **Plan doc:** Keep the checklist in §6 updated; if we revert, uncheck steps after the reverted one and re-implement from there.

---

## 10. Next Action

Start with **Step 0** then **Step 1** (website scaffold with “View my pass” + “Admin login”). After each step, update this PLAN (checkboxes, design decisions, and any new steps or changes).

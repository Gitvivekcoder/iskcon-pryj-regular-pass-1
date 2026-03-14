# Admin login – how credentials are verified

## End-to-end flow

1. **User submits the form** (AdminLogin.jsx)  
   - Values: `username`, `password` (React state).  
   - Sent as: `{ action: 'adminLogin', username: username.trim(), password }`  
   - Password is sent as typed (no trim on frontend; script trims it).

2. **Frontend calls the API** (api.js)  
   - `postToSheet({ action: 'adminLogin', username, password })`  
   - POST body: JSON string of that object.  
   - In dev: request goes to `/api` (Vite proxy forwards to Apps Script URL).  
   - In prod: request goes directly to `VITE_SCRIPT_URL`.

3. **Apps Script receives the request** (Code.gs)  
   - `doPost(e)` reads `e.postData.contents` (raw body string).  
   - Parses it as JSON → `body`.  
   - Dispatches on `body.action`; for `'adminLogin'` calls `handleAdminLogin(body)`.

4. **Credential verification** (handleAdminLogin)  
   - `username = (body.username || '').toString().trim()`  
   - `password = (body.password || '').toString().trim()`  
   - **Step A – Hardcoded (current):**  
     If `username === 'admin'` and `password === 'admin123'` → return `{ success: true }`.  
   - **Step B – Sheet:**  
     - Gets the sheet by name: `getSheetByName('Admin')`.  
     - If no sheet named exactly `Admin` → return `{ success: false, error: 'Admin sheet not found' }`.  
     - Reads all data: `getDataRange().getValues()`.  
     - Row 0 = headers (A1=Username, B1=Password).  
     - For each data row `r >= 1`:  
       - `rowUser = String(data[r][0]).trim()` (column A)  
       - `rowPass = String(data[r][1]).trim()` (column B)  
       - If `rowUser === username && rowPass === password` → return `{ success: true }`.  
     - If no row matches → return `{ success: false }`.

5. **Frontend handles response** (AdminLogin.jsx)  
   - If `data.success === true` → call `onSuccess()` (user is taken to Admin area).  
   - Else → show `data.error` or `'Invalid credentials'`.

## Important details

- **Spreadsheet:** The script uses script property `SPREADSHEET_ID` if set (Project settings → Script properties), else `SpreadsheetApp.getActiveSpreadsheet()` (only works when script is bound to the sheet). For standalone Web apps, set `SPREADSHEET_ID` to your sheet ID from the URL. That is the spreadsheet **to which the script is bound**. So you must create the script from the sheet: **Extensions → Apps Script** from that spreadsheet. If the script is a standalone project, “active” may not be your sheet; you’d need to use `SpreadsheetApp.openById(sheetId)` and store the ID.
- **Sheet name:** Must be exactly `Admin` (case-sensitive).
- **Columns:** A = Username, B = Password. First data row is row 2 (row 1 = headers).
- **No credentials in the frontend:** Username and password are only sent in the POST body; they are not stored in localStorage or anywhere in the browser. Verification is done only in Apps Script (hardcoded check + Admin sheet).

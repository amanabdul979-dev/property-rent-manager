# EstateEase - Property & Rent Management System (Supabase Cloud Edition)

A complete, production-ready full-stack Property & Rent Management Web Application built specifically for a Landlord and their Father who jointly own and manage multiple rented **Residential Flats** and **Commercial Shops** in India.

---

## ☁️ Supabase Cloud Database Integration

All flats, shops, tenants, payments, cash approvals, and maintenance tickets are saved permanently in a **Supabase PostgreSQL Cloud Database**.

### How It Works:
1. **Direct PostgREST Cloud Data Layer (`lib/supabase.js` & `lib/supabase.ts`):** All queries (`SELECT`, `INSERT`, `UPDATE`, `PATCH`) execute directly against your Supabase cloud tables.
2. **Hybrid Offline Resilience:** If Supabase credentials are missing, the application automatically uses local persistent storage (`database.sqlite`) and provides a prominent **"Connect Supabase Cloud"** button in the top navigation bar.
3. **One-Click In-App Cloud Setup:** You can connect your Supabase database directly from the Web UI modal without having to touch config files, or by editing `.env.local`.

---

## 🚀 Quick Setup: Connecting to Supabase Cloud (3 Minutes)

### Step 1: Create a Free Project on Supabase
1. Sign in to [supabase.com](https://supabase.com) and click **"New Project"**.
2. Give your project a name (e.g. `estate-ease`) and set a database password.

### Step 2: Run the Database Migration
1. In your Supabase dashboard, go to the **SQL Editor** (left menu).
2. Copy the entire contents of [`database/schema.sql`](file:///C:/Users/User/.gemini/antigravity/scratch/property-rent-manager/database/schema.sql).
3. Paste into the SQL editor and click **Run**.
   *(This creates all 4 tables, foreign keys, RLS security policies, triggers, and realistic initial seed data for Indian flats & shops).*

### Step 3: Add Credentials to `.env.local` (or via the UI)
In your Supabase project, go to **Project Settings ➔ API**:
- Copy **Project URL**
- Copy **anon / public key**

Paste them into `C:\Users\User\.gemini\antigravity\scratch\property-rent-manager\.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*Alternatively, start the server and paste them directly into the **"Supabase Cloud"** modal in your browser!*

### Step 4: Verify the Connection
Run the verification tool in PowerShell:
```powershell
cd C:\Users\User\.gemini\antigravity\scratch\property-rent-manager
agy-node database/supabase-migrate.js
```
You will see:
```text
✅ Connection Successful! Verified Supabase Cloud Database.
📊 Live Cloud Statistics:
   - Properties in cloud: 6
   - Tenants in cloud:    5
   - Payments in cloud:   4
   - Issues in cloud:     3
🎉 Supabase Cloud Database is fully connected and active!
```

---

## 🏃 Running the Application

Start the web server:
```powershell
cd C:\Users\User\.gemini\antigravity\scratch\property-rent-manager
agy-node server.js
```

Then open your browser:
- **Landlord & Father Dashboard:** `http://localhost:3000`
- **Tenant Self-Service Portal:** `http://localhost:3000#tenant`

---

## 🏛️ Database Schema (`database/schema.sql`)

| Table | Cloud Purpose | Primary Key | Key Relations |
| :--- | :--- | :--- | :--- |
| `properties` | Flat & Shop unit specs, rent, due date, deposit | `id (UUID)` | Leased by `tenants` |
| `tenants` | Active tenant name, phone, lease details | `id (UUID)` | References `properties.id` |
| `payments` | UPI UTRs, cash approvals, status, receipt numbers | `id (UUID)` | References `properties` & `tenants` |
| `issues` | Maintenance complaints (Plumbing, Shutter, etc.) | `id (UUID)` | References `properties` & `tenants` |

---

## 👥 Key Features & Flows

### 1. Landlord Dashboard (For Landlord & Father)
- **Monthly Revenue Collected (INR):** Live total of cloud-verified rent collections against total target with a visual progress bar.
- **Total Pending Dues (INR):** Unverified UPI submissions and uncollected cash payments stored in Supabase.
- **Active Units (Flats & Shops):** Breakdown of occupied flats and shops.
- **Unresolved Maintenance Tickets:** Highlights urgent repair tickets in the cloud.
- **Payment Tracker:** Transaction log with filters for Status (`Pending` / `Verified`) and Mode (`UPI` / `Cash`). Features the manual **"Confirm Cash Received"** button (with Father or Landlord confirmation) which instantly updates Supabase and generates the official digital receipt.
- **Automated 3-Day Reminders Engine:** Evaluates tenant due dates against the current day. Categorizes alerts (`DUE TODAY`, `Due in ≤ 3 Days`, `Overdue`), and provides a **1-Click "Send WhatsApp" button** pre-filled with the exact INR amount, unit code, due date, and Landlord UPI ID.
- **Maintenance Ticket Manager:** Tracks tenant complaints with category badges and priority tags (`Low`, `High`, `Urgent`). Landlord and Father can transition tickets between `Pending` ➔ `In Progress` ➔ `Resolved` with immediate cloud sync.

### 2. Tenant Self-Service Portal
- **Tenant Account Switcher:** Toggle between tenant views.
- **UPI Rent Payment Engine:**
  - Dynamically renders a scannable **UPI QR Code** embedded with the exact rent amount, payee name, and transaction reference.
  - Generates 1-tap deep links for **Google Pay (`gpay://`)**, **PhonePe (`phonepe://`)**, and **Paytm (`paytmmp://`)**.
  - **Submit UPI Verification:** Input field for the 12-digit UTR/Bank Reference ID, moving payment to `Pending Verification` in Supabase.
- **"Paid via Cash" Notification Button:** One-click instant alert that notifies the Landlord and Father's dashboard when a tenant is handing over physical cash in person.
- **Issue Reporting Form:** Tenant form to report problems across Plumbing, Electrical, Shutter, Leaks, or Structural categories with priority selection.
- **Digital Receipt Download:** Unlocks upon Landlord confirmation. Formatted with official seal, transaction ID, **Amount in Words** (Indian numbering system: *Rupees Eighteen Thousand Only*), and a **Print / Save as PDF** dialog.

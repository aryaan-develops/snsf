# Swad Shri Nidhi Foods — Expenditure Manager
## Comprehensive Project Documentation

This document provides a detailed walkthrough of the **Swad Shri Nidhi Foods Expenditure Manager** project, detailing the architecture, folder structure, database design, API endpoints, frontend pages, custom design system, and key logic functions implemented throughout the codebase.

---

## 1. Project Overview & Tech Stack

The **Expenditure Manager** is a production-grade web application designed to track and manage expenditures for *Swad Shri Nidhi Foods*. It provides facilities for adding new entries, tracking unpaid/pending dues, managing recurring monthly billing, visualizing activities on a calendar, viewing uploaded invoice receipts and payment proofs in a gallery, and exporting full expenditure reports to Excel.

### Core Technologies
*   **Framework**: [Next.js 16.2.9](https://nextjs.org/) (utilizing React 19.2.4 and Next App Router).
*   **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose 9.7.1](https://mongoosejs.com/).
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS.
*   **Media Hosting & Processing**: [ImageKit.io](https://imagekit.io/) for server-independent, secure image uploads.
*   **Forms & Validation**: [React Hook Form 7.79.0](https://react-hook-form.com/) combined with [Zod 4.4.3](https://zod.dev/) for robust client/server validation.
*   **Excel Export**: [SheetJS (xlsx) 0.18.5](https://sheetjs.com/) for generating dynamic, styled Excel sheets directly on the server.
*   **Icons**: [Lucide React 1.20.0](https://lucide.dev/).
*   **Other Libraries**: `react-webcam` (for capturing receipt photos in real-time), `react-calendar` (for date-based activity feeds), and `react-hot-toast` (for UI notifications).

---

## 2. Directory Structure

```
expendturesnsf/
├── .env.local             # Environment credentials (MongoDB, ImageKit keys)
├── next.config.ts         # Next.js settings (e.g. remote pattern for ik.imagekit.io)
├── package.json           # Project dependencies & scripts
├── postcss.config.mjs     # PostCSS configurations
├── tsconfig.json          # TypeScript configurations
├── public/                # Static assets (Favicons, logos)
└── src/
    ├── app/               # Next.js App Router Page components & API routes
    │   ├── api/           # Backend REST endpoints (GET, POST, PATCH, DELETE)
    │   ├── calendar/      # /calendar page route
    │   ├── entry/         # /entry (New Expense Form) page route
    │   ├── gallery/       # /gallery page route
    │   ├── monthly/       # /monthly billing page route
    │   ├── pending/       # /pending payments page route
    │   ├── globals.css    # Tailwind v4 theme override & custom animation directives
    │   ├── layout.tsx     # Root shell wrapping the sidebar, topbar, and main viewport
    │   ├── loading.tsx    # Next.js Suspense page fallback using skeleton loaders
    │   └── page.tsx       # Landing page (Dashboard metrics & Quick Actions)
    ├── components/        # Reusable client components grouped by route area
    │   ├── calendar/      # ActivityCalendar.tsx
    │   ├── dashboard/     # SummaryCards.tsx, ExportButton.tsx
    │   ├── entry/         # EntryForm.tsx
    │   ├── gallery/       # GalleryView.tsx
    │   ├── layout/        # Sidebar.tsx, TopBar.tsx (drawer for mobile)
    │   ├── monthly/       # MonthlyTable.tsx (accordion-style view)
    │   ├── pending/       # PendingTable.tsx (dues list + settlement modal)
    │   └── ui/            # Shared primitives (Modal.tsx, Spinner.tsx, ImageUploader.tsx, Skeleton.tsx)
    ├── lib/               # Database connectors and core utility helper libraries
    │   ├── imagekit.ts    # Lazy-loaded ImageKit Node client instantiator
    │   ├── mongodb.ts     # Mongoose global connection cache builder
    │   └── utils.ts       # Text, Currency, and Date formatting utilities
    └── models/            # Mongoose Schemas & Interface declarations
        ├── Category.ts    # Expense Category model
        └── Expense.ts     # Main Expense record model
```

---

## 3. Database Schema Design (Mongoose Models)

### A. Category Model (`src/models/Category.ts`)
Stores the names of various expense buckets.
*   **Schema Fields**:
    *   `name` (`string`, required, unique, trimmed): Name of the category (e.g. "GAS", "Chicken", "Grocery").
*   **Timestamps**: `createdAt` and `updatedAt` are generated automatically by Mongoose.

### B. Expense Model (`src/models/Expense.ts`)
Stores the detailed record of every individual expenditure item.
*   **Fields**:
    *   `category` (`ObjectId`, ref: `"Category"`, required): Link to the Category model.
    *   `billNumber` (`string`, required, trimmed): Invoice identifier.
    *   `billingMonth` (`number`, required): Integer between `1` and `12` specifying the financial month.
    *   `billingYear` (`number`, required): Numeric year.
    *   `billingType` (`string`, enum: `["Paid", "Monthly Billing"]`, required): Indicates whether it's paid immediately or grouped under monthly recurring bills.
    *   `modeOfPayment` (`string`, enum: `["Cash", "Digital", "Cheque", "Pending"]`, null default): Mode of payment used (if billing type is `"Monthly Billing"`, this starts as `null`).
    *   `amount` (`number`, required, minimum `0`): The cost of the expenditure.
    *   `vendorName` (`string`, optional, trimmed): Name of the vendor who supplied the item.
    *   `notes` (`string`, optional, trimmed): Contextual notes.
    *   `billImageUrl` / `billImageFileId` (`string`, optional): File URL and ImageKit unique ID for the uploaded invoice photo.
    *   `paymentProofUrl` / `paymentProofFileId` (`string`, optional): File URL and ImageKit unique ID for the payment transaction receipt image.
    *   `settledAt` (`Date`, optional, null default): The time payment was finalized.
*   **Indexes**:
    *   `Compound Unique Index`: `{ billNumber: 1, billingMonth: 1, billingYear: 1 }` — Enforces that a particular bill number cannot be duplicated within the same billing month and year.
    *   `Single Indexes`: Created on `modeOfPayment`, `billingType`, and `createdAt` (descending) to optimize frequent query patterns.

---

## 4. Backend API Route Handlers (`src/app/api/...`)

Every API endpoint is standard Next.js App Router route handlers. All database-touching APIs call `await connectDB()` to ensure an active MongoDB connection.

### 1. ImageKit Authentication Gateway
*   **Path**: `src/app/api/auth/imagekit/route.ts`
*   **Methods**:
    *   `GET`: Uses `getImageKit().helper.getAuthenticationParameters()` to generate a secure temporal signature (`token`, `expire`, `signature`) used by the client-side component to upload images directly to the ImageKit CDN.

### 2. Categories Resource
*   **Path**: `src/app/api/categories/route.ts`
*   **Methods**:
    *   `GET`: Pulls all categories. It also acts as a seeder: if no categories are present, it inserts a list of 25 default categories (e.g. Pav, Coconut water, Vegetables, GAS, Oil) and sorts them alphabetically.
    *   `POST`: Creates a new category. Validates body parameters and checks for case-insensitive duplicates using regex: `name: { $regex: new RegExp("^" + name.trim() + "$", "i") }`.

### 3. Dashboard Analytics Summary
*   **Path**: `src/app/api/dashboard/route.ts`
*   **Methods**:
    *   `GET`: Runs a parallel set of MongoDB counts and aggregation queries (`Promise.all`) to return metrics:
        1.  Total expense count and aggregated sum.
        2.  Outstanding dues (`modeOfPayment: "Pending"`) count and sum.
        3.  Monthly Billing items count and sum.
        4.  Current calendar month's expense count and sum.

### 4. Expense Collections Handler
*   **Path**: `src/app/api/expenses/route.ts`
*   **Methods**:
    *   `GET`: Serves paginated data (default `page=1`, `limit=20`) populated with the corresponding category name. Filters on `month`, `year`, `billingType`, and `modeOfPayment` can be supplied via query string.
    *   `POST`: Records a new expense.
        *   Checks for compound duplicate: searches for `{ billNumber, billingMonth, billingYear }` and errors with code `409` if exists.
        *   Validates that any `Paid` billing type with `Digital` or `Cheque` payment modes has a valid payment proof URL.
        *   Returns the populated record upon creation.

### 5. Individual Expense Entity Handler
*   **Path**: `src/app/api/expenses/[id]/route.ts`
*   **Methods**:
    *   `GET`: Fetches a single expense record by its ID, populated with category metadata.
    *   `PATCH`: Settles an outstanding expense (such as converting a `"Pending"` cash/digital bill or a `"Monthly Billing"` bill to `"Paid"` status).
        *   Accepts `modeOfPayment`, `paymentProofUrl`, and `paymentProofFileId`.
        *   Saves the settlement date (`settledAt: new Date()`) and updates `billingType` to `"Paid"`.
    *   `DELETE`: Deletes the record corresponding to the supplied ID.

### 6. Pending Expenditures List
*   **Path**: `src/app/api/pending/route.ts`
*   **Methods**:
    *   `GET`: Queries all expenses where `modeOfPayment: "Pending"`, sorted by newest first, populated with category names.

### 7. Monthly Recurring Dues List
*   **Path**: `src/app/api/monthly/route.ts`
*   **Methods**:
    *   `GET`: Queries all expenses where `billingType: "Monthly Billing"`. Returns a raw list sorted by billing year, month, and date, along with a `grouped` object where keys are category names for simple client-side accordion display.

### 8. Media Receipts Gallery
*   **Path**: `src/app/api/gallery/route.ts`
*   **Methods**:
    *   `GET`: Queries all expenses that have a bill receipt image URL OR a payment proof image URL (`$or: [ { billImageUrl: { $exists: true } }, { paymentProofUrl: { $exists: true } } ]`).

### 9. Activity Calendar Aggregator
*   **Path**: `src/app/api/calendar/route.ts`
*   **Methods**:
    *   `GET`: Groups history by day to populate a calendar.
        *   Loops over all expenses.
        *   Converts UTC dates (`createdAt` and `settledAt`) into `Asia/Kolkata` local dates: `date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })` to generate a `YYYY-MM-DD` string.
        *   Builds an activity object for each event (e.g. "Expense Added" or "Payment Settled") and clusters them under their respective local date.

### 10. Data Export (Excel spreadsheet)
*   **Path**: `src/app/api/export/route.ts`
*   **Methods**:
    *   `GET`: Extracts all expenses, formats them into flat JSON rows with localized Indian timezone strings (INR currency, Kolkata date format).
    *   Utilizes `xlsx` worksheets (`json_to_sheet`) to construct an Excel Workbook.
    *   Appends auto-calculated column widths (minimum width of `20`).
    *   Serves the workbook as a binary buffer response with headers:
        *   `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
        *   `Content-Disposition: attachment; filename="SwadShriNidhi_Expenditures_YYYY-MM-DD.xlsx"`

---

## 5. Frontend Pages & Routing Architecture

All pages utilize Next.js Server Side Rendering (SSR) but trigger client-side transition animations.

1.  **Dashboard (`/`)**: Fetches summary calculations on the server (`api/dashboard`) using `{ cache: "no-store" }` to ensure data remains live. Displays metrics via `<SummaryCards>` and holds `<ExportButton>` for Excel downloads.
2.  **New Entry (`/entry`)**: Max width form containing `<EntryForm>` for recording expenditures.
3.  **Pending Dues (`/pending`)**: Displays outstanding cash/digital items in a `<PendingTable>`, showcasing totals and housing confirmation workflows.
4.  **Monthly Billing (`/monthly`)**: Lists recurring supplier payments grouped by category. Clicking a category expands a sub-table with individual bills that have "Pay Now" actions.
5.  **Activity Calendar (`/calendar`)**: Hosts the `<ActivityCalendar>` page which queries `/api/calendar` on load. Emits a grid of calendar cells; highlighted days can be selected to slide open an activity drawer.
6.  **Bills & Receipts Gallery (`/gallery`)**: Displays a tabbed interface splitting image collections into invoice receipts or transaction proofs. Integrates a custom lightbox details overlay.

---

## 6. Detailed Logic of Core Components

### A. Dynamic Form Controller (`EntryForm.tsx`)
Managed with React Hook Form and Zod.
*   **Schema Validation refinement**:
    ```typescript
    .refine(
      (data) => {
        if (data.billingType === "Paid" && !data.modeOfPayment) return false;
        return true;
      },
      { message: "Mode of payment is required for Paid billing", path: ["modeOfPayment"] }
    )
    ```
*   **Conditional Render States**:
    *   If billing type is `"Paid"`, the user chooses a payment mode (Cash, Digital, Cheque, Pending).
    *   If the payment mode is `"Digital"` or `"Cheque"`, the form displays a mandatory `ImageUploader` requesting a transaction proof screenshot.
    *   Category selection includes a inline "+" button. Clicking this reveals a sub-input. When populated and saved, it calls `/api/categories` with a `POST` request, updates the local list in alphabetical order, and pre-selects the newly created category in the dropdown.

### B. Client-side Media Uploader (`ImageUploader.tsx`)
Designed to simplify document capture directly from a mobile device or desktop.
*   **File Selection Mode**: Standard input file type selector (`accept="image/*"`).
*   **Camera Capture Mode**: Utilizes the `react-webcam` component.
    *   Configured to prefer the environment-facing camera on phones: `videoConstraints={{ facingMode: "environment" }}`.
    *   The screenshot is captured as a Base64 string via `webcamRef.current.getScreenshot()`.
    *   The Base64 string is converted to a standard binary blob by calling `fetch(imageSrc)` followed by `.blob()`.
*   **Direct-to-CDN Upload Logic (`uploadToImageKit`)**:
    1.  Hits `/api/auth/imagekit` to fetch temporary public authentication variables.
    2.  Creates a `FormData` object appending the file/blob, the environment variables (`publicKey`, `signature`, `expire`, `token`), and specifying the target CDN folder name (e.g. `/swad-shri-nidhi/bills`).
    3.  Posts the request directly to the ImageKit API: `https://upload.imagekit.io/api/v1/files/upload`. This avoids routing image buffers through the Next.js server, optimizing memory usage.

### C. Dues Settlement Controller (`PendingTable.tsx` / `MonthlyTable.tsx`)
Both tables implement corresponding confirmation workflows using a shared `<Modal>` component.
*   **Settle modal structure**:
    *   Asks the user to specify payment mode.
    *   If "Digital" or "Cheque" is picked, it mounts `<ImageUploader>` requiring a transaction screenshot.
    *   On confirmation, fires a `PATCH` request to `/api/expenses/[id]`.
    *   Upon receiving success, removes the item from the local state list dynamically using standard React array filter state updates, eliminating page-reload stutters.

### D. Highlighted Calendar Grid (`ActivityCalendar.tsx`)
Renders the custom calendar grid.
*   Uses `react-calendar`.
*   Loads aggregated activity data from `/api/calendar`.
*   Maps array contents to a lookup Map for key comparisons: `new Map(activities.map(a => [a.date, a]))`.
*   Implements `tileContent`:
    *   Compares the cell date string to the Map. If an activity is present, renders a small colored dot helper under the date number.
*   Implements `tileClassName`:
    *   Appends a custom css class `.has-activity` to style cells with a custom border and soft golden background.
*   Renders a details timeline panel next to the calendar upon selecting a cell, listing detailed expense descriptions and amounts.

---

## 7. Custom Styling & Design System (`src/app/globals.css`)

The project uses a custom aesthetic theme. While components reference standard Tailwind utility classes like `bg-slate-950`, `bg-slate-900`, `text-slate-300`, and `text-indigo-600`, **Tailwind CSS v4**'s `@theme` directive maps these names to a warm, premium color palette:

### Custom Color Mapping Table

| Utility Color | Hex Value | Practical Role in Design |
| :--- | :--- | :--- |
| `slate-950` | `#faf8f5` | **Page Background**: Warm sand/cream background, pleasant to look at. |
| `slate-900` | `#ffffff` | **Card / Surface Background**: Pure white cards overlaying the background. |
| `slate-850` | `#f7f3ec` | **Input Fields**: Soft sand color for input backgrounds. |
| `slate-800` | `#f2ebd9` | **Interactive States**: Accent hover and active element backgrounds. |
| `slate-700` | `#e5dccb` | **Borders**: Thin warm sand borders separating grid elements. |
| `slate-600` | `#806b5c` | **Subtext**: Soft sandy brown for descriptions. |
| `slate-500` | `#a89484` | **Placeholders**: Light neutral sand text. |
| `slate-400` | `#5c1d24` | **Burgundy Accent text**: Used for secondary text. |
| `slate-300` | `#382c24` | **Primary Body text**: Dark warm sand-brown. |
| `slate-200` | `#231913` | **Primary Headings**: Deep dark espresso color. |
| `indigo-600` | `#5c1d24` | **Primary Burgundy**: Used for main brand elements and buttons. |
| `indigo-500` | `#b58c42` | **Accent Gold**: Sand Gold used for status pills and alerts. |
| `indigo-400` | `#c49b55` | **Lighter Gold**: Border accents and markers. |
| `emerald-600` | `#446e53` | **Forest Green**: Positive status markers (Paid, Settled, Exported). |
| `rose-600` | `#a33843` | **Deep Rose Red**: Negative statuses or errors. |

### Visual Design Utilities
*   **Aesthetic Shadows (`ai-card`)**:
    `box-shadow: 0 8px 24px -6px rgba(92, 29, 36, 0.03), 0 2px 6px -2px rgba(181, 140, 66, 0.02);`
    On hover, transitions smoothly, lifting the card with a slight translation (`-translate-y-0.5`).
*   **Scrollbars**: Styled to match the sand palette (`#faf8f5` track with `#e5dccb` thumb).
*   **Animations**: Default transitions apply globally to colors and shadows with duration `200ms`. Page slide-ups are managed via `.page-enter` applying `fadeIn` slide-ups:
    `animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;`

---

## 8. Helper Utilities & Configuration

### A. Database Connector (`src/lib/mongodb.ts`)
Avoids opening duplicate connection ports during development hot-reloads:
```typescript
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### B. Formatting Toolkit (`src/lib/utils.ts`)
*   `cn(...inputs)`: Combines class names using `clsx` and evaluates overrides with `twMerge`.
*   `formatCurrency(amount)`: Formats numeric amounts using Indian national currency formatting (`en-IN` / `INR` symbol).
*   `formatDate(date)`: Formats timestamp details to `dd MMM yyyy` (e.g. `21 Jun 2026`) in Indian format.
*   `getMonthName(monthNumber)`: Formats numeric indexes (1-12) to full local text month names (e.g. `1` to `"January"`).

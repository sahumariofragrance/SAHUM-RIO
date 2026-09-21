# SAHUMäRIO — Perfume E-Commerce

A React-based e-commerce storefront for Eau de Parfum fragrances with Razorpay payment integration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 (Create React App) |
| Styling | Tailwind CSS 3 + CSS custom properties |
| Icons | lucide-react |
| State | React Context API + localStorage |
| Payments | Razorpay |
| Build | react-scripts |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
REACT_APP_API_URL=http://your-backend-url:8000
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### Development

```bash
npm start        # Starts dev server on http://localhost:3000
npm run build    # Production build → /build
npm test         # Run tests
```

---

## Project Structure

```
src/
├── App.js                  # Root component; client-side routing via currentPage state
├── index.js                # React entry — wraps app in ThemeProvider > OrdersProvider > CartProvider
├── index.css               # Global styles + CSS custom properties (light/dark theme)
│
├── components/
│   ├── NavbarOptimized     # Sticky navbar with theme toggle, cart badge, mobile menu
│   ├── Hero                # Landing banner with animated headline
│   ├── Footer              # 3-column footer with nav links and contact
│   ├── CartDrawer          # Slide-out cart panel (Escape key closes)
│   ├── CartSummary         # Order summary for checkout page
│   ├── PerfumeCardOptimized# Product card (clickable, keyboard accessible)
│   ├── ProductGrid         # Responsive product grid (2 / 3 / 4 columns)
│   ├── ProductDetailModal  # Product detail overlay (Escape key closes)
│   ├── SafeImage           # <img> with inline SVG fallback on error
│   ├── ShippingForm        # Validated shipping address form
│   ├── SectionHeader       # Reusable page section title
│   └── ui/                 # Primitive components: Button, Card, Input, Select, Textarea
│
├── pages/
│   ├── PerfumesPage        # Product listing
│   ├── CheckoutPage        # Shipping form + cart summary + Razorpay trigger
│   ├── AboutPage           # Company story + founder cards
│   ├── OrdersPage          # Order history (localStorage)
│   ├── LoginPage           # Auth form (not yet routed)
│   └── AdminPage           # Admin panel (not yet routed)
│
├── context/
│   ├── cartContext.js      # Cart items, addToCart, updateQty, removeItem, clearCart
│   ├── OrdersContext.js    # Order history, addOrder
│   ├── ThemeContext.js     # Light/dark theme toggle
│   └── AuthContext.jsx     # Token-based auth (login, signup, logout)
│
├── data/
│   └── products.json       # Static product catalogue (5 items)
│
├── lib/
│   └── api.jsx             # Fetch wrapper with auth, error handling, timeout
│
├── utils/
│   └── money.js            # formatINR() — Intl currency formatter
│
└── constants/
    └── checkout.js         # Indian states list for shipping form
```

---

## Security

### Admin Page Access

The admin panel is protected by a login wall backed by `AuthContext`:

| Gate | How it works |
|---|---|
| **Link hidden by default** | The "Admin" link in the Footer only renders when `REACT_APP_ADMIN_ENABLED=true` |
| **Route guard in `App.js`** | If `currentPage === "admin"` and `user` is `null`, the router renders `<LoginPage redirectAfterLogin="admin" />` instead of the admin panel |
| **Token-based session** | `AuthContext` calls `POST /auth/login` (or `/auth/signup`) on the backend; the JWT is stored in `localStorage` under `sahu_token` and sent as `Authorization: Bearer` on every API request via `src/lib/api.jsx` |
| **GitHub PAT required to publish** | "Commit to GitHub" also requires `REACT_APP_GITHUB_TOKEN` in `.env` — a second independent gate for the write operation |
| **Logout button in admin header** | Shows the logged-in user's name/email; clicking Logout clears the token and redirects home |

**Auth flow:**
1. Unauthenticated user navigates to admin → sees Login form
2. Enters credentials → `POST /auth/login` → receives JWT
3. JWT stored in `localStorage`; user redirected to admin panel
4. All subsequent API calls carry the token automatically
5. On 401 response, token is cleared and user must re-authenticate

---

### Payment Security

There is **no custom OTP** in this codebase. The payment security stack is:

| Layer | What it does |
|---|---|
| **HTTPS (Vercel)** | All traffic is TLS-encrypted in transit. |
| **Server-side secret** | `RAZORPAY_KEY_SECRET` lives only in Vercel environment variables — it never reaches the browser bundle. |
| **HMAC-SHA256 signature verification** | `api/payments/razorpay/verify.js` recomputes `HMAC-SHA256(key_secret, order_id \| payment_id)` and rejects any response whose signature doesn't match, preventing tampered payment confirmations. |
| **Razorpay-managed OTPs** | For UPI, net-banking, and many card issuers, Razorpay's checkout modal handles OTP/2FA challenges internally — enforced by the payment network, not our code. |

**Known limitation — amount is client-submitted:**

The cart `subtotal` is calculated on the frontend and sent to `POST /api/payments/razorpay/order`. A malicious user could theoretically manipulate the amount before the API call. A hardened implementation would re-derive the total on the server from the product catalogue and submitted item IDs.

---

## Supabase Setup

The app uses [Supabase](https://supabase.com) (free tier) for authentication and order persistence.

### 1. Create a project
Go to [supabase.com](https://supabase.com) → New project. Copy the **Project URL** and **anon public key** from Settings → API.

### 2. Add environment variables

**.env (local dev):**
```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyxxxxxxxx...
```

**Vercel (production):** add the same two vars in Vercel dashboard → Settings → Environment Variables.

### 3. Create the orders table

Run the following in the Supabase **SQL Editor**:

```sql
create table public.orders (
  id           text        primary key,
  user_id      uuid        references auth.users on delete set null,
  items        jsonb       not null default '[]',
  subtotal     numeric(10,2) not null,
  address      jsonb       not null default '{}',
  payment      jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

-- Row Level Security: users can only see and insert their own orders
alter table public.orders enable row level security;

create policy "select own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);
```

### 4. Enable Email auth

Supabase dashboard → Authentication → Providers → Email → Enable.

### How it works

| Feature | Behaviour |
|---|---|
| **Sign up / Login** | Handled by Supabase Auth (`signUp`, `signInWithPassword`) — no custom backend needed |
| **Session restore** | Supabase client reads the session from `localStorage` on app load; no login-form flash |
| **Token refresh** | Automatic — `onAuthStateChange` keeps `user` in sync |
| **Orders (logged in)** | Written to and read from the `orders` table via Row Level Security |
| **Orders (guest)** | Stored in `localStorage` only |

---

## Architecture

### Routing
Client-side only via `currentPage` state in `App.js`. No React Router dependency.

### State Management
Three independent Context providers:

| Context | Persisted to | Purpose |
|---|---|---|
| CartContext | `sahumario_cart` | Cart items, counts, subtotal |
| OrdersContext | `sahumario_orders` | Order history |
| ThemeContext | `sahumario_theme` | Light / dark mode |

AuthContext exists but is not integrated into the main routing yet.

### Payment Flow
1. User fills shipping form on `/checkout`
2. `CheckoutPage` posts to `/api/payments/razorpay/order` to create an order
3. Razorpay SDK is loaded on-demand and opened
4. On payment success, cart is cleared

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | No | Backend base URL (defaults to dev IP) |
| `REACT_APP_RAZORPAY_KEY_ID` | Yes (production) | Razorpay publishable key |
| `REACT_APP_ADMIN_ENABLED` | No | Set to `true` to show Admin link in footer |
| `REACT_APP_GITHUB_TOKEN` | Admin only | Fine-grained PAT — Contents: Read & write |
| `REACT_APP_GITHUB_OWNER` | Admin only | GitHub repo owner (e.g. `dbhayani01`) |
| `REACT_APP_GITHUB_REPO` | Admin only | GitHub repo name (e.g. `sahumario-app`) |
| `REACT_APP_GITHUB_BRANCH` | No | Branch to commit to (default: `main`) |
| `RAZORPAY_KEY_ID` | Yes (server) | Razorpay key ID — server-side only, never prefix with `REACT_APP_` |
| `RAZORPAY_KEY_SECRET` | Yes (server) | Razorpay secret — **never expose to the browser** |

> **Security:** `REACT_APP_GITHUB_TOKEN` is baked into the JS bundle at build time.
> Use it **only** during local `npm start` sessions. Never build & deploy with this token set.
>
> `RAZORPAY_KEY_SECRET` must only ever be set as a server-side environment variable (Vercel dashboard → Settings → Environment Variables).

---

## Development Progress Log

### Task 1 — Project Audit (2026-02-08)

Performed a full read-only audit of the repository. Key findings:

- **Stack**: React 19, Create React App, Tailwind CSS, Context API, Razorpay
- **Routing**: Client-side via `currentPage` state in `App.js`
- **State**: CartContext, OrdersContext, ThemeContext (AuthContext exists but unwired)

**Issues identified:**
- 10+ duplicate/backup files (`App.jsx`, `Navbar.jsx`, `PerfumeCard.jsx`, `PerfumesPage_og.jsx`, root-level `pages/`, etc.)
- Hardcoded API URL in `src/lib/api.jsx`
- Missing assets: `/public/icons/*.svg`, `/public/products/placeholder.jpg`
- Auth system built but never routed
- Tax calculation inconsistency between CartContext (10%) and CheckoutPage

### Task 2 — Performance Cleanup (2026-02-08)

Removed dead code and duplicate files, reducing `src/` from ~48 to 34 files.

**Deleted files:**
- `src/App.jsx`, `src/App.css`, `src/App.test.js`, `src/logo.svg`, `src/reportWebVitals.js`, `src/setupTests.js` — all unused
- `src/components/Navbar.jsx`, `src/components/PerfumeCard.jsx` — replaced by Optimized variants
- `src/pages/PerfumesPage_og.jsx`, `src/pages/PerfumesPage_works.jsx` — backup/old versions
- Root-level `pages/` directory and `CheckoutPage.jsx` — orphaned duplicates

**Updated:**
- `src/lib/api.jsx` — API base URL now reads from `REACT_APP_API_URL` env var with fallback to dev IP

### Task 3 — Accessibility Basics (2026-02-08)

**Changes:**
- `NavbarOptimized.jsx` — Added `aria-current="page"` to active nav link, `aria-expanded` + `aria-controls` to hamburger button, wrapped mobile nav in `<nav>` element
- `Hero.jsx` — Added `aria-label="Hero banner"` to section
- `ProductDetailModal.jsx` — Added `role="dialog"`, `aria-modal`, `aria-labelledby`, and Escape key handler
- `CartDrawer.jsx` — Added Escape key handler to close drawer
- `PerfumeCardOptimized.jsx` — Added `aria-label` describing the product, fixed `e.preventDefault()` on Space key
- `SafeImage.jsx` — Replaced broken `/products/placeholder.jpg` with inline SVG fallback

### Task 4 — SEO Foundation (2026-02-08)

**Changes:**
- `public/index.html` — Replaced generic CRA boilerplate with proper SEO metadata: title, description, keywords, author, Open Graph tags (og:type, og:title, og:description, og:image), Twitter Card tags, updated theme-color to brand amber (#d97706)
- `public/manifest.json` — Updated app name, description, and theme-color to match brand identity

### Task 5 — Responsive UI Refinement (2026-02-08)

**Changes:**
- `ProductGrid.jsx` — Replaced dynamic Tailwind class generation (broken in production build) with static `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`; removed unused `columns` prop and `useMemo` import
- `CartDrawer.jsx` — Removed invalid `xs:` breakpoint (non-standard Tailwind); replaced with `max-w-sm sm:max-w-md` for proper mobile sizing
- `PerfumeCardOptimized.jsx` — Removed `hidden sm:block` from price and description so mobile users can see product info without opening the modal; removed `hidden sm:flex` from quantity controls

### Task 6 — Cart & State Stability (2026-02-08)

**Changes:**
- `cartContext.js` — Wrapped `addToCart` in `useCallback` (prevents unnecessary re-renders); replaced `alert()` with `console.warn` for invalid product guard; removed dead `TAX_RATE`/`tax`/`total` computation that was never consumed; added `null` default and error-throwing guard to `useCart`
- `OrdersContext.js` — Added try-catch to localStorage write; wrapped `addOrder` in `useCallback`; added context guard to `useOrders`; documented order data shape
- `CartDrawer.jsx` — Removed `const total = subtotal` alias; now references `subtotal` directly
- `CartSummary.jsx` — Same alias cleanup as CartDrawer

---

## Payment Integration Progress Log

### Payment Tasks 4–8 — Full Payment Flow, UX & Polish (2026-02-08)

**Task 4 — Frontend → Backend Validation Flow:**
- `CheckoutPage.jsx` Step 4 now POSTs `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` to `/api/payments/razorpay/verify`
- On verified success: `addOrder()` persists the full order (items, subtotal, shipping address, payment ID) to `OrdersContext` / localStorage, cart is cleared

**Task 5 — Success / Failure UX States:**
- `CheckoutPage.jsx` — `step` state (`"checkout"` | `"success"`): success screen shows green checkmark, order confirmation message, and Order ID
- Failed verification surfaces a distinct "Payment could not be verified" error; network/declined errors mapped to friendly messages

**Task 6 — Environment & Security Setup:**
- `.env.example` — documents all env vars with inline comments separating browser-safe (`REACT_APP_*`) from server-side (`RAZORPAY_KEY_SECRET`)

**Task 7 — Payment Logging & Debug Handling:**
- `src/lib/paymentLogger.js` *(new)* — `paymentLog(level, event, data)` for consistent structured logs; `friendlyPaymentError(err)` maps raw Razorpay error messages to user-friendly strings

**Task 8 — Final Checkout Polish:**
- `CheckoutSteps` now advances to step 2 (Payment) while `loading` is true, giving visual progress feedback
- `successRef` auto-focuses the "Payment Successful!" heading on mount for screen reader accessibility
- `active:scale-95` added to all CTA buttons (pay, success actions, empty-cart browse) for tactile click feedback

---

### Payment Task 3 — Vercel Backend Verification Endpoint (2026-02-08)

Added two Vercel serverless functions and deployment config.

**New files:**
- `api/payments/razorpay/order.js` — `POST /api/payments/razorpay/order`: creates a Razorpay order via the Node SDK; validates amount, guards missing env vars, returns the order object
- `api/payments/razorpay/verify.js` — `POST /api/payments/razorpay/verify`: verifies payment signature using `crypto.createHmac("sha256", key_secret).update(order_id + "|" + payment_id).digest("hex")` and compares with client-submitted `razorpay_signature`; returns `{ verified: true, payment_id }` on success
- `vercel.json` — SPA fallback rewrite: all non-API routes serve `index.html` for client-side routing

**Updated:**
- `package.json` — added `razorpay` ^2.9.6 (Node SDK used by serverless functions)
- README — documented `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` server-side env vars

---

### Payment Task 2 — Payment Button Integration (2026-02-08)

Wired the full Razorpay frontend flow with test/live mode awareness.

**Changes:**
- `src/lib/razorpay.js` *(new)* — Three focused helpers: `loadRazorpayScript()` (idempotent SDK loader), `isTestMode(key)` (detects `rzp_test_` prefix), `openRazorpayCheckout(opts)` (Promise wrapper — resolves with payment details, rejects with `"CANCELLED"` on dismiss or a descriptive string on payment failure)
- `CheckoutPage.jsx` — `initiatePayment` now runs the full 4-step flow: validate → create backend order → load SDK → open modal. Modal dismiss is swallowed silently; payment failures surface as dismissable errors. Test mode detected and passed to CartSummary
- `CartSummary.jsx` — Test mode badge shown when key starts with `rzp_test_`

**Payment flow (frontend):**
1. Validate shipping form
2. `POST /api/payments/razorpay/order` → get `order_id`
3. Load Razorpay SDK on demand
4. Open checkout modal (pre-filled with customer info + brand theme)
5. On success → capture `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }` (verification in Task 3/4)

---

### Payment Task 1 — Checkout UI Foundation (2026-02-08)

Rebuilt the checkout page with a modern, premium layout.

**Changes:**
- `CheckoutPage.jsx` — Back-to-shop link, step progress indicator (Shipping → Payment), responsive grid (summary first on mobile), dismissable `ErrorBanner`, premium empty-cart state
- `CartSummary.jsx` — Redesigned as rich order summary: item list with icons, free-shipping line, amber total, lock-icon pay button (disabled until form valid), "Secured & encrypted" trust badge, spinner during loading
- `ShippingForm.jsx` — Now passes `(formData, isValid)` to parent via `onFormChange`, enabling reactive pay-button gating

---

### Task 7 — Documentation Upgrade (2026-02-08)

Replaced the default Create React App README with comprehensive developer documentation covering tech stack, setup instructions, project structure, architecture overview, environment variables, and the full development progress log.

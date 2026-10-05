# ACCS Marketplace — Frontend

Next.js 16 (App Router) storefront, seller dashboard and admin console for the ACCS Django backend.

## Stack

- **Next.js 16** + React 19 (client components, App Router)
- **Tailwind CSS v4** — design tokens live in `src/app/globals.css` (`brand-*` colours, `.btn`, `.input`, `.card`, `.table`)
- **Zustand** — auth session (`src/store/auth.js`, persisted) and cart (`src/store/cart.js`)
- **Axios** — `src/lib/api.js` attaches the Bearer token + `x-guest-id` header and refreshes expired tokens automatically
- **lucide-react** icons, **sonner** toasts

## Getting started

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
npm run dev                  # http://localhost:3000
```

The backend must be running (`python manage.py runserver` in the `ACCS` project). Seed demo data there with
`python manage.py seed_demo`.

| Role   | Phone         | Password   | Where to sign in |
| ------ | ------------- | ---------- | ---------------- |
| Admin  | `01700000001` | `12345678` | `/admin/login`   |
| Buyer  | `01711111111` | `12345678` | `/login`         |
| Vendor | `01722222222` | `12345678` | `/login`         |
| Vendor | `01733333333` | `12345678` | `/login`         |

Without SMS credentials the backend prints OTP codes to its console (`[OTP DISPATCH]`).

## Structure

```
src/
  app/
    (shop)/        storefront: home, products, shops, cart, checkout, account/*, about, policies
    (auth)/        login, register (buyer OTP), register/vendor (KYC), forgot-password
    vendor/        seller dashboard: overview, products, orders, wallet, reviews, shop profile
    admin/         admin console: analytics, orders, products, categories, shops, users & KYC,
                   staff & roles, wallets, commissions, announcements, settings
  components/      ui/ primitives, layout/ shells & guards, product/, orders/, vendor/, address/, auth/
  hooks/           useSession, useFetch
  lib/             api client, services (every endpoint), utils, order helpers
  store/           zustand stores
```

## Main flows

1. **Buyer** — browse → add to cart (works as guest) → sign in / OTP sign-up → cart merges → checkout with Pathao
   city/zone/area and live delivery quote → order waits for admin approval → track / cancel from *My orders*.
2. **Seller** — register with NID documents → verify phone → admin approves KYC → sign in → create shop →
   add products (reviewed by admin) → fulfil vendor orders (packed → shipped → delivered) → watch commission wallet.
3. **Admin** — approve orders (splits per shop, deducts stock, debits commission) → dispatch to Pathao → mark delivered
   or restock returns; review products & set commission; approve seller KYC; manage wallets, staff, content.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run lint    # eslint (next/core-web-vitals)
```

# Creativo — Full-Stack Next.js App (with real backend)

Plain JavaScript (no TypeScript). Next.js App Router + **Prisma/SQLite database**,
**JWT login** for Admins and Customers, **role-based Admin Management**, and
**real file uploads** (photos/PDFs actually saved to disk).

## 1. Install & set up the database

```bash
cd creativo-nextjs
npm install
npm run db:migrate
npm run db:seed
```

- `npm run db:migrate` creates the local SQLite database file (`prisma/dev.db`) and all tables.
- `npm run db:seed` creates your **Super Admin** account (from `.env`) and seeds the starting product catalog.
  You should see `✅ Super Admin created: yashtomar196@gmail.com` — that confirms it worked.

## 2. Run it

```bash
npm run dev
```

- Website: **http://localhost:3000**
- Admin login: **http://localhost:3000/admin/login**
  - Email: `yashtomar196@gmail.com`
  - Password: `Yash@886.9`
  - (These come from `.env` — change the password from inside Admin Management → your own
    row isn't editable there, so to change the Super Admin password, edit `SUPER_ADMIN_PASSWORD`
    in `.env`, delete the Super Admin row from the database, then run `npm run db:seed` again.)

## 3. Roles & permissions

| Role | Can access |
|---|---|
| 👑 Super Admin | Everything, including **Admin Management** (add/edit/disable/delete other admins) |
| 🛠️ Admin | Dashboard, Products, Orders, Reviews & Leads |
| 📦 Order Manager | Orders & Files only |
| 🛍️ Product Manager | Products only |

Only the Super Admin sees the **Admin Management** tab. From there you can:
- **Add Admin** (name, email, password, role)
- Change an admin's **email**, **reset their password**, **Active/Disable** their account
- **Delete** — per your spec, this is only available for the plain "Admin" role; Order Manager
  and Product Manager accounts can be disabled but not deleted. Say the word if you'd rather
  all three roles be deletable and I'll change it.

## 4. What's real vs. simplified

✅ **Real**: database (SQLite via Prisma), password hashing (bcrypt), login sessions (JWT in
httpOnly cookies), role-based access control, file uploads (actually saved to `public/uploads/`
and downloadable by admins), customer accounts, orders, reviews, bulk leads — all persisted.

⚠️ **Simplified / worth knowing**:
- **Payment**: Cash on Delivery only, as requested — there's no payment gateway. Admins mark an
  order's payment as "Paid" manually once cash is collected (click the Payment badge in Orders).
- **Uploaded files are public**: anything in `public/uploads/` is reachable by URL without login.
  Fine for a first version; for production you'd move this behind an authenticated route or use
  cloud storage (S3/Cloudinary) with signed URLs.
- **SQLite**: great for development and small stores. If you outgrow it, switching `DATABASE_URL`
  in `.env` to a Postgres connection string (e.g. Supabase/Neon) + re-running `prisma migrate`
  gets you there with almost no code changes.
- No email sending (order confirmations, password reset emails) — everything happens in-app.

## 5. Useful commands

```bash
npm run db:studio   # opens a visual database browser at http://localhost:5555
npm run db:seed     # re-run seeding (safe — won't duplicate the Super Admin or products)
npm run build        # production build
npm start             # run the production build
```

## 6. Project structure

```
creativo-nextjs/
├─ prisma/
│  ├─ schema.prisma   -> database models (Products, Orders, Reviews, Leads, AdminUser, Customer)
│  └─ seed.js         -> creates Super Admin + starting products
├─ lib/
│  ├─ prisma.js        -> database client
│  ├─ auth.js          -> JWT session helpers
│  ├─ password.js      -> password hashing
│  ├─ permissions.js   -> role → allowed-sections map
│  ├─ requireAdmin.js  -> auth checks used inside API routes
│  └─ apiClient.js     -> fetch helper used by the frontend
├─ middleware.js        -> blocks /admin/* for anyone not logged in
├─ app/
│  ├─ page.js           -> the whole storefront + admin UI (one client component)
│  ├─ admin/login/page.js
│  ├─ admin/page.js     -> /admin route (protected)
│  ├─ account/login/page.js
│  ├─ account/register/page.js
│  └─ api/               -> all backend routes (products, orders, reviews, leads, auth, upload)
└─ public/uploads/       -> where customer + product photos actually get saved
```

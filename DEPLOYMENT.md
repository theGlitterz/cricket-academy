# BestCricketAcademy — Self-Hosted Deployment Guide

This guide covers deploying the app on **Vercel + PlanetScale** (recommended free stack) or any equivalent Node.js host + MySQL database.

---

## Required Environment Variables

Set these in your hosting provider's environment settings (never commit them to git):

| Variable | Description | Where to Get It |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | PlanetScale / Railway / Aiven |
| `ADMIN_EMAIL` | Admin login email | You choose |
| `ADMIN_PASSWORD` | Admin login password | You choose (use a strong password) |
| `JWT_SECRET` | Session cookie signing secret | Generate with command below |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | [cloudinary.com](https://cloudinary.com) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary dashboard |

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Option A: Vercel + PlanetScale (Recommended Free Stack)

### Step 1: Set up PlanetScale database

1. Create a free account at [planetscale.com](https://planetscale.com)
2. Create a new database named `best-cricket-academy`
3. Go to **Connect** → select **Node.js** → copy the connection string
4. The connection string looks like:
   ```
   mysql://USERNAME:PASSWORD@HOST/DATABASE?ssl={"rejectUnauthorized":true}
   ```

### Step 2: Run database migrations

Install dependencies locally and run the migration:
```bash
npm install
DATABASE_URL="your-planetscale-url" npx drizzle-kit push
```

Or apply the SQL files manually in the PlanetScale console in order:
- `drizzle/0000_first_justice.sql`
- `drizzle/0001_huge_sinister_six.sql`
- `drizzle/0002_prompt2_schema.sql`
- `drizzle/0003_self_hosted_users.sql`

### Step 3: Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [vercel.com](https://vercel.com)
3. Set **Framework Preset** to **Other** (it's an Express app)
4. Set **Build Command** to: `pnpm build`
5. Set **Output Directory** to: `dist`
6. Add all environment variables from the table above
7. Deploy

### Step 4: Set up Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard** → copy your **Cloud Name**, **API Key**, and **API Secret**
3. Add them to your Vercel environment variables

---

## Option B: Railway (Easiest — One Platform)

Railway hosts both your app and database in one place.

1. Create an account at [railway.app](https://railway.app)
2. Create a new project → **Deploy from GitHub repo**
3. Add a **MySQL** plugin to the project
4. Railway auto-sets `DATABASE_URL` — just add the other env vars
5. Deploy

---

## Option C: Render + Neon (PostgreSQL alternative)

> Note: The app currently uses MySQL. To use PostgreSQL (Neon), you'd need to change `drizzle.config.ts` dialect from `mysql` to `postgresql` and update the schema imports from `drizzle-orm/mysql-core` to `drizzle-orm/pg-core`.

---

## Admin Login

After deployment, navigate to `/admin/login` and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set.

On first login, the system automatically creates an admin user record in the database.

---

## File Storage (Cloudinary)

Payment screenshots and UPI QR codes are uploaded to Cloudinary. The free tier provides:
- 25 GB storage
- 25 GB monthly bandwidth
- Sufficient for hundreds of payment screenshots

---

## Security Checklist

Before going live:

- [ ] Set a strong `ADMIN_PASSWORD` (12+ characters, mixed case, numbers, symbols)
- [ ] Set a random `JWT_SECRET` (use the generate command above)
- [ ] Enable HTTPS on your hosting provider (Vercel and Railway do this automatically)
- [ ] Restrict database access to your app's IP (PlanetScale does this automatically)
- [ ] Consider setting `ADMIN_PASSWORD` to a bcrypt hash for extra security:
  ```bash
  node -e "const b=require('bcryptjs'); b.hash('your-password',10).then(h=>console.log(h))"
  ```
  Then set `ADMIN_PASSWORD` to the resulting `$2b$...` hash.

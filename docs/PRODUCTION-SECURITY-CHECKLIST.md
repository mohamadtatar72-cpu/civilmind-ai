# CivilMind Production & Security Checklist

## 1. Production environment

Vercel must define these variables for Production:

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Convex must define:

- `CLERK_JWT_ISSUER_DOMAIN`
- `ADMIN_BOOTSTRAP_EMAIL`

The Clerk JWT template/application ID used by Convex must be `convex`.

## 2. Local production verification

Run from the application directory:

```bash
export PRODUCTION_URL="https://YOUR-PRODUCTION-DOMAIN"
export NEXT_PUBLIC_CONVEX_URL="..."
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
export CLERK_SECRET_KEY="..."
export CLERK_JWT_ISSUER_DOMAIN="https://..."
export ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
node scripts/verify-production.mjs
```

Never commit secret values.

## 3. Real-account security matrix

Use three distinct verified accounts:

| Account | Expected role | Expected access |
|---|---|---|
| Admin bootstrap email | admin | `/admin` allowed |
| Normal verified user | free | `/admin` denied |
| Signed-out browser | none | private data unavailable |

Required checks:

1. Signed-out visitor cannot read planner, profile, analytics history, audit logs, or admin data.
2. Normal user cannot call admin mutations even by directly invoking requests from DevTools.
3. Admin can list users and audit logs.
4. A second account cannot claim initial admin.
5. The last active admin cannot demote or suspend itself.
6. Data created by user A is never visible to user B.

## 4. Session and recovery tests

1. Sign in with GitHub and open `/profile`.
2. Sign out and verify all private views clear immediately.
3. Delete Clerk cookies for the site and reload `/profile`.
4. Open the app in an incognito window and sign in again.
5. Revoke the GitHub/Clerk session, then reload the app.
6. Disconnect the network during profile loading, reconnect, and retry.
7. Confirm stale identity never displays another user's cached data.

## 5. Clerk / Convex / Vercel consistency

The following values must describe the same Production application:

- Vercel Clerk publishable key and secret key
- Clerk instance used to create the `convex` JWT template
- Convex `CLERK_JWT_ISSUER_DOMAIN`
- Vercel `NEXT_PUBLIC_CONVEX_URL`
- Convex deployment receiving production traffic

After changing any environment variable, trigger a fresh Production deployment without reusing an incompatible build cache.

## 6. Release gate

Production is approved only when all are true:

- GitHub CI is green
- Vercel Production deployment is green
- `node scripts/verify-production.mjs` passes
- Admin bootstrap works once
- Normal-user admin access is denied
- Cross-user data isolation passes
- Sign-out and stale-session recovery pass

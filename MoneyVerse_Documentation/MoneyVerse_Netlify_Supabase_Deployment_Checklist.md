# MoneyVerse --- Netlify + Supabase Deployment Prompt & Configuration Checklist

## Purpose

This document is the authoritative deployment guide for MoneyVerse when
hosted on **Netlify** with **Supabase**.

Goals:

-   Secure production deployment
-   Reproducible environments
-   Zero secrets in source control
-   Fast rollback
-   Proper authentication
-   Row-Level Security (RLS)
-   Future-ready for Plaid and optional AI
-   Child-safe defaults

------------------------------------------------------------------------

# Architecture

``` text
Browser
   ↓
Custom Domain
   ↓
Netlify
   ├── Next.js App
   ├── Route Handlers / Functions
   └── Static Assets + 3D Hero
            ↓
      Supabase
      ├── Auth
      ├── PostgreSQL
      ├── Storage
      ├── RLS
      └── (Optional) Edge Functions
```

Passwords and user accounts live in **Supabase Auth**, not on Netlify.

------------------------------------------------------------------------

# Windsurf Agent Instructions

Before changing deployment code:

1.  Read `AGENTS.md`
2.  Read `windsurfrules.md`
3.  Read this document
4.  Never expose secrets
5.  Never commit `.env.local`
6.  Never use service-role credentials in browser code
7.  Validate every environment variable at startup
8.  Preserve RLS

------------------------------------------------------------------------

# Environment Variables

## Local (.env.local)

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

LLM_ENABLED=false
PLAID_ENABLED=false
PAYMENTS_ENABLED=false
ANALYTICS_ENABLED=false
```

Never commit `.env.local`.

Commit only `.env.example` with placeholders.

------------------------------------------------------------------------

## Netlify

Add the same variables inside:

Site Configuration → Environment Variables

Never expose:

-   Supabase Secret Key
-   Database password
-   SMTP credentials
-   JWT signing keys
-   Plaid secrets
-   Payment secrets

------------------------------------------------------------------------

# Supabase

Enable:

-   Email authentication
-   Email confirmation
-   Password reset
-   RLS on all tenant tables

Create application tables separately from `auth.users`.

Recommended:

-   profiles
-   families
-   family_memberships
-   child_profiles
-   lesson_progress
-   virtual_ledger_entries
-   audit_events

------------------------------------------------------------------------

# Authentication

Use Supabase Auth.

Do NOT build a second password database.

Use:

-   @supabase/ssr
-   secure cookies
-   server-side validation

------------------------------------------------------------------------

# Netlify Build

Framework:

Next.js

Typical build:

``` bash
pnpm build
```

Publish directory:

Automatically detected by Netlify.

------------------------------------------------------------------------

# Security Checklist

-   [ ] HTTPS enabled
-   [ ] Environment variables configured
-   [ ] No secrets in repository
-   [ ] CSP configured
-   [ ] Security headers enabled
-   [ ] RLS enabled
-   [ ] Cross-family access denied
-   [ ] Rate limiting tested
-   [ ] Password reset tested
-   [ ] Email verification tested
-   [ ] Refresh sessions tested
-   [ ] 404 and error pages reviewed
-   [ ] Logs contain no secrets

------------------------------------------------------------------------

# Performance Checklist

-   [ ] GLB assets compressed
-   [ ] Lazy loading enabled
-   [ ] Code splitting
-   [ ] Adaptive DPR
-   [ ] Texture compression
-   [ ] Mobile fallback
-   [ ] Reduced-motion support
-   [ ] Lighthouse audit

------------------------------------------------------------------------

# Accessibility Checklist

-   [ ] Keyboard navigation
-   [ ] Screen reader labels
-   [ ] Reduced motion
-   [ ] Focus indicators
-   [ ] Contrast
-   [ ] HTML fallback for 3D hero

------------------------------------------------------------------------

# Custom Domain

1.  Buy domain.
2.  Add domain in Netlify.
3.  Configure DNS.
4.  Wait for SSL.
5.  Update:

```{=html}
<!-- -->
```
    NEXT_PUBLIC_SITE_URL=https://yourdomain.com

Update Supabase:

Authentication → URL Configuration

Set:

Site URL

Redirect URLs

Redeploy.

------------------------------------------------------------------------

# Database Rules

Passwords remain inside Supabase Auth.

Application data belongs in public schema.

Never bypass RLS.

Never trust client permissions.

------------------------------------------------------------------------

# Optional Future Features

Default:

    LLM_ENABLED=false
    PLAID_ENABLED=false
    PAYMENTS_ENABLED=false

Enabling any of these requires:

-   Threat model update
-   Security review
-   Documentation update
-   New environment variables
-   Regression tests

------------------------------------------------------------------------

# Production Verification

-   [ ] Register account
-   [ ] Verify email
-   [ ] Login
-   [ ] Logout
-   [ ] Password reset
-   [ ] Parent creates child
-   [ ] Parent cannot access another family
-   [ ] Child restrictions verified
-   [ ] Mobile works
-   [ ] 3D hero loads
-   [ ] No console errors
-   [ ] SSL valid
-   [ ] CDN serving assets
-   [ ] Database writes succeed
-   [ ] Audit events created

------------------------------------------------------------------------

# Definition of Done

Deployment is complete only when:

-   Netlify deployment succeeds
-   Supabase Auth works
-   Database RLS passes
-   Environment variables validated
-   No secrets exposed
-   Custom domain active
-   HTTPS active
-   All security tests pass
-   Accessibility checks pass
-   Performance acceptable
-   Documentation updated

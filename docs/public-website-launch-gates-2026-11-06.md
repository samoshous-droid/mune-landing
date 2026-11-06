# Public website launch gates — 2026-11-06

**Scope:** getmune.com informational website only, NOT app.getmune.com, paid access, statement uploads, or live financial analysis. Source inspection of `mune-landing/main` and Vercel project metadata. No production deployment or release approval.

## Verified infrastructure
- Vercel project `mune-landing` has custom domain `getmune.com`; project metadata reports `live:false`. Latest inspected deployment was READY but a preview (target null), sourced from `fix/audit-public-claims-20261020`, not necessarily current `main`.
- Separate `mune-app` project owns `app.getmune.com`. Its latest inspected deployment was ERROR; do not use it as the public signup/quiz dependency without verified exact-candidate test.
- `mune-landing/main` has static HTML and Vercel rewrites. `quiz.html` redirects to `https://getmune.com/quiz`, but `vercel.json` has no `/quiz` rewrite; verify production route explicitly before promising a website-native quiz.
- `index.html` sends Sign in to `https://mune-app.vercel.app/signin` and multiple quiz CTAs to `https://mune-app.vercel.app/quiz`, not the canonical `app.getmune.com`. Those app endpoints are not verified public-ready.
- `privacy.html` asserts “Bank statements are deleted the moment we finish reading them” and “immediately delete the original file.” The canonical app instead extracts PDF text in-browser, transmits text to server/AI provider, and retains transaction excerpts; a universal deletion receipt is not implemented. This claim is not supportable.
- `terms.html` describes a $9.99/mo, $79.99/yr subscription as available, despite paid launch being unapproved. Audit all pages for present-tense capability, outcomes, partner and pricing claims.

## Release contract: narrow public website

Allowed at initial release, subject to testing: accurate product explanation, education, company/contact pages, privacy/terms reviewed for the actual website-only collection, an **operationally verified** early-access form or email signup with explicit consent and unsubscribe path.

Not allowed at initial release: active paid subscription, unrestricted app signup, document upload, Plaid, bank connection, financial advice claims, automatic deletion guarantee, untested quiz routing, or statements implying financial product is production-ready.

## Blocking checklist

- [ ] Resolve privacy policy accuracy and obtain qualified privacy/legal review; disclose site analytics and early-access data processing as actually configured.
- [ ] Resolve Terms: clearly distinguish upcoming product/pricing from currently purchasable services.
- [ ] Remove/disable or redirect all links that expose unverified app routes; confirm `/quiz` availability or remove the promise.
- [ ] Choose one public CTA: join early access, with an actual working backend or validated mailing list, consent, spam control, confirmation, unsubscribe and deletion/contact mechanism. Do not claim it works without end-to-end evidence.
- [ ] Audit all static pages for unsupported product features, financial outcomes, testimonials, partners, investor and legal claims.
- [ ] Check all internal links, 404 behavior, responsive layout, keyboard/focus, accessible labels, mobile view, SEO/meta/social preview, TLS and canonical domain redirects.
- [ ] Confirm support/contact inbox receives mail and owner can respond; verify terms/privacy links and business identity.
- [ ] Verify deployment candidate source SHA, branch, project, production target, and domain mapping; run production-equivalent preview smoke tests.
- [ ] Record rollback procedure and owner signoff; do not promote merely because build is READY.

## Acceptance

A visitor can understand what Munē is, access useful content, sign up for early access without submitting financial records, receive truthful confirmation, find accurate privacy/terms/support, and never be directed into unapproved financial functionality. All release checks must be evidenced on the same candidate that will be promoted.

## Decision

**NOT YET READY.** Prepare changes on a review branch and run exact-candidate verification. This document is not a substitute for fixes, tests, legal review or founder approval.

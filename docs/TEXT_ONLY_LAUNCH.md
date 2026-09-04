# Text-only launch: decision and release gates

## Approved scope — 4 September 2026

The owner approved proceeding with text-only assessments, without activating R2 or any paid plan. D1 remains required: it stores assessments, registrations, answers and results. R2 is file storage, not a replacement for D1.

The official deployment source is `caciitg/c-and-assess`. The personal `Hermes-25/c-and-assess` fork is for portfolio and contributions, not deployment.

## What organizers can use

- Text questions and text answer options, uploaded through CSV.
- Registration, timed attempts, submission, scoring, results and analysis.
- Leave every CSV `Image` cell blank. Image ZIP uploads and image references are not supported in this release.
- The server rejects image-bearing imports rather than silently dropping images or publishing an incomplete paper.

Keep `CLOUDFLARE_R2_BUCKET` unset in both GitHub environments. The configuration renderer removes inherited R2 bindings. Keep Workers Free; no automatic paid upgrade is authorized.

## Evidence, not a capacity promise

The staging rehearsal on 4 September passed the core organizer-to-results flow using separate real Google organizer and candidate sign-ins. The known-answer paper produced the expected 5/12 score. Result release, separate solution release, duplicate-submit handling and same-device recovery were checked.

The deployment configuration tests also passed for staging without R2, production without R2, a future explicitly configured R2 bucket, and rejection of production configuration without a domain.

These checks do not certify a large simultaneous event, server-only recovery, or a complete security audit. Staged load tests, backup/restore verification and final-domain testing remain release gates.

## Existing data: cutover is not yet authorized as a fresh start

A read-only inventory on 4 September found six assessments and fourteen question rows on the existing Sites-managed live database. Two questions have image references. No data was changed or deleted. This inventory is not a database or object backup and does not establish how many historical attempts must be migrated.

Do not repoint `assess.caciitg.com` to an empty database merely because text-only mode is approved. First obtain the owner's choice:

1. Start a fresh text-only platform, preserving the old deployment and arranging verified access to old results separately; or
2. Preserve assessment history on the final domain, requiring a migration and an explicit handling plan for the image-bearing assessments.

Never strip historical image references or delete old attempts to make migration pass. Do not assume the old deployment's alternate hostname supports OAuth or historical result access until tested. Keep its domain and data unchanged until this decision and the preservation plan are complete.

## Next release steps

1. Resolve the old-data decision above; inventory attempts and related tables without publishing candidate personal data.
2. Back up the source data and record a tested restoration procedure. If starting fresh, preserve the old installation and explain where previous results remain accessible.
3. Prepare the official repository's protected production environment, separate production D1, and runtime Google credentials and session secret. Do not reuse staging data as production data.
4. Apply schema migrations before serving candidate requests; verify the production database and no-R2 configuration.
5. Verify production Google callback, privacy and terms links, and intended Google audience.
6. Schedule a quiet cutover window with registrations closed and no active exam. Record old DNS and deployment details. Attach the club Worker to the final hostname only when the previous gates pass.
7. Complete the organizer-to-results dry run on the final hostname and verify the main site's assessment link.
8. Name monitoring and backup owners, set a deployment freeze, and choose a launch size supported by measured load and Free-plan quotas.

Rollback must account for any answers saved after cutover. Do not switch back to an older database and silently abandon newer submissions. Freeze writes and reconcile first.

## Later phase: private image storage

R2 remains an optional future upgrade, not removed from the product roadmap. It requires separate approval for billing activation and any usage charges.

After approval: create private staging and production buckets, configure `CLOUDFLARE_R2_BUCKET`, redeploy, and copy existing images with their original keys. Verify every stored image reference resolves. Rehearse CSV plus ZIP publishing, organizer previews, candidate delivery and post-test review before enabling image-based assessments. Do not make the bucket public or publish exam images in GitHub.

See [Free-tier operation](FREE_TIER.md) and [deployment cutover](DEPLOYMENT_CUTOVER.md) for configuration and operating procedures.


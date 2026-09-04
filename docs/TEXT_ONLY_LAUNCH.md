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

## Existing data: fresh launch approved; old results preserved

The owner approved a fresh text-only production database while retaining the old Sites-managed installation for previous results. Do not copy staging attempts into production, delete the old installation, or strip historical image references.

Archive entry point: https://caciitg-assess.siabatra.chatgpt.site/assessments

Verified on 4 September through normal Google sign-in at that address: the existing candidate desk, two previously released reports (including PA Mock Test 1), scores and analysis. A released image question loaded successfully through its authenticated image endpoint (natural width 1920 pixels). Result access also survived a page refresh. These are sampled access checks, not a backup or proof of indefinite hosting availability.

Keep the archive's Google callback registered: https://caciitg-assess.siabatra.chatgpt.site/api/auth/callback/google. Users must sign in with the same Google account used for their original attempt. Old attempt links should use the archive hostname after cutover, not the fresh production hostname.

The read-only live inventory contained six assessments and fourteen question rows, including two image references. The old database and storage were not modified. Before cutover, add a clearly labelled Previous results link on the new site, verify the archive again, and retain the old release as the rollback target.

## Production preparation status

The official repository now has a separate production environment with the existing production D1 selected, the intended hostname configured, no R2 variable, and a required club reviewer. Deployment credentials are kept only in encrypted secrets.

The deployment workflow defaults to preparation: select production and leave attach_domain off. This creates the production Worker at its temporary workers.dev address without attaching the live hostname. Configure runtime OAuth and session secrets and complete preparation checks there. Only after the release gates pass, rerun with attach_domain on to perform the explicit domain cutover. Do not rerun preparation on an already-live Worker: it is an initial-launch step, not a rollback method.

## Next release steps

1. Follow the approved fresh-launch decision above; preserve old attempts and maintain access through the verified archive address.
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


# Ownership and handover

Built by Abhishek Das for the Consulting & Analytics Club, IIT Guwahati.

## Two repositories, different purposes

- **Official source:** https://github.com/caciitg/c-and-assess — owned by the club; issues, reviews, releases and deployment belong here.
- **Portfolio and contribution fork:** https://github.com/Hermes-25/c-and-assess — Abhishek’s showcase and development fork. It preserves the original work and links back to the official source.
- **Main website:** `caciitg/devops` — separate source connected to Cloudflare Pages. It only needs a normal link to `https://assess.caciitg.com`.

The official repository was transferred, not recreated, on 4 September 2026. Its commit history and attribution remain intact. The personal repository is now a genuine GitHub fork.

## How changes reach the club

1. Sync your fork with the official main branch.
2. Make a feature branch and run the checks described in CONTRIBUTING.md.
3. Open a pull request to `caciitg/c-and-assess:main`.
4. A club maintainer reviews it and merges after required checks pass.
5. An authorized maintainer runs the official deployment workflow, starting with staging.

The deploy job runs only in `caciitg/c-and-assess`. Do not copy club tokens, OAuth secrets or candidate data into a personal fork. Fork CI may run without club deployment credentials.

For an existing clone, inspect its remotes before changing them. Use the personal fork as `origin` for contributions and the club repository as `upstream`. Creating the fork at the old URL replaces GitHub’s old transfer redirect, so do not rely on that redirect for official-source links.

## Deployment ownership is separate from repository ownership

The club Cloudflare account owns the staging Worker and D1 database. Moving GitHub ownership does not move data, change DNS, activate billing, or replace the current live site. The live-domain cutover remains subject to the [cutover checklist](DEPLOYMENT_CUTOVER.md).

After transfer, the club account owner must verify the staging environment variables and encrypted deployment secret, deployment permissions, branch protections, and any required GitHub App repository access. A code collaborator cannot administer environment secrets. GitHub normally carries repository secrets with a transfer; their presence and a successful club-source deployment must still be verified.

The current setup remains free: R2 is deferred and the new Worker is text-only. Paid services need separate approval. The existing image-capable live release remains unchanged until a tested migration is approved.

## Next team’s handover checklist

- Keep at least a primary and backup maintainer named in the operating runbook.
- Keep club credentials under club control, never in source code or portfolio forks.
- Review deployment-token expiry and rotate it before expiry.
- Test sign-in, registration, exam recovery, submission and result release in staging.
- Back up D1 and record the Worker version before production changes.
- Use human approval for production and freeze deployments during exams.

The `caciitg` GitHub identity currently uses a user account rather than an organization. A future organization would allow named team roles without sharing a login; that is a separate migration, not required for this repository transfer.

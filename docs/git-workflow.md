# Git Workflow

ClinicFlow uses a simple branch workflow for the 7-day MVP.

## Branches

- `main`: stable and demo-ready.
- `dev`: active development and integration.
- `feature/*`: individual task branches.

## Rules

- Do not commit directly to `main` after the initial project foundation is established.
- Start each task from the latest `dev`.
- Use small, focused commits.
- Open a pull request for each feature branch.
- Keep pull requests easy to review.

## Create a Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feature/public-clinic-page
```

Use clear branch names:

- `feature/public-clinic-page`
- `feature/appointment-form`
- `feature/clinic-dashboard`
- `feature/ai-receptionist`

## Commit Changes

```bash
git status
git add .
git commit -m "feat: add public clinic page"
```

Commit message prefixes:

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `chore`: maintenance
- `refactor`: code restructuring without behavior change
- `test`: tests

## Push a Branch

```bash
git push origin feature/public-clinic-page
```

## Open a Pull Request

Open a PR from the feature branch into `dev`.

Before requesting review:

- Confirm the branch is up to date with `dev`.
- Run formatting and lint checks when available.
- Confirm the feature works locally.
- Keep the PR description specific.

## Merge to Main

Merge `dev` into `main` only when the current demo is stable.

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

## PR Template

```md
## Summary

- What changed?
- Why was it needed?

## Screenshots or Demo

- Add screenshots, a short video, or testing notes if UI changed.

## Testing

- [ ] Ran formatting
- [ ] Ran lint
- [ ] Tested locally
- [ ] Checked Supabase queries or migrations if database changed

## Safety Notes

- [ ] AI does not diagnose
- [ ] AI does not prescribe medicine
- [ ] AI does not suggest dosage
- [ ] Appointment submissions are shown as requests until staff confirmation
```

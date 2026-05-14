# Branching strategy

## Branches

| Branch    | Purpose                                                        | Protected |
|-----------|----------------------------------------------------------------|-----------|
| `main`    | Production. Deployed via ArgoCD to the live cluster.           | ✅        |
| `develop` | Integration. All feature branches merge here first.            | ✅        |
| `feature/<topic>` | Short-lived feature work, off `develop`.               | ❌        |
| `hotfix/<topic>`  | Urgent production fix, off `main`, back-merged to `develop`. | ❌ |
| `release/<version>` | Release stabilization, off `develop`, merged to `main`. | ❌ |

## Flow

```
feature/* ──► develop ──► release/* ──► main ──► (ArgoCD deploys)
                                          ▲
                                  hotfix/* ┘
```

## Required GitHub branch-protection rules

Apply these in **Settings → Branches → Add rule** for both `main` and `develop`:

### `main`
- ✅ Require a pull request before merging
- ✅ Require approvals: **2**
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require review from Code Owners
- ✅ Require status checks: `test`, `build-and-push` (from CI workflow)
- ✅ Require branches to be up to date before merging
- ✅ Require linear history (no merge commits — squash or rebase only)
- ✅ Do not allow bypassing the above settings (even admins)
- ✅ Restrict who can push: only the release manager / GitHub Actions bot

### `develop`
- ✅ Require a pull request before merging
- ✅ Require approvals: **1**
- ✅ Require status checks: `test`
- ✅ Require branches to be up to date before merging

## Conventional commits

Use the format `type(scope): subject` so changelogs auto-generate:

- `feat(booking): add recurring schedule support`
- `fix(auth): correct JWT tenant mismatch check`
- `refactor(db): extract RLS context helper`
- `chore(deps): bump fastify to 5.2`
- `docs(readme): add tenant onboarding diagram`

## Tenant-specific deployments

Do **not** create a long-lived branch per tenant. Instead, edit
`infrastructure/helm/values/values-<slug>.yaml` on `main` via the
`deploy-tenant` workflow — ArgoCD picks up the change and syncs only
that namespace.

## Summary
<!-- What does this PR change and why? -->

## Scope of impact
- [ ] App code only
- [ ] Database migration (RLS-sensitive — extra review required)
- [ ] Infrastructure (Terraform / Helm / K8s)
- [ ] CI/CD workflow

## Tenant rollout
- [ ] All tenants (fleet release)
- [ ] Single tenant via `values-<slug>.yaml`
- [ ] Behind a feature flag (specify key): `___`

## Test plan
- [ ] Unit tests pass locally
- [ ] Migrations applied + rolled back cleanly
- [ ] Verified RLS isolation (no cross-tenant data leak)
- [ ] Manual smoke test against `acme` demo tenant

## Checklist
- [ ] No secrets in code or `.env.example`
- [ ] `tenant_id` present on any new tenant-scoped table
- [ ] RLS policy added for any new tenant-scoped table
- [ ] Cache keys are tenant-prefixed

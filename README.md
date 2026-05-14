# Home Services SaaS Platform

Multi-tenant SaaS platform for home-services businesses. Each business gets a branded subdomain, isolated data, and a configurable catalog of services + pricing — all running on shared infrastructure with PostgreSQL Row-Level Security as the safety boundary.

## Architecture summary

- **Multi-tenancy**: Hybrid — Pool model (shared DB, RLS) for standard tenants; Bridge (per-schema) / Silo (per-DB) provisioned via Terraform for enterprise.
- **Backend**: Node.js + Fastify microservices.
- **Data**: PostgreSQL 16 (RLS + hash-partitioned `bookings` / `audit_logs`), PgBouncer pooling, read replicas.
- **Cache**: Redis with tenant-prefixed keys.
- **Infra**: Docker → Kubernetes (EKS) → Terraform (per-tenant module) → Helm (per-tenant values) → ArgoCD GitOps.
- **Feature management**: Unleash for tenant-scoped flags.

## Repository layout

```
homeservices-saas/
├── services/
│   ├── api-gateway/        Fastify reverse proxy, tenant resolution, JWT, rate limit
│   ├── tenant-service/     Signup, theme/white-label, settings
│   ├── auth-service/       JWT issuance, refresh, /me
│   ├── booking-service/    Bookings, customers, services, categories CRUD
│   ├── pricing-service/    (skeleton — dynamic quoting engine)
│   └── notification-service/ (skeleton — email/SMS consumer)
├── shared/
│   ├── db/                 Knex migrations (schema + RLS), seeds, pg client
│   ├── cache/              Redis tenant cache helper
│   ├── middleware/         tenantContext, auth, errorHandler
│   └── utils/              logger, jwt, errors
├── infrastructure/
│   ├── terraform/
│   │   ├── global/         VPC, EKS, Aurora, ElastiCache, registry
│   │   └── modules/tenant/ Namespace + S3 + CloudFront + (enterprise) dedicated RDS
│   ├── helm/
│   │   ├── homeservices/   Base chart (deployments, ingress, HPA)
│   │   └── values/         Per-tenant override files (values-acme.yaml, …)
│   └── k8s/base/           Namespace template, ArgoCD app template
├── scripts/init-db.sql     Initial extensions + roles
├── docker-compose.yml      Postgres + PgBouncer + Redis + Unleash for local dev
├── Dockerfile              Multi-stage, parameterized by SERVICE
└── .github/workflows/      CI + targeted-tenant deploy
```

## Local development

```bash
# 1. Copy env
cp .env.example .env

# 2. Start infra (Postgres + PgBouncer + Redis + Unleash)
docker compose up -d postgres redis pgbouncer

# 3. Install workspaces
npm install --workspaces --include-workspace-root

# 4. Migrate DB (creates schema + RLS policies)
npm run migrate

# 5. Seed (creates demo tenant "acme")
npm run seed

# 6. Run all services in parallel
npm run dev:all
```

Once running:

```bash
# Resolve tenant by host
curl -H "Host: acme.localhost" http://localhost:3000/api/v1/tenants/resolve

# Login as the demo admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Host: acme.localhost" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password123"}'

# Use the returned accessToken for protected endpoints
curl http://localhost:3000/api/v1/categories \
  -H "Host: acme.localhost" \
  -H "Authorization: Bearer <accessToken>"
```

## How data isolation works

1. Gateway resolves the tenant from `Host` (subdomain or custom domain) and injects `x-tenant-id`.
2. Each service wraps every query in `db.withTenant(tenantId, fn)` which opens a transaction and runs `SELECT set_config('app.current_tenant', $1, true)`.
3. RLS policies on every tenant-scoped table compare `tenant_id` against `current_setting('app.current_tenant')`. Cross-tenant rows are invisible.
4. `FORCE ROW LEVEL SECURITY` ensures even the table owner obeys the policy — defense-in-depth.

## How granular deployments work

| Goal | Mechanism |
|------|-----------|
| Deploy a new version to **all tenants** | Bump `image.tag` in `values-default.yaml` → ArgoCD syncs all apps |
| Deploy to **one tenant** | Edit `infrastructure/helm/values/values-<slug>.yaml` (or run the `deploy-tenant` workflow) — ArgoCD syncs only that namespace |
| Release a feature to **one tenant** without redeploying | Toggle the flag in Unleash, scoped to that `tenant_id` |
| Emergency kill switch | Disable the Unleash flag — zero downtime, no rollback |

## How tenant onboarding works

On signup (`POST /api/v1/tenants/signup`):

1. `tenant-service` inserts a row into `tenants` (super-admin context bypasses RLS).
2. A `business_admin` user is created with hashed password.
3. (Production) A job triggers `terraform apply -target=module.tenant` with the tenant slug → provisions K8s namespace, S3 bucket, CloudFront, optional dedicated RDS.
4. ArgoCD picks up a new tenant Application from `infrastructure/k8s/base/argocd-app-template.yaml` and deploys.
5. DNS for `<slug>.yourapp.com` resolves via wildcard A record (Route53).

## Production deployment (high level)

```bash
# 1. Bootstrap shared infra (once)
cd infrastructure/terraform/global && terraform init && terraform apply

# 2. Provision a tenant (run from your onboarding job)
cd ../modules/tenant && terraform apply \
  -var tenant_id=<uuid> -var tenant_slug=acme -var plan_tier=pro

# 3. Build + push images
docker build --build-arg SERVICE=tenant-service -t ghcr.io/yourorg/tenant-service:1.0.0 .
docker push ghcr.io/yourorg/tenant-service:1.0.0
# (CI workflow does this for all services in parallel)

# 4. ArgoCD picks up Helm chart changes from git automatically
```

## Performance targets

| Metric | Target | Mechanism |
|--------|--------|-----------|
| p95 API latency | < 100 ms | Redis cache, PgBouncer, read replicas |
| Tenant config load | < 5 ms | Redis (24h TTL) |
| DB query | < 20 ms | Composite indexes + hash partitioning |
| Availability | 99.9% | Multi-AZ Aurora, Redis replicas, HPA |
| Tenant onboarding | < 5 min | Automated Terraform |

## What's intentionally stubbed

- `pricing-service` and `notification-service` directories are placeholders. The pricing engine should consume `pricing_structures` rules; the notifier should subscribe to a `bookings.*` event stream (SQS/Kafka).
- The frontend (Next.js) is not in this repo — it consumes `/api/v1/themes` and `/api/v1/tenants/resolve` to bootstrap a tenant-specific UI via CSS variables.
- Observability stack (Prometheus, Grafana, OpenTelemetry exporter) is documented but not yet wired up.

## Key files to read first

- [shared/db/migrations/20260101000002_rls_policies.js](shared/db/migrations/20260101000002_rls_policies.js) — RLS policy creation
- [shared/db/client.js](shared/db/client.js) — `withTenant` helper (the safety net)
- [services/api-gateway/src/server.js](services/api-gateway/src/server.js) — tenant resolution + JWT + proxy
- [infrastructure/helm/homeservices/templates/deployments.yaml](infrastructure/helm/homeservices/templates/deployments.yaml) — how services are templated per tenant
- [infrastructure/terraform/modules/tenant/main.tf](infrastructure/terraform/modules/tenant/main.tf) — tenant infra provisioning

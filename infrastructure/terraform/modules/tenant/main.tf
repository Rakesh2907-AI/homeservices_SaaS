# Provisions a single tenant's infrastructure.
# Called by the platform's tenant-onboarding job when a business signs up.
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws        = { source = "hashicorp/aws",        version = "~> 5.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.30" }
    helm       = { source = "hashicorp/helm",       version = "~> 2.13" }
  }
}

variable "tenant_id"   { type = string }
variable "tenant_slug" {
  type = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.tenant_slug))
    error_message = "tenant_slug must be lowercase alphanumeric or hyphens."
  }
}
variable "plan_tier"   { type = string, default = "basic" }
variable "custom_domain" { type = string, default = "" }

# Plan → resource quota mapping
locals {
  resource_caps = {
    basic      = { cpu_req = "500m", cpu_lim = "1",  mem_req = "512Mi", mem_lim = "1Gi"  }
    pro        = { cpu_req = "1",    cpu_lim = "4",  mem_req = "1Gi",   mem_lim = "4Gi"  }
    enterprise = { cpu_req = "4",    cpu_lim = "16", mem_req = "4Gi",   mem_lim = "16Gi" }
  }
  caps = local.resource_caps[var.plan_tier]
}

# ---- Kubernetes namespace + isolation primitives ----
resource "kubernetes_namespace" "tenant" {
  metadata {
    name = "tenant-${var.tenant_slug}"
    labels = {
      "tenant-id"  = var.tenant_id
      "plan-tier"  = var.plan_tier
      "managed-by" = "terraform"
    }
  }
}

resource "kubernetes_resource_quota" "tenant" {
  metadata {
    name      = "tenant-quota"
    namespace = kubernetes_namespace.tenant.metadata[0].name
  }
  spec {
    hard = {
      "requests.cpu"    = local.caps.cpu_req
      "requests.memory" = local.caps.mem_req
      "limits.cpu"      = local.caps.cpu_lim
      "limits.memory"   = local.caps.mem_lim
      "pods"            = "20"
    }
  }
}

resource "kubernetes_network_policy" "default_deny" {
  metadata {
    name      = "default-deny-all"
    namespace = kubernetes_namespace.tenant.metadata[0].name
  }
  spec {
    pod_selector {}
    policy_types = ["Ingress", "Egress"]
  }
}

# ---- S3 bucket for tenant assets (logos, branded images) ----
resource "aws_s3_bucket" "assets" {
  bucket = "hs-assets-${var.tenant_slug}"
  tags = {
    TenantId = var.tenant_id
    PlanTier = var.plan_tier
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---- CloudFront distribution (CDN for tenant assets) ----
resource "aws_cloudfront_origin_access_control" "assets" {
  name                              = "tenant-${var.tenant_slug}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "assets" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "Assets CDN for tenant ${var.tenant_slug}"

  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "s3-${var.tenant_slug}"
    origin_access_control_id = aws_cloudfront_origin_access_control.assets.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-${var.tenant_slug}"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }

  tags = { TenantId = var.tenant_id }
}

# ---- Dedicated RDS instance (enterprise tier only) ----
resource "aws_db_instance" "tenant_db" {
  count = var.plan_tier == "enterprise" ? 1 : 0

  identifier              = "hs-tenant-${var.tenant_slug}"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = "db.t4g.medium"
  allocated_storage       = 50
  storage_encrypted       = true
  db_name                 = "homeservices"
  username                = "saas_user"
  manage_master_user_password = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "hs-tenant-${var.tenant_slug}-final"
  backup_retention_period = 14
  multi_az                = true
  publicly_accessible     = false
  deletion_protection     = true
  tags = { TenantId = var.tenant_id }
}

output "namespace"        { value = kubernetes_namespace.tenant.metadata[0].name }
output "s3_bucket"        { value = aws_s3_bucket.assets.id }
output "cdn_domain"       { value = aws_cloudfront_distribution.assets.domain_name }
output "dedicated_db_arn" { value = length(aws_db_instance.tenant_db) > 0 ? aws_db_instance.tenant_db[0].arn : "" }

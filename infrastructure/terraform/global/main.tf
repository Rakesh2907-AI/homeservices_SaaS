# Global / shared infrastructure: VPC, EKS, RDS primary, ElastiCache Redis,
# state backend, ECR registry. Run ONCE per environment.
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "hs-tf-state"
    key            = "global/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "hs-tf-lock"
    encrypt        = true
  }
}

provider "aws" { region = var.region }

variable "region"       { type = string, default = "us-east-1" }
variable "environment"  { type = string, default = "production" }
variable "vpc_cidr"     { type = string, default = "10.0.0.0/16" }

# VPC + subnets (3 AZs)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name    = "hs-${var.environment}"
  cidr    = var.vpc_cidr
  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway = true
  single_nat_gateway = false
}

# EKS cluster (runs all tenants)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"
  cluster_name    = "hs-${var.environment}"
  cluster_version = "1.30"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 3
      max_size     = 20
      instance_types = ["t3.large"]
    }
  }
}

# Primary RDS Aurora cluster (shared by pool/bridge tenants)
resource "aws_rds_cluster" "primary" {
  cluster_identifier      = "hs-primary"
  engine                  = "aurora-postgresql"
  engine_version          = "16"
  database_name           = "homeservices"
  master_username         = "saas_user"
  manage_master_user_password = true
  vpc_security_group_ids  = [aws_security_group.db.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name
  backup_retention_period = 14
  storage_encrypted       = true
  deletion_protection     = true
}

resource "aws_rds_cluster_instance" "writer" {
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.primary.engine
}

resource "aws_rds_cluster_instance" "reader" {
  count              = 2
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.primary.engine
}

resource "aws_db_subnet_group" "main" {
  name       = "hs-main"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "db" {
  name   = "hs-db"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr]
  }
}

# ElastiCache Redis cluster (tenant cache layer)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "hs-redis"
  description                = "Tenant cache + sessions"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.t4g.medium"
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.main.name
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "hs-cache"
  subnet_ids = module.vpc.private_subnets
}

output "cluster_endpoint"  { value = module.eks.cluster_endpoint }
output "db_writer_endpoint" { value = aws_rds_cluster.primary.endpoint }
output "db_reader_endpoint" { value = aws_rds_cluster.primary.reader_endpoint }
output "redis_endpoint"     { value = aws_elasticache_replication_group.redis.primary_endpoint_address }

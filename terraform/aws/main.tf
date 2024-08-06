provider "aws" {
  region = var.region
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

resource "aws_key_pair" "ssh_pubkey" {
  key_name   = "ssh_pubkey"
  public_key = file(var.ssh_pubkey)
}

resource "aws_launch_template" "eks_node_with_keypair" {
  instance_type = var.vm_size
  key_name      = aws_key_pair.ssh_pubkey.key_name
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.9.0"

  name = var.vpc_name

  azs  = slice(data.aws_availability_zones.available.names, 0, 3)
  cidr = "192.168.0.0/16"

  public_subnets  = ["192.168.0.0/19", "192.168.32.0/19", "192.168.64.0/19"]
  private_subnets = ["192.168.96.0/19", "192.168.128.0/19", "192.168.160.0/19"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
}

module "irsa-ebs-csi" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "5.41.0"

  create_role           = true
  role_name             = "EKSEBSCSIRole-${var.cluster_name}"
  attach_ebs_csi_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:ebs-csi-controller-sa"]
    }
  }
}

module "irsa-vpc-cni" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "5.41.0"

  create_role           = true
  role_name             = "EKSVPCCNIRole-${var.cluster_name}"
  attach_vpc_cni_policy = true
  vpc_cni_enable_ipv4   = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-node"]
    }
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.19.0"

  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version

  cluster_endpoint_public_access           = true
  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    vpc-cni = {
      kubernetes_version       = var.kubernetes_version
      most_recent              = true
      service_account_role_arn = module.irsa-vpc-cni.iam_role_arn
    }

    coredns = {
      kubernetes_version = var.kubernetes_version
      most_recent        = true
    }

    kube-proxy = {
      kubernetes_version = var.kubernetes_version
      most_recent        = true
    }

    eks-pod-identity-agent = {
      kubernetes_version = var.kubernetes_version
      most_recent        = true
    }

    aws-ebs-csi-driver = {
      kubernetes_version       = var.kubernetes_version
      most_recent              = true
      service_account_role_arn = module.irsa-ebs-csi.iam_role_arn
      depends_on               = [module.eks.eks_managed_node_groups]
    }
  }

  vpc_id                               = module.vpc.vpc_id
  subnet_ids                           = module.vpc.private_subnets
  cluster_endpoint_public_access_cidrs = var.authorized_ip_ranges

  eks_managed_node_group_defaults = {
    ami_type                = var.ami_type
    instance_types          = [var.vm_size]
    launch_template_id      = aws_launch_template.eks_node_with_keypair.id
    launch_template_version = aws_launch_template.eks_node_with_keypair.latest_version

    block_device_mappings = {
      xvda = {
        device_name = "/dev/xvda"
        ebs = {
          volume_size           = 25
          volume_type           = "gp3"
          iops                  = 3000
          throughput            = 150
          encrypted             = true
          delete_on_termination = true
        }
      }
    }
  }

  eks_managed_node_groups = {
    worker = {
      name = "worker-group"

      min_size     = 2
      desired_size = 4
      max_size     = 6
    }
  }
}

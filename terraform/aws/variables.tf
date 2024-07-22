variable "ami_type" {
  type    = string
  default = "AL2023_ARM_64_STANDARD"
}

variable "authorized_ip_ranges" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "cluster_name" {
  type    = string
  default = "taktzeit"
}

variable "kubernetes_version" {
  type    = string
  default = "1.30"
}

variable "profile" {
  type    = string
  default = "default"
}

variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "ssh_pubkey" {
  type    = string
  default = "~/.ssh/id_rsa.pub"
}

variable "vm_size" {
  type    = string
  default = "t4g.small"
}

variable "vpc_name" {
  type    = string
  default = "taktzeit-vpc"
}

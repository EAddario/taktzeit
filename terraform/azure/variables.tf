variable "admin_username" {
  type    = string
  default = "sysadmin"
}

variable "authorized_ip_ranges" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "cluster_name" {
  type    = string
  default = "taktzeit-cluster"
}

variable "default_node_count" {
  type    = number
  default = 1
}

variable "dns_prefix" {
  type    = string
  default = "taktzeit-dns"
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "max_nodes" {
  type    = number
  default = 3
}

variable "max_pods" {
  type    = number
  default = 100
}

variable "min_nodes" {
  type    = number
  default = 1
}

variable "node_pool_name" {
  type    = string
  default = "systempool"
}

variable "node_resource_group" {
  type    = string
  default = "taktzeit-infra-rg"
}

variable "project_name" {
  type    = string
  default = "taktzeit"
}

variable "resource_group_name" {
  type    = string
  default = "taktzeit-rg"
}

variable "ssh_public_key" {
  type    = string
  default = "~/.ssh/id_rsa.pub"
}

variable "vm_size" {
  type    = string
  default = "Standard_A2_v2"
}

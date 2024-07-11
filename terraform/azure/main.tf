terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.111.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.31.0"
    }
  }

  required_version = ">= 1.9.0"
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

resource "azurerm_resource_group" "rg" {
  location = var.location
  name     = var.resource_group_name
}

resource "azurerm_kubernetes_cluster" "aks" {
  automatic_channel_upgrade = "patch"
  dns_prefix                = var.dns_prefix
  kubernetes_version        = data.azurerm_kubernetes_service_versions.current.latest_version
  location                  = var.location
  name                      = var.cluster_name
  node_os_channel_upgrade   = "NodeImage"
  node_resource_group       = var.node_resource_group
  resource_group_name       = var.resource_group_name
  sku_tier                  = "Free"

  api_server_access_profile {
    authorized_ip_ranges = var.authorized_ip_ranges
  }

  default_node_pool {
    enable_auto_scaling  = true
    max_count            = var.max_nodes
    max_pods             = var.max_pods
    min_count            = var.min_nodes
    name                 = var.node_pool_name
    node_count           = var.default_node_count
    orchestrator_version = data.azurerm_kubernetes_service_versions.current.latest_version
    os_sku               = "Ubuntu"
    type                 = "VirtualMachineScaleSets"
    vm_size              = var.vm_size

    upgrade_settings {
      drain_timeout_in_minutes      = 0
      max_surge                     = "10%"
      node_soak_duration_in_minutes = 0
    }
  }

  identity {
    type = "SystemAssigned"
  }

  lifecycle {
    ignore_changes = [
      default_node_pool.0.node_count,
      default_node_pool.0.upgrade_settings
    ]
  }

  linux_profile {
    admin_username = var.admin_username
    ssh_key {
      key_data = file(var.ssh_public_key)
    }
  }

  network_profile {
    network_plugin = "azure"
  }

  web_app_routing {
    # Needed to enable the Azure application routing add-on and deploy the managed NGINX ingress controller
  }
}

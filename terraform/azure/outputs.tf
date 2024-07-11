output "latest_aks_version" {
  value = data.azurerm_kubernetes_service_versions.current.latest_version
}

provider "helm" {
  kubernetes {
    host = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args = ["eks", "get-token", "--cluster-name", data.aws_eks_cluster.cluster.name]
      command     = "aws"
    }
  }
}

resource "helm_release" "metrics_server" {
  name             = "metrics-server"
  namespace        = "metrics-server"
  create_namespace = true
  repository       = "https://kubernetes-sigs.github.io/metrics-server"
  chart            = "metrics-server"
  version          = "3.12.1"

  set {
    name = "args"
    value = "{--kubelet-insecure-tls=true}"
  }

  set {
    name = "args"
    value = "{--kubelet-preferred-address-types=InternalIP,Hostname,InternalDNS,ExternalDNS,ExternalIP}"
  }
}

resource "helm_release" "nginx" {
  name             = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  version          = "4.11.0"

  set {
    name  = "controller.service.annotations.service.beta.kubernetes.io/aws-load-balancer-type"
    value = "nlb"
  }

  set {
    name  = "externalTrafficPolicy"
    value = "Local"
  }
}

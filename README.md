# Taktzeit
Simple PoC to demonstrate scalable cloud patterns and advantages of adhering to the [12 Factor App](https://12factor.net/) methodology.  

## Deployment and Operation
While a [Docker Compose](https://docs.docker.com/compose/) file is available, this PoC is designed to operate in a Kubernetes cluster. [kube-up](./kubernetes/kube-up) and [kube-down](./kubernetes/kube-down) shell scripts are provided to start and shutdown the PoC.

```sh
% kube-up

Deploying Secrets
secret/vault created

Deploying RabbitMQ
service/rabbitmq-cluster-ip created
deployment.apps/rabbitmq-deployment created

Sleeping 30 sec to allow for RabbitMQ startup
▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇| 100%
Deploying Redis
service/redis-cluster-ip created
deployment.apps/redis-deployment created

Creating Peristent Volume Claim
persistentvolumeclaim/database-pvc created

Deploying Postgres
service/postgres-cluster-ip created
deployment.apps/postgres-deployment created

Deploying WORKER service
deployment.apps/worker-deployment created

Deploy WORKER horizontal pod autoscaler? (y/n)
y

Deploying WORKER horizontal pod autoscaler
horizontalpodautoscaler.autoscaling/worker-hpa created

Deploying API service
service/api-cluster-ip created
deployment.apps/api-deployment created

Deploying CLIENT service
service/client-cluster-ip created
deployment.apps/client-deployment created

Deploying ingress service
ingress.networking.k8s.io/ingress-service created

Finished deploying cloud native system
```

```sh
% kube-down

Deleting ingress service
ingress.networking.k8s.io "ingress-service" deleted

Deleting CLIENT service
service "client-cluster-ip" deleted
deployment.apps "client-deployment" deleted

Deleting API service
service "api-cluster-ip" deleted
deployment.apps "api-deployment" deleted

Deleting WORKER horizontal pod autoscaler
horizontalpodautoscaler.autoscaling "worker-hpa" deleted

Deleting WORKER service
deployment.apps "worker-deployment" deleted

Deleting Postgres
service "postgres-cluster-ip" deleted
deployment.apps "postgres-deployment" deleted

Delete Peristent Volume Claim? (y/n)
y

Deleting Peristent Volume Claim
persistentvolumeclaim "database-pvc" deleted

Deleting Redis
service "redis-cluster-ip" deleted
deployment.apps "redis-deployment" deleted

Deleting RabbitMQ
service "rabbitmq-cluster-ip" deleted
deployment.apps "rabbitmq-deployment" deleted

Deleting Secrets
secret "vault" deleted

Finished destroying cloud native system
```

## System Behaviour
Upon entering an integer in the web front-end, located at http://localhost/ when deployed locally (http://localhost:8080/ if running via docker compose), the system will calculate the [Fibonacci number](https://en.wikipedia.org/wiki/Fibonacci_number) using a very inefficient recursive algorithm running in O(c<sup>n</sup>) time. For a good analysis of other (better) implementations check Ali Dasdan's paper [Twelve Simple Algorithms to Compute Fibonacci Numbers](https://arxiv.org/pdf/1803.07199.pdf).  

Values of 40 or less should complete within seconds with negligible resource consumption, while values approaching 50 will take exponentially longer and tax heavily the CPU. Values above 50 are **not** recommended, and values above 55 are ignored.  

Although overly simplistic in their implementation, each service is designed to be event-driven, concurrent, stateless, disposable  and capable of significant horizontal scaling. All the system's state is managed by backing services (*PostgreSQL, RabbbitMQ and Redis*).  

When deployed in a Kubernetes cluster, a [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) (*HPA*) monitors the Worker's CPU and will create additional instances automatically (*up to 4 in this PoC*) whenever its utilization is above 50% for 15 seconds or more. As the combined Workers' CPU utilization falls below that mark, the HPA will terminate unneeded instances.  

The HPA's monitoring interval can be changed by setting the `--horizontal-pod-autoscaler-sync-period` flag in the cluster's default controller manager.  

## System Architecture
![High Level Architecture](https://mermaid.ink/svg/eyJjb2RlIjoiZ3JhcGggTFJcbkEoW0luZ3Jlc3NdKSAgLS0-fG5naW54fCBCKENsaWVudClcbkIgLS0-fHByb3h5fCBDe0FQSX1cbkMgLS0-IEdcbkdbW1JlZGlzXV0gLS4tPiB8LWZpYm9uYWNjaSByZXN1bHQtfENcbkMgLS0-IElbKFBvc3RncmVzKV1cbkkgLS4tPiB8aW50ZWdlcnN8Q1xuQyAtLT4gSFtbUmFiYml0TVFdXVxuSCAtLT5EKFdvcmtlciAxKVxuRCAtLT4gR1xuSCAtLT5FKFdvcmtlciBuLTEpXG5FIC0tPiBHXG5IIC0tPkYoV29ya2VyIG4pXG5GIC0tPiBHIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0)  

## Sequence Diagram
![Sequence Diagram](https://mermaid.ink/svg/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG5cbnBhciBDdXJyZW50XG5cdENsaWVudC0-PitBUEk6IEdFVCAvdmFsdWVzL2N1cnJlbnRcbiAgQVBJLT4-K1JlZGlzOiBoZ2V0YWxsXG4gIFJlZGlzLS0-Pi1BUEk6IGN1cnJlbnRcbiAgQVBJLS0-Pi1DbGllbnQ6IGN1cnJlbnRcbmVuZFxuXG5wYXIgQWxsXG4gIENsaWVudC0-PitBUEk6IEdFVCAvdmFsdWVzL2FsbFxuICBBUEktPj4rUG9zdGdyZVNRTDogR0VUIC92YWx1ZXMvYWxsXG4gIFBvc3RncmVTUUwtLT4-LUFQSTogYWxsXG4gIEFQSS0tPj4tQ2xpZW50OiBhbGxcbmVuZFxuXG5wYXIgVmFsdWVzXG4gIENsaWVudC0-PkFQSTogUE9TVCAvdmFsdWVzXG4gIEFQSS0-PlJlZGlzOiBoc2V0ICdOYU4nXG4gIEFQSS0-PlBvc3RncmVTUUw6IEluc2VydCBJbnRcblx0QVBJLT4-UmFiYml0TVA6IFB1Ymxpc2ggSW50XG5lbmRcblxucGFyIEZpYm9uYWNjaVxuICBSYWJiaXRNUC0teCtXb3JrZXI6IFN1YnNjcmlwdGlvbiBFdmVudFxuICBXb3JrZXItPj5Xb3JrZXI6IGZpYm9uYWNjaShJbnQpXG4gIFdvcmtlci0-Pi1SZWRpczogaHNldCAnTmFuJyB0byBGaWJvbmFjY2lcbmVuZFxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0)

# How It Works

The schema registry has one essential task, to hold the schemas for all the services. Along with each schema, it holds some configuration like URL or discovery identifier. Before a schema can be updated, it has to be validated. Beyond basic linting, we also catch things like breaking changes, and conflicts that arise when combining the schema with the rest of the graph.

Federated schema and graphql gateway are very fragile. If you have type name collision or invalid reference in one of the services and serve it to the gateway, it won’t like it.

By default, the gateway’s behavior will be to poll services for their schemas so it's easy for one service to crash the traffic. The schema registry solves it by validating schema on-push and rejecting registration if it causes possible conflict.

If the schema registry sees that the provided set of versions is not stable, it falls back to the last registered versions.


## Features

- Stores versioned schema for graphql-federated services.
- Serves schema for graphql gateway based on provided services & their versions.
- Validates new schema to be compatible with other running services.
- Stores & shows in UI persisted queries passed by the gateway for debugging.

## Installation
Assuming you have nvm & docker installed:

 $nvm use
 $npm install
 $npm run build
 $docker-compose up --build
 
 Open http://localhost:6001


## Config


## Usacases

## Deployment

The registry has been deployed to 2 kubernetes clusters with separation of:
    
      1.prod
      
      2.dev/testing/demo (separated via namepaces)
      
 The deployment has been set via CI/CD with the flexibility of helm values to set default configurations, just overriding the configs that differ from one environment to the other.


## K8S 101


### Pods

- Pod is an abstaction over a container
- Pods can die

### Service

- A service is a load balancer, it forwards request to less busy pods.
- Pods communicate with each other using the service
- A permanent IP address that can be attached to a pod
- Lifecycle of pod and service are not connected

### Ingress

- It routes traffic onto the cluster
- Requests comes here and get forwaded to the service

### ConfigMap

- represents an external config to an aplication
- It connects to the pod for it to get the details

### Secret

- Used to store secret data
- Putting credentials in config map is insecure

### Deployment

- A deployment is an abstraction on top of pods
- Required to replicate everything on multilpe servers
- In order to create a second pod you will define a blueprint of the first
- Create a deployment to specify how many replica pods which can be scaled

### Statefulset

- It is meant for databases
- Databases are created via a statefulset
- It ensures database reads and writes are synchronized
- Its common practice to host database outside a kubernates cluster

### DataStorage

- If pod restarted the data will be gone
- The fix for that is to have an external reference to it via volume
- K8 does not manage data persistent

### Volume

Since containers are ephemeral, we need to configure a volume, via a PersistentVolume and a PersistentVolumeClaim, to store the Mysql data outside of the pod. Without a volume, you we lose our data when the pod goes down.

Create a Persistent Disk:

 $gcloud compute disks create <name-of-disk> --size <e.g 50GB> --zone <zone>

### Kubernetes Cluster

how to create a cluster on Kubernetes Engine:

 $gcloud container clusters create <name-of-node> --num-nodes=<number-of-nodes> --zone <zone-name> --machine-type <type-of-machine>

This will create a one-node cluster called node-kubernetes in the europe-west2-b region with g1-small machines. It will take a few minutes to spin up.


Connect the kubectl client to the cluster:

 $ gcloud container clusters get-credentials <name-of-node> --zone <zone-name>

listing the number of nodes in a cluster

 $kubectl get nodes

listing the number of pods in a cluster

 $kubectl get pods

viewing logs in a pod

 $kubectl logs -f <pode-name>



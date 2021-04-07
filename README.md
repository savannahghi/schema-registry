Schema Registry
---------------
The schema registry has one essential task, to hold the schemas for all the services. Along with each schema, it holds some configuration like URL or discovery identifier. Before a schema can be updated, it has to be validated. Beyond basic linting, we also catch things like breaking changes, and conflicts that arise when combining the schema with the rest of the graph.

Federated schema and graphql gateway are very fragile. If you have type name collision or invalid reference in one of the services and serve it to the gateway, it won’t like it.

By default, the gateway’s behavior will be to poll services for their schemas so it's easy for one service to crash the traffic. The schema registry solves it by validating schema on-push and rejecting registration if it causes possible conflict.

If the schema registry sees that the provided set of versions is not stable, it falls back to the last registered versions.


Features
--------
- Stores versioned schema for graphql-federated services.
- Serves schema for graphql gateway based on provided services & their versions.
- Validates new schema to be compatible with other running services.
- Stores & shows in UI persisted queries passed by the gateway for debugging.


Deployment
----------
The registry has been deployed to 2 kubernetes clusters with separation of:
    
      1.prod
      
      2.dev/testing/demo (separated via namepaces)
      
 The deployment has been set via CI/CD with the flexibility of helm values to set default configurations, just overriding the configs that differ from one environment to the other.

Kubernetes Cluster
------------------
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


Volume
------
Since containers are ephemeral, we need to configure a volume, via a PersistentVolume and a PersistentVolumeClaim, to store the Mysql data outside of the pod. Without a volume, you we lose our data when the pod goes down.

Create a Persistent Disk:

 $gcloud compute disks create <name-of-disk> --size <e.g 50GB> --zone <zone>
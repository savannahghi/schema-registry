# How It Works

![image info](./dist/schema_poll.png)

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

## Use cases

### Validating schema on deploy

On pre-commit / deploy make a POST /schema/validate to see if its compatible with current schema.

### Schema registration

On service start-up (runtime), make POST to /schema/push to register schema (see API reference for details).
Make sure to handle failure.

## Architecture

### Tech stack

| Frontend (`/client` folder) | Backend (`/app` folder)           |
| --------------------------- | --------------------------------- |
| react                       | nodejs 14                         |
| apollo client               | express, hapi/joi                 |
| styled-components           | apollo-server-express, dataloader |
|                             | redis 6                           |
|                             | knex                              |
|                             | mysql 8                           |

### DB structure

Migrations are done using knex
![](https://app.lucidchart.com/publicSegments/view/74fc86d4-671e-4644-a198-41d7ff681cae/image.png)

### DB migrations

To create new DB migration, use:

```bash
npm run new-db-migration
```

If not using the default configuration of executing DB migrations on service startup, you can run the following `npm`
command prior to starting the registry:

```bash
npm run migrate-db
```

The command can be prefixed with any environment variable necessary to configure DB connection (in case you ALTER DB with another user), such as:

```bash
DB_HOST=my-db-host DB_PORT=6000 npm run migrate-db
```

## Rest API documentation

### GET /schema/latest

Simplified version of /schema/compose where latest versions from different services is composed. Needed mostly for debugging

### POST /schema/compose

Lists schema based on passed services & their versions.
Used by graphql gateway to fetch schema based on current containers

#### Request params (optional, raw body)

```json
{
  "services": [
    { "name": "service_a", "version": "ke9j34fuuei" },
    { "name": "service_b", "version": "e302fj38fj3" }
  ]
}
```

#### Response example

- ✅ 200

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "service_id": 3,
      "version": "ke9j34fuuei",
      "name": "service_a",
      "url": "http://example.com/graphql",
      "added_time": "2020-12-11T11:59:40.000Z",
      "type_defs": "\n\ttype Query {\n\t\thello: String\n\t}\n",
      "is_active": 1
    },
    {
      "id": 3,
      "service_id": 4,
      "version": "v1",
      "name": "service_b",
      "url": "http://example.com/graphql",
      "added_time": "2020-12-14T18:51:04.000Z",
      "type_defs": "type Query {\n  world: String\n}\n",
      "is_active": 1
    }
  ]
}
```

- ❌ 400 "services[0].version" must be a string
- ❌ 500 Internal error (DB is down)

#### Request params

- services{ name, version}

If `services` is not passed, schema-registry tries to find most recent versions. Logic behind the scenes is that schema with _highest_ `added_time` OR `updated_time` is picked as latest. If time is the same, `schema.id` is used.

### POST /schema/push

Validates and registers new schema for a service.

#### Request params (optional, raw body)

```json
{
  "name": "service_a",
  "version": "ke9j34fuuei",
  "url":: "http://example.com/graphql",
  "type_defs": "\n\ttype Query {\n\t\thello: String\n\t}\n"
}
```

#### POST /schema/validate

Validates schema, without adding to DB

##### Request params (raw body)

- name
- version
- url
- type_defs

#### POST /schema/diff

Compares schemas and finds breaking or dangerous changes between provided and latest schemas.

- name
- version
- url
- type_defs

#### DELETE /schema/delete/:schemaId

Deletes specified schema

##### Request params

| Property   | Type   | Comments      |
| ---------- | ------ | ------------- |
| `schemaId` | number | ID of sechema |

#### GET /persisted_query

Looks up persisted query from DB & caches it in redis if its found

##### Request params (query)

| Property | Type   | Comments                         |
| -------- | ------ | -------------------------------- |
| `key`    | string | hash of APQ (with `apq:` prefix) |

#### POST /persisted_query

Adds persisted query to DB & redis cache

##### Request params (raw body)

| Property | Type   | Comments                         |
| -------- | ------ | -------------------------------- |
| `key`    | string | hash of APQ (with `apq:` prefix) |
| `value`  | string | Graphql query                    |

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

\$gcloud compute disks create <name-of-disk> --size <e.g 50GB> --zone <zone>

### Kubernetes Cluster

how to create a cluster on Kubernetes Engine:

\$gcloud container clusters create <name-of-node> --num-nodes=<number-of-nodes> --zone <zone-name> --machine-type <type-of-machine>

This will create a one-node cluster called node-kubernetes in the europe-west2-b region with g1-small machines. It will take a few minutes to spin up.

Connect the kubectl client to the cluster:

\$ gcloud container clusters get-credentials <name-of-node> --zone <zone-name>

listing the number of nodes in a cluster

\$kubectl get nodes

listing the number of pods in a cluster

\$kubectl get pods

viewing logs in a pod

\$kubectl logs -f <pode-name>

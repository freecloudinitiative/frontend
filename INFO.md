# Free Cloud Initiative — TUI Cloud Management Dashboard

A high-performance, single-page cloud management console built with **React 18**, **TypeScript**, **Vite**, and **TanStack Query**, featuring a retro **Terminal User Interface (TUI)** aesthetic. Designed to visually emulate a terminal application—utilizing monospace typography, pixel-aligned panel borders, floating labels, dark monochrome tones, and keyboard-first navigation—while offering a modern, dynamic web application user experience.

---

## Comprehensive API Reference & Endpoint Specification

The Free Cloud Initiative dashboard communicates with backend services using a RESTful JSON API (intercepted by MSW in nonprod development environments) and a real-time WebSocket connection for interactive serial console access.

### Production Integration & Backend Architecture

The frontend is 100% ready for live database and OIDC authentication integration without requiring frontend code changes:

- **Direct Backend & Database Proxying**: Setting `VITE_APP_ENV=prod` bypasses Mock Service Worker (MSW) initialization completely. All HTTP requests to `/api/*` flow through relative endpoints and are reverse-proxied by Nginx (`proxy_pass ${API_BACKEND_URL};`) directly to the live backend service and database.
- **OIDC Authentication & Bearer Tokens**: Supplying `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID` enables strict authentication via `react-oidc-context`. Unauthenticated users are redirected to `/login`, and `AuthTokenSync` automatically injects active OIDC Bearer tokens (`Authorization: Bearer <token>`) into all outgoing Axios request headers.
- **Real-time Terminal WebSockets**: Setting `VITE_ENABLE_REAL_TERMINAL=true` connects serial console components to `ws://<host>/ws/terminal/:ceId`. Nginx reverse-proxies `/ws/` traffic using HTTP 1.1 upgrade headers (`Upgrade $http_upgrade`, `Connection "Upgrade"`).

### Master Endpoint Summary Table

| Category           | Method   | Endpoint Path                              | Description                                                                                     |
| :----------------- | :------- | :----------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Compute Engine** | `GET`    | `/api/compute-engines`                     | List all Compute Engine instances (supports `status` filter)                                    |
| **Compute Engine** | `GET`    | `/api/compute-engines/:id`                 | Fetch single Compute Engine instance by ID                                                      |
| **Compute Engine** | `POST`   | `/api/compute-engines`                     | Provision / launch a new Compute Engine instance                                                |
| **Compute Engine** | `PATCH`  | `/api/compute-engines/:id`                 | Update instance properties (status, specs, name, OS)                                            |
| **Compute Engine** | `DELETE` | `/api/compute-engines/:id`                 | Terminate / delete a Compute Engine instance                                                    |
| **Compute Engine** | `GET`    | `/api/compute-engines/:id/metrics`         | Fetch instance telemetry metrics (CPU, RAM, Disk)                                               |
| **Compute Engine** | `PATCH`  | `/api/compute-engines/:id/settings`        | Update Compute Engine configuration settings                                                    |
| **Database**       | `GET`    | `/api/databases`                           | List all database clusters (supports `status` filter)                                           |
| **Database**       | `GET`    | `/api/databases/:id`                       | Fetch single database cluster by ID                                                             |
| **Database**       | `POST`   | `/api/databases`                           | Provision a new database cluster                                                                |
| **Database**       | `PATCH`  | `/api/databases/:id`                       | Update database specs or backup status                                                          |
| **Database**       | `DELETE` | `/api/databases/:id`                       | Delete a database cluster                                                                       |
| **Database**       | `GET`    | `/api/databases/:id/metrics`               | Fetch database metrics (connections, QPS, disk I/O, CPU, RAM)                                   |
| **Database**       | `POST`   | `/api/databases/:id/execute-sql`           | Execute a SQL script via Monaco editor                                                          |
| **Database**       | `POST`   | `/api/databases/:id/import-data`           | Import data file (CSV, JSON, SQL) via multipart form                                            |
| **Database**       | `PATCH`  | `/api/databases/:id/settings`              | Update database settings                                                                        |
| **IAM**            | `GET`    | `/api/iam/users`                           | List all IAM users                                                                              |
| **IAM**            | `GET`    | `/api/iam/users/:id`                       | Fetch single IAM user with attached security policies                                           |
| **IAM**            | `POST`   | `/api/iam/users`                           | Register a new IAM user                                                                         |
| **IAM**            | `PATCH`  | `/api/iam/users/:id`                       | Update IAM user role, status, or MFA setting                                                    |
| **IAM**            | `DELETE` | `/api/iam/users/:id`                       | Remove an IAM user                                                                              |
| **IAM**            | `GET`    | `/api/iam/users/:id/activity`              | Fetch user security activity audit log                                                          |
| **IAM**            | `PATCH`  | `/api/iam/users/:id/settings`              | Update IAM user settings                                                                        |
| **Network**        | `GET`    | `/api/networks`                            | List all Virtual Private Clouds (VPCs)                                                          |
| **Network**        | `GET`    | `/api/networks/:id`                        | Fetch single VPC with subnets, firewall rules, routes & peerings                                |
| **Network**        | `POST`   | `/api/networks`                            | Provision a new VPC network                                                                     |
| **Network**        | `DELETE` | `/api/networks/:id`                        | Delete a VPC network                                                                            |
| **Network**        | `GET`    | `/api/networks/:id/firewall-rules`         | Fetch firewall security rules for a network                                                     |
| **Network**        | `POST`   | `/api/networks/:id/firewall-rules`         | Add an ingress/egress firewall security rule                                                    |
| **Network**        | `DELETE` | `/api/networks/:id/firewall-rules/:ruleId` | Delete a firewall security rule                                                                 |
| **Network**        | `PATCH`  | `/api/networks/:id/settings`               | Update network settings                                                                         |
| **Storage**        | `GET`    | `/api/buckets`                             | List all storage buckets                                                                        |
| **Storage**        | `GET`    | `/api/buckets/:id`                         | Fetch single storage bucket                                                                     |
| **Storage**        | `POST`   | `/api/buckets`                             | Provision a new storage bucket                                                                  |
| **Storage**        | `DELETE` | `/api/buckets/:id`                         | Delete a storage bucket                                                                         |
| **Storage**        | `GET`    | `/api/buckets/:id/files`                   | List object files within a bucket                                                               |
| **Storage**        | `GET`    | `/api/buckets/:id/metrics`                 | Fetch bucket storage metrics (total size, object count, ops)                                    |
| **Storage**        | `GET`    | `/api/buckets/:id/access-policies`         | Fetch IAM access policies for a bucket                                                          |
| **Storage**        | `PATCH`  | `/api/buckets/:id/settings`                | Update storage bucket settings                                                                  |
| **Account**        | `GET`    | `/api/account`                             | Fetch the current user's account settings                                                       |
| **Account**        | `PATCH`  | `/api/account/settings`                    | Update display name, email, default region, theme, session timeout, or notification preferences |
| **Account**        | `POST`   | `/api/account/api-keys`                    | Generate a new personal API key                                                                 |
| **Account**        | `DELETE` | `/api/account/api-keys/:keyId`             | Revoke a personal API key                                                                       |
| **WebSocket**      | `WS`     | `/ws/terminal/:ceId`                       | Real-time bi-directional interactive serial console stream                                      |

---

### Detailed Endpoint Parameters & Specifications

#### 1. Compute Engine APIs (`/api/compute-engines`)

##### `GET /api/compute-engines`

- **Description**: Retrieves all Compute Engine instances.
- **Query Parameters**:
  | Parameter | Type | Required | Default | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `status` | `string` | No | — | `'running'`, `'stopped'`, `'pending'` | Filter instances by current status |
- **Expected Response** (`200 OK`): Array of `ComputeEngine` objects.

```json
[
  {
    "id": "ce-1",
    "name": "web-server-prod",
    "status": "running",
    "cpu": 4,
    "memory": 16,
    "disk": 100,
    "diskType": "SSD",
    "ipAddress": "192.168.1.10",
    "os": "Ubuntu 22.04 LTS",
    "region": "ANK",
    "zone": "ANK-1",
    "createdAt": "2026-01-15T08:30:00Z"
  }
]
```

##### `GET /api/compute-engines/:id`

- **Description**: Retrieves single Compute Engine instance by ID.
- **Path Parameters**:
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | `string` | Yes | Existing Compute Engine ID (e.g. `'ce-1'`) | Instance unique identifier |
- **Expected Response**: `200 OK` with single `ComputeEngine` object, or `404 Not Found` (`{ "error": "Compute Engine not found" }`).

##### `POST /api/compute-engines`

- **Description**: Launches a new Compute Engine instance.
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Default | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `name` | `string` | Yes | — | Non-empty string (e.g. `'api-gateway-01'`) | Instance display name |
  | `cpu` | `number` | Yes | — | Integer `> 0` (e.g. `1`, `2`, `4`, `8`, `16`) | Number of CPU vCores |
  | `memory` | `number` | Yes | — | Integer `> 0` (e.g. `2`, `4`, `8`, `16`, `32`) | RAM allocation in GB |
  | `disk` | `number` | Yes | — | Integer `> 0` (e.g. `20`, `50`, `100`, `500`) | Root disk size in GB |
  | `os` | `string` | Yes | — | `'Ubuntu 22.04 LTS'`, `'Debian 12'`, `'Alpine 3.18'`, `'Fedora 38'` | Operating system image |
  | `region` | `string` | Yes | — | `'ANK'`, `'IST'` | Target cloud region |
  | `zone` | `string` | No | `'ANK-1'` / `'IST-1'` | `'ANK-1'`, `'ANK-2'`, `'IST-1'`, `'IST-2'` | Availability zone |
- **Expected Response**: `201 Created` returning created `ComputeEngine` record.

##### `PATCH /api/compute-engines/:id`

- **Description**: Partial update of Compute Engine parameters or status transition.
- **Path Parameters**: `id` (`string`, required)
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `name` | `string` | No | Non-empty string | Updated instance name |
  | `status` | `string` | No | `'running'`, `'stopped'`, `'pending'` | Lifecycle state change |
  | `cpu` | `number` | No | Integer `> 0` | Resized CPU count |
  | `memory` | `number` | No | Integer `> 0` | Resized RAM in GB |
  | `disk` | `number` | No | Integer `> 0` | Resized disk size in GB |
  | `os` | `string` | No | Valid OS string | Updated OS image |
- **Expected Response**: `200 OK` with updated `ComputeEngine`, `400 Bad Request` (invalid field name or value), or `404 Not Found`.

##### `DELETE /api/compute-engines/:id`

- **Description**: Terminates and removes a Compute Engine instance.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `204 No Content` on success, or `404 Not Found`.

##### `GET /api/compute-engines/:id/metrics`

- **Description**: Returns CPU, Memory, and Disk utilization telemetry time series.
- **Path Parameters**: `id` (`string`, required)
- **Query Parameters**:
  | Parameter | Type | Required | Default | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `range` | `string` | No | `'1h'` | `'30m'`, `'1h'`, `'3h'`, `'1w'` | Time-window range for data points |
- **Expected Response** (`200 OK`): Array of `ComputeEngineMetricPoint` objects (`timestamp`, `cpu` %, `memory` %, `disk` %).

##### `PATCH /api/compute-engines/:id/settings`

- **Description**: Updates custom key-value settings object.
- **Path Parameters**: `id` (`string`, required)
- **Request Body**: JSON object (`Record<string, unknown>`).
- **Expected Response**: `200 OK` with updated `ComputeEngine`.

---

#### 2. Database APIs (`/api/databases`)

##### `GET /api/databases`

- **Description**: Retrieves list of provisioned database instances.
- **Query Parameters**:
  | Parameter | Type | Required | Default | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `status` | `string` | No | — | `'running'`, `'stopped'`, `'pending'` | Filter database state |
- **Expected Response** (`200 OK`): Array of `Database` objects (`id`, `name`, `engine`, `version`, `status`, `cpu`, `memory`, `storageSize`, `connectionString`, `host`, `port`, `maxConnections`, `activeConnections`, `backupStatus`, `region`, `zone`, `createdAt`).

##### `GET /api/databases/:id`

- **Description**: Retrieves single database cluster by ID.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `200 OK` or `404 Not Found`.

##### `POST /api/databases`

- **Description**: Provisions a new database cluster.
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Default | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `name` | `string` | Yes | — | Non-empty string (e.g. `'db-cluster-main'`) | Database instance name |
  | `engine` | `string` | Yes | — | `'postgres'`, `'mysql'`, `'redis'` | Database engine type |
  | `version` | `string` | Yes | — | Engine version string (e.g. `'15.4'`, `'8.0'`, `'7.0'`) | Database engine version |
  | `storageSize` | `number` | Yes | — | Integer `> 0` (e.g. `20`, `50`, `200`, `1000`) | Allocated disk storage in GB |
  | `cpu` | `number` | Yes | — | Integer `> 0` | Allocated vCPUs |
  | `memory` | `number` | Yes | — | Integer `> 0` | Allocated RAM in GB |
  | `region` | `string` | Yes | — | `'ANK'`, `'IST'` | Deployment region |
  | `zone` | `string` | No | `'ANK-1'` | Zone identifier string | Availability zone |
- **Expected Response**: `201 Created` with created `Database` object.

##### `PATCH /api/databases/:id`

- **Description**: Partial update of database properties or backup status.
- **Path Parameters**: `id` (`string`, required)
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `name` | `string` | No | Non-empty string | Updated instance name |
  | `status` | `string` | No | `'running'`, `'stopped'`, `'pending'` | Database lifecycle status |
  | `cpu` | `number` | No | Integer `> 0` | Scaled vCPU count |
  | `memory` | `number` | No | Integer `> 0` | Scaled RAM in GB |
  | `storageSize` | `number` | No | Integer `> 0` | Expanded storage in GB |
  | `backupStatus` | `string` | No | `'healthy'`, `'failed'`, `'in-progress'`, `'none'` | Backup health status |
- **Expected Response**: `200 OK`, `400 Bad Request`, or `404 Not Found`.

##### `DELETE /api/databases/:id`

- **Description**: Deletes a database cluster.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `204 No Content` on success.

##### `GET /api/databases/:id/metrics`

- **Description**: Retrieves 24-point database metrics (active connections, QPS, disk I/O, CPU %, RAM %).
- **Path Parameters**: `id` (`string`, required)
- **Expected Response** (`200 OK`): Array of `DatabaseMetricPoint` objects.

##### `POST /api/databases/:id/execute-sql`

- **Description**: Runs a SQL script against the database instance.
- **Path Parameters**: `id` (`string`, required)
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `script` | `string` | Yes | Non-empty string, max 10,000 characters | SQL statements. _Note: Destructive keywords (`DROP`, `TRUNCATE`, `ALTER`, `DELETE`) are blocked._ |
- **Expected Response** (`200 OK`):

```json
{
  "success": true,
  "rowsAffected": 12,
  "resultData": [{ "id": 1, "name": "Alice", "email": "alice@example.com" }],
  "executedAt": "2026-08-13T02:00:00.000Z"
}
```

- **Error Statuses**: `400 Bad Request` (missing/oversized script), `403 Forbidden` (destructive statements rejected).

##### `POST /api/databases/:id/import-data`

- **Description**: Uploads and imports a data file (CSV, JSON, SQL) into the database.
- **Path Parameters**: `id` (`string`, required)
- **Request Body** (`multipart/form-data`):
  | Field | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `file` | `File` | Yes | Valid CSV, JSON, or SQL file (Max size: 10MB) | Form file payload |
  | `options` | `string` (JSON) | No | JSON string (`{ "tableName": "users", "delimiter": ",", "hasHeaders": true, "mode": "insert" }`) | Import settings (`mode`: `'insert'` \| `'upsert'` \| `'replace'`) |
- **Expected Response** (`200 OK`): `{ "success": true, "rowsImported": 500 }` for CSV/JSON, or `{ "success": true }` for SQL.
- **SQL behavior**: `.sql` files run atomically in a managed transaction. Import options are ignored; transaction-control statements, psql meta-commands, and `COPY FROM STDIN` are rejected.

##### `PATCH /api/databases/:id/settings`

- **Description**: Updates database configuration settings.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `200 OK`.

---

#### 3. IAM APIs (`/api/iam/users`)

##### `GET /api/iam/users`

- **Description**: Retrieves all IAM user accounts.
- **Expected Response** (`200 OK`): Array of `IamUser` objects (`id`, `name`, `email`, `status`, `role`, `lastLogin`, `mfaEnabled`, `region`, `zone`, `createdAt`).

##### `GET /api/iam/users/:id`

- **Description**: Retrieves single user details including attached policy bindings and permissions.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response** (`200 OK`): `IamUserWithPolicies` containing embedded `policies` list with granular `permissions` (`resource`, `action`, `effect` (`'allow'`|`'deny'`), `condition`).

##### `POST /api/iam/users`

- **Description**: Registers a new IAM user account.
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `name` | `string` | Yes | Non-empty string | User full name |
  | `email` | `string` | Yes | Valid email string (containing `@`) | User email address |
  | `role` | `string` | Yes | `'admin'`, `'editor'`, `'viewer'`, `'auditor'` | Role-Based Access Control (RBAC) role |
- **Expected Response**: `201 Created` with created `IamUser`.

##### `PATCH /api/iam/users/:id`

- **Description**: Modifies user account status, RBAC role, or MFA status.
- **Path Parameters**: `id` (`string`, required)
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `status` | `string` | No | `'active'`, `'disabled'`, `'locked'` | User account state |
  | `role` | `string` | No | `'admin'`, `'editor'`, `'viewer'`, `'auditor'` | Assigned RBAC role |
  | `mfaEnabled` | `boolean` | No | `true`, `false` | Multi-Factor Authentication flag |
- **Expected Response**: `200 OK`, `400 Bad Request`, or `404 Not Found`.

##### `DELETE /api/iam/users/:id`

- **Description**: Deletes an IAM user account.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `204 No Content`.

##### `GET /api/iam/users/:id/activity`

- **Description**: Fetches user activity audit log history.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response** (`200 OK`): Array of `IamActivityEntry` objects (`id`, `timestamp`, `action`, `resource`, `status` (`'success'`|`'failed'`)).

##### `PATCH /api/iam/users/:id/settings`

- **Description**: Updates user settings configuration.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `200 OK`.

---

#### 4. Network APIs (`/api/networks`)

##### `GET /api/networks`

- **Description**: Retrieves all VPC networks.
- **Expected Response** (`200 OK`): Array of `Network` objects (`id`, `vpcName`, `cidrBlock`, `type`, `status`, `gateway`, `region`, `zone`, `firewallRules`, `routes`, `peerings`, `createdAt`).

##### `GET /api/networks/:id`

- **Description**: Retrieves single network details with nested firewall rules, route tables, and VPC peerings.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `200 OK` or `404 Not Found`.

##### `POST /api/networks`

- **Description**: Provisions a new VPC network.
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Default | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `vpcName` | `string` | Yes | — | Non-empty string (e.g. `'vpc-production'`) | Name of the VPC network |
  | `cidrBlock` | `string` | Yes | — | Valid IPv4 CIDR string (e.g. `'10.0.0.0/16'`, `'172.16.0.0/12'`) | IP address space allocation |
  | `type` | `string` | Yes | — | `'vpc'`, `'subnet'`, `'public'` | Network architecture type |
  | `region` | `string` | No | `'ANK'` | `'ANK'`, `'IST'` | Deployment region |
  | `zone` | `string` | No | `'ANK-1'` | Availability zone string | Availability zone |
- **Expected Response**: `201 Created` returning created `Network` object.

##### `DELETE /api/networks/:id`

- **Description**: Deletes a VPC network.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `204 No Content`.

##### `GET /api/networks/:id/firewall-rules`

- **Description**: Lists firewall security rules configured for a specific network.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response** (`200 OK`): Array of `FirewallRule` objects.

##### `POST /api/networks/:id/firewall-rules`

- **Description**: Adds an ingress or egress firewall rule to a network.
- **Path Parameters**: `id` (`string`, required)
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `name` | `string` | Yes | Non-empty string (e.g. `'allow-http'`) | Rule name descriptor |
  | `direction` | `string` | Yes | `'ingress'`, `'egress'` | Traffic direction |
  | `protocol` | `string` | Yes | `'tcp'`, `'udp'`, `'icmp'`, `'all'` | Transport protocol |
  | `portRange` | `string` | Yes | String (e.g. `'80'`, `'443'`, `'8000-8080'`, `'all'`) | Targeted port range |
  | `source` | `string` | Yes | IPv4 / CIDR string (e.g. `'0.0.0.0/0'`, `'10.0.0.0/8'`) | Source traffic CIDR origin |
  | `action` | `string` | Yes | `'allow'`, `'deny'` | Rule enforcement action |
- **Expected Response**: `201 Created` returning created `FirewallRule` object.

##### `DELETE /api/networks/:id/firewall-rules/:ruleId`

- **Description**: Removes a firewall security rule from a network.
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `id` | `string` | Yes | Network VPC ID |
  | `ruleId` | `string` | Yes | Firewall Rule ID to delete |
- **Expected Response**: `204 No Content` on success, or `404 Not Found`.

##### `PATCH /api/networks/:id/settings`

- **Description**: Updates network settings configuration.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `200 OK`.

---

#### 5. Storage APIs (`/api/buckets`)

##### `GET /api/buckets`

- **Description**: Retrieves all S3-compatible storage buckets.
- **Expected Response** (`200 OK`): Array of `Bucket` objects (`id`, `bucketName`, `totalSize`, `objectCount`, `region`, `zone`, `access`, `versioning`, `lifecycleEnabled`, `status`, `createdAt`).

##### `GET /api/buckets/:id`

- **Description**: Retrieves single bucket details.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `200 OK` or `404 Not Found`.

##### `POST /api/buckets`

- **Description**: Provisions a new storage bucket.
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `bucketName` | `string` | Yes | Lowercase alphanumeric with hyphens/dots (`/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/`) | Bucket unique identifier |
  | `region` | `string` | Yes | Non-empty region code string (e.g. `'ANK'`, `'IST'`) | Storage region |
  | `access` | `string` | Yes | `'private'`, `'public-read'`, `'public-read-write'` | Bucket access permissions tier |
  | `zone` | `string` | No | Availability zone string | Storage zone |
- **Expected Response**: `201 Created` returning created `Bucket` object.

##### `DELETE /api/buckets/:id`

- **Description**: Deletes a storage bucket.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `204 No Content`.

##### `GET /api/buckets/:id/files`

- **Description**: Lists object files stored within a bucket.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response** (`200 OK`): Array of `StorageFile` objects (`id`, `bucketId`, `key`, `size`, `contentType`, `storageClass` (`'standard'` \| `'nearline'` \| `'coldline'` \| `'archive'`), `lastModified`).

##### `GET /api/buckets/:id/metrics`

- **Description**: Retrieves 24-hour time series storage telemetry (total size in bytes, object count, read ops, write ops).
- **Path Parameters**: `id` (`string`, required)
- **Expected Response** (`200 OK`): Array of `StorageMetricPoint` objects.

##### `GET /api/buckets/:id/access-policies`

- **Description**: Retrieves IAM access control policies attached to a bucket.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response** (`200 OK`): Array of `BucketAccessPolicy` objects (`id`, `principal`, `permission` (`'roles/storage.objectViewer'` \| `'roles/storage.objectAdmin'` \| `'roles/storage.admin'`), `resource`, `createdAt`).

##### `PATCH /api/buckets/:id/settings`

- **Description**: Updates storage bucket configuration settings.
- **Path Parameters**: `id` (`string`, required)
- **Expected Response**: `200 OK`.

---

#### 6. User Account APIs (`/api/account`)

##### `GET /api/account`

- **Description**: Retrieves the current user's account settings and API keys.
- **Expected Response** (`200 OK`): `AccountSettings` object:
  ```json
  {
    "id": "me",
    "displayName": "root",
    "email": "root@freecloudinitiative.dev",
    "defaultRegion": "IST",
    "theme": "default",
    "sessionTimeoutMinutes": 60,
    "notifications": { "emailAlerts": true, "weeklyDigest": false },
    "apiKeys": [
      {
        "id": "…",
        "name": "ci-deploy-key",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "lastFour": "a1b2"
      }
    ]
  }
  ```

##### `PATCH /api/account/settings`

- **Description**: Updates the current user's account settings. All fields are optional; only provided fields are persisted.
- **Request Body** (`application/json`):
  | Parameter | Type | Required | Default | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `displayName` | `string` | No | — | Any non-empty string | User's display name |
  | `email` | `string` | No | — | Valid email string | User's email address |
  | `defaultRegion` | `string` | No | `'IST'` | `'ANK'`, `'IST'` | Default region for new resources |
  | `theme` | `string` | No | `'default'` | `'default'`, `'beige'`, `'mono'`, `'navy'` | Preferred visual theme |
  | `sessionTimeoutMinutes` | `number` | No | `60` | `15`, `30`, `60`, `120`, `240` | Idle session timeout in minutes |
  | `notifications` | `object` | No | — | `{ emailAlerts: boolean, weeklyDigest: boolean }` | Notification preferences |
- **Expected Response** (`200 OK`): Updated `AccountSettings` object.

##### `POST /api/account/api-keys`

- **Description**: Generates a new personal API key. The plaintext secret is only returned once, in this response.
- **Request Body** (`application/json`): `{ "name": "string (required)" }`
- **Expected Response** (`201 Created`):
  ```json
  {
    "apiKey": {
      "id": "…",
      "name": "ci-deploy-key",
      "createdAt": "…",
      "lastFour": "a1b2"
    },
    "plaintextSecret": "fci_…",
    "apiKeys": ["…"]
  }
  ```

##### `DELETE /api/account/api-keys/:keyId`

- **Description**: Revokes a personal API key.
- **Path Parameters**: `keyId` (`string`, required)
- **Expected Response**: `200 OK` with `{ "apiKeys": [...] }`, or `404 Not Found`.

---

#### 7. Interactive WebSocket Serial Console Stream

##### `WS /ws/terminal/:ceId`

- **Description**: Establishes a full-duplex interactive WebSocket stream powering the Xterm.js terminal emulator for serial console access to a Compute Engine instance.
- **URL Pattern**: `ws://<host>/ws/terminal/:ceId` (Default base: `ws://localhost:8080`, configured via `VITE_WS_BASE_URL`).
- **Path Parameters**:
  | Parameter | Type | Required | Allowed / Expected Values | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `ceId` | `string` | Yes | Valid Compute Engine ID (e.g. `'ce-1'`) | Target Compute Engine instance ID |
- **Client Connection Options**:
  | Option | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `reconnect` | `boolean` | `true` | Enables automatic reconnection logic on unexpected socket drop |
  | `maxRetries` | `number` | `3` | Maximum retry attempts with exponential backoff (1s, 2s, 4s...) before falling back to local mock shell |
- **Frame Message Formats**:
  - **Client -> Server Data Stream**: Raw string containing user keystrokes / terminal commands (e.g. `ls -la\n`).
  - **Server -> Client Data Stream**: Raw string containing terminal stdout/stderr stream with VT100/ANSI escape sequences for screen rendering.

---

### Docker Build & Process Overview (`nonprod` vs `prod`)

The application supports two primary container build configurations via the `VITE_APP_ENV` build argument:

#### 1. Non-Production / Local Demo Build (`VITE_APP_ENV=nonprod`)

- **MSW Status**: Enabled (Mock Service Worker intercepts all `/api/*` requests in-browser and serves seeded dummy datasets).
- **Backend Dependency**: None required (runs fully stand-alone without a live backend database).
- **Use Case**: Local development, demo environments, visual design testing.

```bash
# Build Non-Production Docker Image
docker build --build-arg VITE_APP_ENV=nonprod -t fci-frontend:nonprod .

# Run Non-Production Container
docker run -d --name fci-dashboard-nonprod -p 8080:80 fci-frontend:nonprod
```

#### 2. Production Build (`VITE_APP_ENV=prod`)

- **MSW Status**: Bypassed (MSW worker initialization is completely disabled at startup).
- **Backend Dependency**: Live Backend API & Database required (Nginx reverse-proxies `/api/` traffic directly to `API_BACKEND_URL`).
- **Authentication**: OIDC (Authentik) strictly enforced when `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID` are supplied.
- **Use Case**: Live staging and production deployments.

```bash
# Build Production Docker Image
docker build \
  --build-arg VITE_APP_ENV=prod \
  --build-arg VITE_API_BASE_URL= \
  --build-arg VITE_OIDC_AUTHORITY=https://auth.example.com/application/o/fci/ \
  --build-arg VITE_OIDC_CLIENT_ID=fci-dashboard-client \
  --build-arg VITE_OIDC_REDIRECT_URI=https://console.example.com/callback \
  --build-arg VITE_WS_BASE_URL=wss://console.example.com \
  --build-arg VITE_ENABLE_REAL_TERMINAL=true \
  -t fci-frontend:prod .

# Run Production Container with Nginx Backend Network Proxy
docker network create fci-net

docker run -d \
  --name fci-dashboard-prod \
  -p 8080:80 \
  --network fci-net \
  -e API_BACKEND_URL=http://backend-service:8080 \
  fci-frontend:prod
```

---

## Technical Overview & Core Architecture

The Free Cloud Initiative (FCI) dashboard provides full lifecycle control over 7 cloud services (**Virtual Machines**, **Database**, **IAM**, **Storage**, **Network**, **Load Balancer**, and **Kubernetes**). The client operates statefully in-browser via **Mock Service Worker (MSW)** while supporting live backend WebSocket connections for interactive terminal streaming and Authentik OIDC authentication.

```text
               ┌──────────────────────────────────────────────────────────┐
               │              React 18 SPA Shell (Vite)                   │
               │   React Router v6 (/dashboard, /services/:service/:tab)  │
               └────────────────────────────┬─────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │                                  │                                  │
┌────────▼────────┐                ┌────────▼────────┐                ┌────────▼────────┐
│ TanStack Query  │                │  Zustand Stores │                │  React-OIDC     │
│  (Server State) │                │  (Theme/Toast)  │                │   (Authentik)   │
└────────┬────────┘                └────────┬────────┘                └────────┬────────┘
         │                                  │                                  │
         │ Axios HTTP Interceptor           │ DOM Theme Attribute              │ Bearer Auth
┌────────▼────────┐                         │                                  │
│ In-Browser MSW  │                         │                                  │
│  REST API Engine│                         │                                  │
└─────────────────┘                         └──────────────────────────────────┘
```

### Key Architectural Subsystems & Deep Dive

1. **Flat Routing & Workspace Navigation**:
   - Implemented using React Router v6 in [`src/app/router.tsx`](src/app/router.tsx).
   - Routes follow a flat structure: `/dashboard` (overview summary), `/services/:serviceId/:tab` (main tabbed service view), `/services/compute-engine/instances/:id` (standalone Compute Engine detail page), `/console/:computeEngineName` (full-screen standalone serial terminal), `/login` & `/callback` (OIDC authentication flow), and `/ui-preview` (legacy component preview sandbox).
   - Page components are code-split using `React.lazy()` and wrapped in `<Suspense fallback={<RouteFallback />}>` using the blinking [`DashboardLoading`](src/features/dashboard/DashboardLoading.tsx) skeleton.

2. **Server State & In-Browser MSW Mock Engine**:
   - HTTP requests are intercepted in-browser using Mock Service Worker ([`src/mocks/browser.ts`](src/mocks/browser.ts), [`src/mocks/handlers/`](src/mocks/handlers)).
   - Simulated network latency (300–600ms) mimics real-world backend responses.
   - Handlers utilize generic factory utilities ([`src/mocks/handlers/utils.ts`](src/mocks/handlers/utils.ts)) like `createGetByIdHandler`, `createDeleteHandler`, and `createSettingsPatchHandler` to eliminate endpoint boilerplate across all services.
   - Server state caching, optimistic updates, and background revalidations are managed by TanStack Query ([`@tanstack/react-query`](src/features/computeEngine/hooks.ts)).

3. **TUI CSS Design System & Dynamic 4-Theme Engine**:
   - Custom CSS design system in [`src/pages/tui-dashboard.css`](src/pages/tui-dashboard.css) utilizing the `fci-` class namespace.
   - Core visual tokens: pure black background (`#000000`), muted blue borders (`#3a6ea5`), amber top-floating box labels (`#e8a020`), off-white body text (`#dcdcdc`), and monospace font stack (`'Courier New', Courier, monospace`).
   - Supports 4 switchable color themes (`default`, `beige`, `mono`, `navy`) managed by Zustand ([`src/store/themeStore.ts`](src/store/themeStore.ts)) and synchronized to the root element's `data-theme` attribute.
   - Programmatic theme colors for Recharts time-series graphs and Xterm.js terminal sessions are mapped via [`DASH_COLORS`](src/lib/tui-theme.ts).

4. **Dual-Mode Interactive Terminal Emulator**:
   - Serial console built with Xterm.js (`@xterm/xterm`, `@xterm/addon-fit`, `ResizeObserver`) in [`TerminalView.tsx`](src/components/terminal/TerminalView.tsx).
   - **Mock Shell Mode**: Executes commands via [`mockShell.ts`](src/components/terminal/mockShell.ts) (`help`, `ls`, `uname -a`, `df -h`, `free -m`, `uptime`, `clear`).
   - **Real WebSocket Mode**: Managed by [`TerminalWebSocket`](src/lib/websocket.ts) connecting to `ws://<host>/ws/terminal/:ceId`. Features exponential backoff retries (max 3 retries), connection state indicators, and automatic fallback to mock shell mode upon retry exhaustion. Gated by `VITE_ENABLE_REAL_TERMINAL`.

5. **Database SQL Editor & Multi-Format Data Importer**:
   - Embedded `@monaco-editor/react` editor in [`SqlEditor.tsx`](src/components/editor/SqlEditor.tsx) with custom syntax theme `fci-sql-dark`.
   - SQL query result sets rendered in [`QueryResultPanel.tsx`](src/components/database/QueryResultPanel.tsx) using TanStack Table.
   - Drag-and-drop file uploader [`DataImportPanel.tsx`](src/components/database/DataImportPanel.tsx) supporting CSV, JSON, and SQL file previewing via [`fileParser.ts`](src/utils/fileParser.ts) and schema/size validation via [`fileValidator.ts`](src/utils/fileValidator.ts).

6. **Single-Scroll Tabular Data Engine (`DataTable.tsx`)**:
   - Generic table component [`DataTable.tsx`](src/features/dashboard/DataTable.tsx) wrapping `@tanstack/react-table`.
   - Features 2-state ▲/▼ column sorting (`getSortedRowModel`), table global filtering (`getFilteredRowModel`), selected row highlighting, and custom action delegates (`renderActions`).
   - Displays all items in a single view with vertical scrolling via `.fci-itemslist` under `.fci-itemsbox`, eliminating pagination overhead.
   - Column definitions ([`src/features/dashboard/columns.ts`](src/features/dashboard/columns.ts)) provide service-tailored header sets for Compute Engine, Database, IAM, Network, Storage, Load Balancer, and Kubernetes.

7. **WAI-ARIA Accessibility & Focus Trapping**:
   - Custom dropdowns ([`RegionSelector.tsx`](src/features/dashboard/RegionSelector.tsx), [`ProfileMenu.tsx`](src/features/dashboard/ProfileMenu.tsx), [`ServiceSearchGrid.tsx`](src/features/dashboard/ServiceSearchGrid.tsx)) implement full WAI-ARIA `listbox`, `menu`, and `combobox` patterns with arrow key navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`).
   - Portal modals ([`DashboardModal.tsx`](src/features/dashboard/DashboardModal.tsx), [`CommandPalette.tsx`](src/features/dashboard/CommandPalette.tsx)) feature document-level focus trapping and `invokerRef` focus restoration upon closing.
   - Verified automated zero-violation accessibility checks using `vitest-axe` ([`DataTable.a11y.test.tsx`](src/features/dashboard/__tests__/DataTable.a11y.test.tsx), [`DashboardModal.a11y.test.tsx`](src/features/dashboard/__tests__/DashboardModal.a11y.test.tsx), etc.).

8. **OIDC Authentik Authentication & Request Interception**:
   - OIDC integration managed by `react-oidc-context` in [`src/lib/oidc.ts`](src/lib/oidc.ts).
   - Unauthenticated access is blocked by [`ProtectedRoute.tsx`](src/components/auth/ProtectedRoute.tsx), redirecting to [`LoginPage.tsx`](src/pages/LoginPage.tsx) while preserving destination parameters.
   - [`AuthTokenSync.tsx`](src/components/auth/AuthTokenSync.tsx) listens to active authentication state and automatically injects `Authorization: Bearer <token>` headers into centralized Axios requests ([`src/lib/axios.ts`](src/lib/axios.ts)).

9. **Toast Notifications & Keyboard Shortcut System**:
   - Mutation notifications managed by Zustand store [`toastStore.ts`](src/store/toastStore.ts) and rendered via React Portal in [`Toast.tsx`](src/features/dashboard/Toast.tsx) (`role="alert"`, `aria-live="assertive"`, 3000ms auto-dismiss).
   - Keyboard listener [`useKeyboardShortcuts.ts`](src/hooks/useKeyboardShortcuts.ts) handles `/` or `a` to open command palette, `Ctrl+S` search focus, `Ctrl+C` copy row name, `Ctrl+D` delete confirmation, `Ctrl+I` Info tab navigation, and single-key hotkeys (`c`, `d`, `i`, `n`, `s`, `l`, `k`).

---

## Tech Stack & Dependencies

| Layer                  | Technology                                      | Description                                                             |
| :--------------------- | :---------------------------------------------- | :---------------------------------------------------------------------- |
| **Framework & Build**  | Vite, React 18, TypeScript (Strict Mode)        | Lightning-fast HMR and bundle compilation                               |
| **Routing**            | React Router DOM v6                             | Flat service routing, code-splitting with `React.lazy()` & `<Suspense>` |
| **Server State**       | TanStack Query v5 (`@tanstack/react-query`)     | Query caching, invalidation, mutation lifecycle                         |
| **Client UI State**    | Zustand                                         | Light-weight state stores for theme selection and toast queue           |
| **Tabular Data**       | TanStack Table v8 (`@tanstack/react-table`)     | High-performance sorting, filtering, single-scroll tables               |
| **Terminal Emulator**  | Xterm.js (`@xterm/xterm`, `@xterm/addon-fit`)   | Canvas-based serial terminal emulator with auto-resize                  |
| **Code Editor**        | Monaco Editor (`@monaco-editor/react`)          | Full SQL editor with custom dark TUI syntax highlighting                |
| **Metrics & Charts**   | Recharts                                        | Responsive time-series CPU, RAM, Disk, and Network IO visualizations    |
| **API Mocking & HTTP** | MSW (Mock Service Worker), Axios                | In-browser HTTP interception with Faker-seeded datasets                 |
| **Authentication**     | `react-oidc-context` (OIDC / OAuth2)            | Authentik integration with automatic token sync                         |
| **Testing & Linting**  | Vitest, Testing Library, `vitest-axe`, Oxlint   | Integration tests, automated ARIA accessibility tests, fast linter      |
| **Styling**            | Vanilla CSS (`tui-dashboard.css`), Tailwind CSS | Custom TUI CSS variable design tokens and layout utility                |

---

## Supported Cloud Services

FCI provides dedicated workspace views, live metrics, tabbed operations, and settings for 7 cloud domains:

1. **Compute Engine (CE)**: Instance lifecycle management (launch, stop, reboot, delete), real-time resource usage metrics (CPU, Memory, Disk IO, Network IO), inline Xterm.js console, standalone full-screen terminal, and Compute Engine settings.
2. **Database (DB)**: PostgreSQL/MySQL/Redis database instance management, active connection parameters, automated backups, Monaco SQL code editor, drag-and-drop CSV/JSON/SQL file importer, metrics, and database settings.
3. **IAM (Identity & Access Management)**: User management, role assignment, granular policy matrix, MFA status tracking, activity audit trail, and security settings.
4. **Storage (Object Storage)**: S3-compatible bucket creation, object file browser, file upload simulation, access policies, byte usage formatting, metric charts, and bucket settings.
5. **Network (VPC & Security)**: Virtual Private Cloud management, subnets, nested firewall security rules with ALLOW/DENY status pills, routing tables, VPC peering connections, CIDR validation, and network settings.
6. **Load Balancer (LB)**: Target groups, health check rules, and listener configuration (Coming Soon workspace).
7. **Kubernetes (K8s)**: Container cluster monitoring, pod deployment status, and node pool controls (Coming Soon workspace).

---

## Project Structure & File Map

```text
src/
├── app/
│   ├── providers.tsx               # QueryClientProvider, AuthProvider, ThemeProvider wrappers
│   ├── router.tsx                  # React Router routes (/dashboard, /services/:serviceId/:tab, etc.)
│   └── UiPreview.tsx               # Legacy component UI sandbox route (/ui-preview)
├── components/
│   ├── auth/
│   │   ├── AuthTokenSync.tsx       # Syncs OIDC auth token with Axios request headers
│   │   └── ProtectedRoute.tsx      # Route guard enforcing authentication
│   ├── database/
│   │   ├── DataImportPanel.tsx     # Drag-and-drop file upload & preview component
│   │   └── QueryResultPanel.tsx    # TanStack table component for SQL query execution results
│   ├── editor/
│   │   └── SqlEditor.tsx           # Lazy-loaded Monaco SQL editor with custom fci-sql-dark theme
│   ├── terminal/
│   │   ├── TerminalView.tsx        # Xterm.js canvas wrapper supporting WebSocket & mock modes
│   │   └── mockShell.ts            # Fake shell command interpreter (ls, uname, df, free, etc.)
│   └── ui/                         # Shared UI primitives (Panel, Button, StatusBadge, IconButton)
├── features/
│   ├── dashboard/
│   │   ├── actions/                # Per-service table row action components (ComputeEngineRowActions, etc.)
│   │   ├── tabs/                   # Tab content components (ComputeEngineTabContent, DatabaseTabContent, NetworkMapTab, etc.)
│   │   ├── columns.ts              # @tanstack/react-table column definitions per service
│   │   ├── CommandPalette.tsx      # WAI-ARIA accessible global command palette modal
│   │   ├── DashboardLoading.tsx    # Blinking TUI skeleton loading indicator
│   │   ├── DashboardModal.tsx      # Accessible portal modal with focus trap & restoration
│   │   ├── DashboardOverview.tsx   # Overview summary page (/dashboard grid)
│   │   ├── DataTable.tsx           # Reusable single-scroll @tanstack/react-table component
│   │   ├── GlobalSearchOverlay.tsx # Cross-service search result overlay dropdown
│   │   ├── TopBar.tsx              # Dashboard control bar (service switcher, search, profile, region)
│   │   └── Toast.tsx               # Self-contained toast notification component & portal container
│   ├── database/                   # Database data layer (api.ts, hooks.ts, types.ts, pages, sections)
│   ├── iam/                        # IAM data layer (api.ts, hooks.ts, types.ts)
│   ├── network/                    # Network data layer (api.ts, hooks.ts, types.ts)
│   ├── storage/                    # Storage data layer (api.ts, hooks.ts, types.ts)
│   └── computeEngine/              # Compute Engine data layer (api.ts, hooks.ts, types.ts, pages)
├── hooks/
│   ├── useGlobalSearch.ts          # Unified client-side cross-service search hook
│   ├── useIsMobile.ts              # Responsive viewport breakpoint detection hook
│   └── useKeyboardShortcuts.ts     # Global keyboard shortcut binding listener
├── lib/
│   ├── axios.ts                    # Centralized Axios instance with auth interceptors
│   ├── mockServiceData.ts          # Default service status codes, colors, and dataset types
│   ├── oidc.ts                     # OIDC client configuration helper
│   ├── tui-theme.ts                # Theme token color mapping constants (DASH_COLORS)
│   └── websocket.ts                # Resilient WebSocket connection manager with backoff retries
├── mocks/
│   ├── browser.ts                  # MSW worker initialization
│   ├── data/                       # In-memory stores seeded with Faker data
│   └── handlers/                   # Service MSW endpoints & generic handler factories (utils.ts)
├── pages/
│   ├── DashboardPage.tsx           # Main single-page TUI dashboard container
│   ├── ErrorPage.tsx               # React Router error boundary view
│   ├── LoginPage.tsx               # TUI login view for OIDC authentication
│   ├── NotFoundPage.tsx            # Retro TUI 404 page
│   ├── StandaloneConsolePage.tsx   # Dedicated full-screen Compute Engine serial terminal view
│   └── tui-dashboard.css           # Core FCI design system styles & theme tokens
├── store/
│   ├── themeStore.ts               # Zustand store managing theme selection (default, beige, mono, navy)
│   └── toastStore.ts               # Zustand store managing toast notifications
└── utils/
    ├── fileParser.ts               # Async parser for CSV, JSON, and SQL file previewing
    └── fileValidator.ts            # File import validation utilities
```

---

## Detailed PR Implementation Log (PRs #1–#41)

### Sprint 1 & 2 — Architecture, Design System & Virtual Machine Subsystem

#### PR #1 — `chore: project setup, router & base dependencies`

- **File Changes**: `package.json`, `src/main.tsx`, `src/app/router.tsx`, `src/app/providers.tsx`.
- **Details**: Initialized React 18 with Vite, TypeScript in strict mode, and React Router v6. Configured `QueryClientProvider` and root navigation skeleton.

#### PR #2 — `feat: TUI design system & main dashboard grid layout`

- **File Changes**: `src/pages/tui-dashboard.css`, `src/pages/DashboardPage.tsx`.
- **Details**: Established core TUI CSS properties (`--dash-*`) under `.fci-` namespace. Created dark terminal layout featuring top service buttons, items list box, detail panel, and monospace fonts.

#### PR #3 — `feat: dynamic theme engine with Zustand`

- **File Changes**: `src/store/themeStore.ts`, `src/components/ThemeSwitcher.tsx`.
- **Details**: Created Zustand theme store managing 4 themes (`default`, `beige`, `mono`, `navy`), syncing active selection directly to document root `data-theme`.

#### PR #4 — `feat: Compute Engine data layer & MSW mock REST API`

- **File Changes**: `src/mocks/data/computeEngines.ts`, `src/mocks/handlers/computeEngine.ts`, `src/features/computeEngine/types.ts`, `src/features/computeEngine/api.ts`, `src/features/computeEngine/hooks.ts`.
- **Details**: Built Faker-seeded in-memory Compute Engine store supporting stateful REST endpoints (`GET/POST/PATCH/DELETE /api/compute-engines`) with simulated network delay.

#### PR #5 — `feat: wire Compute Engine items table and detail panel`

- **File Changes**: `src/pages/DashboardPage.tsx`.
- **Details**: Wired `useComputeEngines` hook to the dashboard items list. Enabled row selection updating the right-hand detail panel with active instance properties.

#### PR #6 — `feat: Compute Engine instance mutations (launch, stop, reboot, delete)`

- **File Changes**: `src/features/computeEngine/hooks.ts`, `src/pages/DashboardPage.tsx`.
- **Details**: Integrated status lifecycle mutations (`useUpdateComputeEngine`, `useDeleteComputeEngine`, `useCreateComputeEngine`) into context menus and action buttons.

#### PR #7 — `feat: Compute Engine metrics visualization with Recharts & AsciiProgressBar`

- **File Changes**: `src/components/ui/AsciiProgressBar.tsx`, `src/features/dashboard/tabs/ComputeEngineMetricsTab.tsx`.
- **Details**: Created ASCII progress bar component (█ filled, ░ empty) and integrated Recharts `LineChart` graphing CPU, RAM, Disk, and Network IO across customizable time ranges.

#### PR #8 — `feat: interactive Xterm.js serial terminal emulator`

- **File Changes**: `src/components/terminal/TerminalView.tsx`, `src/components/terminal/mockShell.ts`.
- **Details**: Built `@xterm/xterm` canvas wrapper with `@xterm/addon-fit` and `ResizeObserver`. Created interactive `mockShell` executing shell commands (`ls`, `uname -a`, `df -h`, `free -m`, `uptime`, `clear`).

#### PR #9 — `feat: Compute Engine instance creation form and standalone detail view`

- **File Changes**: `src/features/computeEngine/pages/ComputeEngineCreateForm.tsx`, `src/features/computeEngine/pages/ComputeEngineDetailPage.tsx`, `src/pages/StandaloneConsolePage.tsx`.
- **Details**: Created inline creation form `ComputeEngineCreateForm.tsx`, dedicated instance view `ComputeEngineDetailPage.tsx` (`/services/compute-engine/instances/:id`), and standalone console view `StandaloneConsolePage.tsx`.

#### PR #10 — `refactor: extract TabContent into per-service components`

- **File Changes**: `src/features/dashboard/tabs/` (`ComputeEngineTabContent.tsx`, `DatabaseTabContent.tsx`, `IamTabContent.tsx`, `NetworkTabContent.tsx`, `StorageTabContent.tsx`).
- **Details**: Refactored monolithic tab section into clean per-service tab components.

#### PR #11–#14 — `feat: Compute Engine tab wiring, metrics refinement, and console integration`

- **File Changes**: `src/features/dashboard/tabs/ComputeEngineTabContent.tsx`, `src/features/computeEngine/hooks.ts`.
- **Details**: Finalized Compute Engine sub-tabs (Console, Storage, Network, Backups, Metrics), wired live time-range selectors (`30m`, `1h`, `3h`, `1w`), and bound terminal sessions to active Compute Engine instances.

---

### Sprint 3 — Database, IAM, Storage & Network Service Data Layers

#### PR #15 & #16 — `feat: Database service — data layer, MSW API & live tab wiring`

- **File Changes**: `src/mocks/data/databases.ts`, `src/mocks/handlers/database.ts`, `src/features/database/` (`types.ts`, `api.ts`, `hooks.ts`, `pages/DatabaseCreateForm.tsx`).
- **Details**: Built database store supporting PostgreSQL, MySQL, and Redis engines. Implemented endpoints (`/api/databases`) and React Query hooks (`useDatabases`, `useCreateDatabase`, `useDeleteDatabase`). Wired Info, Details, Metrics, Backups, Connections, SQL Editor, and Data Import tabs.

#### PR #17 — `feat: SQL Editor with Monaco & CSV/JSON/SQL file import engine`

- **File Changes**: `src/components/editor/SqlEditor.tsx`, `src/components/database/QueryResultPanel.tsx`, `src/components/database/DataImportPanel.tsx`, `src/utils/fileParser.ts`, `src/utils/fileValidator.ts`.
- **Details**: Embedded Monaco Editor with custom dark TUI theme (`fci-sql-dark`). Built TanStack Table query result viewer and drag-and-drop file import engine with client-side parsing and schema validation.

#### PR #18 & #19 — `feat: IAM service — data layer, MSW API & live tab wiring`

- **File Changes**: `src/mocks/data/iam.ts`, `src/mocks/handlers/iam.ts`, `src/features/iam/` (`types.ts`, `api.ts`, `hooks.ts`), `src/features/dashboard/tabs/IamTabContent.tsx`.
- **Details**: Built IAM user, role, and policy data structures. Added MSW endpoints (`/api/iam/users`, `/api/iam/roles`, `/api/iam/policies`) and wired Permissions matrix, Policies grid, and Activity audit log.

#### PR #20 & #21 — `feat: Storage service — data layer, MSW API & live tab wiring`

- **File Changes**: `src/mocks/data/storage.ts`, `src/mocks/handlers/storage.ts`, `src/features/storage/` (`types.ts`, `api.ts`, `hooks.ts`), `src/features/dashboard/tabs/StorageTabContent.tsx`.
- **Details**: Built S3-compatible bucket and object browser data layer. Implemented bucket creation, file upload simulation, policy updates, byte size formatting (`KB`, `MB`, `GB`), and metrics.

#### PR #22 & #23 — `feat: Network service — data layer, MSW API & live tab wiring`

- **File Changes**: `src/mocks/data/network.ts`, `src/mocks/handlers/network.ts`, `src/features/network/` (`types.ts`, `api.ts`, `hooks.ts`), `src/features/dashboard/tabs/NetworkTabContent.tsx`.
- **Details**: Created VPC, subnet, firewall security rule, route table, and VPC peering data layer. Added color-coded `ALLOW` (green) / `DENY` (red) status pills and IPv4 CIDR validation.

---

### Sprint 4 — Polish, Auth, Styling Consolidation & Table Migration

#### PR #24 — `fix: consolidate dual styling system and remove dead code`

- **File Changes**: Deleted `src/App.tsx`, updated `src/lib/tui-theme.ts`, `src/features/computeEngine/pages/ComputeEngineDetailPage.tsx`, annotated `src/components/ui/`.
- **Details**: Removed dead wrapper `App.tsx`. Added `DASH_COLORS` theme constants for Recharts/Xterm. Migrated `ComputeEngineDetailPage.tsx` to pure `fci-` CSS layout with theme support and expanded metadata.

#### PR #25 — `feat: toast/notification system for mutations`

- **File Changes**: `src/store/toastStore.ts`, `src/features/dashboard/Toast.tsx`, `src/pages/tui-dashboard.css`.
- **Details**: Created Zustand `toastStore.ts` and accessible portal container `Toast.tsx` (`role="alert"`, `aria-live="assertive"`, 3000ms auto-dismiss). Added slide-in CSS keyframe animations and integrated toast feedback across all forms and modal actions.

#### PR #26 — `feat: Dashboard responsive layout (mobile/tablet)`

- **File Changes**: `src/features/dashboard/TopBar.tsx`, `src/hooks/useIsMobile.ts`, `src/pages/tui-dashboard.css`.
- **Details**: Standardized header action bar height (38px). Replaced emojis with uniform 18x18px SVG service icons. Optimized mobile sticky search overlay, full-screen mobile terminal/SQL modal, and responsive instance detail expansion.

#### PR #27 — `feat: global command palette & updated keyboard shortcuts`

- **File Changes**: `src/hooks/useKeyboardShortcuts.ts`, `src/features/dashboard/CommandPalette.tsx`.
- **Details**: Built keyboard listener `useKeyboardShortcuts.ts` (`/` or `a` command palette, `Ctrl+S` search, `Ctrl+C` copy row name, `Ctrl+D` delete confirmation, `Ctrl+I` Info tab, single-key service hotkeys). Built Spotlight-style `CommandPalette.tsx` portal with prefix execution (`:ce`, `:db`, `:iam`, `:net`, `:str`).

#### PR #28 — `feat: OIDC auth integration (Authentik) and protected routes`

- **File Changes**: `src/lib/oidc.ts`, `src/app/providers.tsx`, `src/components/auth/AuthTokenSync.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/pages/LoginPage.tsx`.
- **Details**: Integrated `react-oidc-context`, `ProtectedRoute.tsx`, centered TUI view `LoginPage.tsx`, and automatic Bearer token injection into Axios requests via `AuthTokenSync.tsx`.

#### PR #29 — `feat: error boundary, 404 page, global loading skeleton`

- **File Changes**: `src/pages/NotFoundPage.tsx`, `src/pages/ErrorPage.tsx`, `src/features/dashboard/DashboardLoading.tsx`.
- **Details**: Created retro TUI 404 view `NotFoundPage.tsx`, React Router error boundary `ErrorPage.tsx` with dev stack traces, and blinking skeleton indicator `DashboardLoading.tsx`.

#### PR #30 — `feat: Dashboard overview/home page with cross-service summary`

- **File Changes**: `src/features/dashboard/DashboardOverview.tsx`, `src/features/dashboard/icons.tsx`.
- **Details**: Built `/dashboard` overview page featuring 5 service cards with live resource counts, status breakdowns, last-created resource timestamps, recent activity log, and system status health panel.

#### PR #31 — `feat: @tanstack/react-table migration for items table`

- **File Changes**: `src/features/dashboard/DataTable.tsx`, `src/features/dashboard/columns.ts`, deleted `useSortableRows.ts` & `SortableHeader.tsx`.
- **Details**: Migrated items table to generic `@tanstack/react-table` wrapper `DataTable.tsx`. Added 2-state ▲/▼ column sorting, table global filtering, selected row highlighting, and service-tailored column definitions.

---

### Sprint 5 — Refactoring, Accessibility, Tests & Production Deployment

#### PR #32 — `feat: WebSocket connection layer for real terminal`

- **File Changes**: `src/lib/websocket.ts`, `src/components/terminal/TerminalView.tsx`, `src/features/dashboard/tabs/ComputeEngineTabContent.tsx`.
- **Details**: Created `TerminalWebSocket` client handling real-time WebSocket connections (`ws://<host>/ws/terminal/:ceId`) with exponential backoff retries (max 3 retries), retry exhaustion events, and fallback to mock shell mode. Gated by `VITE_ENABLE_REAL_TERMINAL`.

#### PR #33 — `chore: code-splitting, lazy routes, production build optimization`

- **File Changes**: `src/app/router.tsx`, `vite.config.ts`, `src/features/dashboard/tabs/`.
- **Details**: Code-split route pages using `React.lazy()` & `<Suspense>`. Deferred loading for Monaco and Xterm bundles. Configured Vite rollup chunk splitting (`vendor-react`, `vendor-query`, `vendor-charts`, `vendor-terminal`).

#### PR #34 — `test: MSW integration tests for critical flows`

- **File Changes**: `src/features/*/__tests__/` (`computeEngine.test.tsx`, `database.test.tsx`, `iam.test.tsx`, `network.test.tsx`, `storage.test.tsx`).
- **Details**: Created stateful MSW integration test suite verifying list fetching, creation, mutation cache invalidation, deletion, and metric series handling across all services.

#### PR #35 — `chore: Docker build, env config, deployment readiness`

- **File Changes**: `Dockerfile`, `nginx.conf`, `.env.example`, `README.md`.
- **Details**: Added multi-stage production `Dockerfile` (`node:20-alpine AS build` -> `nginx:alpine`), `nginx.conf` SPA fallback & reverse proxy setup, environment variable references, and deployment documentation.

#### PR #36 — `refactor: decompose monolithic DashboardPage.tsx`

- **File Changes**: `src/pages/DashboardPage.tsx`, `src/features/dashboard/actions/`, `src/features/dashboard/DetailPanel.tsx`, `src/features/dashboard/TopBar.tsx`, `src/features/dashboard/useDashboardModals.ts`.
- **Details**: Reduced `DashboardPage.tsx` size from ~2,350 lines down to ~798 lines by extracting per-service row actions, detail panel, top control bar, profile menu, region selector, search grid, and modal management hook.

#### PR #37 — `feat: accessibility pass — ARIA roles, keyboard navigation, automated a11y checks`

- **File Changes**: `RegionSelector.tsx`, `ProfileMenu.tsx`, `ServiceSearchGrid.tsx`, `DataTable.tsx`, `DashboardModal.tsx`, `CommandPalette.tsx`, `setup.ts`, `vitest-axe.d.ts`, `*.a11y.test.tsx`.
- **Details**: Upgraded custom dropdowns to full WAI-ARIA `listbox`, `menu`, and `combobox` patterns with arrow key navigation. Added dynamic sort button `aria-label`s and `scope="col"` to tables. Added focus traps and focus restoration to modals. Installed `vitest-axe` and enabled oxlint `jsx-a11y` rules.

#### PR #38 — `feat: global cross-service search and command palette integration`

- **File Changes**: `src/hooks/useGlobalSearch.ts`, `src/features/dashboard/GlobalSearchOverlay.tsx`, `src/features/dashboard/CommandPalette.tsx`.
- **Details**: Built unified client-side search hook filtering resources across Compute Engines, Databases, IAM Users, Buckets, and Networks by name, ID, status, region, or engine. Integrated real-time search overlay into top search input and synced with command palette shortcode prefixes.

#### PR #39 — `feat: service settings views with retro TUI styling`

- **File Changes**: `src/features/*/pages/*SettingsPage.tsx`, `src/mocks/handlers/`.
- **Details**: Built retro TUI settings pages for all 5 primary services (`ComputeEngineSettingsPage`, `DatabaseSettingsPage`, etc.) with MSW PATCH persistence and toast notifications. Wired top control bar and mobile menu gear buttons (`⚙`) to navigate to `/services/:serviceId/settings`.

#### PR #40 — `refactor: abstract repetitive MSW mock handlers`

- **File Changes**: `src/mocks/handlers/utils.ts`, `src/mocks/handlers/` (`computeEngine.ts`, `database.ts`, `iam.ts`, `storage.ts`, `network.ts`).
- **Details**: Created generic MSW handler factory functions (`createGetByIdHandler`, `createDeleteHandler`, `createSettingsPatchHandler`), eliminating ~250 lines of duplicate route boilerplate across service mocks.

#### PR #41 — `feat: new service options, responsive refinements & pagination removal`

- **File Changes**: `src/features/dashboard/constants.ts`, `src/features/dashboard/TopBar.tsx`, `src/features/dashboard/DataTable.tsx`, `src/pages/tui-dashboard.css`.
- **Details**: Added Load Balancer (`:lb`, hotkey `l`) and Kubernetes (`:k8s`, hotkey `k`) workspaces and icons. Repositioned parenthesis shortcode key labels to the bottom-right border notch. Responsive layout refinements: hidden box labels `<=1450px`, hidden key labels `<=1000px`. Completely removed table pagination controls in favor of a clean single-view vertical scrolling list.

#### PR #42 — `feat: full settings suite, centralized content engine, functional refresh, and project manifesto`

- **File Changes**: `src/constants/serviceContent.ts`, `src/pages/AboutPage.tsx`, `src/features/dashboard/TopBar.tsx`, `src/pages/DashboardPage.tsx`, `src/features/dashboard/DetailPanel.tsx`, `src/app/router.tsx`, `src/features/dashboard/ProfileMenu.tsx`, `src/features/dashboard/CommandPalette.tsx`, `src/pages/tui-dashboard.css`, `src/features/dashboard/__tests__/`.
- **Details**: Built centralized service content engine (`SERVICE_CONTENT`) for all primary and secondary cloud services. Wired global refresh button to TanStack Query cache invalidation (`queryClient.invalidateQueries()`) with active 360-degree CSS spin animation (`fci-spin`) and toast notification. Added retro TUI Technical Project Manifesto page (`/about`) with ASCII art banner, architectural decision matrix, and keyboard navigation. Completed full settings suite for primary/secondary cloud services and user accounts.

#### PR #43 — `refactor: rename VM service to Compute Engine (ce)`

- **File Changes**: `src/features/computeEngine/`, `src/lib/mockServiceData.ts`, `src/app/router.tsx`, `src/features/dashboard/`, `README.md`.
- **Details**: Renamed Virtual Machine (VM) service domain and `vm` shortcode to Compute Engine (`ce`, `:ce`). Updated routes (`/services/compute-engine`), mock endpoints (`/api/compute-engines`), components, types, tests, and icon mappings across the entire application codebase.

#### PR #44 — `feat: My Account settings page, MSW API & ProfileMenu enhancements`

- **File Changes**: `src/pages/MyAccountPage.tsx`, `src/features/account/` (`types.ts`, `api.ts`, `hooks.ts`), `src/mocks/data/account.ts`, `src/mocks/handlers/account.ts`, `src/features/dashboard/ProfileMenu.tsx`, `src/features/dashboard/__tests__/AccountSettings.test.tsx`.
- **Details**: Built dedicated My Account settings page (`/account`) supporting display name, email, default region, session timeout, notification toggles, and personal API key management (generate & revoke). Created MSW `/api/account` endpoint handlers and React Query hooks (`useAccount`, `useUpdateAccountSettings`, `useGenerateApiKey`, `useRevokeApiKey`). Enhanced ProfileMenu with quick theme switcher, user profile details, and responsive menu behavior.

#### PR #45 — `feat: dynamic back navigation, technical manifesto, white/mono themes, and UX refinements`

- **File Changes**: `src/hooks/useSmartBack.ts`, `src/pages/AboutPage.tsx`, `src/pages/MyAccountPage.tsx`, `src/constants/serviceContent.ts`, `src/pages/tui-dashboard.css`, `src/mocks/data/` (`account.ts`, `computeEngines.ts`, `databases.ts`, `iamUsers.ts`, `networks.ts`, `buckets.ts`).
- **Details**:
  - Implemented `useSmartBack` custom hook standardizing dynamic browser history popping (`navigate(-1)`) with smart fallback routing across all detail, creation, about, and account views.
  - Added Retro TUI Technical Project Manifesto page (`/about`) with ASCII art headers, architectural principles, and single menu item conditioning across viewports.
  - Expanded theme system with Mono (White) retro theme (`data-theme='mono'`) and theme-compatible action buttons.
  - Refined My Account page with draft theme state isolation (persisting theme changes only upon successful save) and form submission guards while loading.
  - Added store reset functions (`resetAccountStore`, `resetComputeEngineStore`, `resetDatabaseStore`, `resetIamUserStore`, `resetNetworkStore`, `resetBucketStore`) to all MSW mock data stores for 100% test isolation in `afterEach`.
  - Added automatic search bar input clearing on outside screen touch/click.
  - Fixed terminal outer container padding and active tab underline indicator alignment in CSS.

#### PR #46 — `feat: Network Map, deterministic back navigation, 7-column dashboard layout, and centered monochrome manifesto`

- **Key File Changes**: `src/features/dashboard/tabs/NetworkMapTab.tsx`, `src/features/dashboard/DashboardOverview.tsx`, `src/features/dashboard/` (`TopBar.tsx`, `DashboardModalBody.tsx`, `actions/ComputeEngineRowActions.tsx`, `__tests__/`), `src/features/network/` (`types.ts`), `src/mocks/data/networks.ts`, `src/pages/` (`tui-dashboard.css`, `DashboardPage.tsx`, `MyAccountPage.tsx`, `AboutPage.tsx`, `ErrorPage.tsx`, `NotFoundPage.tsx`).
- **Details**:
  - Built interactive "Network Map" topology visualization tab inside the Network service workspace to render VPC parent nodes and subnet child nodes with filters.
  - Standardized notch back navigation buttons to deterministically navigate back to `/dashboard` root across all primary layouts.
  - Redesigned the `/dashboard` home banner with a prominent blinking `[FREE CLOUD INITIATIVE]` plain-text header.
  - Restructured the overview service cards layout to sit in a single horizontal row of 7 buttons using a compact layout.
  - Added a centered, borderless single-column project manifesto featuring *Hitchhiker's Guide to the Galaxy* satirical cloud madness lore.

---

## Development Setup & Workflow

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher

### Local Development

1. **Clone the repository and install dependencies**:

   ```bash
   git clone https://github.com/freecloudinitiative/frontend.git
   cd frontend
   npm install
   ```

2. **Start the Vite development server**:

   ```bash
   npm run dev
   ```

   The application will start at `http://localhost:5173`. MSW automatically intercepts all network calls in development.

3. **Useful Scripts**:
   ```bash
   npm run build   # Run TypeScript typechecks & build production bundle
   npx oxlint .    # Run fast Oxlint static analysis
   npm test        # Run Vitest test suite (unit, integration, and accessibility tests)
   ```

---

## Environment Variables

Copy `.env.example` to `.env` to customize local environment behavior.

### Build-time Variables (`VITE_*`)

| Variable                    | Description                                                                                      | Default / Fallback                   |
| :-------------------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------- |
| `VITE_APP_ENV`              | Application environment (`nonprod` initializes MSW mock worker; `prod` bypasses MSW completely). | `nonprod`                            |
| `VITE_API_BASE_URL`         | Base URL for the backend API endpoint.                                                           | `""` (Same-origin, required for MSW) |
| `VITE_OIDC_AUTHORITY`       | Authentik / OIDC Provider issuer URL. Unset disables auth.                                       | Unset (Auth disabled pass-through)   |
| `VITE_OIDC_CLIENT_ID`       | OIDC Client Identifier registered with IdP.                                                      | Unset                                |
| `VITE_OIDC_REDIRECT_URI`    | OIDC OAuth callback URI.                                                                         | `${origin}/callback`                 |
| `VITE_WS_BASE_URL`          | WebSocket URL for real serial terminal connection.                                               | `ws://localhost:8080`                |
| `VITE_ENABLE_REAL_TERMINAL` | Enable real WebSocket terminal (`true`) or mock shell (`false`).                                 | `false`                              |

### Container Runtime Variables

| Variable          | Description                                                         | Default               |
| :---------------- | :------------------------------------------------------------------ | :-------------------- |
| `API_BACKEND_URL` | Origin backend server address reverse-proxied by Nginx for `/api/`. | `http://backend:8080` |

---

## Docker & Container Deployment

### 1. Non-Production Build (`VITE_APP_ENV=nonprod`)

Build and run a standalone container using Mock Service Worker (MSW) dummy data:

```bash
# Build Image
docker build \
  --build-arg VITE_APP_ENV=nonprod \
  -t fci-frontend:nonprod .

# Run Container
docker run -d \
  --name fci-dashboard-nonprod \
  -p 8080:80 \
  fci-frontend:nonprod
```

### 2. Production Build (`VITE_APP_ENV=prod`)

Build and run a production container routing `/api/` requests directly to a live backend API server via Nginx reverse proxy:

```bash
# 1. Build Multi-Stage Production Docker Image
docker build \
  --build-arg VITE_APP_ENV=prod \
  --build-arg VITE_API_BASE_URL= \
  --build-arg VITE_OIDC_AUTHORITY=https://auth.example.com/application/o/fci/ \
  --build-arg VITE_OIDC_CLIENT_ID=fci-dashboard-client \
  --build-arg VITE_OIDC_REDIRECT_URI=https://console.example.com/callback \
  --build-arg VITE_WS_BASE_URL=wss://console.example.com \
  --build-arg VITE_ENABLE_REAL_TERMINAL=true \
  -t fci-frontend:prod .

# 2. Create Shared Container Network
docker network create fci-net

# 3. Launch Nginx Container with Runtime Proxy Configuration
docker run -d \
  --name fci-dashboard-prod \
  -p 8080:80 \
  --network fci-net \
  -e API_BACKEND_URL=http://backend-service:8080 \
  fci-frontend:prod
```

The application serves at `http://localhost:8080`. Nginx handles SPA client routing (redirecting non-static routes to `index.html`), serves static assets with 1-year immutable caching, proxies all `/api/` HTTP traffic directly to `${API_BACKEND_URL}`, and proxies `/ws/` WebSocket streaming with HTTP 1.1 upgrade headers.

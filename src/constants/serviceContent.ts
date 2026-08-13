export interface ServiceInfo {
  id: string
  title: string
  shortDescription: string
  aboutText: string[]
  creationGuide: {
    overview: string
    fieldTooltips: Record<string, string>
    bestPractices: string[]
  }
  architectureNotes: string
}

export const SERVICE_CONTENT: Record<string, ServiceInfo> = {
  'Compute Engine': {
    id: 'compute-engine',
    title: 'Compute Engine',
    shortDescription: 'Scalable virtual machine instances with configurable CPU, RAM, OS, and persistent block storage.',
    aboutText: [
      'Compute Engine provides high-performance virtual machine instances running Debian, Ubuntu, AlmaLinux, or custom OS images on Free Cloud Initiative infrastructure.',
      'Instances feature configurable vCPU and memory allocations, attached SSD/HDD block storage volumes, dedicated internal IP addresses, and direct serial console access.',
      'Use the Details tab for instance specs, Console for interactive SSH terminal sessions, Storage for volume attachments, Network for NIC stats, Backups for snapshot schedules, and Metrics for real-time telemetry.',
    ],
    creationGuide: {
      overview: 'Configure instance specification, boot disk image, network interface, and tags.',
      fieldTooltips: {
        name: 'Unique machine hostname identifier in RFC 1123 format.',
        os: 'Operating system template image to provision on the boot disk.',
        cpu: 'Virtual CPU count allocated to the virtual machine instance.',
        memory: 'System RAM allocated in Gigabytes.',
        disk: 'Boot disk storage capacity in Gigabytes.',
        region: 'Target geographic data center region for provisioning.',
      },
      bestPractices: [
        'Select SSD boot disks for database or heavy I/O workloads.',
        'Apply instance tags for automated firewall rule targeting.',
        'Configure daily automated snapshot backups for production instances.',
      ],
    },
    architectureNotes: 'Virtual machines run on KVM-isolated hypervisor hosts with virtio network interfaces and NVMe-backed persistent disk attachments.',
  },
  Database: {
    id: 'database',
    title: 'Database Service',
    shortDescription: 'Managed relational database instances supporting PostgreSQL, MySQL, and Redis with high availability.',
    aboutText: [
      'Database Service delivers fully managed relational database clusters with automated replication, failover, transaction logging, and connection pooling.',
      'Instances support PostgreSQL, MySQL, and Redis engines with customizable max connection limits, maintenance windows, and automatic point-in-time backups.',
      'Use the Details tab for endpoint connection strings, Connections for active client monitoring, Backups for snapshots, Logs for server diagnostic logs, Metrics for query throughput, SQL Editor for interactive queries, and Data Import for ingestion.',
    ],
    creationGuide: {
      overview: 'Provision a managed database instance with engine selection, storage allocation, and credentials.',
      fieldTooltips: {
        name: 'Database cluster name identifier.',
        engine: 'Database engine type (PostgreSQL, MySQL, Redis).',
        memory: 'Allocated buffer pool RAM in Gigabytes.',
        storageSize: 'Initial allocated disk storage in Gigabytes.',
        maxConnections: 'Maximum permitted concurrent client pool connections.',
      },
      bestPractices: [
        'Enable auto-failover and multi-zone deployment for production database nodes.',
        'Configure maintenance windows during off-peak traffic hours.',
        'Use connection pooling to prevent max connection limits under heavy traffic.',
      ],
    },
    architectureNotes: 'Database clusters run on dedicated isolated container pods with write-ahead logging (WAL) streamed to multi-region object storage.',
  },
  IAM: {
    id: 'iam',
    title: 'Identity and Access Management (IAM)',
    shortDescription: 'Fine-grained access control, role assignments, user lifecycle management, and security audit logs.',
    aboutText: [
      'Identity and Access Management (IAM) provides role-based access control (RBAC) across cloud resources, user accounts, and API service accounts.',
      'Manage user privileges, attach predefined or custom JSON security policies, enforce mandatory multi-factor authentication (MFA), and monitor login activity audit trails.',
      'Use the Details tab for account identity and attached policies, Permissions for effective allow/deny evaluation, Policies for global policy definitions, and Activity for security audit events.',
    ],
    creationGuide: {
      overview: 'Create a new IAM user account with initial role bindings and security settings.',
      fieldTooltips: {
        name: 'User full name or display name.',
        email: 'Primary user email address used for login and notifications.',
        role: 'Primary administrative or operational role assignment.',
      },
      bestPractices: [
        'Enforce mandatory Multi-Factor Authentication (MFA) across all administrative accounts.',
        'Follow the Principle of Least Privilege when assigning IAM policy roles.',
        'Regularly audit inactive user accounts and rotate API access keys.',
      ],
    },
    architectureNotes: 'IAM authorization decisions are evaluated by a centralized high-speed policy engine using immutable cryptographically signed JWT tokens.',
  },
  Storage: {
    id: 'storage',
    title: 'Object Storage Service',
    shortDescription: 'High-durability object storage buckets for unstructured data, backups, assets, and media.',
    aboutText: [
      'Storage Service provides S3-compatible object storage buckets with configurable access controls, automatic object versioning, and lifecycle policy automation.',
      'Store and retrieve unstructured data files, database backups, static media assets, and build artifacts with multi-region redundancy and encryption at rest.',
      'Use the Details tab for bucket configuration, Objects for file management, Access for IAM permission bindings, and Metrics for bandwidth and object count telemetry.',
    ],
    creationGuide: {
      overview: 'Create an object storage bucket with access controls and lifecycle options.',
      fieldTooltips: {
        bucketName: 'Globally unique bucket identifier compliant with DNS naming standards.',
        access: 'Visibility access level (Private, Public-Read, Authenticated-Read).',
        region: 'Primary storage region location.',
      },
      bestPractices: [
        'Enable object versioning to protect against accidental file deletion or overwrites.',
        'Configure lifecycle rules to auto-archive aging backup files to cold storage.',
        'Keep bucket access default set to Private unless serving public static website content.',
      ],
    },
    architectureNotes: 'Objects are erasure-coded and replicated across at least three physical availability zones with AES-256 server-side encryption.',
  },
  Network: {
    id: 'network',
    title: 'Virtual Private Cloud Network',
    shortDescription: 'Software-defined networking, Virtual Private Clouds (VPCs), subnets, firewall rules, and routes.',
    aboutText: [
      'Network Service offers isolated Virtual Private Clouds (VPCs) with custom IPv4/IPv6 CIDR IP ranges, granular stateful firewall rules, and VPC peering connections.',
      'Define subnets, gateways, and NAT configurations to connect compute instances and database clusters securely within private subnets.',
      'Use the Details tab for VPC topology, Firewall for ingress/egress filtering rules, Routes for route tables, and Peering for cross-VPC interconnectivity.',
    ],
    creationGuide: {
      overview: 'Provision a software-defined VPC network with CIDR block allocation.',
      fieldTooltips: {
        vpcName: 'Unique network topology name.',
        cidrBlock: 'Classless Inter-Domain Routing IP block (e.g. 10.0.0.0/16).',
        type: 'Network type (Public Internet-Facing, Private Subnet, Hybrid VPN).',
      },
      bestPractices: [
        'Restrict ingress SSH (port 22) firewall access to specific administrator IP CIDRs.',
        'Segregate database and backend instances into private subnets without public IPs.',
        'Use VPC peering for low-latency instance communication between networks.',
      ],
    },
    architectureNotes: 'Networking runs on software-defined eBPF virtual switches with line-rate packet processing and zero-copy kernel forwarding.',
  },
  'Load Balancer': {
    id: 'load-balancer',
    title: 'Load Balancer Service',
    shortDescription: 'Application and Network Load Balancers distributing incoming traffic across compute target pools.',
    aboutText: [
      'Load Balancer Service automatically distributes incoming HTTP, HTTPS, and TCP traffic across multiple backend compute instances to ensure high availability and fault tolerance.',
      'Features integrated SSL/TLS termination, health checks, path-based routing rules, and automatic target group failover.',
      'Use the Settings tab to configure target pools, health check probes, routing rules, and TLS certificate bindings.',
    ],
    creationGuide: {
      overview: 'Configure a load balancer listener with target backend instances.',
      fieldTooltips: {
        name: 'Load balancer instance name.',
        protocol: 'Listener protocol (HTTP, HTTPS, TCP).',
        port: 'Listener ingress port (e.g., 80, 443, 8080).',
      },
      bestPractices: [
        'Attach HTTP to HTTPS redirect rules on default listener port 80.',
        'Configure health check probes with reasonable intervals to drop unhealthy backends quickly.',
      ],
    },
    architectureNotes: 'Powered by high-throughput HAProxy and NGINX routing daemons with automated TLS certificate rotation.',
  },
  Kubernetes: {
    id: 'kubernetes',
    title: 'Kubernetes Engine',
    shortDescription: 'Fully managed Kubernetes clusters for container orchestration, node pool scaling, and deployment workloads.',
    aboutText: [
      'Kubernetes Engine provides managed production-ready Kubernetes clusters with automated control plane upgrades, node auto-scaling, and integrated ingress controllers.',
      'Deploy containerized microservices using standard kubectl commands, Helm charts, and declarative manifest specifications.',
      'Use the Settings tab for cluster node pool sizing, control plane version updates, and RBAC workload identity configuration.',
    ],
    creationGuide: {
      overview: 'Provision a managed Kubernetes cluster with initial worker node count.',
      fieldTooltips: {
        clusterName: 'Kubernetes cluster resource identifier.',
        version: 'Kubernetes control plane release version.',
        nodeCount: 'Initial worker node count in default node pool.',
      },
      bestPractices: [
        'Enable cluster autoscaling to dynamic scale worker nodes under load.',
        'Use namespaces to isolate environment workloads (dev, staging, prod).',
      ],
    },
    architectureNotes: 'Managed control plane API servers backed by HA etcd database clusters with automated worker node health self-healing.',
  },
  Security: {
    id: 'security',
    title: 'Cloud Security Center',
    shortDescription: 'Centralized security monitoring, vulnerability scans, threat detection, and compliance auditing.',
    aboutText: [
      'Security Center monitors cloud infrastructure continuously for misconfigurations, open vulnerability ports, unencrypted volumes, and compliance rule violations.',
      'View real-time security alerts, review failed login attempts, and initiate automated patch remediation across Compute Engine and Storage services.',
    ],
    creationGuide: {
      overview: 'Configure automated security scanning schedules and alerting channels.',
      fieldTooltips: {
        scanInterval: 'Frequency of automated vulnerability and compliance scans.',
      },
      bestPractices: [
        'Enable continuous compliance reporting for SOC2 and ISO27001 standards.',
        'Set immediate alerting for any public bucket exposure or unauthorized root logins.',
      ],
    },
    architectureNotes: 'Security analysis engine streams event logs asynchronously to analyze behavioral anomalies using rule heuristics.',
  },
}

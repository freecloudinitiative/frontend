export type IamUserStatus = 'active' | 'disabled' | 'locked'
export type IamUserRole = 'admin' | 'editor' | 'viewer' | 'auditor'
export type IamPolicyType = 'managed' | 'custom'
export type IamPolicyStatus = 'active' | 'review-needed'
export type IamPermissionEffect = 'allow' | 'deny'

export interface IamPermission {
  resource: string
  action: string
  effect: IamPermissionEffect
  condition?: string
}

export interface IamUser {
  id: string
  name: string
  email: string
  status: IamUserStatus
  role: IamUserRole
  lastLogin: string
  mfaEnabled: boolean
  region: string
  zone: string
  createdAt: string
}

export interface IamPolicy {
  id: string
  userId: string
  name: string
  type: IamPolicyType
  permissions: IamPermission[]
  attachedAt: string
  status: IamPolicyStatus
}

export interface IamUserWithPolicies extends IamUser {
  policies: IamPolicy[]
}

export interface CreateIamUserInput {
  name: string
  email: string
  role: IamUserRole
}

export interface UpdateIamUserInput {
  status?: IamUserStatus
  role?: IamUserRole
  mfaEnabled?: boolean
}

// 'degraded' = local write committed, best-effort Authentik sync failed.
// Constrained by iam.audit_log CHECK — see
// iam-service/migrations/0010_audit_log_degraded_status.sql.
export type IamActivityStatus = 'success' | 'failed' | 'degraded'

export interface IamActivityEntry {
  id: string
  timestamp: string
  action: string
  resource: string
  status: IamActivityStatus
}

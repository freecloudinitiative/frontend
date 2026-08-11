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

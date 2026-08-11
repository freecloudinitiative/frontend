export type Region = 'ANK' | 'IST'

export type FirewallDirection = 'ingress' | 'egress'
export type FirewallProtocol = 'tcp' | 'udp' | 'icmp' | 'all'
export type FirewallAction = 'allow' | 'deny'

export interface FirewallRule {
  id: string
  name: string
  direction: FirewallDirection
  protocol: FirewallProtocol
  portRange: string
  source: string
  action: FirewallAction
}

export type RouteStatus = 'active' | 'pending'

export interface NetworkRoute {
  id: string
  destination: string
  nextHop: string
  priority: number
  status: RouteStatus
}

export type PeeringStatus = 'active' | 'pending' | 'failed'

export interface VpcPeering {
  id: string
  peerVpc: string
  peerRegion: string
  peerCidr: string
  status: PeeringStatus
}

export type NetworkType = 'vpc' | 'subnet' | 'public'
export type NetworkStatus = 'active' | 'down' | 'pending'

export interface Network {
  id: string
  vpcName: string
  cidrBlock: string
  type: NetworkType
  status: NetworkStatus
  gateway: string
  firewallRules: FirewallRule[]
  routes: NetworkRoute[]
  peerings: VpcPeering[]
  createdAt: string
}

export interface CreateNetworkInput {
  vpcName: string
  cidrBlock: string
  type: NetworkType
}

export interface CreateFirewallRuleInput {
  name: string
  direction: FirewallDirection
  protocol: FirewallProtocol
  portRange: string
  source: string
  action: FirewallAction
}

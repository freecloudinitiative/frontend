import type { ServiceId } from '@/lib/mockServiceData'
import { AnimatedPlaceholder } from './shared/AnimatedPlaceholder'

interface ComingSoonTabContentProps {
  serviceId: ServiceId
}

export function ComingSoonTabContent({ serviceId }: ComingSoonTabContentProps) {
  return (
    <AnimatedPlaceholder
      label="COMING SOON"
      subtitle={`${serviceId} automated management, provisioning, and cluster orchestration features are under active development for Free Cloud Initiative.`}
    />
  )
}

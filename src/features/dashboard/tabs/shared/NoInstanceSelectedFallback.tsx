import { AnimatedPlaceholder } from './AnimatedPlaceholder'

interface NoInstanceSelectedFallbackProps {
  subtitle?: string
}

export function NoInstanceSelectedFallback({ subtitle }: NoInstanceSelectedFallbackProps) {
  return <AnimatedPlaceholder label="NO INSTANCE SELECTED" subtitle={subtitle} />
}

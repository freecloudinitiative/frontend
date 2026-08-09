import { AsciiBanner } from '@/components/ui/AsciiBanner'

export function Header() {
  return (
    <div className="shrink-0 pl-4">
      <AsciiBanner lines={['FREE CLOUD INITIATIVE']} className="text-[6px]" />
    </div>
  )
}

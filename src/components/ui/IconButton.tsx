import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type IconButtonVariant = 'back' | 'create' | 'settings' | 'refresh' | 'delete' | 'connect'

export type IconButtonPlacement = 'default' | 'topright' | 'notch' | 'inline'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  icon?: ReactNode
  title: string
  ariaLabel?: string
  placement?: IconButtonPlacement
}

const VARIANT_CLASS_MAP: Record<IconButtonVariant, string> = {
  back: 'fci-topbtn-back fci-action-back',
  create: 'fci-topbtn-add fci-action-add',
  settings: 'fci-topbtn-settings',
  refresh: 'fci-topbtn-refresh',
  delete: 'fci-action-delete',
  connect: 'fci-action-edit',
}

export function IconButton({
  variant = 'back',
  icon,
  title,
  ariaLabel,
  placement = 'default',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const variantClass = VARIANT_CLASS_MAP[variant]
  const placementClass =
    placement === 'topright'
      ? 'fci-tui-back-topright'
      : placement === 'notch'
        ? 'fci-box-key-top'
        : ''

  const combinedClassName = ['fci-linkbtn', variantClass, placementClass, className].filter(Boolean).join(' ')
  const content = icon ?? children ?? (variant === 'back' ? '<' : null)

  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={combinedClassName}
      title={title}
      aria-label={ariaLabel || title}
    >
      {content}
    </button>
  )
}

interface SettingsInfoPanelProps {
  service: string
  paragraphs: readonly string[]
}

export function SettingsInfoPanel({ service, paragraphs }: SettingsInfoPanelProps) {
  return (
    <div className="fci-split-info">
      <h3>About {service} Service Settings</h3>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  )
}

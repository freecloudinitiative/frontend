interface MetricRowItem {
  label: string
  value: string
  color: string
}

/**
 * The `fci-section-title` + `fci-metricrow` label/value block repeated across
 * every service tab (SSH Access, Disk I/O, Traffic, Pool Stats, Policy, …).
 */
export function MetricRow({ title, items }: { title: string; items: MetricRowItem[] }) {
  return (
    <>
      <div className="fci-section-title" style={{ marginTop: 14 }}>{title}</div>
      <div className="fci-metricrow">
        {items.map((item) => (
          <div key={item.label}>
            {item.label}: <span style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
    </>
  )
}

import { describe, expect, it } from 'vitest'
import { getObservabilityLinks } from '@/lib/observabilityLinks'

describe('getObservabilityLinks', () => {
  it('uses nonprod observability hosts for the nonprod application', () => {
    expect(getObservabilityLinks('nonprod.freecloudinitiative.test')).toEqual({
      grafana: 'https://grafana.nonprod.freecloudinitiative.test',
      prometheus: 'https://prometheus.nonprod.freecloudinitiative.test',
      loki: 'https://loki.nonprod.freecloudinitiative.test',
    })
  })

  it('uses production observability hosts for the production application', () => {
    expect(getObservabilityLinks('freecloudinitiative.com')).toEqual({
      grafana: 'https://grafana.freecloudinitiative.com',
      prometheus: 'https://prometheus.freecloudinitiative.com',
      loki: 'https://loki.freecloudinitiative.com',
    })
  })
})

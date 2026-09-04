const PROD_DOMAIN = 'freecloudinitiative.com'
const NONPROD_DOMAIN = 'nonprod.freecloudinitiative.test'

export interface ObservabilityLinks {
  grafana: string
  prometheus: string
  loki: string
}

export function getObservabilityLinks(
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
): ObservabilityLinks {
  const domain = hostname === NONPROD_DOMAIN || hostname.endsWith(`.${NONPROD_DOMAIN}`)
    ? NONPROD_DOMAIN
    : PROD_DOMAIN

  return {
    grafana: `https://grafana.${domain}`,
    prometheus: `https://prometheus.${domain}`,
    loki: `https://loki.${domain}`,
  }
}

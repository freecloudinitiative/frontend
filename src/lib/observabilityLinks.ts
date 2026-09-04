const PROD_DOMAIN = 'freecloudinitiative.com'
const NONPROD_DOMAIN = 'nonprod.freecloudinitiative.com'

/**
 * Grafana is served from a sub-path, not the host root: the chart sets
 * `server.root_url = %(protocol)s://%(domain)s/grafana/` with
 * `serve_from_sub_path: true` (kube-prometheus-stack/values.yaml, identical in
 * k3s-manifests and nonprod-k3s-manifests). A link to the bare host does not
 * land on Grafana -- it gets a 301 that Grafana builds from `%(domain)s`, which
 * the chart never sets, so the browser is sent to `http://localhost/grafana/`.
 * That redirect is what "the Grafana button does nothing" actually is.
 */
const GRAFANA_PATH = '/grafana/'

/** Same shape: Prometheus runs with `routePrefix: /prometheus`. */
const PROMETHEUS_PATH = '/prometheus/'

/** `uid` of the Loki datasource provisioned in kube-prometheus-stack/values.yaml. */
const LOKI_DATASOURCE_UID = 'loki'

export interface ObservabilityLinks {
  grafana: string
  prometheus: string
  loki: string
}

/**
 * Grafana's Explore view, opened on the Loki datasource.
 *
 * Loki has no UI and no ingress of its own -- it is a query API that is meant
 * to be reached through Grafana, and `loki.<domain>` matches no Traefik router
 * at all (it answers with the default self-signed cert). Explore is the real
 * destination for "show me the logs", so the button points there rather than at
 * a host that cannot serve it.
 *
 * `schemaVersion`/`panes` is the Grafana 10+ Explore URL state; the older
 * `left=` form was dropped. Deployed Grafana is 13.x.
 */
function lokiExploreUrl(domain: string): string {
  const panes = {
    fci: {
      datasource: LOKI_DATASOURCE_UID,
      queries: [{ refId: 'A', datasource: { type: 'loki', uid: LOKI_DATASOURCE_UID } }],
      range: { from: 'now-1h', to: 'now' },
    },
  }
  const query = new URLSearchParams({
    schemaVersion: '1',
    orgId: '1',
    panes: JSON.stringify(panes),
  })
  return `https://grafana.${domain}${GRAFANA_PATH}explore?${query}`
}

export function getObservabilityLinks(
  hostname = typeof window !== 'undefined' ? window.location.hostname : '',
): ObservabilityLinks {
  const domain = hostname === NONPROD_DOMAIN || hostname.endsWith(`.${NONPROD_DOMAIN}`)
    ? NONPROD_DOMAIN
    : PROD_DOMAIN

  return {
    grafana: `https://grafana.${domain}${GRAFANA_PATH}`,
    prometheus: `https://prometheus.${domain}${PROMETHEUS_PATH}`,
    loki: lokiExploreUrl(domain),
  }
}

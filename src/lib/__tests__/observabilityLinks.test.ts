import { describe, expect, it } from 'vitest'
import { getObservabilityLinks } from '@/lib/observabilityLinks'

// Every expectation below was checked against the live nonprod endpoints and
// against the manifests that produce them:
//   - nonprod-k3s-manifests/infrastructure/traefik/ingress-routes.yaml (hosts)
//   - .../kube-prometheus-stack/values.yaml (root_url, routePrefix, datasources)
// The host suffix is `.com`. An earlier `.test` never matched the real nonprod
// hostname, so nonprod silently fell through to the production branch and sent
// operators to the production Grafana.
describe('getObservabilityLinks', () => {
  it('uses nonprod observability hosts for the nonprod application', () => {
    const links = getObservabilityLinks('nonprod.freecloudinitiative.com')
    expect(links.grafana).toBe('https://grafana.nonprod.freecloudinitiative.com/grafana/')
    expect(links.prometheus).toBe('https://prometheus.nonprod.freecloudinitiative.com/prometheus/')
    expect(links.loki).toContain('https://grafana.nonprod.freecloudinitiative.com/grafana/explore?')
  })

  it('recognizes application subdomains in the nonprod environment', () => {
    expect(getObservabilityLinks('preview.nonprod.freecloudinitiative.com').grafana)
      .toBe('https://grafana.nonprod.freecloudinitiative.com/grafana/')
  })

  it('uses production observability hosts for the production application', () => {
    const links = getObservabilityLinks('freecloudinitiative.com')
    expect(links.grafana).toBe('https://grafana.freecloudinitiative.com/grafana/')
    expect(links.prometheus).toBe('https://prometheus.freecloudinitiative.com/prometheus/')
    expect(links.loki).toContain('https://grafana.freecloudinitiative.com/grafana/explore?')
  })

  // A bare host is not a working link for either service: Grafana runs with
  // serve_from_sub_path and Prometheus with routePrefix, so the root 301s to a
  // URL Grafana builds from an unset %(domain)s -- http://localhost/grafana/.
  it.each(['nonprod.freecloudinitiative.com', 'freecloudinitiative.com'])(
    'never points at a bare host on %s',
    (hostname) => {
      const links = getObservabilityLinks(hostname)
      expect(links.grafana).toMatch(/\/grafana\/$/)
      expect(links.prometheus).toMatch(/\/prometheus\/$/)
    },
  )

  // Loki has no ingress and no UI; loki.<domain> matches no Traefik router.
  it('sends Loki to Grafana Explore on the Loki datasource, not to a Loki host', () => {
    const { loki } = getObservabilityLinks('nonprod.freecloudinitiative.com')
    expect(loki).not.toContain('//loki.')

    const panes = JSON.parse(new URL(loki).searchParams.get('panes') ?? '{}')
    const pane = Object.values(panes)[0] as { datasource: string; queries: { datasource: { uid: string } }[] }
    expect(pane.datasource).toBe('loki')
    expect(pane.queries[0].datasource.uid).toBe('loki')
  })

  // Grafana 10 dropped the `left=` Explore state; deployed Grafana is 13.x.
  it('uses the panes Explore URL state rather than the removed left= form', () => {
    const url = new URL(getObservabilityLinks('freecloudinitiative.com').loki)
    expect(url.searchParams.get('schemaVersion')).toBe('1')
    expect(url.searchParams.has('panes')).toBe(true)
    expect(url.searchParams.has('left')).toBe(false)
  })
})

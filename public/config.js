// Safe container default: localhost remains convenient for development, while
// an image served on any other host fails closed until Kubernetes mounts the
// production runtime configuration over this file.
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Only override the environment so local Vite variables remain usable.
  window.__FCI_CONFIG__ = { appEnv: 'nonprod' }
} else {
  window.__FCI_CONFIG__ = {
    appEnv: 'prod',
    apiBaseUrl: '',
    oidcAuthority: '',
    oidcClientId: '',
    oidcRedirectUri: '',
    enableRealTerminal: false,
    wsBaseUrl: '',
  }
}

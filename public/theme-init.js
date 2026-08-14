(function () {
  try {
    var raw = localStorage.getItem('fci-theme')
    if (!raw) return
    var parsed = JSON.parse(raw)
    var theme = parsed && parsed.state && parsed.state.theme
    var validThemes = ['beige', 'mono', 'default', 'navy', 'sketch']
    if (typeof theme === 'string' && validThemes.indexOf(theme) !== -1) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  } catch {
    // Theme restoration is best effort and must never block application boot.
  }
})()

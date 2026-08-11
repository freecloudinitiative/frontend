# Antigravity Agent Instructions

Before executing any task or prompt in this repository, ALWAYS read and adhere to the following context files and guidelines:

1. **[CLAUDE.md](CLAUDE.md)**
   - Project overview, TUI visual design system standards, verification/testing commands (`npm test`, `npx oxlint .`, `npm run build`), and architectural patterns.

2. **[.antigravity/pr-prompts.md](.antigravity/pr-prompts.md)**
   - 35-PR incremental roadmap, feature acceptance criteria, API data contracts, and MSW mock service handler specifications.

### Execution Guidelines
- **TUI Aesthetic & Design System**: Strictly preserve the retro Terminal User Interface styling (monospace fonts, bordered panel boxes with floating top labels, flat routing, custom `--dash-*` theme tokens).
- **Step Verification**: Ensure tests (`npm test`), linting (`npx oxlint .`), and build checks pass for all modifications.
- **PR Roadmap Alignment**: Match new features to the specifications in `.antigravity/pr-prompts.md`.

# PR #37 — Accessibility Pass: ARIA Roles, Keyboard Navigation & Automated A11y Checks

Bring the dashboard to a baseline accessible standard by adding proper ARIA semantics to custom interactive elements, ensuring keyboard operability, enabling lint-time a11y checks, and adding axe-core automated tests.

## Audit Summary

### What's Already Good
- **DataTable**: Rows already have `tabIndex={0}` + `onKeyDown` (Enter/Space), `aria-sort` on header cells ✅
- **DashboardModal**: Has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap (Tab/Shift+Tab cycle), Escape to close, focus restoration to invoking element ✅
- **CommandPalette**: Has `role="dialog"`, `aria-modal="true"`, `aria-label`, `role="listbox"` on command list, `role="option"` on items, `aria-autocomplete="list"`, `aria-controls`, `aria-activedescendant`, arrow key navigation, Escape to close ✅
- **ProfileMenu**: Has `role="button"`, `tabIndex={0}`, `aria-expanded`, `onKeyDown` (Enter/Space) ✅
- **RegionSelector**: Has `role="button"`, `tabIndex={0}`, `aria-expanded`, `onKeyDown` (Enter/Space) ✅

### Gaps Found

| Component | Issue | Fix |
|---|---|---|
| **ProfileMenu** | Menu items (`fci-dd-item`) are plain `<div onClick>`, no keyboard path | Add `role="menu"` on panel, `role="menuitem"` + `tabIndex={-1}` on items, arrow-key nav within menu, Enter to activate |
| **ProfileMenu** | Missing `aria-haspopup` on trigger | Add `aria-haspopup="menu"` |
| **ProfileMenu** | Escape doesn't close and return focus | Add `onKeyDown` on menu panel for Escape handling |
| **RegionSelector** | Menu items are plain `<div onClick>`, no keyboard path | Add `role="listbox"` on panel, `role="option"` + `aria-selected` on items, arrow-key nav, Enter to select |
| **RegionSelector** | Missing `aria-haspopup` on trigger | Add `aria-haspopup="listbox"` |
| **RegionSelector** | Escape doesn't close and return focus | Add Escape key handling |
| **ServiceSearchGrid** | Search result dropdown items are plain `<div onMouseDown>`, no keyboard access | Add `role="listbox"` on dropdown, `role="option"` on items, arrow-key nav in search results, Enter to select |
| **DataTable** | `<th>` cells missing `scope="col"` | Add `scope="col"` to all header `<th>` elements |
| **DataTable** | Sort buttons lack accessible names describing the action | Add `aria-label="Sort by {column name}"` to sort `<button>`s |
| **DataTable** | Pagination buttons have only `<`/`>` text — unclear to screen readers | Add `aria-label="Previous page"` / `aria-label="Next page"` |
| **DashboardModal** | Uses hardcoded `id="fci-modal-title"` — only one modal can exist at a time without ID conflicts | Use `useId()` for unique IDs (minor, but good practice) |
| **CommandPalette** | Focus doesn't return to invoking element on close | Add focus restoration (capture `activeElement` on open, restore on close) |
| **oxlint config** | No a11y linting | Enable `jsx-a11y` plugin |
| **Tests** | No automated axe-core a11y tests | Add `vitest-axe` tests for high-traffic components |

---

## Proposed Changes

### RegionSelector

#### [MODIFY] [RegionSelector.tsx](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/RegionSelector.tsx)

- Add `aria-haspopup="listbox"` to the trigger `<div>`
- Add `role="listbox"` + `aria-label="Select region"` on the dropdown menu panel
- Add `role="option"` + `aria-selected` + `tabIndex={-1}` to each dropdown item
- Add `onKeyDown` handler on the dropdown panel for:
  - `ArrowDown`/`ArrowUp` to move focus between options
  - `Enter`/`Space` to select the focused option
  - `Escape` to close dropdown and return focus to trigger
- Add `aria-disabled` for the disabled ANK option

---

### ProfileMenu

#### [MODIFY] [ProfileMenu.tsx](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/ProfileMenu.tsx)

- Add `aria-haspopup="menu"` to the trigger `<div>`
- Add `role="menu"` + `aria-label="Profile menu"` on the dropdown menu panel
- Add `role="menuitem"` + `tabIndex={-1}` to each menu item (`<div>` items and `<a>` links)
- Add `onKeyDown` handler on the menu panel for:
  - `ArrowDown`/`ArrowUp` to move focus between menu items
  - `Enter` to activate the focused item
  - `Escape` to close menu and return focus to trigger
- Theme buttons already have proper `role` via `<button>` — keep as-is

---

### ServiceSearchGrid (search result dropdowns)

#### [MODIFY] [ServiceSearchGrid.tsx](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/ServiceSearchGrid.tsx)

- Add `role="listbox"` + `aria-label` on the `.fci-search-dropdown` container
- Add `role="option"` on each search result `<div>`
- Add keyboard navigation in the search input for:
  - `ArrowDown`/`ArrowUp` to highlight search results
  - `Enter` to activate highlighted result
  - `Escape` to clear/close search
- Track highlighted index with `aria-activedescendant` on the input + `id` on each result item

---

### DataTable

#### [MODIFY] [DataTable.tsx](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/DataTable.tsx)

- Add `scope="col"` to all header `<th>` elements
- Add `aria-label={`Sort by ${header name}`}` to each sortable header `<button>`
- Add `aria-label="Previous page"` and `aria-label="Next page"` to pagination buttons
- Add `role="row"` to `<tr>` elements for explicit semantics (already implicit, but reinforces intent)

---

### DashboardModal

#### [MODIFY] [DashboardModal.tsx](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/DashboardModal.tsx)

- Replace hardcoded `id="fci-modal-title"` with `useId()` for unique IDs to avoid collisions if multiple modals are ever rendered
- Focus trap and restoration already work correctly — no changes needed there

---

### CommandPalette

#### [MODIFY] [CommandPalette.tsx](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/src/features/dashboard/CommandPalette.tsx)

- Add focus restoration on close: capture `document.activeElement` when palette opens, restore focus to it when it closes (matching the pattern in `DashboardModal`)
- The rest of the ARIA implementation (listbox, option, activedescendant, keyboard nav) is already excellent

---

### Oxlint Configuration

#### [MODIFY] [.oxlintrc.json](file:///Users/entelektuelmaganda/Repositories/freecloudinitiative/frontend/.oxlintrc.json)

- Add `"jsx-a11y"` to the `plugins` array to enable all built-in JSX accessibility lint rules
- This catches missing `alt` attributes, missing `aria-*` attributes, non-interactive elements with handlers, etc.

---

### Automated a11y Tests (vitest-axe)

#### [NEW] DataTable.a11y.test.tsx
`src/features/dashboard/__tests__/DataTable.a11y.test.tsx`

- Render `DataTable` with sample data
- Run `axe()` against the container
- Assert zero critical/serious violations

#### [NEW] DashboardModal.a11y.test.tsx
`src/features/dashboard/__tests__/DashboardModal.a11y.test.tsx`

- Render `DashboardModal` in open state with sample content
- Run `axe()` against the portal container
- Assert zero critical/serious violations

#### [NEW] CommandPalette.a11y.test.tsx
`src/features/dashboard/__tests__/CommandPalette.a11y.test.tsx`

- Render `CommandPalette` in open state
- Run `axe()` against the portal container
- Assert zero critical/serious violations

#### [NEW] DashboardOverview.a11y.test.tsx
`src/features/dashboard/__tests__/DashboardOverview.a11y.test.tsx`

- Render `DashboardOverview` with MSW-backed data (using existing test server)
- Run `axe()` against the container
- Assert zero critical/serious violations

---

## Verification Plan

### Automated Tests
```bash
npm install --save-dev vitest-axe
npm run build       # Ensure clean TypeScript compilation
npx oxlint .        # Verify new jsx-a11y rules pass
npm test            # All existing + new a11y tests pass
```

### Manual Verification
- Tab through all custom dropdowns (Region, Profile, search results) confirming:
  - Tab reaches trigger → Enter/Space opens → ArrowDown/ArrowUp navigates → Enter selects → Escape closes + returns focus
- Verify DataTable header sort buttons announce "Sort by Name" etc.
- Verify modal focus trap still works correctly

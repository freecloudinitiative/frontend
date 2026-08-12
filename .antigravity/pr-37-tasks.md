# PR #37 — Accessibility Pass Tasks

- [x] Install `vitest-axe` dependency
- [x] Update `src/test/setup.ts` to extend Vitest expect with `vitest-axe` matchers
- [x] Add `src/test/vitest-axe.d.ts` for Vitest v4 TypeScript matcher definitions
- [x] Enable `jsx-a11y` plugin in `.oxlintrc.json`
- [x] Add `.sr-only` utility CSS class in `tui-dashboard.css`
- [x] Fix `RegionSelector.tsx` — ARIA listbox/option roles, aria-haspopup, keyboard nav (ArrowDown/Up/Home/End/Enter/Space/Escape)
- [x] Fix `ProfileMenu.tsx` — ARIA menu/menuitem roles, aria-haspopup, keyboard nav (ArrowDown/Up/Home/End/Escape), auto-focus first item
- [x] Fix `ServiceSearchGrid.tsx` — combobox/listbox ARIA roles, aria-activedescendant, keyboard nav (ArrowDown/Up/Enter/Escape)
- [x] Fix `DataTable.tsx` — `scope="col"`, dynamic sort button aria-labels with direction, pagination labels, `role="row"` on body rows
- [x] Fix `DashboardModal.tsx` — unique title IDs via `useId()`, focus trap attached to document for robust trapping
- [x] Fix `CommandPalette.tsx` — focus restoration on close via invokerRef
- [x] Create `DataTable.a11y.test.tsx` (5 tests: default, sorted, filtered, empty, loading states)
- [x] Create `DashboardModal.a11y.test.tsx` (2 tests: dialog content, form content)
- [x] Create `CommandPalette.a11y.test.tsx` (2 tests: open state, selected row context)
- [x] Create `DashboardOverview.a11y.test.tsx` (1 test: MSW-backed data)
- [x] Run `npm run build` — clean build verified
- [x] Run `npx oxlint .` — jsx-a11y rules pass with 0 errors
- [x] Run `npm test` — all 667 tests passing across 58 test files

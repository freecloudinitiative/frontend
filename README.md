# Free Cloud Initiative

A terminal-style cloud management dashboard built with React, TypeScript, Tailwind CSS, and Vite.

## What it is

- A TUI-inspired UI for cloud services such as VMs, databases, storage, networking, and IAM.
- Uses monospace styling, square borders, and terminal palette tokens for a console look.
- Uses MSW for mocked backend data until real backend integration is available.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- React Router DOM
- Zustand for UI state
- TanStack Query for data fetching
- TanStack Table for tables
- Recharts for charts
- XTerm.js for terminal emulation
- MSW for local API mocking

## Project structure

- `src/app/` - app providers and router configuration
- `src/components/` - shared UI primitives, layout, auth, and terminal components
- `src/features/` - service-specific pages and hooks
- `src/lib/` - utilities, theme tokens, and axios setup
- `src/mocks/` - MSW handlers and fake backend data
- `src/store/` - local UI state stores
- `src/styles/` - global styles and Tailwind entrypoint

## Notes

This repo is intended as a frontend prototype with mocked backend data and terminal-inspired UX styling.

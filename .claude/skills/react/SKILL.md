---
name: react
description: React/TypeScript conventions for the FE-bapperrida1 frontend (Vite + React 19 + Tailwind + shadcn/radix-ui). Use when creating or editing components, pages, layouts, or API calls in this project.
---

# React conventions for FE-bapperrida1

Stack: React 19 + TypeScript, Vite, React Router 7, Tailwind CSS 3, shadcn/radix-ui + `class-variance-authority`/`clsx`/`tailwind-merge`, `lucide-react` icons, `axios`, `recharts`, `sweetalert2`. Backend is Laravel (fields come back in `UPPER_SNAKE_CASE`).

## Project layout
- `src/pages/` — route-level screens, grouped by feature (`pages/master`, `pages/Rencana`, `pages/dashboard`, `pages/landingPage`). One default-exported component per file, named `export default function <Name>()`.
- `src/layouts/` — route shells (e.g. `DashboardLayout.tsx`) that render `<Outlet />` and shared chrome (sidebar/header).
- `src/components/` — shared, reusable components (e.g. `Pagination.tsx`); `src/components/ui/` holds shadcn primitives (`button.tsx`, `card.tsx`) — prefer these over raw `<button>`/`<div>` when a page's design goes beyond the ad-hoc Tailwind pattern below.
- `src/services/api.ts` — the single axios instance; always import and use this instead of creating new axios clients.
- `src/utils/` — small helpers (e.g. `toast.ts`).
- `src/lib/` — shadcn's `cn()` / other low-level utilities.

## API calls
Always go through the shared client:
```ts
import api from "../../services/api"; // adjust relative depth
```
It already sets `baseURL` from `VITE_API_URL`, `withCredentials`, and attaches `Authorization: Bearer <token>` from `localStorage.getItem('token')` via a request interceptor — never add auth headers manually.

Response bodies are normalized as `response.data.data ?? response.data`:
```ts
const response = await api.get("/api/master-bidang");
const responseData = response.data.data || response.data;
setData(Array.isArray(responseData) ? responseData : []);
```

Errors: catch as `err: any`, log with `console.error`, surface `err.response?.data?.message` (fallback to a generic Indonesian message) via `Toast`/`Swal.fire`, not raw `alert()` for anything user-facing beyond quick prototypes.

## CRUD page pattern (master data pages)
`src/pages/master/*.tsx` (e.g. `Bidang.tsx`) is the canonical template for a list+CRUD screen. New master pages should follow the same shape:

1. TS `interface` mirroring the backend row shape, fields in `UPPER_SNAKE_CASE` (e.g. `ID`, `NAMA_BIDANG`, `FLAG_ACTIVE`).
2. State: `data`, `loading`, `error`, `search`, `currentPage` (+ `ITEMS_PER_PAGE = 10`), modal state (`isModalOpen`, `modalMode: "add" | "edit"`, `currentId`, `formData`, `isSubmitting`), and delete-confirm state.
3. `fetchData()` — async, sets `loading`, fetches, normalizes response, clears/sets `error`, called from `useEffect(() => { fetchData() }, [])`.
4. Client-side `search` filters `data` with `.filter(...)`; a separate `useEffect` resets `currentPage` to 1 when `search` changes; pagination is sliced locally and rendered with `<Pagination currentPage totalPages onPageChange />` from `src/components/Pagination.tsx`.
5. Add/edit uses one modal driven by `modalMode`, submits via `api.post`/`api.put`, then `handleCloseModal()` + `fetchData()`.
6. Delete uses SweetAlert2 confirm (`Swal.fire({ icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', ... })`), then `api.delete`, then `Toast.fire({ icon: 'success', ... })` from `src/utils/toast.ts` on success or `Swal.fire({ icon: 'error', ... })` on failure.

Reuse `src/components/Pagination.tsx` and `src/utils/toast.ts` rather than reimplementing pagination or toasts per page.

## Styling conventions
- Utility-first Tailwind, no CSS modules/styled-components.
- Primary/action color: `emerald-600`/`emerald-700` (hover), focus rings `emerald-500`. Destructive actions: `red-600`/`red-700`. Neutral surfaces/text: the `slate` scale (`slate-50` backgrounds, `slate-200` borders, `slate-900`/`slate-500` text).
- Cards/panels: `bg-white border border-slate-200 rounded-2xl shadow-sm`; smaller elements (buttons, inputs, badges) use `rounded-lg`/`rounded-xl`.
- Icons from `lucide-react`, sized `w-4 h-4` (inline/button) or `w-5 h-5` (nav/headers).
- Loading spinners: `<div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />` (match size/color to context, white border-t on colored buttons).
- Modals: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm` backdrop + `bg-white rounded-2xl shadow-xl` panel — plain conditional-render `<div>`s, not a portal/dialog library, even though `radix-ui`/shadcn `dialog` is available. Match the existing pattern unless the user asks for the shadcn Dialog explicitly.
- Status badges: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium` with `bg-emerald-100 text-emerald-800` (active/success) or `bg-red-100 text-red-800` (inactive/error).

## Routing & layout
- Routes are declared with `react-router-dom` v7 (`Outlet`, `Link`, `useLocation`, `useNavigate`); `DashboardLayout.tsx` renders the authenticated shell (sidebar with `sidebarLinks`, collapsible, mobile drawer) and `<Outlet />` for the active page.
- New sidebar entries go in the `sidebarLinks` array in `DashboardLayout.tsx`: `{ name, href, icon }`, or `{ Heading: "..." }` for section dividers.
- `DashboardLayout` currently has `const BYPASS_AUTH = true;` short-circuiting the session check — this is a known temporary state, not something to "fix" incidentally while doing unrelated work.

## General component conventions
- Functional components only, `export default function ComponentName(...)`.
- Local component state via `useState`/`useEffect`; no external state library in use — don't introduce Redux/Zustand/etc. without being asked.
- Prefer named, typed `interface`s for API row shapes and form data over `any`; existing code sometimes uses `any` for quick error/user objects (`err: any`, `user: any`) — matching that is fine, but don't spread `any` into new domain types.
- Keep Indonesian user-facing copy (labels, toasts, confirmations) consistent with existing pages — don't switch to English strings.

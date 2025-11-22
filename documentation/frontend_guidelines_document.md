# Frontend Guideline Document

This document outlines the frontend setup for the Decision Support System (DSS) project. It describes the architecture, design principles, styling, components, and tools used to build a scalable, maintainable, and user-friendly application.

---

## 1. Frontend Architecture

**Framework and Libraries**
- React 18 with TypeScript for building UI components with clear type safety.
- Vite 5 as the build tool for fast startup and instant hot module replacement.
- Tailwind CSS for utility-first styling and responsive design.
- shadcn/ui component library for accessible, pre-built UI elements.
- React Router v6 for client-side routing.
- Zustand for lightweight state management.

**How It Supports Scalability, Maintainability, and Performance**
- **Modular Structure:** Code is split into folders (`components/`, `hooks/`, `services/`, `utils/`, `routes/`), keeping responsibilities clear and easing future growth.
- **Type Safety:** TypeScript catches errors early, making refactors safer and documentation clearer.
- **Fast Builds:** Vite’s dev server and optimized bundling ensure quick feedback and short build times, improving developer productivity.
- **Utility-First Styling:** Tailwind’s JIT mode only includes used classes, reducing CSS size and improving runtime performance.

---

## 2. Design Principles

**Key Principles**
- **Usability:** Interfaces are straightforward. Labels, buttons, and forms use clear language and follow consistent layout patterns.
- **Accessibility:** shadcn/ui components include ARIA attributes, keyboard navigation, and sufficient color contrast. Screens respect user preferences, including dark mode.
- **Responsiveness:** Layouts adjust gracefully from mobile to desktop using Tailwind’s responsive utilities (sm, md, lg, xl breakpoints).
- **Consistency:** Shared styles, spacing, and typography ensure a uniform look across all pages.

**Applying These Principles**
- Form fields include accessible labels and error messages.
- Navigation menus collapse into a hamburger menu on smaller screens.
- Buttons and links have visible focus states for keyboard users.
- Color choices meet WCAG AA contrast ratios.

---

## 3. Styling and Theming

**Styling Approach**
- Tailwind CSS with a utility-first mindset: small, composable classes for margins, padding, typography, colors, and layout.
- No custom CSS files except for project-wide resets and global rules in `globals.css`.
- Dark mode handled via the `next-themes` pattern adapted for Vite.

**Theming and Consistency**
- Themes defined in `tailwind.config.js`, allowing light and dark palettes.
- A single source of truth for colors, font sizes, and spacing.

**Visual Style**
- Modern flat design with subtle shadows and rounded corners, inspired by Material Design but simpler.
- Glassmorphic elements (semi-transparent cards with light blurs) used sparingly for overlays and modals.

**Color Palette**
- Primary: #1E3A8A (Deep Blue)
- Secondary: #10B981 (Emerald Green)
- Accent: #F59E0B (Amber)
- Neutral Light: #F3F4F6 (Gray-100)
- Neutral Dark: #374151 (Gray-700)

**Typography**
- Font Family: Inter (sans-serif) for readability and modern feel.
- Base font size: 16px. Scales for headings (h1–h6) defined in Tailwind.

---

## 4. Component Structure

**Organization**
- `src/components/`: Reusable UI pieces (buttons, inputs, cards).
- `src/components/ui/`: shadcn/ui wrappers and custom variants.
- `src/layouts/`: Layout components like header, sidebar, footer.
- `src/pages/` or `src/routes/`: Page-level components tied to routes.

**Reusability and Maintainability**
- Each component lives in its own folder with `Component.tsx`, `Component.test.tsx`, and `index.ts` for exports.
- Props are strictly typed, documentation comments describe usage.
- Shared utilities (e.g., date formatting) live in `src/utils/` to avoid duplication.

**Benefits of Component-Based Architecture**
- Changes to one component don’t ripple across the app.
- Easy to test and reason about isolated pieces of UI.
- Encourages a library of patterns that speeds up new feature development.

---

## 5. State Management

**Tool and Pattern**
- Zustand for global state: simple API, no boilerplate, and React hooks.
- Local component state managed with `useState` and `useReducer` where needed.

**Data Layer Abstraction**
- `src/services/storage.ts` abstracts all LocalStorage operations: `getStudents()`, `addStudent()`, `updateCriteria()`, etc.
- Centralizing data access keeps components focused on UI, not storage details.

**Shared State Flow**
- Store user session and role in Zustand, synced to LocalStorage.
- Store lists of students, criteria, and evaluations in the global store for easy access across pages.

---

## 6. Routing and Navigation

**Library**
- React Router v6 for client-side routing.

**Structure**
- `src/routes/ProtectedRoute.tsx` checks authentication and roles before rendering target page or redirecting to login.
- Nested routes under a main layout (`/dashboard`, `/students`, `/criteria`, `/evaluate`, `/reports`).

**Navigation Flow**
1. User lands on `/login`.
2. On success, `useAuth` hook stores user info and role, then navigates to `/dashboard`.
3. Sidebar and header provide links to other pages. Unauthorized access auto-redirects back to login.

---

## 7. Performance Optimization

**Key Strategies**
- **Lazy Loading:** Use `React.lazy` and `Suspense` to load pages and heavy components on demand.
- **Code Splitting:** Vite automatically splits code by route; ensure third-party libraries are imported when needed.
- **Asset Optimization:** SVGs inlined as React components; images served at appropriate resolutions.
- **Tree Shaking:** Rely on ES modules to drop unused code in production builds.
- **Tailwind Purge:** Configured to remove unused CSS classes, minimizing bundle size.

**Impact on UX**
- Faster initial load times.
- Reduced memory footprint on users’ devices.
- Smoother interactions, especially on low-powered hardware.

---

## 8. Testing and Quality Assurance

**Testing Layers**
- **Unit Tests:** Vitest + React Testing Library for components, hooks (`useAuth`), and utilities (`utils/saw.ts`).
- **Integration Tests:** Test flows that involve multiple components, e.g., login flow, CRUD operations in Student Management.
- **End-to-End (E2E) Tests:** Use Cypress or Playwright to simulate real user interactions (login, navigation, report export).

**Quality Tools**
- **ESLint** with recommended React and TypeScript rules.
- **Prettier** for consistent code formatting.
- **Husky & lint-staged** to run linting and tests on pre-commit.

**What We Cover**
- Authentication edge cases (invalid credentials, token expiry).
- LocalStorage errors (quota exceeded).
- Correctness of SAW algorithm outputs.
- Accessibility checks for critical pages.

---

## 9. Conclusion and Overall Frontend Summary

This frontend setup combines a modern toolchain—Vite, React, TypeScript, Tailwind CSS, and shadcn/ui—with best practices in architecture, design, and testing. By following these guidelines, the DSS project will have:
- A clear, modular codebase that’s easy for any developer to pick up.
- Responsive, accessible interfaces that work across devices and themes.
- Scalable state and data handling, ready for future enhancements.
- Robust performance optimizations and a comprehensive testing suite.

Together, these elements deliver a high-quality Decision Support System tailored to the needs of SD Islam Al Fatiha, with maintainability and user experience at its core.
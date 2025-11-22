# Project Requirements Document: Decision Support System for SD Islam Al Fatiha

## 1. Project Overview

This project is a lightweight, single-page Decision Support System (DSS) built with Vite, React, and TypeScript. It helps school administrators and teachers (Gurus) manage student data, define evaluation criteria, carry out assessments using a Simple Additive Weighting (SAW) algorithm, and export the results as PDF or Excel. By leveraging a proven Next.js starter template for architecture, UI components, and development patterns, the DSS focuses on client-side simplicity while maintaining clear separation of concerns.

We’re building this tool to streamline the evaluation process at SD Islam Al Fatiha. Instead of juggling spreadsheets or manual calculations, users get a consistent workflow: log in, manage students and criteria, run objective scoring, and instantly download reports. Success will be measured by ease of use (new users onboard in under 5 minutes), performance (page load under 2 seconds), and accuracy (unit-tested SAW algorithm). A future migration to a server-side database or containerized deployment should require minimal overhaul thanks to our clean modular design.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1.0)**
- Client-side authentication and role management (Admin, Guru) using a custom `useAuth.ts` hook with LocalStorage.
- CRUD interfaces for students and evaluation criteria (`StudentManagement.tsx`, `CriteriaManagement.tsx`).
- Evaluation screen (`Evaluation.tsx`) that runs the SAW algorithm (`utils/saw.ts`) to normalize, weight, and rank students.
- Reporting view (`Reports.tsx`) with PDF export via `jsPDF` + `jsPDF-AutoTable` and Excel export via `XLSX`.
- Responsive UI built with `shadcn/ui` components and Tailwind CSS, supporting light and dark themes via `next-themes`.
- Client-side routing with React Router, including `ProtectedRoute` for role-based access control.
- Centralized data layer in `services/storage.ts` abstracting all LocalStorage operations.
- Basic unit tests for core logic (SAW algorithm) using Vitest.

**Out-of-Scope (Planned for Later Phases)**
- Server-side API or database integration (PostgreSQL, Drizzle ORM).
- Multi-tenant support or advanced user roles beyond Admin and Guru.
- Real-time collaboration or notifications.
- Mobile-specific optimizations (will rely on responsive design only).
- Containerized deployment (Docker) and CI/CD pipelines.

## 3. User Flow

A new Guru or Admin navigates to the login page (`Login.tsx`). They enter their credentials, which are validated by the `useAuth.ts` hook. On successful sign-in, the user’s role and session data are stored in LocalStorage. They are then redirected to the main dashboard, where a persistent sidebar and top header provide navigation links to Students, Criteria, Evaluation, and Reports.

From the dashboard, the user selects “Student Management” to add, edit, or remove students. They then move to “Criteria Management” to define or adjust evaluation criteria. Next, they head to “Evaluation,” select a batch of students, input scores per criterion, and click “Calculate.” The SAW algorithm runs in `utils/saw.ts`, updates rankings via `services/storage.ts`, and displays results in a data table. Finally, the user goes to “Reports” to view the ranked list and exports it as a PDF or Excel file. Throughout, `ProtectedRoute` ensures only authorized roles can access each view, and a theme toggle in the header switches between light and dark modes.

## 4. Core Features

- **Authentication & Authorization**: Client-side login/logout, session persistence, role-based route guarding.  
- **Data Persistence Layer**: `services/storage.ts` handles all LocalStorage reads/writes for students, criteria, and results.  
- **Student & Criteria Management**: CRUD forms and data tables for managing student lists and evaluation criteria.  
- **SAW Algorithm Engine**: Normalization, weighted score computation, and ranking in `utils/saw.ts`, backed by unit tests.  
- **Reporting & Exports**: PDF generation (`jsPDF` + `jsPDF-AutoTable`) and Excel workbook creation (`XLSX`).  
- **Responsive UI & Theming**: Tailwind CSS + `shadcn/ui` components, dark mode via `next-themes`.  
- **Routing & Navigation**: React Router with protected routes and a consistent sidebar/header layout.  
- **State Management**: Optional use of Zustand for shared state across components (students, criteria, theme).  

## 5. Tech Stack & Tools

- Frontend: Vite 5, React 18, TypeScript 5
- UI: `shadcn/ui` component library, Tailwind CSS, `next-themes` for dark mode
- Routing: React Router v6
- Storage: Browser LocalStorage abstracted by `services/storage.ts`
- State Management: Zustand (optional, for cross-component state)
- Algorithm: Custom SAW implementation in `utils/saw.ts`
- Reporting: `jsPDF`, `jsPDF-AutoTable`, `XLSX`
- Testing: Vitest for unit tests, React Testing Library for component checks
- Linting & Formatting: ESLint, Prettier, TypeScript strict mode
- Version Control: Git

## 6. Non-Functional Requirements

- **Performance**: Initial load under 2 seconds on modern browsers; transitions under 200 ms.  
- **Responsiveness**: Fully responsive from 320px (mobile) to 1920px (desktop).  
- **Accessibility**: Follow WCAG 2.1 AA standards; use semantic HTML and `aria-` attributes.  
- **Security**: Protect routes with `ProtectedRoute`; sanitize all user inputs; clear session on logout.  
- **Reliability**: Data layer should handle LocalStorage failures gracefully (e.g., quota exceeded).  
- **Maintainability**: Clear code organization, type-safe patterns, and modular structure to ease future migrations.  

## 7. Constraints & Assumptions

- The app is purely client-side; no backend or network calls are required in V1.  
- LocalStorage is available and has sufficient capacity for the expected data volume (hundreds of records).  
- User roles are limited to two: Admin and Guru.  
- Browser support: latest versions of Chrome, Firefox, Edge, and Safari.  
- Future server migration is assumed to reuse the same service and utility layers with minimal changes.  

## 8. Known Issues & Potential Pitfalls

- **LocalStorage Limits**: Storing large datasets can hit browser quotas. Mitigation: show clear error messages and fallback to CSV exports.  
- **Data Consistency**: Concurrent edits in separate tabs may overwrite data. Mitigation: implement `storage` event listeners to sync state.  
- **Algorithm Edge Cases**: Zero or identical weights can skew rankings. Mitigation: validate criteria weights and provide user warnings.  
- **Routing Race Conditions**: Redirect loops if `useAuth` initialization lags. Mitigation: add a loading state during auth check.  
- **Theme Flash**: FOUC (flash of unstyled content) when switching themes. Mitigation: persist theme in LocalStorage and hydrate on first render.  
- **Cross-Browser Bugs**: PDF rendering differences across OSes. Mitigation: test exports on target platforms and adjust `jsPDF` settings accordingly.

---

This PRD outlines the full scope, user experience, technical foundations, and potential challenges for the Decision Support System. It should provide a clear blueprint for each subsequent technical document, ensuring consistency and eliminating guesswork throughout the project lifecycle.
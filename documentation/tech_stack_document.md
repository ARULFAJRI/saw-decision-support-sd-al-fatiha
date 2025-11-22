# Tech Stack Document for Decision Support System (DSS)

This document explains, in everyday language, the technology choices made for the DSS project. It shows what each tool does and why it was chosen—no technical background needed.

## 1. Frontend Technologies

We built the user-facing part of the app with tools that make it fast, responsive, and pleasant to use.

- **Vite + React**  
  - Vite gives us lightning-fast startup and reload times during development.  
  - React lets us break the interface into reusable pieces (components), so building and maintaining the UI is easier.

- **TypeScript**  
  - A superset of JavaScript that adds clear types.  
  - Helps catch mistakes early and makes the code easier to understand and maintain.

- **React Router**  
  - Manages page navigation inside our single-page app.  
  - Lets us define routes (e.g., `/login`, `/students`) and protect them based on user roles.

- **Zustand**  
  - A lightweight state management library.  
  - Keeps shared data (like the current user or student list) in one place, avoiding complex property passing.

- **shadcn/ui**  
  - A collection of ready-made, accessible UI components (buttons, forms, tables).  
  - Speeds up development and ensures a consistent look and feel.

- **Tailwind CSS**  
  - A utility-first CSS framework for styling.  
  - Lets us build responsive layouts quickly without writing custom CSS rules.

- **next-themes**  
  - Adds light and dark mode support.  
  - Users can switch themes, and the app remembers their preference.

## 2. Backend Technologies

Although this is a single-page application without a traditional server, we still need a way to manage data and access control.

- **LocalStorage (via `services/storage.ts`)**  
  - All student, criteria, and evaluation data live in the browser’s LocalStorage.  
  - We created a dedicated module (`services/storage.ts`) that acts like a mini-database interface, handling data reads, writes, and JSON conversions.

- **Custom Authentication Hook (`useAuth.ts`)**  
  - Manages login, logout, and user roles (Admin or Guru).  
  - Stores user session information in LocalStorage and redirects users based on their roles.

- **ProtectedRoute Component**  
  - Wraps each protected page and checks the user’s role before allowing access.  
  - Redirects unauthorized visitors back to the login screen.

## 3. Infrastructure and Deployment

These tools ensure the project’s code stays organized, reliable, and easy to deploy.

- **Git & GitHub**  
  - Version control system to track code changes and collaborate.  
  - GitHub hosts our repository and provides issue tracking.

- **CI/CD Pipeline (GitHub Actions)**  
  - Automatically runs linting, formatting, and tests on each code push.  
  - Ensures code quality and prevents broken builds from being merged.

- **Docker (Reference Configuration)**  
  - A sample Docker setup is provided for containerizing the app in the future.  
  - Makes it simple to spin up the app consistently in any environment.

- **Hosting Platform (e.g., Netlify or Vercel)**  
  - Automatically deploys the app whenever we push to the main branch.  
  - Takes care of HTTPS, CDN distribution, and rollback capabilities.

## 4. Third-Party Integrations

We integrated a few external libraries to handle specialized tasks without reinventing the wheel.

- **jsPDF & jsPDF-AutoTable**  
  - Generate PDF reports directly in the browser.  
  - AutoTable adds nicely formatted tables for evaluation data.

- **XLSX (SheetJS)**  
  - Create and download Excel spreadsheets of student rankings and criteria summaries.

- **Vitest**  
  - A fast testing framework for unit tests.  
  - Ensures critical logic (like our SAW algorithm) works correctly.

## 5. Security and Performance Considerations

We took steps to keep user data safe and the app running smoothly.

- **Authentication & Access Control**  
  - Credentials and roles are stored securely in LocalStorage.  
  - All protected routes verify the user’s role before rendering.

- **Data Validation & Error Handling**  
  - The storage module checks for read/write errors (e.g., storage full).  
  - Forms validate input to avoid invalid or malicious data.

- **Performance Optimizations**  
  - Vite’s hot module replacement (HMR) speeds up development feedback loops.  
  - Tree-shaking and code-splitting ensure only necessary code is shipped to users.  
  - Tailwind’s built-in purging removes unused CSS for smaller bundle sizes.

## 6. Conclusion and Overall Tech Stack Summary

In summary, our DSS application combines modern, well-supported tools to deliver a fast, reliable, and user-friendly experience:

- Frontend built with **Vite**, **React**, **TypeScript**, **React Router**, and **Zustand**
- UI accelerated by **shadcn/ui**, **Tailwind CSS**, and **next-themes**
- Data and authentication handled in-browser through **LocalStorage** and custom hooks
- Reports generated via **jsPDF**, **jsPDF-AutoTable**, and **XLSX**
- Code quality ensured with **ESLint**, **Prettier**, and **Vitest**, all orchestrated in a **GitHub Actions** pipeline
- Future-ready deployment options using **Docker** and modern hosting platforms

These choices align with our goals of quick development, maintainability, and a smooth user journey. By abstracting data access, using reusable UI components, and automating our workflows, we ensure the DSS is robust today and easy to extend tomorrow.
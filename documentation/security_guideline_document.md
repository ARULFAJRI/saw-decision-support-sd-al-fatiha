# Security Guidelines for saw-decision-support-sd-al-fatiha

This document describes the security requirements and best practices for the Decision Support System (DSS) application built with Vite, React, TypeScript, and LocalStorage. It codifies core security principles—Security by Design, Least Privilege, Defense in Depth, and Secure Defaults—into actionable guidelines to ensure a robust, maintainable, and secure solution.

---

## 1. Core Security Principles

• Security by Design: Embed security from planning through deployment.  
• Least Privilege: Grant only the minimum permissions to each component.  
• Defense in Depth: Layer controls so a single failure does not compromise the system.  
• Input Validation & Output Encoding: Treat *all* external input as untrusted.  
• Fail Securely: Avoid leaking sensitive info in errors; default to safe states.  
• Secure Defaults: Ship with the most restrictive settings and open ports only as needed.  

---

## 2. Authentication & Access Control

### 2.1 Secure Client-Side Auth
- useAuth.ts Hook:
  • Validate credentials against a trusted source.  
  • Never store plaintext passwords; if offline auth is required, store hashed values using Argon2 or bcrypt (via WebAssembly).  
  • On login success, set a short-lived session token in LocalStorage (or, ideally, HttpOnly, Secure cookie).  
  • Implement idle and absolute timeouts; clear storage on logout or expiration.  
  
- Role-Based Access Control (RBAC):
  • Define roles (Admin, Guru) explicitly in your type system.  
  • Enforce role checks server-side or in ProtectedRoute before rendering any sensitive view.  
  
- Multi-Factor Authentication (MFA) [Future Enhancement]:
  • Integrate an OTP or TOTP mechanism for elevated privileges (e.g., changing criteria weights).  

### 2.2 Session Security
- Protect against Session Fixation:
  • Regenerate tokens on login.  
- Secure Storage:
  • Prefer HttpOnly & Secure cookies over LocalStorage for tokens to mitigate XSS.  
  • If LocalStorage is used, encrypt tokens or sensitive data using the Web Crypto API.  

---

## 3. Input Handling & Data Validation

### 3.1 Client-Side & Server-Side Validation
- Never trust client input alone; replicate all checks in your API or service layer.  
- Use a schema validation library (e.g., Zod, Yup) for:
  • Student and criteria CRUD payloads.  
  • Evaluation scores and weight assignments.  

### 3.2 Prevent XSS & Injection
- Content-Security-Policy (CSP):
  • Restrict scripts/styles to your origin and approved CDNs.  
  • Disallow `unsafe-inline` and `eval()`.  
- Output Encoding:
  • Escape user-supplied strings in JSX.  
- Sanitize Rich Text (if used) with a library like DOMPurify.  
  
### 3.3 File Uploads & Exports
- If file upload is added in future:
  • Validate MIME types & file extensions.  
  • Scan for malware or reject executable content.  
- Exported PDFs/Excel:
  • Ensure data is sanitized and only required fields are included.  

---

## 4. Data Protection & Privacy

### 4.1 Data at Rest
- LocalStorage is not encrypted by default:
  • Avoid storing highly sensitive PII or credentials.  
  • Implement optional encryption modules to protect critical data.  

### 4.2 Data in Transit
- Serve the SPA over HTTPS (TLS 1.2+).  
- For any future API calls, enforce TLS, certificate pinning (mobile/web), and HSTS.  

### 4.3 Secrets Management
- Do not hard-code keys/secrets in source code.  
- Use environment variables secured by the build pipeline and avoid exposing them in the client bundle.  

---

## 5. Web Application Security Hygiene

### 5.1 Security Headers
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options: `nosniff`
- X-Frame-Options: `DENY` or CSP `frame-ancestors 'none'`
- Referrer-Policy: `no-referrer-when-downgrade` or stricter
- Set cookies with `HttpOnly`, `Secure`, `SameSite=Strict`

### 5.2 CSRF Protection
- For future server-side POST/PUT/DELETE endpoints, implement anti-CSRF tokens and validate them server-side.  

### 5.3 Build & Deployment
- Disable React DevTools in production.  
- Strip all console logs and debug code.  
- Enable source-map exclusion for production bundles.  

---

## 6. Dependency & Supply Chain Management

- Use package lockfiles (`package-lock.json` or `yarn.lock`) to fix versions.  
- Audit dependencies regularly (`npm audit`, Snyk, Dependabot).  
- Remove unused or deprecated libraries to reduce the attack surface.  

---

## 7. Infrastructure & CI/CD Security

- Enforce least-privilege IAM roles for build/deploy pipelines.  
- Store CI/CD secrets (API tokens, SSH keys) in secure vaults (e.g., GitHub Secrets, Vault).  
- Run vulnerability scans and automated linting/security checks as part of pipelines.  
- Use signed commits and enforce branch protection rules.  

---

## 8. Monitoring, Logging & Incident Response

- Centralize client-side logging of critical errors with a secure monitoring service (e.g., Sentry).  
- Redact PII from logs and error reports.  
- Define an incident response process: detection, escalation, mitigation, and post-mortem.  

---

## 9. Future Enhancements & Migrations

• **Backend API Migration**: When moving from LocalStorage to a server-side database, ensure all endpoints enforce authentication, authorization, and input validation server-side.  
• **MFA Rollout**: Add multi-factor authentication for privileged operations.  
• **End-to-End Encryption**: Protect data in transit and at rest for highly sensitive PII using client-side encryption before storage.  

---

Adherence to these guidelines will help secure the DSS application against common threats and build a resilient, maintainable system by design. Regularly review and update this document as the project evolves and new risks emerge.

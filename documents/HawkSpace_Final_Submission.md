# HawkSpace Final Delivery Packet

## 1. Cover Page
- **Course Code & Project Title:** CP317A - HawkSpace: Laurier Club Room Booking System  
- **Group ID:** Group 6  
- **GitHub Repository:** https://github.com/SawaabA/HawkSpace  
- **Team Members & Roles:**  
  - **Sawaab Anas - Product Owner & Full-stack Lead (highlighted)**  
  - Manahil Bashir - Scrum Master & Test Coordinator  
  - Mary Joleene Ismael - UX / Visual Designer  
  - Asmah Yasin Mohamed - Firebase & API Engineer  
  - Muqadas Nazif - Data & Reporting Engineer  
  - Efetobore Salubi - Accessibility & Release Engineer  

## 2. Final Project Description (Executive Summary)
**Purpose.** HawkSpace solves the long queue of Laurier club executives who email facilities to reserve rooms without seeing availability. The final product lets students search validated campus rooms, submit structured requests, and track outcomes while giving the bookings office guardrails such as slot validation, conflicts checks, overrides, and analytics (see `web/src/pages/student` and `web/src/pages/admin`).  
**Target Audience.** (1) Club leaders and student groups planning meetings or events. (2) Students' Union operations staff who review and schedule requests. (3) Administrators who must report on room demand for facilities planning.  
**Delivered Features.**  
1. Domain-gated authentication with Firebase Auth plus profile sync and session persistence (`web/src/context/AuthContext.jsx`).  
2. Student experience with four flows: search availability with live slot timeline, submit single or recurring booking requests, review "My Requests," and browse curated campus events.  
3. Admin console with pending/modifed queue, inline conflict calendar, approve/modify/reject/override actions, and monthly utilization reports with CSV export.  
4. Firestore-backed booking engine that protects room slots via transactions, tracks history, enforces max duration, and allows recurring series creation/cancellation (`web/src/services/bookings.js`).  
5. Accessibility and branding enhancements such as global high-contrast toggle, semantic labels, and Laurier campus callouts to meet UI-6 commitments.  
Collectively these features shorten booking turnaround from days to minutes and give staff auditable visibility.

## 3. Final Product Backlog
### A. Completed Stories
| Story ID | Title | Priority | Points | Sprint | Status / Notes |
| --- | --- | --- | --- | --- | --- |
| AUTH-1 | User Authentication | High | 5 | Sprint 1 | **DONE.** Laurier/Gmail-gated login, persistence, and profile hydration implemented in `web/src/context/AuthContext.jsx` and `web/src/pages/auth`. |
| UI-1 | Search Availability | High | 5 | Sprint 1 | **DONE.** Filterable room catalog with live slot timeline (`web/src/pages/student/SearchAvailability.jsx`). |
| UI-2 | Request Booking | High | 8 | Sprint 1 | **DONE.** Structured request form with conflict detection, success states, and route pre-fill (`web/src/pages/student/RequestBooking.jsx`). |
| DB-1 | Save Booking Data | High | 5 | Sprint 1 | **DONE.** Firestore-backed transactions store requests, room day calendars, and history logs (`web/src/services/bookings.js`). |
| UI-4 | View My Bookings | Medium | 5 | Sprint 1 | **DONE.** My Requests page shows singles and recurring series with status chips and admin notes (`web/src/pages/student/MyRequests.jsx`). |
| ADM-1 | Approve / Decline Request | High | 5 | Sprint 2 | **DONE.** Admin queue includes approve/reject/modify flows with audit notes and timeline preview (`web/src/pages/admin/AdminRequests.jsx`). |
| ADM-3 | Override Booking | Medium | 5 | Sprint 3 | **DONE.** Priority override workflow cancels conflicts, approves critical events, and logs history (`web/src/services/bookings.js`). |
| UI-5 | Recurring Booking | Medium | 8 | Sprint 3 | **DONE.** Weekly/monthly recurrence wizard plus bulk cancellation for a series (`web/src/pages/student/RequestBooking.jsx`, `MyRequests.jsx`). |
| REP-1 | Room Utilization Report | Medium | 8 | Sprint 3 | **DONE.** Monthly aggregation and CSV export covering bookings per room and unique students (`web/src/pages/admin/AdminReports.jsx`, `web/src/services/reports.js`). |
| UI-6 | Accessibility Enhancements | Medium | 3 | Sprint 3 | **DONE.** High-contrast toggle, aria labels, readable color system, and keyboard-friendly layout in `StudentLayout.jsx` and `AdminLayout.jsx`. |

### B. Remaining / Deferred Stories
| Story ID | Title | Priority | Points | Sprint | Current Status | Notes / Next Steps |
| --- | --- | --- | --- | --- | --- | --- |
| UI-3 | Cancel Booking | Medium | 3 | Sprint 2 | Partially Done | Admin override/cancellation works, but end-user self-service cancel for single bookings still pending (only recurring series cancellation exists). |
| ADM-2 | Set Booking Policies | High | 8 | Sprint 2 | Deferred | Weekly quota rules were not built; only per-request max duration/timeboxing is enforced. Need per-club quota logic tied to profile usage. |
| NOTIF-1 | Status Notifications | High | 3 | Sprint 2 | Deferred | Email/SMS triggers were postponed while Mailjet deliverability is debugged; UI shows status changes but no outbound notifications yet. |

### C. Reference
The fully detailed Excel backlog, sprint breakdown, and effort logs are attached as `documents/Product Backlog Template MAIN (1).xlsx` per submission requirements.

## 4. Design Document
### A. System Architecture
- **Client Layer.** React + Vite SPA with React Router controlling student and admin shells (`web/src/App.jsx`). Context providers (`AuthContext`, `ThemeContext`) supply auth state, role claims, and accessibility toggles.  
- **Service Layer.** Firebase SDK handles Auth and Firestore on the client. Booking logic encapsulated in `web/src/services/bookings.js`, analytics wrapper in `services/analytics.js`, and reporting queries in `services/reports.js`.  
- **Data Layer.** Firestore collections: `users`, `rooms`, `rooms/{roomId}/days/{date}`, and `bookingRequests`. Day docs maintain slot maps to prevent overlaps, and booking docs store history arrays for auditing.  
- **Ops Scripts.** Node/Firebase Admin scripts (`web/scripts/*.mjs`) seed rooms, create admin users, and verify emails using a service account (`scripts/lib/serviceAccount.js`).  
- **Diagram Placeholder.** _Insert a high-level diagram showing React client -> Firebase Auth/Firestore, real-time listeners, and admin scripts interacting with the same project._

### B. Final UI Screens
Provide the following screenshots/wireframes when exporting to PDF:  
1. **Student Shell & Hero.** Show `StudentLayout` hero banner with call-to-action and highlighted event.  
2. **Search Availability Grid.** Capture filters, equipment pills, and slot timeline to illustrate UI-1.  
3. **Request Booking Form.** Include the recurring booking accordion and conflict legend (UI-2/UI-5).  
4. **My Requests View.** Highlight recurring series visualization and status pills (UI-4).  
5. **Admin Queue & Timeline.** Display decision panel plus override modal (ADM-1/ADM-3).  
6. **Reports Dashboard.** Show monthly summary with CSV export button (REP-1).  
_(Add captions referencing the numbered list when images are inserted.)_

### C. Design Decisions
- **React + Vite** were chosen for fast iteration and built-in HMR. React Router partitions student vs. admin experiences without duplicating layout logic.  
- **Firebase Auth + Firestore** were selected to avoid provisioning custom servers. Auth domain enforcement (`ALLOWED_DOMAIN`) keeps bookings limited to Laurier/Gmail testing accounts.  
- **Slot-based availability model** (30-minute slots, validated via `validateSlotWindow`) simplifies conflict checking and enforces the five-hour maximum requested by the client.  
- **History-first auditing.** Every booking mutation writes a structured history entry, empowering admins to justify overrides or modifications and enabling future notifications.  
- **Accessibility & branding.** High-contrast modes, aria labels (e.g., toggle buttons), and Laurier-inspired gradients align with UI-6 while keeping the experience on-brand.  
- **Offline-friendly scripts.** Admin scripts run locally with service accounts, letting ops teams seed rooms, promote admins, or verify emails without redeploying the front-end.

## 5. User Manual (Quick Start)
### 5.1 Prerequisites
1. Node.js 18+ (`package.json` enforces this).  
2. Firebase project with Auth + Firestore enabled.  
3. Service account JSON stored at `web/serviceAccountKey.json` (already git-ignored) or specified via `FIREBASE_SERVICE_ACCOUNT`.  
4. Update `web/.env` with your Firebase web config (sample values committed for reference).  

### 5.2 Installation & Local Run
```
cd web
npm install
npm run dev        # launches http://localhost:5173
npm run build      # creates production build in dist/
```
Run `npm run preview` to test the production bundle locally. Use `npm run lint` to run ESLint.

### 5.3 Firebase Seeding & Admin Setup
1. **Seed Rooms:** `npm run seed-rooms` writes the curated room list from `src/data/rooms.js` into Firestore.  
2. **Create Admin:** `npm run create-admin admin@mylaurier.ca Admin123! "Campus Admin"` seeds a verified admin user (email must match the Laurier domain).  
3. **Verify Accounts:** If email delivery fails, run `npm run verify-email clubexec.demo@mylaurier.ca` or start the Express helper with `npm run verify-server` and POST `{"email":"..."}` to `http://localhost:3001/verify-email`.  
4. **Set Auth Persistence:** Optional `auth_persistence` key in `localStorage` (`local` or `session`) influences Firebase persistence restoration (`web/src/services/firebase.js`).  

### 5.4 Test Credentials
- **Student / Club:** Create via the Sign Up page or Firebase console. Recommended demo: `clubexec.demo@mylaurier.ca` / `Demo123!` (verify using the script above, then log in at `/login`).  
- **Admin:** After running `npm run create-admin`, sign in with `admin@mylaurier.ca` / `Admin123!` via `/login?intent=admin`.  
Store demo passwords securely if deploying beyond grading.

### 5.5 Feature Walkthroughs
1. **Search Availability (UI-1).** After logging in, open "Find a Space," choose building/capacity/equipment filters, pick a date, and inspect the slot timeline. Gold cells mark pending requests, green mark approvals.  
2. **Submit Request (UI-2/UI-5).** From Search or "Request a Room," choose room/date/start/end, add notes, optionally enable "Make this recurring," then submit. The success card shows the tracking ID.  
3. **Track Requests (UI-4).** Visit "My Requests" to view current status, admin decisions, and cancellation options for recurring series.  
4. **Admin Review (ADM-1/ADM-3).** Navigate to `/admin/requests`, pick a date, select a request, add notes, adjust slots if needed, approve/modify/reject, or open the Override modal for critical events.  
5. **Reporting (REP-1).** Go to `/admin/reports`, pick month/year/room filters, click Generate, and export the CSV for spreadsheet analysis.  
6. **Recurring Cancellation.** From My Requests, click "Cancel Series" to bulk-cancel upcoming events; status updates propagate instantly via listeners.  

## 6. Summary of Testing
### A. Methodology
- **Manual functional testing** across Chrome and Edge covering core student flows, admin actions, and error states (invalid slots, missing notes).  
- **Integration testing** with Firebase emulator project to ensure Firestore transactions prevent slot conflicts and history arrays update atomically.  
- **Ad-hoc verification scripts** (`npm run seed-rooms`, `npm run create-admin`) confirm service-account powered operations.  
- Due to time constraints no automated Jest suite exists; instead, smoke tests are repeated before each sprint review.

### B. Results Table
| Story ID | Test Performed | Expected Result | Actual Result | Pass/Fail |
| --- | --- | --- | --- | --- |
| UI-1 | Filter Science rooms to >=25 capacity with projector, verify timeline in SearchAvailability. | Only SB-201 & SB-310 appear; slots show availability colors. | Filters returned two rooms and timeline matched Firestore day doc. | Pass |
| UI-2 | Submit single booking for LH-205 10:00-12:00 with notes. | Request saved, conflict prevented, success card shows ID. | Request created, success ID displayed, Firestore entry pending. | Pass |
| UI-5 | Create weekly recurring booking (4 weeks) then cancel series. | Four pending requests created; cancel removes them and frees slots. | Series IDs stored, cancellation API set status "cancelled," calendar slots cleared. | Pass |
| ADM-1 | Approve pending request with admin note. | Status changes to approved, admin note stored, calendar shows approved. | Request updated, My Requests pill turned green, slot locked. | Pass |
| REP-1 | Generate report for September (all rooms) then export CSV. | Summary metrics show booking count; CSV downloads with BOM. | Report aggregated (per-room stats) and CSV opened correctly in Excel. | Pass |

### C. Known Issues / Limitations
- Email/SMS notifications are not wired (Story NOTIF-1). Users must check the portal for updates.  
- Student self-service cancellation only exists for recurring series; single-booking cancellation is queued for next release.  
- Timezone conversions assume America/Toronto; multi-campus deployments need per-room timezone in Firestore.  
- Some static text imported from PDFs shows encoding artifacts ("A?") that should be cleaned before production.

## 7. Ethical Dimensions Report
### Privacy, Security, and Mitigations
- **Data minimization.** Booking documents store only student UID/email/display name and event metadata. Sensitive club details are optional notes.  
- **Authentication controls.** `ALLOWED_DOMAIN` forces Laurier or temporary Gmail addresses; admin promotion requires service-account scripts, reducing spoofed access.  
- **Auditability.** History entries capture actor UID, role, timestamp, and action so overrides or cancellations can be traced.  
- **Transport & storage.** Firebase enforces TLS in transit; Firestore security rules (not included here) must restrict writes to owners/admins. Service accounts are kept out of the repo (`scripts/lib/serviceAccount.js`).  
- **Future work.** Add role-based Firestore rulesets, rotate service account keys, encrypt exported CSVs at rest, and purge cancelled requests after retention period.

### Accessibility, Fairness, and Bias
- **Visual accessibility.** High-contrast toggle in both student/admin layouts (`useTheme`) persists in localStorage. Buttons include aria labels so screen readers convey purpose.  
- **Keyboard use.** Navigation uses semantic `<button>` and `<select>` patterns; timeline grids are div-based but ordered to follow DOM reading order.  
- **Inclusive content.** Event cards highlight diverse campus programming to avoid biasing space usage toward well-funded clubs.  
- **Potential bias.** Manual admin review can introduce human bias; future iterations should display anonymized club info or fairness prompts when overriding bookings.

### Reflection: Implemented vs. Future Improvements
- **Implemented now:** domain-gated auth, structured booking workflows, admin accountability, accessible UI toggles, and transparent historical data.  
- **To improve:** automated notifications, analytics that surface clubs underserved by room assignments, and machine-checked policy enforcement (weekly caps, conflict-of-interest alerts). Proactive privacy reviews should accompany each new data export.

## 8. Final Reflection
- **What is complete?** All core MVP stories through Sprint 3 (auth, search, booking, admin management, reports, accessibility) shipped and demo-ready. Firestore data model, recurring logic, and override tooling proved stable during testing.  
- **Biggest technical challenge.** Designing conflict-free transactions for overlapping bookings while supporting overrides required careful slot maps and transaction retries (`web/src/services/bookings.js`). Handling recurring series cancellation without partial failures demanded defensive loops.  
- **What to improve with more time?** Finish policy quotas, self-service cancellation for singles, add notification service (Mailjet or Firebase Functions), clean up encoding artifacts, and automate regression tests (React Testing Library + Firebase emulator).  
- **Next recommended steps.** Harden Firestore security rules, add CI/CD checks, and integrate analytics dashboards into admin view.

_Prepared for the CP317A Final Project submission. Convert this Markdown to PDF (e.g., `npx @marp-team/marp-cli documents/HawkSpace_Final_Submission.md --allow-local-files --pdf`) and append the Excel backlog as an attachment with screenshots noted above._

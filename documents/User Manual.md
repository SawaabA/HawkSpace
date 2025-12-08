% HawkSpace User Manual

## 1. Introduction

HawkSpace is Laurier’s club room booking portal built with React, Firebase Authentication, and Cloud Firestore. This manual walks through day-to-day activities for students, clubs, and administrators so you can find spaces, submit bookings, monitor status, and manage approvals without leaving the app.

## 2. Access & Account Setup

1. **Sign in** at `http://localhost:5174/` (or the hosted URL). Use your `@mylaurier.ca` email; tester accounts such as `test@mylaurier.ca` are preapproved for demos.
2. **Verification**: Confirm your email via the verification link delivered by Firebase (check spam folders). If the link fails, run `npm run verify-email user@mylaurier.ca` or use the verify server script.
3. **Roles**:
   - Students see Search, Request, Events, and My Requests.
   - Admins land on `/admin/requests` and can switch to the student view using the banner toggle.

## 3. Student Experience

### 3.1 Search Availability
- Apply filters for building, capacity, equipment, and date inside the "Search Laurier rooms" card.
- Equipment pills (projector, whiteboard, speakers, mic, HDMI) refine the room list instantly.
- The adjacent timeline shows 30-minute slots for the selected room, coloring pending, approved, and modified states so you can quickly spot conflicts.

### 3.2 Request Booking
1. Select a room, date, start time, and optional end time (auto-populates).
2. Add notes (club name, setup details) and choose "Make this a recurring booking" for weekly/monthly series; the wizard previews how many bookings will be created.
3. Submit the request. If a conflict exists, a warning appears plus pending slots are highlighted in the timeline.
4. The success card shows tracking ID and next steps; use "View my requests" to review statuses.

### 3.3 My Requests
- Lists every booking with status chips (Pending, Approved, Modified).
- Each card displays time, notes, admin responses, and submit timestamps.
- Recurring series entries group the individual dates; an admin-managed cancellation button will appear once enabled.

### 3.4 Events & Accessibility
- `/events` surfaces curated programming with reserve/share buttons plus an upcoming card grid.
- High-contrast mode is available via the toggle in the header. Keyboard navigation focus states and semantic labels keep the interface accessible.

## 4. Admin Operations

### 4.1 Requests Queue
- Pending requests appear in the queue on the left; select one to reveal details on the right.
- The detail pane shows requester info, notes, decision field, and timing controls (Date, Start, End).
- Approve, Modify Window, Override, or Reject are available actions depending on the situation.
- The inline room calendar mirrors the student timeline, showing slot colors and enabling quick reference before decisions.

### 4.2 Overrides & History
- Overrides require a reason and priority level (High Priority or Critical/Emergency); the modal emphasizes that overrides cancel conflicting bookings.
- History text such as "Override completed (check)" confirms operations succeeded.

### 4.3 Reporting
- `/admin/reports` features a Monthly Usage Report. Set Year/Month/Room filters and hit Generate.
- The summary shows approvals, unique student counts, and per-room metrics.
- Use "Export Detailed CSV" to download logs for Excel analysis; exported files include BOM for compatibility.

## 5. Ops Scripts & Troubleshooting

1. **Seed Rooms** – `npm run seed-rooms` populates initial rooms and equipment data.
2. **Create Admin** – `npm run create-admin admin@mylaurier.ca Admin123! "Campus Admin"`.
3. **Verify Email** – `npm run verify-email user@mylaurier.ca` or use `npm run verify-server` with the POST endpoint.
4. **Fix Missing Images** – If Pandoc warnings appear about missing resources, rerun conversion from `/documents` using `--resource-path=images`.
5. **PDF Export** – Install MiKTeX or wkhtmltopdf, then run:
   ```powershell
   cd documents
   pandoc "User Manual.md" -o "User Manual.pdf" --resource-path=images --pdf-engine=pdflatex
   ```
   Replace the engine with `wkhtmltopdf` after installing that binary if you prefer.

## 6. Support & Feedback

- Report bugs through the GitHub repo’s Issues tab.
- Highlight missing email deliverability or accessibility concerns in the weekly standup.
- Future work includes student cancellations, fairness analytics, and refreshed notification providers.

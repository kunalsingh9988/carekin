# Active Care — local prototype

## Scope and routes

This implements the attached Active Care experience inside the existing
frontend-only CareKin application. It is **not ready for real care delivery**.

- `/family/bookings/[id]/active`: family visit status, optional arrival PIN,
  care/emergency brief, local updates preference, check-out confirmation,
  review handoff, and private reporting.
- `/provider/bookings/[id]/active`: arrival, PIN check-in, elapsed timer,
  safety check-ins, care checklist, check-out request, independent safe return,
  and private reporting/interruption.
- `/admin/safety`: severity/status filters, case assignment, required staff
  notes, evidence snapshots, audit history, and overdue safe-return follow-ups.
- Both booking chat routes have a compact visit/safety header, including when
  messaging is restricted. Dashboards and booking details link to Active Care.

## Direction contract — Operate

THESIS: Make the current visit and an immediate, equal path to safety legible
to both participants, without claiming that a local prototype can protect them.

OWN-WORLD: Preserve CareKin's existing semantic palette, typography, small
corners, controls, light/dark themes and workspace layout. No visual rebrand.
Provider initials are explicitly not a verified photograph. Generated lifestyle
images are not identity evidence and are not used as provider portraits here.

STORY: Scheduled → on the way → check-in/active → check-out request → family
confirmation → review. Either participant may interrupt the visit independently.
Provider safe return is independent of family check-out approval.

FIRST VIEWPORT: Task heading and prototype warning, persistent visit status and
safety shield, named participant, timer/schedule, and visit controls. Desktop
separates timeline/brief from actions; narrow screens stack them with a sticky
safety toolbar. Chat retains a compact safety header above its conversation.

FORM: Role-aware native dialog with focus containment, Escape/close handling,
and a persistent emergency link. Emergency access precedes report entry.
Categorized reports keep optional narrative private in participant views.

FINISH: Check ownership, approval, PIN mismatch, guardian consent, terminal
privacy, stale chat sends, storage errors, independent departure, case audit,
and both themes at mobile/tablet/desktop widths. Preserve the user's explicit
no-visible-focus-style preference; keyboard navigation itself remains enabled.

## Implemented boundaries

All data goes through `src/lib/storage/client.ts`. `care.ts` is the local
repository seam. Existing records get a derived visit state without a reset.
Check-in and family-confirmed check-out update the booking and existing demo
payout ledger; no transfer or real financial decision occurs.

The optional six-digit PIN is visible only in the family context DTO and must
match at provider check-in. Child visits require an existing, non-withdrawn
guardian consent record. Sharing a child's brief also requires an explicit
guardian acknowledgement. These checks are demo behavior, not secure auth.

Provider context shows the address only within two hours of the scheduled
start or during care, and hides it after the visit ends. Sensitive notes and
the authorized emergency brief are limited to the active visit. Personal
phone numbers are not exposed by the call action. The UI explicitly identifies
approval as demo approval, not real identity verification.

Sensitive reports restrict visit messaging at read/send time, including stale
chat screens. Timeline and message snapshots are retained in a separate case.
The counterpart gets no case narrative, reporter detail or sensitive report
notification in their participant view. Ordinary service reports do not
automatically restrict contact. Either party may interrupt without permission;
this marks the booking disputed for later review, not automatic punishment.
Resolving a case does not restore chat, suspend accounts or move money.

Critical local writes are read back before confirming success. This does not
make localStorage transactional, tamper-proof or encrypted. Browser storage,
demo role switching and client checks do **not** provide real access control.
Use fictional data only. Multiple devices do not share state.

## Deliberately not represented as live services

- `tel:112` is a direct emergency dial link. CareKin dispatches nobody.
- Masked calling and staffed urgent support are not connected. Their actions
  explain that limitation instead of exposing personal numbers or inventing a
  support number.
- Trusted sharing is an explicitly consented, manual clipboard status snapshot,
  not a live share link. It excludes address, medical notes and private contacts.
  The separate location/details copy action uses recorded demo details and
  tells the user to verify their actual location. No geolocation is requested.
- Notifications are browser-local. Trusted contacts do not receive alerts.
- Safety reminders run only while the page is open. Overdue safe-return flags
  are calculated when the operations queue is loaded/refreshed, not by a worker.
- Reassignment, replacement care, welfare checks, wellbeing follow-up,
  account restrictions, earnings protection and refund decisions require a
  human process; the case note documents review but does not execute it.
- Timestamps come from the device, not a trusted server. The simulator permits
  testing a future confirmed visit now; no real attendance is proved.

## Required before a real launch

1. Real authentication and server-authorized family/provider/staff access;
   row-level policies, scoped DTOs, encryption, retention/deletion policy and
   access logs for health/contact/location records. Review child/guardian and
   designated family consent, including withdrawal during an active visit.
2. Server-recorded, atomic visit state transitions, idempotency and concurrency
   control; enforce schedule, identity, current consent, secure hashed/expiring
   PINs, check-out rules and restricted contact on the server.
3. Append-only evidence and staff audit storage, protected from counterpart
   access and browser tampering. Case creation/restriction/evidence preservation
   must succeed atomically; add retry/reconciliation and failure monitoring.
4. Staffed urgent response with verified contact paths, triage SLAs, welfare
   checks, escalation/retaliation safeguards, replacement-care and independent
   earnings/refund procedures. Test operational drills, not just UI.
5. Server notifications and scheduled safe-return jobs, delivery acknowledgements,
   escalation and reliable recovery. A missed check-in is not proof of misconduct.
6. Consent-scoped, revocable trusted-contact share links, minimal disclosed data,
   expiry/access audit; masked communications with enforced contact restrictions.
   Do not add live location or recordings without separate privacy/consent work.
7. Integration/security/accessibility tests and an emergency-access review on
   actual phones. Never place emergency test calls. Reconsider the requested
   removal of visible keyboard focus before an accessibility-compliant launch.

## Verification

`care.test.ts` covers participant scoping, hidden PINs, wrong PIN, provider
approval, legacy bypass, check-in/checklist, guardian consent and withdrawal,
brief privacy, local update preferences, family check-out/payout idempotence,
independent safe return/interruption, private reports/evidence, stale chat
read/send restrictions, audit/ownership, service-report distinction, overdue
follow-ups and failed-storage handling. Browser checks use fictional QA data
and do not dial emergency numbers or transmit locations/medical information.

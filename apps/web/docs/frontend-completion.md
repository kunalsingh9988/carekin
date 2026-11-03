# Additional frontend pages

This extension adds 14 route templates to the existing 38. It remains a
browser-local demo, not a secure backend or a live care service.

## Route inventory

- Public: `/help`, `/contact`, `/privacy`, `/terms`, `/cancellation-policy`.
- Family: `/family/plans`, `/family/plans/[id]`, `/family/bookings/[id]/reschedule`.
- Provider: `/provider/availability`, `/provider/profile`, `/provider/bookings/[id]`.
- Admin: `/admin/users`, `/admin/providers/[id]`, `/admin/bookings/[id]`.

## Direction contract

THESIS: Extend the existing care journey with actionable management and clear
explanations, rather than disconnected landing pages.

OWN-WORLD: Preserve the existing semantic violet/neutral tokens, paired themes,
Figtree/Bricolage typography, 48px controls and illustrative care photographs.

STORY: Readers find help without signing up; families manage recorded plans
and visits; providers edit profiles/hours; admins inspect linked records.
Local state changes always explain their demo-only consequences.

FIRST VIEWPORT: A task heading, plain-language description, optional compact
care image and relevant back link lead into a responsive working area. Detail
screens pair readable records with a self-contained action panel. Mobile
stacks records and actions without clipping.

FORM: Code-led extension of existing Operate and Read surfaces; the user
selected the precise 14-page scope. No replacement visual-world round.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Functional boundaries

- Support requests are saved as local drafts, never sent.
- Policy pages describe the prototype and explicitly await business/legal approval.
- Availability is a local weekly preference, not live inventory or acceptance.
- Rescheduling validates ownership, future times and overlapping stored bookings.
- Plan status changes leave existing bookings and money unchanged.
- Admin directory is read-only; production account access controls remain backend work.
- Approval decisions, visit transitions and payout records remain simulations.
- Existing role guards auto-enter role-specific demo accounts. They are not authorization.
- Existing lifestyle images are reused; no new generated provider identity imagery.

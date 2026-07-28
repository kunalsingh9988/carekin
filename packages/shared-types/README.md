# @carekin/shared-types — frozen, mobile-only

This package is **not** the source of truth for new work. It's kept only
because `apps/mobile` (paused per the Supabase architecture pivot — see
`archive/README.md`) imports its uppercase-valued enums (`"FAMILY"`,
`"CAREGIVER"`, etc.) and rewriting the mobile screens wasn't in scope for
that pivot.

New work — `apps/web` and everything Supabase-backed — uses
`@carekin/validation` instead, which mirrors the actual Postgres enum
values (lowercase: `"family"`, `"caregiver"`, etc.). The two packages are
**not** interchangeable — don't try to consolidate them without also
updating every mobile screen's string literals to match.

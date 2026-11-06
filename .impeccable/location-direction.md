# Address picker extension

Mode: Operate. User-pinned flow follows food-delivery location selection: GPS or address search, adjust a map pin, review address details, then confirm. Preserve CareKin's existing brand and fallback location controls.

## Direction contract

THESIS: A readable address and deliberately confirmed pin, not a raw coordinate result mistaken for a postal address.

OWN-WORLD: CareKin semantic light/dark surfaces, violet primary actions, established form controls, Lucide icons. Geoapify's real map tiles provide geographic content, with attribution retained.

STORY: Open the address picker with mapping-provider disclosure; use GPS or search; move the map under a fixed pin; add private flat/landmark details; confirm. Cancel preserves the previously saved location.

FIRST VIEWPORT: A compact location summary and choose/change action in the parent form. A focused dialog opens a search field, current-location action and large map; address confirmation sits beside it on desktop and below it on phones. Detail fields remain scrollable at small heights.

FORM: Precisely requested task-flow extension inside an established interface; code-led. seed: none (unavailable).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

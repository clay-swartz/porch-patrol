# Porch Patrol Component System + CMS Foundation

**Branch:** `feature/cms-component-foundation`  
**Production impact:** none. The current `main` implementation remains the live source until the migration is explicitly approved.

## Purpose

Turn the current Porch Patrol production UI into a small, reusable design system that can later be controlled by a simple CMS without exposing raw CSS or arbitrary layout controls.

The CMS should let an editor change copy, images, items, section order, visibility, and approved variants while preserving Porch Patrol's spacing, typography, gutters, colors, responsive behavior, states, and accessibility.

## Current production component map

### Global components

| Component | Current production DOM | CMS role |
| --- | --- | --- |
| `SiteHeader` | `.site-header` | Edit phone/service area through global site settings |
| `LeadDialog` | `#plan-dialog` | Edit lead-dialog copy; form behavior remains application logic |
| `SiteFooter` | `footer` | Edit location/phone/year through global site settings |

### Home page components

| Component | Current production DOM | Current variant | Reusable? |
| --- | --- | --- | --- |
| `HeroLead` | `.hero.hero-patterned` | `patternedNavy` | Singleton hero |
| `ProcessSteps` | `.pp-process-section` | `mediaSwap` | Yes |
| `ServiceTicker` | `.pp-service-ticker-wrap` | `creamBento` | Yes |
| `FAQAccordion` | `.faq-section` | `standard` | Yes |
| `CTABand` | `.final-cta` | `centered` | Yes |

### Approved reusable component not currently instantiated

#### `HorizontalContentStrip`

This preserves the component idea originally established by the "What we handle" work even though the current production page now uses the lighter service ticker instead.

Its contract is:

`eyebrow? → headline → supportingText? → compact icon/label grid`

Approved variants:

- `cream`
- `white`
- `navy`

Approved density choices:

- `compact`
- `standard`

A future editor should be able to add this block, choose an approved variant, edit the content, reorder the icon/label items, and move the whole block up or down the page without touching CSS.

## Content source of truth

`content/site.json` is the CMS-ready representation of the current production content.

It separates:

- global site settings
- global components
- page-level component order
- component content
- component variants
- enabled/hidden state

The file intentionally does **not** expose arbitrary pixel values, colors, fonts, radii, breakpoints, or free-form CSS.

## Validation

`content/site.schema.json` is the machine-readable JSON Schema for the content model.

It defines:

- allowed component types
- allowed variants
- required fields
- repeatable item structures
- practical content limits
- CTA structure
- image structure
- page section ordering data

The future admin can validate a draft against this schema before publishing.

## Editor blueprint

`src/components/registry.js` describes how each component should appear in the future admin editor.

Examples:

- plain text field
- textarea
- toggle
- image picker
- link field
- reorderable repeater
- icon + label repeater
- approved segmented variant control

The editor registry is deliberately stricter than a WYSIWYG page builder.

## Render layer

`src/components/renderers.js` contains framework-agnostic renderers for the current production components.

The renderers preserve the existing class contracts so we can migrate incrementally rather than redesign the site.

They are **not connected to production yet**.

When the migration step is approved, the current hard-coded section markup can be replaced section-by-section with render output from `content/site.json`.

## Design controls that remain locked in code

The CMS should never expose unrestricted controls for:

- fonts
- font sizes
- line heights
- arbitrary colors
- arbitrary spacing
- max widths
- gutters
- breakpoint values
- border radius
- shadows
- animation timing
- focus treatment
- responsive layout rules

Those are component-system responsibilities.

## Content controls intended for the CMS

Editors should be able to:

- edit copy
- edit CTA labels/links
- add/remove/reorder repeatable items
- add/remove/reorder approved page components
- hide/show a component
- swap images
- edit alt text
- select an approved component variant
- preview a draft
- publish

## Component identity

Each page component has:

- `id`: stable instance identity
- `type`: renderer/component contract
- `variant`: approved visual treatment
- `enabled`: visibility
- component-specific content fields

This is important for the future database: content can change without losing the identity of the component instance.

## Recommended CMS database shape

The JSON model is intentionally compatible with a very small Supabase setup.

### `site_pages`

- `id`
- `slug`
- `title`
- `draft_content jsonb`
- `published_content jsonb`
- `published_at`
- `updated_at`

### `site_settings`

- `id`
- `draft_content jsonb`
- `published_content jsonb`
- `updated_at`

This keeps the first version simple. We do **not** need a separate SQL table for every component type.

If component-level revision history becomes important later, that can be added without changing the public content contract.

## Publishing model

Recommended flow:

1. Admin loads `draft_content`.
2. Editor changes content/components.
3. Draft validates against `site.schema.json`.
4. Preview renders the draft through the same component renderers used by production.
5. Publish copies the validated draft to `published_content`.
6. Production reads `published_content`.

That gives the user an effectively instant front-end update without a Git commit or Vercel build for normal content changes.

## Migration sequence

1. **Foundation — complete on this branch**
   - current production content extracted to JSON
   - schema defined
   - component registry defined
   - renderers created

2. **No-visual-change runtime migration**
   - load the same content from JSON
   - render one section at a time
   - verify output against current production
   - keep form behavior and interaction controllers intact

3. **Supabase content source**
   - create `site_pages` and `site_settings`
   - seed with the validated current production JSON
   - keep a static fallback

4. **Private admin**
   - authentication
   - page outline
   - edit component
   - reorder
   - add approved component
   - preview
   - publish

5. **Media library**
   - upload/select images
   - alt text
   - replace media without code changes

## Important implementation rule

A CMS "component" is not a screenshot recreation. It is a stable UI contract.

For example, creating another `HorizontalContentStrip` with different content must automatically inherit the same Porch Patrol:

- shell width
- section rhythm
- typography hierarchy
- icon treatment
- responsive grid
- mobile behavior
- focus behavior
- approved color variant

That is the standard for every component added to this system.

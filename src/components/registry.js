/**
 * Porch Patrol component registry
 *
 * This file is intentionally framework-agnostic. It describes which UI blocks
 * the future editor may create, which variants are allowed, and which fields
 * are content-editable. Visual tokens (spacing, typography, radii, colors,
 * breakpoints) remain in the frontend CSS and are not exposed as free-form CMS
 * controls.
 */

export const componentRegistry = {
  heroLead: {
    label: "Hero",
    kind: "section",
    singleton: true,
    variants: ["patternedNavy"],
    defaultVariant: "patternedNavy",
    editor: {
      groups: [
        {
          label: "Message",
          fields: [
            { path: "headlineLines", label: "Headline", control: "lineList", min: 1, max: 3 },
            { path: "subhead", label: "Subhead", control: "textarea" },
            { path: "proofLabel", label: "Proof label", control: "text" },
            { path: "proofItems", label: "Proof examples", control: "list", min: 1, max: 12 },
            { path: "priceLine", label: "Price line", control: "text" }
          ]
        },
        {
          label: "Lead form",
          fields: [
            { path: "form.headline", label: "Form headline", control: "text" },
            { path: "form.submitLabel", label: "Button label", control: "text" },
            { path: "form.reassurance", label: "Reassurance", control: "text" },
            { path: "form.successMessage", label: "Success message", control: "text" }
          ]
        }
      ]
    }
  },

  processSteps: {
    label: "Process / Steps",
    kind: "section",
    singleton: false,
    variants: ["mediaSwap"],
    defaultVariant: "mediaSwap",
    editor: {
      groups: [
        {
          label: "Heading",
          fields: [
            { path: "eyebrow", label: "Eyebrow", control: "text" },
            { path: "headline", label: "Headline", control: "text" },
            { path: "supportingText", label: "Supporting text", control: "textarea" }
          ]
        },
        {
          label: "Steps",
          fields: [
            {
              path: "steps",
              label: "Steps",
              control: "repeater",
              min: 2,
              max: 6,
              reorderable: true,
              fields: [
                { path: "heading", label: "Heading", control: "text" },
                { path: "body", label: "Body", control: "textarea" },
                { path: "mediaLabel", label: "Image label", control: "text" },
                { path: "image.src", label: "Image", control: "image" },
                { path: "image.alt", label: "Alt text", control: "text" }
              ]
            }
          ]
        }
      ]
    }
  },

  serviceTicker: {
    label: "Service Ticker",
    kind: "section",
    singleton: false,
    variants: ["creamBento"],
    defaultVariant: "creamBento",
    editor: {
      groups: [
        {
          label: "Ticker items",
          fields: [
            {
              path: "items",
              label: "Items",
              control: "iconLabelRepeater",
              min: 3,
              max: 30,
              reorderable: true
            }
          ]
        },
        {
          label: "CTA",
          fields: [
            { path: "cta.label", label: "Button label", control: "text" },
            { path: "cta.href", label: "Button link", control: "link" },
            { path: "cta.showArrow", label: "Show arrow", control: "toggle" }
          ]
        }
      ]
    }
  },

  horizontalContentStrip: {
    label: "Horizontal Content Strip",
    kind: "section",
    singleton: false,
    variants: ["cream", "white", "navy"],
    defaultVariant: "cream",
    editor: {
      groups: [
        {
          label: "Heading",
          fields: [
            { path: "eyebrow", label: "Eyebrow", control: "text", optional: true },
            { path: "headline", label: "Headline", control: "text" },
            { path: "supportingText", label: "Supporting text", control: "textarea", optional: true }
          ]
        },
        {
          label: "Items",
          fields: [
            {
              path: "items",
              label: "Icon + label items",
              control: "iconLabelRepeater",
              min: 2,
              max: 24,
              reorderable: true
            }
          ]
        },
        {
          label: "Layout",
          fields: [
            {
              path: "density",
              label: "Spacing",
              control: "segmented",
              options: [
                { label: "Compact", value: "compact" },
                { label: "Standard", value: "standard" }
              ]
            }
          ]
        }
      ]
    }
  },

  faqAccordion: {
    label: "FAQ",
    kind: "section",
    singleton: false,
    variants: ["standard"],
    defaultVariant: "standard",
    editor: {
      groups: [
        {
          label: "Heading",
          fields: [
            { path: "headline", label: "Headline", control: "text" },
            { path: "intro.prefix", label: "Intro text", control: "text" },
            { path: "intro.linkLabel", label: "Contact link label", control: "text" },
            { path: "intro.href", label: "Contact link", control: "link" }
          ]
        },
        {
          label: "Questions",
          fields: [
            {
              path: "items",
              label: "Questions",
              control: "repeater",
              min: 1,
              max: 30,
              reorderable: true,
              fields: [
                { path: "question", label: "Question", control: "text" },
                { path: "lead", label: "Optional bold lead", control: "text", optional: true },
                { path: "answer", label: "Answer", control: "textarea" }
              ]
            }
          ]
        }
      ]
    }
  },

  ctaBand: {
    label: "CTA Band",
    kind: "section",
    singleton: false,
    variants: ["centered"],
    defaultVariant: "centered",
    editor: {
      groups: [
        {
          label: "CTA",
          fields: [
            { path: "headline", label: "Headline", control: "text" },
            { path: "cta.label", label: "Button label", control: "text" },
            { path: "cta.href", label: "Button link", control: "link" }
          ]
        }
      ]
    }
  }
};

export const globalComponentRegistry = {
  siteHeader: {
    label: "Site Header",
    kind: "global",
    variants: ["standard"],
    editor: {
      source: "site",
      fields: [
        { path: "site.phoneDisplay", label: "Phone number", control: "text" },
        { path: "site.serviceAreaShort", label: "Service area", control: "text" }
      ]
    }
  },

  leadDialog: {
    label: "Lead Dialog",
    kind: "global",
    variants: ["standard"],
    editor: {
      fields: [
        { path: "eyebrow", label: "Eyebrow", control: "text" },
        { path: "headline", label: "Headline", control: "text" },
        { path: "supportingText", label: "Supporting text", control: "textarea" },
        { path: "priceNote", label: "Price note", control: "text" },
        { path: "submitLabel", label: "Button label", control: "text" },
        { path: "successMessage", label: "Success message", control: "text" }
      ]
    }
  },

  siteFooter: {
    label: "Site Footer",
    kind: "global",
    variants: ["standard"],
    editor: {
      source: "site",
      fields: [
        { path: "site.serviceAreaLong", label: "Location", control: "text" },
        { path: "site.phoneDisplay", label: "Phone number", control: "text" },
        { path: "site.copyrightYear", label: "Copyright year", control: "number" }
      ]
    }
  }
};

export function getComponentDefinition(type) {
  return componentRegistry[type] || globalComponentRegistry[type] || null;
}

export function getAddableComponents() {
  return Object.entries(componentRegistry).map(([type, definition]) => ({
    type,
    label: definition.label,
    variants: definition.variants,
    defaultVariant: definition.defaultVariant
  }));
}

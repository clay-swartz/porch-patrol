/**
 * Porch Patrol reusable component renderers.
 *
 * These mirror the current production DOM/class contracts but are not wired
 * into index.html yet. The live site remains unchanged until the migration
 * step is explicitly approved.
 */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attr(name, value) {
  if (value === undefined || value === null || value === "") return "";
  return " " + name + '="' + escapeHtml(value) + '"';
}

function patternSvg(id, className) {
  return [
    '<svg class="' + className + '" aria-hidden="true" preserveAspectRatio="none">',
      "<defs>",
        '<pattern id="' + escapeHtml(id) + '" width="144" height="96" patternUnits="userSpaceOnUse">',
          '<text x="20" y="28" font-size="22">home</text>',
          '<text x="68" y="28" font-size="22">build</text>',
          '<text x="116" y="28" font-size="22">lightbulb</text>',
          '<text x="20" y="76" font-size="22">cleaning_services</text>',
          '<text x="68" y="76" font-size="22">potted_plant</text>',
          '<text x="116" y="76" font-size="22">search</text>',
        "</pattern>",
      "</defs>",
      '<rect width="100%" height="100%" fill="url(#' + escapeHtml(id) + ')"></rect>',
    "</svg>"
  ].join("");
}

export function renderSiteHeader(site, component = {}) {
  if (component.enabled === false) return "";

  return [
    '<header class="site-header" data-pp-component="siteHeader">',
      '<div class="header-inner">',
        '<a class="wordmark" href="#" aria-label="' + escapeHtml(site.name) + ' home">Porch <span>Patrol</span></a>',
        '<div class="header-actions">',
          '<a class="phone-link"' + attr("href", site.phoneHref) + ">" + escapeHtml(site.phoneDisplay) + "</a>",
          '<div class="service-area">' + escapeHtml(site.serviceAreaShort) + "</div>",
        "</div>",
      "</div>",
    "</header>"
  ].join("");
}

export function renderHeroLead(component, context = {}) {
  if (component.enabled === false) return "";

  const form = component.form || {};
  const site = context.site || {};
  const phoneHref = site.phoneHref || "tel:+19034618877";
  const phoneDisplay = site.phoneDisplay || "903-461-8877";
  const fields = (form.fields || []).map((field) => {
    return [
      '<input class="field"',
      attr("type", field.type || "text"),
      attr("name", field.name),
      attr("placeholder", field.label),
      attr("aria-label", field.label),
      attr("autocomplete", field.autocomplete),
      attr("inputmode", field.inputmode),
      field.required ? " required" : "",
      ">"
    ].join("");
  }).join("");

  const headline = (component.headlineLines || []).map(escapeHtml).join("<br>");
  const proof = (component.proofItems || []).map(escapeHtml).join(" · ");

  return [
    '<section class="hero hero-patterned" data-pp-component="heroLead" data-pp-variant="' + escapeHtml(component.variant) + '">',
      '<div class="hero-navy-base" aria-hidden="true"></div>',
      patternSvg("porchPatrolHeroPattern", "hero-pattern-layer"),
      '<div class="hero-pattern-wash" aria-hidden="true"></div>',
      '<div class="hero-inner">',
        '<div class="hero-copy">',
          "<h1>" + headline + "</h1>",
          '<p class="hero-lede">' + escapeHtml(component.subhead) + "</p>",
          '<p class="hero-proof-line"><strong>' + escapeHtml(component.proofLabel) + "</strong> " + proof + "</p>",
          '<div class="hero-price-note">' + escapeHtml(component.priceLine) + "</div>",
        "</div>",
        '<form class="signup-card" id="signup">',
          '<input type="hidden" name="Plan" id="selected-plan"' + attr("value", form.defaultPlan || "Front Entry") + ">",
          '<input type="hidden" name="_subject" value="New Porch Patrol service request">',
          '<input type="hidden" name="_template" value="table">',
          '<input type="text" name="_honey" tabindex="-1" autocomplete="off" style="display:none">',
          "<h2>" + escapeHtml(form.headline) + "</h2>",
          '<div class="form-stack hero-form-grid">',
            fields,
            '<button class="button" type="submit">' + escapeHtml(form.submitLabel) + "</button>",
          "</div>",
          '<div class="form-note" id="form-plan-note">' + escapeHtml(form.reassurance) + "</div>",
          '<div class="mobile-form-note" id="mobile-form-note">' + escapeHtml(form.reassurance) + "</div>",
          '<div class="success" id="form-success" role="status" aria-live="polite">' + escapeHtml(form.successMessage) + "</div>",
          '<div class="form-error" id="form-error" role="alert" aria-live="assertive">Something didn’t send. Please call us at <a' + attr("href", phoneHref) + '>' + escapeHtml(phoneDisplay) + '</a>.</div>',
        "</form>",
      "</div>",
    "</section>"
  ].join("");
}

export function renderProcessSteps(component) {
  if (component.enabled === false) return "";

  const componentId = component.id || "process";
  const headingId = componentId + "-heading";
  const labelId = componentId + "-media-label";

  const stepButtons = (component.steps || []).map((step, index) => {
    const active = index === 0;
    return [
      '<button type="button" class="pp-process-step' + (active ? " active" : "") + '"',
      ' data-process-index="' + index + '"',
      ' data-process-label="' + escapeHtml(step.mediaLabel) + '"',
      ' aria-pressed="' + (active ? "true" : "false") + '">',
        '<span class="pp-process-step-number">' + (index + 1) + "</span>",
        '<span class="pp-process-step-copy">',
          "<strong>" + escapeHtml(step.heading) + "</strong>",
          "<span>" + escapeHtml(step.body) + "</span>",
        "</span>",
      "</button>"
    ].join("");
  }).join("");

  const photos = (component.steps || []).map((step, index) => {
    return [
      '<img loading="lazy" decoding="async" class="pp-process-photo' + (index === 0 ? " active" : "") + '"',
      ' data-process-photo="' + index + '"',
      attr("src", step.image && step.image.src),
      attr("alt", step.image && step.image.alt),
      ">"
    ].join("");
  }).join("");

  return [
    '<section class="section pp-process-section" data-pp-component="processSteps" data-pp-instance="' + escapeHtml(componentId) + '"' + attr("aria-labelledby", headingId) + ">",
      '<div class="shell">',
        '<div class="pp-process-intro">',
          '<div class="pp-process-eyebrow">' + escapeHtml(component.eyebrow) + "</div>",
          '<h2 id="' + escapeHtml(headingId) + '">' + escapeHtml(component.headline) + "</h2>",
          "<p>" + escapeHtml(component.supportingText) + "</p>",
        "</div>",
        '<div class="pp-process-layout">',
          '<div class="pp-process-steps" role="list" aria-label="What happens each visit">' + stepButtons + "</div>",
          '<div class="pp-process-media" aria-live="polite">',
            photos,
            '<div class="pp-process-media-label" id="' + escapeHtml(labelId) + '">' + escapeHtml(component.steps?.[0]?.mediaLabel || "") + "</div>",
          "</div>",
        "</div>",
      "</div>",
    "</section>"
  ].join("");
}

function renderTickerItems(items, ariaHidden = false) {
  return [
    '<div class="pp-service-ticker__set"' + (ariaHidden ? ' aria-hidden="true"' : ' role="list"') + ">",
      (items || []).map((item) => [
        '<div class="pp-service-ticker__item"' + (ariaHidden ? "" : ' role="listitem"') + ">",
          '<span class="pp-service-ticker__icon"><span class="material-symbols-rounded">' + escapeHtml(item.icon) + "</span></span>",
          "<span>" + escapeHtml(item.label) + "</span>",
        "</div>"
      ].join("")).join(""),
    "</div>"
  ].join("");
}

export function renderServiceTicker(component) {
  if (component.enabled === false) return "";

  const cta = component.cta || {};
  return [
    '<section class="pp-service-ticker-wrap" data-pp-component="serviceTicker" data-pp-variant="' + escapeHtml(component.variant) + '"' + attr("aria-label", component.ariaLabel) + ">",
      '<div class="shell">',
        '<div class="pp-service-ticker">',
          '<div class="pp-service-ticker__viewport" tabindex="0"' + attr("aria-label", component.pauseInstruction) + ">",
            '<div class="pp-service-ticker__track">',
              renderTickerItems(component.items, false),
              renderTickerItems(component.items, true),
            "</div>",
          "</div>",
          '<a class="pp-service-ticker__cta"' + attr("href", cta.href) + ">",
            "<span>" + escapeHtml(cta.label) + "</span>",
            cta.showArrow ? '<span class="pp-service-ticker__cta-arrow" aria-hidden="true">→</span>' : "",
          "</a>",
        "</div>",
      "</div>",
    "</section>"
  ].join("");
}

export function renderHorizontalContentStrip(component) {
  if (component.enabled === false) return "";

  const variantClass = "pp-content-strip--" + escapeHtml(component.variant || "cream");
  const densityClass = "pp-content-strip--" + escapeHtml(component.density || "compact");

  return [
    '<section class="pp-content-strip ' + variantClass + " " + densityClass + '" data-pp-component="horizontalContentStrip">',
      '<div class="shell">',
        '<div class="pp-content-strip__header">',
          component.eyebrow ? '<div class="pp-content-strip__eyebrow">' + escapeHtml(component.eyebrow) + "</div>" : "",
          "<h2>" + escapeHtml(component.headline) + "</h2>",
          component.supportingText ? "<p>" + escapeHtml(component.supportingText) + "</p>" : "",
        "</div>",
        '<div class="pp-content-strip__grid" role="list">',
          (component.items || []).map((item) => [
            '<div class="pp-content-strip__item" role="listitem">',
              '<span class="pp-content-strip__icon"><span class="material-symbols-rounded">' + escapeHtml(item.icon) + "</span></span>",
              '<span class="pp-content-strip__label">' + escapeHtml(item.label) + "</span>",
            "</div>"
          ].join("")).join(""),
        "</div>",
      "</div>",
    "</section>"
  ].join("");
}

export function renderFAQAccordion(component) {
  if (component.enabled === false) return "";

  const intro = component.intro || {};
  const items = (component.items || []).map((item) => {
    return [
      '<details class="faq-item">',
        "<summary>" + escapeHtml(item.question) + "</summary>",
        "<p>",
          item.lead ? "<strong>" + escapeHtml(item.lead) + "</strong> " : "",
          escapeHtml(item.answer),
        "</p>",
      "</details>"
    ].join("");
  }).join("");

  return [
    '<section class="faq-section" data-pp-component="faqAccordion">',
      '<div class="faq-wrap">',
        '<div class="section-heading">',
          "<h2>" + escapeHtml(component.headline) + "</h2>",
          "<p>" + escapeHtml(intro.prefix) + ' <a class="faq-contact-link"' + attr("href", intro.href) + ">" + escapeHtml(intro.linkLabel) + "</a>.</p>",
        "</div>",
        '<div class="faq-list">' + items + "</div>",
      "</div>",
    "</section>"
  ].join("");
}

export function renderCTABand(component) {
  if (component.enabled === false) return "";

  return [
    '<section class="final-cta" data-pp-component="ctaBand">',
      "<h2>" + escapeHtml(component.headline) + "</h2>",
      '<a class="button"' + attr("href", component.cta && component.cta.href) + ' style="display:inline-flex;align-items:center;margin-top:24px;">',
        escapeHtml(component.cta && component.cta.label),
      "</a>",
    "</section>"
  ].join("");
}

export function renderLeadDialog(component, context = {}) {
  if (component.enabled === false) return "";

  const site = context.site || {};
  const phoneHref = site.phoneHref || "tel:+19034618877";
  const phoneDisplay = site.phoneDisplay || "903-461-8877";

  return [
    '<dialog class="plan-dialog" id="plan-dialog" aria-labelledby="plan-dialog-title" data-pp-component="leadDialog">',
      '<div class="plan-dialog-card">',
        '<button type="button" class="plan-dialog-close" aria-label="Close form">×</button>',
        '<div class="plan-dialog-copy">',
          '<p class="plan-dialog-eyebrow">' + escapeHtml(component.eyebrow) + "</p>",
          '<h2 id="plan-dialog-title">' + escapeHtml(component.headline) + "</h2>",
          '<p class="plan-dialog-sub" id="plan-dialog-note">' + escapeHtml(component.supportingText) + "</p>",
        "</div>",
        '<form id="plan-dialog-form">',
          '<input type="hidden" name="Plan" id="dialog-selected-plan"' + attr("value", component.defaultPlan || "Front Entry") + ">",
          '<input type="text" name="_honey" tabindex="-1" autocomplete="off" style="display:none">',
          '<div class="form-stack">',
            '<input class="field" type="text" name="Home Address" placeholder="Home address" aria-label="Home address" autocomplete="street-address" required>',
            '<input class="field" type="text" name="Name" placeholder="Your name" aria-label="Your name" autocomplete="name" required>',
            '<input class="field" type="tel" name="Mobile" placeholder="Mobile number" aria-label="Mobile number" autocomplete="tel" inputmode="tel" required>',
            '<button class="button" type="submit">' + escapeHtml(component.submitLabel) + "</button>",
          "</div>",
          '<div class="plan-dialog-price" id="plan-dialog-price">' + escapeHtml(component.priceNote) + "</div>",
          '<div class="success" id="dialog-success" role="status" aria-live="polite">' + escapeHtml(component.successMessage) + "</div>",
          '<div class="form-error" id="dialog-error" role="alert" aria-live="assertive">Something didn’t send. Please call us at <a' + attr("href", phoneHref) + '>' + escapeHtml(phoneDisplay) + '</a>.</div>',
        "</form>",
      "</div>",
    "</dialog>"
  ].join("");
}

export function renderSiteFooter(site, component = {}) {
  if (component.enabled === false) return "";

  return [
    '<footer data-pp-component="siteFooter">',
      '<div class="footer-inner">',
        '<div class="footer-brand">Porch <span>Patrol</span></div>',
        '<div class="footer-meta">',
          "<span>" + escapeHtml(site.serviceAreaLong) + "</span>",
          '<a' + attr("href", site.phoneHref) + ">" + escapeHtml(site.phoneDisplay) + "</a>",
          "<span>© " + escapeHtml(site.copyrightYear) + " " + escapeHtml(site.name) + "</span>",
        "</div>",
      "</div>",
    "</footer>"
  ].join("");
}

export const componentRenderers = {
  heroLead: renderHeroLead,
  processSteps: renderProcessSteps,
  serviceTicker: renderServiceTicker,
  horizontalContentStrip: renderHorizontalContentStrip,
  faqAccordion: renderFAQAccordion,
  ctaBand: renderCTABand
};

export function renderPage(page, context = {}) {
  return (page.sections || [])
    .filter((section) => section.enabled !== false)
    .map((section) => {
      const renderer = componentRenderers[section.type];
      if (!renderer) {
        console.warn("Unknown Porch Patrol component type:", section.type);
        return "";
      }
      return renderer(section, context);
    })
    .join("");
}

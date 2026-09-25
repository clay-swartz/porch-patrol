import {
  renderSiteHeader,
  renderPage,
  renderLeadDialog,
  renderSiteFooter
} from "./components/renderers.js";

const CONTENT_URL = "/content/site.json";

function assertContentShape(content) {
  if (!content || typeof content !== "object") {
    throw new Error("Site content is missing.");
  }

  if (content.schemaVersion !== 1) {
    throw new Error("Unsupported site content schema version.");
  }

  if (!content.site || !content.global || !content.pages?.home) {
    throw new Error("Site content is incomplete.");
  }

  if (!Array.isArray(content.pages.home.sections)) {
    throw new Error("Home page sections are missing.");
  }
}

function buildRenderedPage(content) {
  const context = { site: content.site };
  const home = content.pages.home;

  return {
    title: home.title || document.title,
    header: renderSiteHeader(content.site, content.global.header),
    main:
      renderPage(home, context) +
      renderLeadDialog(content.global.leadDialog, context),
    footer: renderSiteFooter(content.site, content.global.footer)
  };
}

function assertRenderedPage(rendered) {
  if (!rendered.header.includes("site-header")) {
    throw new Error("Header renderer returned invalid markup.");
  }

  if (!rendered.main.includes('id="signup"')) {
    throw new Error("Hero form renderer returned invalid markup.");
  }

  if (!rendered.main.includes("pp-process-section")) {
    throw new Error("Process renderer returned invalid markup.");
  }

  if (!rendered.main.includes("pp-service-ticker-wrap")) {
    throw new Error("Service ticker renderer returned invalid markup.");
  }

  if (!rendered.main.includes("faq-section")) {
    throw new Error("FAQ renderer returned invalid markup.");
  }

  if (!rendered.footer.includes("<footer")) {
    throw new Error("Footer renderer returned invalid markup.");
  }
}

function commitRenderedPage(rendered) {
  const header = document.querySelector(".site-header");
  const main = document.querySelector("main");
  const footer = document.querySelector("footer");

  if (!header || !main || !footer) {
    throw new Error("Static fallback shell is incomplete.");
  }

  /*
   * Important safety behavior:
   * We build and validate every component before touching the page.
   * Only after all renderers succeed do we replace the static fallback DOM.
   */
  header.outerHTML = rendered.header;
  main.innerHTML = rendered.main;
  footer.outerHTML = rendered.footer;
  document.title = rendered.title;

  document.documentElement.dataset.ppContentSource = "json";
}

async function loadContent() {
  const response = await fetch(CONTENT_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not load site content (" + response.status + ").");
  }

  return response.json();
}

async function migratePageToContentRuntime() {
  try {
    const content = await loadContent();
    assertContentShape(content);

    const rendered = buildRenderedPage(content);
    assertRenderedPage(rendered);
    commitRenderedPage(rendered);

    window.dispatchEvent(new CustomEvent("porchpatrol:content-rendered", {
      detail: {
        source: CONTENT_URL,
        schemaVersion: content.schemaVersion
      }
    }));
  } catch (error) {
    /*
     * The existing HTML remains untouched if any part of the migration fails.
     * That is the rollback/fallback path for the runtime layer.
     */
    document.documentElement.dataset.ppContentSource = "static-fallback";
    console.warn("[Porch Patrol] Content runtime fell back to static HTML.", error);

    window.dispatchEvent(new CustomEvent("porchpatrol:content-fallback", {
      detail: { message: error instanceof Error ? error.message : String(error) }
    }));
  }
}

migratePageToContentRuntime();

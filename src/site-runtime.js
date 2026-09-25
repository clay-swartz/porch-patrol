import {
  renderSiteHeader,
  renderPage,
  renderLeadDialog,
  renderSiteFooter
} from "./components/renderers.js";

const STATIC_CONTENT_URL = "/content/site.json";
const CMS_CONTENT_URL =
  "https://uymwsivcgtapckzjoywk.supabase.co/rest/v1/rpc/get_porch_patrol_published_site";
const CMS_PUBLISHABLE_KEY = "sb_publishable_Zv_J_fCv2wTC-qlsV3h_Mg_i7nkJPZG";

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

  if (!rendered.main.includes("<section")) {
    throw new Error("Page renderer returned no visible sections.");
  }

  if (!rendered.footer.includes("<footer")) {
    throw new Error("Footer renderer returned invalid markup.");
  }
}

function commitRenderedPage(rendered, source) {
  const header = document.querySelector(".site-header");
  const main = document.querySelector("main");
  const footer = document.querySelector("footer");

  if (!header || !main || !footer) {
    throw new Error("Static fallback shell is incomplete.");
  }

  /*
   * Safety behavior:
   * We build and validate the complete replacement before touching the page.
   * If CMS content cannot load or render, we try the repository JSON snapshot.
   * If both fail, the original static production HTML remains untouched.
   */
  header.outerHTML = rendered.header;
  main.innerHTML = rendered.main;
  footer.outerHTML = rendered.footer;
  document.title = rendered.title;

  document.documentElement.dataset.ppContentSource = source;
}

async function fetchCmsContent() {
  const response = await fetch(CMS_CONTENT_URL, {
    method: "POST",
    headers: {
      "apikey": CMS_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: "{}",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("CMS content request failed (" + response.status + ").");
  }

  return response.json();
}

async function fetchStaticContent() {
  const response = await fetch(STATIC_CONTENT_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Static content request failed (" + response.status + ").");
  }

  return response.json();
}

function validateAndRender(content) {
  assertContentShape(content);
  const rendered = buildRenderedPage(content);
  assertRenderedPage(rendered);
  return rendered;
}

async function getPreferredContent() {
  try {
    const content = await fetchCmsContent();
    return {
      content,
      rendered: validateAndRender(content),
      source: "cms"
    };
  } catch (cmsError) {
    console.warn(
      "[Porch Patrol] Published CMS content unavailable. Using repository JSON snapshot.",
      cmsError
    );
  }

  const content = await fetchStaticContent();
  return {
    content,
    rendered: validateAndRender(content),
    source: "json-fallback"
  };
}

async function migratePageToContentRuntime() {
  try {
    const result = await getPreferredContent();
    commitRenderedPage(result.rendered, result.source);

    window.dispatchEvent(new CustomEvent("porchpatrol:content-rendered", {
      detail: {
        source: result.source,
        schemaVersion: result.content.schemaVersion
      }
    }));
  } catch (error) {
    document.documentElement.dataset.ppContentSource = "static-fallback";
    console.warn(
      "[Porch Patrol] Content runtime fell back to static production HTML.",
      error
    );

    window.dispatchEvent(new CustomEvent("porchpatrol:content-fallback", {
      detail: { message: error instanceof Error ? error.message : String(error) }
    }));
  }
}

migratePageToContentRuntime();

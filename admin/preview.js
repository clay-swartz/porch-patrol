import {
  renderSiteHeader,
  renderPage,
  renderLeadDialog,
  renderSiteFooter
} from "/src/components/renderers.js";

function loadDraft() {
  const raw = localStorage.getItem("porchPatrolCmsPreview");
  if (!raw) throw new Error("No draft preview is available. Return to the editor and choose Preview again.");
  return JSON.parse(raw);
}

async function loadProductionStyles() {
  const response = await fetch("/", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the current Porch Patrol styles.");

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const clone = link.cloneNode(true);
    if (clone.href) clone.href = new URL(clone.getAttribute("href"), window.location.origin).href;
    document.head.appendChild(clone);
  });

  doc.head.querySelectorAll("style").forEach((style) => {
    document.head.appendChild(style.cloneNode(true));
  });
}

async function renderPreview() {
  const content = loadDraft();
  await loadProductionStyles();

  const context = { site: content.site };
  document.title = (content.pages?.home?.title || "Porch Patrol") + " — Draft Preview";

  document.body.innerHTML = [
    '<div style="position:fixed;z-index:99999;right:14px;top:14px;padding:8px 11px;border-radius:999px;background:#f5c64e;color:#183447;font:800 10px/1 system-ui,sans-serif;letter-spacing:.08em;box-shadow:0 5px 16px rgba(24,52,71,.14)">DRAFT PREVIEW</div>',
    renderSiteHeader(content.site, content.global.header),
    "<main>",
      renderPage(content.pages.home, context),
      renderLeadDialog(content.global.leadDialog, context),
    "</main>",
    renderSiteFooter(content.site, content.global.footer)
  ].join("");

  await import("/src/site-interactions.js");
}

renderPreview().catch((error) => {
  const loading = document.getElementById("preview-loading");
  if (loading) {
    loading.textContent = error.message;
    loading.style.color = "#9f2e1c";
  } else {
    document.body.innerHTML = '<div style="font-family:system-ui,sans-serif;padding:24px;color:#9f2e1c">' + error.message + "</div>";
  }
});

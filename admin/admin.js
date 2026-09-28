import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uymwsivcgtapckzjoywk.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zv_J_fCv2wTC-qlsV3h_Mg_i7nkJPZG";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const authView = document.getElementById("auth-view");
const editorView = document.getElementById("editor-view");
const authStatus = document.getElementById("auth-status");
const passcodeForm = document.getElementById("passcode-form");
const editorPasscode = document.getElementById("editor-passcode");
const saveStatus = document.getElementById("save-status");
const sectionList = document.getElementById("section-list");
const editorForm = document.getElementById("component-editor");
const editorEmpty = document.getElementById("editor-empty");
const saveButton = document.getElementById("save-button");
const publishButton = document.getElementById("publish-button");
const previewButton = document.getElementById("preview-button");
const historyButton = document.getElementById("history-button");
const mediaButton = document.getElementById("media-button");
const historyDialog = document.getElementById("history-dialog");
const historyList = document.getElementById("history-list");
const mediaDialog = document.getElementById("media-dialog");
const mediaGrid = document.getElementById("media-grid");
const mediaUploadInput = document.getElementById("media-upload-input");
const mediaStatus = document.getElementById("media-status");
const signoutButton = document.getElementById("signout-button");
const addSectionType = document.getElementById("add-section-type");
const addSectionButton = document.getElementById("add-section-button");
const confirmDialog = document.getElementById("confirm-dialog");
const confirmAction = document.getElementById("confirm-action");

let state = null;
let selected = "global";
let dirty = false;
let editorToken = sessionStorage.getItem("porchPatrolEditorToken") || "";
let mediaTargetPath = "";

const labels = {
  heroLead: "Hero",
  processSteps: "Process / Steps",
  serviceTicker: "Service Ticker",
  horizontalContentStrip: "Horizontal Content Strip",
  faqAccordion: "FAQ",
  ctaBand: "CTA Band"
};

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setStatus(message, tone = "") {
  saveStatus.textContent = message;
  saveStatus.className = "save-status" + (tone ? " " + tone : "");
}

function markDirty() {
  dirty = true;
  setStatus("Unsaved changes", "dirty");
}

function getByPath(root, path) {
  return path.split(".").reduce((value, key) => value?.[key], root);
}

function setByPath(root, path, value) {
  const parts = path.split(".");
  let cursor = root;
  parts.slice(0, -1).forEach((part) => {
    if (cursor[part] == null) cursor[part] = {};
    cursor = cursor[part];
  });
  cursor[parts.at(-1)] = value;
}

function arrayAt(path) {
  return getByPath(state, path);
}

function field(label, path, options = {}) {
  const value = getByPath(state, path) ?? "";
  const help = options.help ? '<div class="field-help">' + esc(options.help) + "</div>" : "";
  const control = options.textarea
    ? '<textarea data-path="' + esc(path) + '">' + esc(value) + "</textarea>"
    : options.select
      ? '<select data-path="' + esc(path) + '">' +
        options.select.map((item) =>
          '<option value="' + esc(item.value) + '"' + (item.value === value ? " selected" : "") + ">" + esc(item.label) + "</option>"
        ).join("") +
        "</select>"
      : '<input data-path="' + esc(path) + '" type="' + esc(options.type || "text") + '" value="' + esc(value) + '">';

  return '<label class="field-group"><span class="field-label">' + esc(label) + "</span>" + control + help + "</label>";
}

function presetPicker(label, path, options) {
  const value = getByPath(state, path) ?? options[0]?.value ?? "";
  return [
    '<div class="field-group">',
      '<span class="field-label">' + esc(label) + '</span>',
      '<div class="preset-grid">',
        options.map((item) =>
          '<button type="button" class="preset-option' + (item.value === value ? ' active' : '') + '"' +
          ' data-preset-path="' + esc(path) + '" data-preset-value="' + esc(item.value) + '">' +
            '<span class="preset-swatch swatch-' + esc(item.swatch || item.value) + '"></span>' +
            '<strong>' + esc(item.label) + '</strong>' +
          '</button>'
        ).join(''),
      '</div>',
    '</div>'
  ].join('');
}

function mediaField(label, path) {
  const value = getByPath(state, path) ?? "";
  return [
    '<div class="field-group">',
      '<span class="field-label">' + esc(label) + '</span>',
      '<div class="media-field">',
        '<div class="media-thumb">' +
          (value ? '<img src="' + esc(value) + '" alt="Current image">' : '') +
        '</div>',
        '<div class="media-field-actions">',
          '<button type="button" class="secondary-button" data-media-path="' + esc(path) + '">Replace image</button>',
          '<div class="media-field-path">' + esc(value || 'No image selected') + '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');
}

function normalizeVisualDefaults(content) {
  const sections = content?.pages?.home?.sections || [];

  sections.forEach((section) => {
    if (section.type === "heroLead") {
      section.visual ||= {};
      section.visual.tone ||= "navy";
      section.visual.pattern ||= "icons";
      section.visual.patternStrength ||= "standard";
    }

    if (section.type === "processSteps") {
      section.visual ||= {};
      section.visual.background ||= "paper";
      (section.steps || []).forEach((step) => {
        step.image ||= {};
        step.image.position ||= "center";
      });
    }

    if (section.type === "serviceTicker") {
      section.visual ||= {};
      section.visual.railTone ||= "cream";
      section.visual.ctaTone ||= "navy";
    }

    if (section.type === "faqAccordion") {
      section.visual ||= {};
      section.visual.background ||= "cream";
    }

    if (section.type === "ctaBand") {
      section.visual ||= {};
      section.visual.background ||= "teal";
    }
  });
}

function sectionBlock(title, inner) {
  return '<section class="field-section"><h2>' + esc(title) + "</h2>" + inner + "</section>";
}

function rowTools(arrayPath, index, count) {
  return [
    '<div class="repeater-handle">',
      '<button type="button" class="small-button" data-repeat-action="up" data-array-path="' + esc(arrayPath) + '" data-index="' + index + '"' + (index === 0 ? " disabled" : "") + '>↑</button>',
      '<button type="button" class="small-button" data-repeat-action="down" data-array-path="' + esc(arrayPath) + '" data-index="' + index + '"' + (index === count - 1 ? " disabled" : "") + '>↓</button>',
      '<button type="button" class="small-button danger" data-repeat-action="remove" data-array-path="' + esc(arrayPath) + '" data-index="' + index + '">×</button>',
    "</div>"
  ].join("");
}

function simpleStringRepeater(label, arrayPath) {
  const items = arrayAt(arrayPath) || [];
  return sectionBlock(label,
    '<div class="repeater">' +
      items.map((item, index) =>
        '<div class="repeater-row">' +
          rowTools(arrayPath, index, items.length) +
          '<div class="repeater-main">' +
            '<input data-path="' + esc(arrayPath + "." + index) + '" value="' + esc(item) + '">' +
          "</div>" +
        "</div>"
      ).join("") +
      '<button type="button" class="add-row-button" data-add-array="' + esc(arrayPath) + '" data-add-kind="string">+ Add item</button>' +
    "</div>"
  );
}

function iconLabelRepeater(label, arrayPath) {
  const items = arrayAt(arrayPath) || [];
  return sectionBlock(label,
    '<div class="repeater">' +
      items.map((item, index) =>
        '<div class="repeater-row">' +
          rowTools(arrayPath, index, items.length) +
          '<div class="repeater-main"><div class="repeater-grid">' +
            field("Icon", arrayPath + "." + index + ".icon") +
            field("Label", arrayPath + "." + index + ".label") +
          "</div></div>" +
        "</div>"
      ).join("") +
      '<button type="button" class="add-row-button" data-add-array="' + esc(arrayPath) + '" data-add-kind="iconLabel">+ Add item</button>' +
    "</div>"
  );
}

function processRepeater(arrayPath) {
  const items = arrayAt(arrayPath) || [];
  return sectionBlock("Steps",
    '<div class="repeater">' +
      items.map((item, index) =>
        '<div class="repeater-row">' +
          rowTools(arrayPath, index, items.length) +
          '<div class="repeater-main">' +
            '<div class="repeater-grid">' +
              field("Heading", arrayPath + "." + index + ".heading") +
              field("Image label", arrayPath + "." + index + ".mediaLabel") +
            '</div>' +
            field("Body", arrayPath + "." + index + ".body", { textarea: true }) +
            mediaField("Photo", arrayPath + "." + index + ".image.src") +
            '<div class="repeater-grid">' +
              field("Image focal point", arrayPath + "." + index + ".image.position", { select: [
                {label:"Center",value:"center"},
                {label:"Top",value:"top"},
                {label:"Bottom",value:"bottom"},
                {label:"Left",value:"left"},
                {label:"Right",value:"right"}
              ]}) +
              field("Alt text", arrayPath + "." + index + ".image.alt") +
            '</div>' +
          '</div>' +
        '</div>'
      ).join('') +
      '<button type="button" class="add-row-button" data-add-array="' + esc(arrayPath) + '" data-add-kind="processStep">+ Add step</button>' +
    '</div>'
  );
}

function faqRepeater(arrayPath) {
  const items = arrayAt(arrayPath) || [];
  return sectionBlock("Questions",
    '<div class="repeater">' +
      items.map((item, index) =>
        '<div class="repeater-row">' +
          rowTools(arrayPath, index, items.length) +
          '<div class="repeater-main">' +
            field("Question", arrayPath + "." + index + ".question") +
            field("Optional bold lead", arrayPath + "." + index + ".lead") +
            field("Answer", arrayPath + "." + index + ".answer", { textarea: true }) +
          "</div>" +
        "</div>"
      ).join("") +
      '<button type="button" class="add-row-button" data-add-array="' + esc(arrayPath) + '" data-add-kind="faq">+ Add question</button>' +
    "</div>"
  );
}

function componentHead(title, subtitle, sectionIndex = null) {
  const deleteButton = sectionIndex == null || state.pages.home.sections[sectionIndex].type === "heroLead"
    ? ""
    : '<button type="button" class="small-button danger" data-delete-section="' + sectionIndex + '">Remove section</button>';

  return [
    '<div class="editor-component-head">',
      "<div>",
        '<p class="eyebrow">PORCH PATROL COMPONENT</p>',
        "<h1>" + esc(title) + "</h1>",
        "<p>" + esc(subtitle) + "</p>",
      "</div>",
      '<div class="component-tools">' + deleteButton + "</div>",
    "</div>"
  ].join("");
}

function renderGlobalEditor() {
  editorForm.innerHTML =
    componentHead("Site settings", "Global information shared by the header, footer and forms.") +
    sectionBlock("Contact & service area",
      '<div class="field-grid">' +
        field("Phone display", "site.phoneDisplay") +
        field("Phone link", "site.phoneHref") +
        field("Short service area", "site.serviceAreaShort") +
        field("Footer service area", "site.serviceAreaLong") +
        field("Copyright year", "site.copyrightYear", { type: "number" }) +
      "</div>"
    ) +
    sectionBlock("Lead dialog",
      '<div class="field-grid">' +
        field("Eyebrow", "global.leadDialog.eyebrow") +
        field("Headline", "global.leadDialog.headline") +
      "</div>" +
      field("Supporting text", "global.leadDialog.supportingText", { textarea: true }) +
      '<div class="field-grid">' +
        field("Price note", "global.leadDialog.priceNote") +
        field("Button label", "global.leadDialog.submitLabel") +
      "</div>" +
      field("Success message", "global.leadDialog.successMessage")
    );
}

function renderHero(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("Hero", "The first thing homeowners see.", index) +
    sectionBlock("Visual style",
      presetPicker("Background", base + ".visual.tone", [
        {label:"Navy",value:"navy",swatch:"navy"},
        {label:"Teal",value:"teal",swatch:"teal"},
        {label:"Cream",value:"cream",swatch:"cream"}
      ]) +
      presetPicker("Pattern", base + ".visual.pattern", [
        {label:"House icons",value:"icons",swatch:"icons"},
        {label:"Dots",value:"dots",swatch:"dots"},
        {label:"Grid",value:"grid",swatch:"grid"},
        {label:"None",value:"none",swatch:"none"}
      ]) +
      field("Pattern strength", base + ".visual.patternStrength", { select: [
        {label:"Subtle",value:"subtle"},
        {label:"Standard",value:"standard"},
        {label:"Bold",value:"bold"}
      ]})
    ) +
    sectionBlock("Message",
      field("Headline line 1", base + ".headlineLines.0") +
      field("Headline line 2", base + ".headlineLines.1") +
      field("Subhead", base + ".subhead", { textarea: true }) +
      '<div class="field-grid">' +
        field("Proof label", base + ".proofLabel") +
        field("Price line", base + ".priceLine") +
      '</div>'
    ) +
    simpleStringRepeater("Proof examples", base + ".proofItems") +
    sectionBlock("Lead form",
      '<div class="field-grid">' +
        field("Form headline", base + ".form.headline") +
        field("Button label", base + ".form.submitLabel") +
      '</div>' +
      field("Reassurance", base + ".form.reassurance") +
      field("Success message", base + ".form.successMessage")
    );
}

function renderProcess(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("Process / Steps", "Interactive process copy and matching imagery.", index) +
    sectionBlock("Visual style",
      presetPicker("Section background", base + ".visual.background", [
        {label:"Paper",value:"paper",swatch:"paper"},
        {label:"Cream",value:"cream",swatch:"cream"},
        {label:"Pale blue",value:"paleBlue",swatch:"paleBlue"}
      ])
    ) +
    sectionBlock("Heading",
      '<div class="field-grid">' +
        field("Eyebrow", base + ".eyebrow") +
        field("Headline", base + ".headline") +
      '</div>' +
      field("Supporting text", base + ".supportingText", { textarea: true })
    ) +
    processRepeater(base + ".steps");
}

function renderTicker(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("Service Ticker", "A low-footprint stream of examples with a primary CTA.", index) +
    sectionBlock("Visual style",
      presetPicker("Ticker background", base + ".visual.railTone", [
        {label:"Cream",value:"cream",swatch:"cream"},
        {label:"White",value:"white",swatch:"white"},
        {label:"Pale blue",value:"paleBlue",swatch:"paleBlue"},
        {label:"Soft teal",value:"softTeal",swatch:"softTeal"}
      ]) +
      presetPicker("CTA color", base + ".visual.ctaTone", [
        {label:"Navy",value:"navy",swatch:"navy"},
        {label:"Teal",value:"teal",swatch:"teal"},
        {label:"Yellow",value:"yellow",swatch:"yellow"}
      ])
    ) +
    iconLabelRepeater("Ticker items", base + ".items") +
    sectionBlock("CTA",
      field("Button label", base + ".cta.label") +
      '<div class="field-help">This button opens the compact lead form directly beneath the ticker.</div>'
    );
}

function renderContentStrip(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("Horizontal Content Strip", "Reusable icon-and-label content block.", index) +
    sectionBlock("Heading",
      '<div class="field-grid">' +
        field("Eyebrow", base + ".eyebrow") +
        field("Headline", base + ".headline") +
      "</div>" +
      field("Supporting text", base + ".supportingText", { textarea: true }) +
      '<div class="field-grid">' +
        field("Color treatment", base + ".variant", { select: [
          {label:"Cream",value:"cream"},
          {label:"White",value:"white"},
          {label:"Navy",value:"navy"}
        ]}) +
        field("Spacing", base + ".density", { select: [
          {label:"Compact",value:"compact"},
          {label:"Standard",value:"standard"}
        ]}) +
      "</div>"
    ) +
    iconLabelRepeater("Items", base + ".items");
}

function renderFaq(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("FAQ", "Questions homeowners can expand on the live site.", index) +
    sectionBlock("Visual style",
      presetPicker("Section background", base + ".visual.background", [
        {label:"Cream",value:"cream",swatch:"cream"},
        {label:"Paper",value:"paper",swatch:"paper"},
        {label:"Pale blue",value:"paleBlue",swatch:"paleBlue"}
      ])
    ) +
    sectionBlock("Heading",
      field("Headline", base + ".headline") +
      '<div class="field-grid">' +
        field("Intro", base + ".intro.prefix") +
        field("Link label", base + ".intro.linkLabel") +
        field("Link destination", base + ".intro.href") +
      '</div>'
    ) +
    faqRepeater(base + ".items");
}

function renderCta(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("CTA Band", "A simple closing call to action.", index) +
    sectionBlock("Visual style",
      presetPicker("Background", base + ".visual.background", [
        {label:"Teal",value:"teal",swatch:"teal"},
        {label:"Navy",value:"navy",swatch:"navy"},
        {label:"Cream",value:"cream",swatch:"cream"}
      ])
    ) +
    sectionBlock("CTA",
      field("Headline", base + ".headline") +
      '<div class="field-grid">' +
        field("Button label", base + ".cta.label") +
        field("Button link", base + ".cta.href") +
      '</div>'
    );
}

function renderEditor() {
  editorEmpty.hidden = true;
  editorForm.hidden = false;

  if (selected === "global") {
    renderGlobalEditor();
    return;
  }

  const index = state.pages.home.sections.findIndex((section) => section.id === selected);
  if (index < 0) {
    selected = "global";
    renderGlobalEditor();
    return;
  }

  const section = state.pages.home.sections[index];
  switch (section.type) {
    case "heroLead": renderHero(section, index); break;
    case "processSteps": renderProcess(section, index); break;
    case "serviceTicker": renderTicker(section, index); break;
    case "horizontalContentStrip": renderContentStrip(section, index); break;
    case "faqAccordion": renderFaq(section, index); break;
    case "ctaBand": renderCta(section, index); break;
    default:
      editorForm.innerHTML = componentHead(labels[section.type] || section.type, "This component has no editor yet.", index);
  }
}

function sectionSummary(section) {
  if (section.type === "heroLead") return section.headlineLines?.join(" ") || "";
  if (section.type === "processSteps") return section.headline || "";
  if (section.type === "serviceTicker") return (section.items?.length || 0) + " ticker items";
  if (section.type === "horizontalContentStrip") return section.headline || "";
  if (section.type === "faqAccordion") return (section.items?.length || 0) + " questions";
  if (section.type === "ctaBand") return section.headline || "";
  return "";
}

function renderOutline() {
  sectionList.innerHTML = state.pages.home.sections.map((section, index) => {
    const disabledClass = section.enabled === false ? " section-disabled" : "";
    return [
      '<button type="button" class="outline-item' + (selected === section.id ? " active" : "") + disabledClass + '" data-select="' + esc(section.id) + '">',
        '<span class="outline-index">' + (index + 1) + "</span>",
        "<span><strong>" + esc(labels[section.type] || section.type) + "</strong><small>" + esc(sectionSummary(section)) + "</small></span>",
        '<span class="outline-controls">',
          '<span class="icon-button" role="button" tabindex="0" data-section-action="up" data-section-index="' + index + '"' + (index === 0 ? ' aria-disabled="true"' : "") + '>↑</span>',
          '<span class="icon-button" role="button" tabindex="0" data-section-action="down" data-section-index="' + index + '"' + (index === state.pages.home.sections.length - 1 ? ' aria-disabled="true"' : "") + '>↓</span>',
          '<span class="icon-button" role="button" tabindex="0" data-section-action="toggle" data-section-index="' + index + '">' + (section.enabled === false ? "○" : "●") + "</span>",
        "</span>",
      "</button>"
    ].join("");
  }).join("");

  document.querySelector('[data-select="global"]')?.classList.toggle("active", selected === "global");
}

function renderAll() {
  renderOutline();
  renderEditor();
}

function newSection(type) {
  const id = type.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) + "-" + Date.now().toString().slice(-6);

  if (type === "horizontalContentStrip") return {
    id, type, variant:"cream", enabled:true, eyebrow:"", headline:"New content strip",
    supportingText:"", density:"compact",
    items:[
      {icon:"home_repair_service",label:"First item"},
      {icon:"lightbulb",label:"Second item"},
      {icon:"potted_plant",label:"Third item"}
    ]
  };

  if (type === "processSteps") return {
    id, type, variant:"mediaSwap", enabled:true, visual:{background:"paper"}, eyebrow:"Our Process", headline:"A simple process.",
    supportingText:"",
    steps:[
      {heading:"First step",body:"Describe what happens here.",mediaLabel:"First step",image:{src:"/images/process-patrol.png",alt:"",position:"center"}},
      {heading:"Second step",body:"Describe what happens here.",mediaLabel:"Second step",image:{src:"/images/process-work.png",alt:"",position:"center"}}
    ]
  };

  if (type === "serviceTicker") return {
    id, type, variant:"creamBento", enabled:true, visual:{railTone:"cream",ctaTone:"navy"},
    ariaLabel:"Examples of what Porch Patrol handles",
    pauseInstruction:"Examples of what Porch Patrol handles. Hover or focus to pause.",
    items:[
      {icon:"home_repair_service",label:"First item"},
      {icon:"lightbulb",label:"Second item"},
      {icon:"potted_plant",label:"Third item"}
    ],
    cta:{label:"Patrol my place.",href:"#signup",showArrow:true,action:"inlineLead"}
  };

  if (type === "faqAccordion") return {
    id, type, variant:"standard", enabled:true, visual:{background:"cream"}, headline:"Good to know",
    intro:{prefix:"Have another question? Feel free to",linkLabel:"call or text us anytime",href:"tel:+19034618877"},
    items:[{question:"New question",lead:"",answer:"Add the answer here."}]
  };

  if (type === "ctaBand") return {
    id, type, variant:"centered", enabled:true, visual:{background:"teal"}, headline:"Ready when you are.",
    cta:{label:"Start service",href:"#signup"}
  };

  return null;
}

async function loadEditor() {
  setStatus("Loading…");

  const { data, error } = await supabase.rpc("get_porch_patrol_editor_state", {
    p_token: editorToken
  });

  if (error || !data) {
    throw new Error("Editor session expired. Enter the passcode again.");
  }

  state = structuredClone(data);
  normalizeVisualDefaults(state);
  dirty = false;
  setStatus("Draft loaded", "good");
  renderAll();
}

async function saveDraft() {
  if (!state || !editorToken) return;
  setStatus("Saving…");

  const { error } = await supabase.rpc("save_porch_patrol_editor_draft", {
    p_token: editorToken,
    p_content: state
  });

  if (error) {
    setStatus("Save failed", "error");
    throw error;
  }

  dirty = false;
  setStatus("Draft saved", "good");
}

async function publish() {
  await saveDraft();
  setStatus("Publishing…");

  const { error } = await supabase.rpc("publish_porch_patrol_editor_draft", {
    p_token: editorToken
  });

  if (error) {
    setStatus("Publish failed", "error");
    throw error;
  }

  setStatus("Published", "good");
}

function showLogin(message = "") {
  state = null;
  editorView.hidden = true;
  authView.hidden = false;
  authStatus.textContent = message;
  setStatus("Ready");
}

async function openEditor() {
  authView.hidden = true;
  editorView.hidden = false;

  try {
    await loadEditor();
  } catch (error) {
    editorToken = "";
    sessionStorage.removeItem("porchPatrolEditorToken");
    showLogin(error.message);
  }
}

passcodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authStatus.textContent = "Opening editor…";

  const { data, error } = await supabase.rpc("porch_patrol_editor_login", {
    p_passcode: editorPasscode.value
  });

  if (error || !data) {
    authStatus.textContent = "That passcode didn’t work.";
    editorPasscode.select();
    return;
  }

  editorToken = data;
  sessionStorage.setItem("porchPatrolEditorToken", editorToken);
  editorPasscode.value = "";
  authStatus.textContent = "";
  await openEditor();
});

signoutButton.addEventListener("click", async () => {
  if (editorToken) {
    await supabase.rpc("porch_patrol_editor_logout", {
      p_token: editorToken
    });
  }

  editorToken = "";
  sessionStorage.removeItem("porchPatrolEditorToken");
  dirty = false;
  showLogin();
});

async function loadHistory() {
  historyList.innerHTML = '<div class="status-message">Loading history…</div>';

  const { data, error } = await supabase.rpc("list_porch_patrol_editor_revisions", {
    p_token: editorToken
  });

  if (error) {
    historyList.innerHTML = '<div class="status-message">Could not load revision history.</div>';
    return;
  }

  const revisions = data || [];
  historyList.innerHTML = revisions.length
    ? revisions.map((revision) => {
        const date = new Date(revision.created_at);
        return [
          '<div class="history-item">',
            '<div>',
              '<strong>' + esc(revision.label || 'Published') + '</strong>',
              '<small>' + esc(date.toLocaleString([], {dateStyle:'medium', timeStyle:'short'})) + '</small>',
            '</div>',
            '<button type="button" class="small-button" data-restore-revision="' + esc(revision.id) + '">Restore to draft</button>',
          '</div>'
        ].join('');
      }).join('')
    : '<div class="status-message">No published revisions yet.</div>';
}

async function restoreRevision(id) {
  setStatus("Restoring…");

  const { data, error } = await supabase.rpc("restore_porch_patrol_editor_revision", {
    p_token: editorToken,
    p_revision_id: id
  });

  if (error || !data) {
    setStatus("Restore failed", "error");
    return;
  }

  state = structuredClone(data);
  normalizeVisualDefaults(state);
  dirty = false;
  selected = "global";
  setStatus("Revision restored to draft", "good");
  historyDialog.close();
  renderAll();
}

async function fetchMediaItems() {
  const response = await fetch(SUPABASE_URL + "/functions/v1/porch-patrol-media", {
    headers: {
      "x-porch-patrol-editor-token": editorToken
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not load the media library.");
  }

  const payload = await response.json();
  return payload.items || [];
}

function renderMediaItems(items) {
  mediaGrid.innerHTML = items.length
    ? items.map((item) => [
        '<div class="media-card">',
          '<img src="' + esc(item.url) + '" alt="">',
          '<div class="media-card-body">',
            '<div class="media-card-name">' + esc(item.name) + '</div>',
            '<div class="media-card-actions">',
              '<button type="button" class="small-button" data-use-media-url="' + esc(item.url) + '">' +
                (mediaTargetPath ? 'Use image' : 'Copy URL') +
              '</button>',
            '</div>',
          '</div>',
        '</div>'
      ].join('')).join('')
    : '<div class="status-message">No uploaded photos yet.</div>';
}

async function openMediaLibrary(targetPath = "") {
  mediaTargetPath = targetPath;
  mediaStatus.textContent = "Loading…";
  mediaGrid.innerHTML = "";
  mediaDialog.showModal();

  try {
    const items = await fetchMediaItems();
    renderMediaItems(items);
    mediaStatus.textContent = "";
  } catch (error) {
    mediaStatus.textContent = error.message;
  }
}

async function uploadMedia(file) {
  if (!file) return;

  mediaStatus.textContent = "Uploading…";
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(SUPABASE_URL + "/functions/v1/porch-patrol-media", {
    method: "POST",
    headers: {
      "x-porch-patrol-editor-token": editorToken
    },
    body: form
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.item) {
    mediaStatus.textContent = payload.error || "Upload failed.";
    return;
  }

  mediaStatus.textContent = "Uploaded.";
  const items = await fetchMediaItems();
  renderMediaItems(items);

  if (mediaTargetPath) {
    setByPath(state, mediaTargetPath, payload.item.url);
    markDirty();
    renderEditor();
  }
}

editorForm.addEventListener("submit", (event) => event.preventDefault());

editorForm.addEventListener("input", (event) => {
  const path = event.target.dataset.path;
  if (!path) return;
  const value = event.target.type === "number" ? Number(event.target.value) : event.target.value;
  setByPath(state, path, value);
  markDirty();
  renderOutline();
});

editorForm.addEventListener("change", (event) => {
  const path = event.target.dataset.path;
  if (!path) return;
  setByPath(state, path, event.target.value);
  markDirty();
});

editorForm.addEventListener("click", (event) => {
  const presetButton = event.target.closest("[data-preset-path]");
  if (presetButton) {
    setByPath(state, presetButton.dataset.presetPath, presetButton.dataset.presetValue);
    markDirty();
    renderEditor();
    return;
  }

  const mediaTrigger = event.target.closest("[data-media-path]");
  if (mediaTrigger) {
    openMediaLibrary(mediaTrigger.dataset.mediaPath);
    return;
  }

  const repeatButton = event.target.closest("[data-repeat-action]");
  if (repeatButton) {
    const arrayPath = repeatButton.dataset.arrayPath;
    const index = Number(repeatButton.dataset.index);
    const list = arrayAt(arrayPath);
    const action = repeatButton.dataset.repeatAction;

    if (action === "up" && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
    if (action === "down" && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
    if (action === "remove") list.splice(index, 1);

    markDirty();
    renderEditor();
    renderOutline();
    return;
  }

  const addButton = event.target.closest("[data-add-array]");
  if (addButton) {
    const list = arrayAt(addButton.dataset.addArray);
    const kind = addButton.dataset.addKind;

    if (kind === "string") list.push("New item");
    if (kind === "iconLabel") list.push({icon:"home_repair_service",label:"New item"});
    if (kind === "processStep") list.push({heading:"New step",body:"Describe what happens here.",mediaLabel:"New step",image:{src:"",alt:"",position:"center"}});
    if (kind === "faq") list.push({question:"New question",lead:"",answer:"Add the answer here."});

    markDirty();
    renderEditor();
    renderOutline();
    return;
  }

  const deleteButton = event.target.closest("[data-delete-section]");
  if (deleteButton) {
    const index = Number(deleteButton.dataset.deleteSection);
    state.pages.home.sections.splice(index, 1);
    selected = "global";
    markDirty();
    renderAll();
  }
});

document.querySelector(".outline-panel").addEventListener("click", (event) => {
  const action = event.target.closest("[data-section-action]");
  if (action) {
    event.preventDefault();
    event.stopPropagation();

    const index = Number(action.dataset.sectionIndex);
    const sections = state.pages.home.sections;

    if (action.dataset.sectionAction === "up" && index > 0) {
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
    }
    if (action.dataset.sectionAction === "down" && index < sections.length - 1) {
      [sections[index + 1], sections[index]] = [sections[index], sections[index + 1]];
    }
    if (action.dataset.sectionAction === "toggle") {
      sections[index].enabled = sections[index].enabled === false;
    }

    markDirty();
    renderAll();
    return;
  }

  const item = event.target.closest("[data-select]");
  if (!item) return;
  selected = item.dataset.select;
  renderAll();
});

addSectionButton.addEventListener("click", () => {
  const type = addSectionType.value;
  if (!type) return;
  const section = newSection(type);
  if (!section) return;

  state.pages.home.sections.push(section);
  selected = section.id;
  addSectionType.value = "";
  markDirty();
  renderAll();
});

saveButton.addEventListener("click", async () => {
  try { await saveDraft(); }
  catch (error) { console.error(error); }
});

historyButton.addEventListener("click", async () => {
  historyDialog.showModal();
  await loadHistory();
});

mediaButton.addEventListener("click", () => {
  openMediaLibrary("");
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.closeDialog)?.close();
  });
});

historyList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-restore-revision]");
  if (!button) return;
  await restoreRevision(button.dataset.restoreRevision);
});

mediaUploadInput.addEventListener("change", async () => {
  const file = mediaUploadInput.files?.[0];
  mediaUploadInput.value = "";
  if (file) await uploadMedia(file);
});

mediaGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-use-media-url]");
  if (!button) return;

  const url = button.dataset.useMediaUrl;

  if (mediaTargetPath) {
    setByPath(state, mediaTargetPath, url);
    markDirty();
    renderEditor();
    mediaDialog.close();
  } else {
    try {
      await navigator.clipboard.writeText(url);
      mediaStatus.textContent = "Image URL copied.";
    } catch {
      mediaStatus.textContent = url;
    }
  }
});

previewButton.addEventListener("click", () => {
  if (!state) return;
  localStorage.setItem("porchPatrolCmsPreview", JSON.stringify(state));
  window.open("/admin/preview.html", "_blank", "noopener");
});

publishButton.addEventListener("click", () => {
  confirmDialog.showModal();
});

confirmDialog.addEventListener("close", async () => {
  if (confirmDialog.returnValue !== "confirm") return;
  try { await publish(); }
  catch (error) { console.error(error); }
});

window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

if (editorToken) {
  await openEditor();
} else {
  showLogin();
}

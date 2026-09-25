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
const signoutButton = document.getElementById("signout-button");
const addSectionType = document.getElementById("add-section-type");
const addSectionButton = document.getElementById("add-section-button");
const confirmDialog = document.getElementById("confirm-dialog");
const confirmAction = document.getElementById("confirm-action");

let state = null;
let selected = "global";
let dirty = false;
let editorToken = sessionStorage.getItem("porchPatrolEditorToken") || "";

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
            "</div>" +
            field("Body", arrayPath + "." + index + ".body", { textarea: true }) +
            '<div class="repeater-grid">' +
              field("Image path", arrayPath + "." + index + ".image.src") +
              field("Alt text", arrayPath + "." + index + ".image.alt") +
            "</div>" +
          "</div>" +
        "</div>"
      ).join("") +
      '<button type="button" class="add-row-button" data-add-array="' + esc(arrayPath) + '" data-add-kind="processStep">+ Add step</button>' +
    "</div>"
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
    sectionBlock("Message",
      field("Headline line 1", base + ".headlineLines.0") +
      field("Headline line 2", base + ".headlineLines.1") +
      field("Subhead", base + ".subhead", { textarea: true }) +
      '<div class="field-grid">' +
        field("Proof label", base + ".proofLabel") +
        field("Price line", base + ".priceLine") +
      "</div>"
    ) +
    simpleStringRepeater("Proof examples", base + ".proofItems") +
    sectionBlock("Lead form",
      '<div class="field-grid">' +
        field("Form headline", base + ".form.headline") +
        field("Button label", base + ".form.submitLabel") +
      "</div>" +
      field("Reassurance", base + ".form.reassurance") +
      field("Success message", base + ".form.successMessage")
    );
}

function renderProcess(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("Process / Steps", "Interactive process copy and matching imagery.", index) +
    sectionBlock("Heading",
      '<div class="field-grid">' +
        field("Eyebrow", base + ".eyebrow") +
        field("Headline", base + ".headline") +
      "</div>" +
      field("Supporting text", base + ".supportingText", { textarea: true })
    ) +
    processRepeater(base + ".steps");
}

function renderTicker(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("Service Ticker", "A low-footprint stream of examples with a primary CTA.", index) +
    iconLabelRepeater("Ticker items", base + ".items") +
    sectionBlock("CTA",
      '<div class="field-grid">' +
        field("Button label", base + ".cta.label") +
        field("Button link", base + ".cta.href") +
      "</div>"
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
    sectionBlock("Heading",
      field("Headline", base + ".headline") +
      '<div class="field-grid">' +
        field("Intro", base + ".intro.prefix") +
        field("Link label", base + ".intro.linkLabel") +
        field("Link destination", base + ".intro.href") +
      "</div>"
    ) +
    faqRepeater(base + ".items");
}

function renderCta(section, index) {
  const base = "pages.home.sections." + index;
  editorForm.innerHTML =
    componentHead("CTA Band", "A simple closing call to action.", index) +
    sectionBlock("CTA",
      field("Headline", base + ".headline") +
      '<div class="field-grid">' +
        field("Button label", base + ".cta.label") +
        field("Button link", base + ".cta.href") +
      "</div>"
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
    id, type, variant:"mediaSwap", enabled:true, eyebrow:"Our Process", headline:"A simple process.",
    supportingText:"",
    steps:[
      {heading:"First step",body:"Describe what happens here.",mediaLabel:"First step",image:{src:"/images/process-patrol.png",alt:""}},
      {heading:"Second step",body:"Describe what happens here.",mediaLabel:"Second step",image:{src:"/images/process-work.png",alt:""}}
    ]
  };

  if (type === "serviceTicker") return {
    id, type, variant:"creamBento", enabled:true,
    ariaLabel:"Examples of what Porch Patrol handles",
    pauseInstruction:"Examples of what Porch Patrol handles. Hover or focus to pause.",
    items:[
      {icon:"home_repair_service",label:"First item"},
      {icon:"lightbulb",label:"Second item"},
      {icon:"potted_plant",label:"Third item"}
    ],
    cta:{label:"Patrol my place.",href:"#signup",showArrow:true}
  };

  if (type === "faqAccordion") return {
    id, type, variant:"standard", enabled:true, headline:"Good to know",
    intro:{prefix:"Have another question? Feel free to",linkLabel:"call or text us anytime",href:"tel:+19034618877"},
    items:[{question:"New question",lead:"",answer:"Add the answer here."}]
  };

  if (type === "ctaBand") return {
    id, type, variant:"centered", enabled:true, headline:"Ready when you are.",
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
    if (kind === "processStep") list.push({heading:"New step",body:"Describe what happens here.",mediaLabel:"New step",image:{src:"",alt:""}});
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

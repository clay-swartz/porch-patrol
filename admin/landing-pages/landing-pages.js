import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uymwsivcgtapckzjoywk.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zv_J_fCv2wTC-qlsV3h_Mg_i7nkJPZG";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const token = sessionStorage.getItem("porchPatrolEditorToken") || "";
const app = document.getElementById("landing-app");
const authNeeded = document.getElementById("auth-needed");
const empty = document.getElementById("landing-empty");
const editor = document.getElementById("landing-editor");
const list = document.getElementById("landing-list");
const statusEl = document.getElementById("landing-status");
const dialog = document.getElementById("new-page-dialog");

let pages = [];
let currentSlug = "";
let content = null;
let dirty = false;

function esc(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function status(message,tone=""){
  statusEl.textContent = message;
  statusEl.className = "save-status" + (tone ? " " + tone : "");
}

function getByPath(root,path){
  return path.split(".").reduce((value,key)=>value?.[key],root);
}

function setByPath(root,path,value){
  const parts = path.split(".");
  let cursor = root;
  parts.slice(0,-1).forEach((part)=>{
    if(cursor[part] == null) cursor[part] = {};
    cursor = cursor[part];
  });
  cursor[parts.at(-1)] = value;
}

function markDirty(){
  dirty = true;
  status("Unsaved changes","dirty");
}

function defaultContent(firstName,locationLabel){
  const place = String(locationLabel || "").replace(/^Coming to\\s+/i,"").trim();
  return {
    type:"customLandingPage",
    title:place ? "Porch Patrol — " + place : "Porch Patrol",
    firstName:firstName || "Neighbor",
    locationLabel:locationLabel || "Coming soon",
    headline:"Your house is about to get some backup.",
    listHeadline:"Let us handle the little things.",
    items:["Bulbs","Cobwebs","Loose hardware","Weeds","Mats + furniture","Drips","Quick fixes","Small upkeep"],
    form:{
      addressPlaceholder:"Home address",
      mobilePlaceholder:"Mobile number",
      submitLabel:"Add my house",
      note:"We’ll text you with the details.",
      successMessage:"Got it. We’ll text you with the details."
    },
    visual:{patternStrength:"subtle"}
  };
}

async function loadPages(){
  const {data,error} = await supabase.rpc("list_porch_patrol_editor_landing_pages",{p_token:token});
  if(error) throw error;
  pages = data || [];
  renderList();
}

function renderList(){
  list.innerHTML = pages.length
    ? pages.map((page)=>[
        '<button type="button" class="landing-item' + (page.slug === currentSlug ? ' active' : '') + '" data-slug="' + esc(page.slug) + '">',
          '<strong>' + esc(page.title || page.slug) + '</strong>',
          '<small>/' + esc(page.slug) + '</small>',
        '</button>'
      ].join(""))
      .join("")
    : '<div class="status-message">No custom landing pages yet.</div>';
}

async function openPage(slug){
  if(dirty && !confirm("Discard unsaved landing-page changes?")) return;

  status("Loading…");
  const {data,error} = await supabase.rpc("get_porch_patrol_editor_landing_page",{
    p_token:token,
    p_slug:slug
  });
  if(error || !data) throw error || new Error("Landing page not found");

  currentSlug = slug;
  content = structuredClone(data);
  dirty = false;
  renderList();
  renderEditor();
  status("Draft loaded","good");
}

function renderEditor(){
  if(!content){
    editor.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  editor.hidden = false;
  document.getElementById("editor-title").textContent = content.firstName ? content.firstName + " landing page" : "Landing page";
  document.getElementById("path-chip").textContent = "/" + currentSlug;
  document.getElementById("open-live-link").href = "/" + currentSlug;

  editor.querySelectorAll("[data-path]").forEach((control)=>{
    control.value = getByPath(content,control.dataset.path) ?? "";
  });

  document.getElementById("items-field").value = (content.items || []).join("\\n");
}

async function saveCurrent(){
  if(!content || !currentSlug) return;

  const items = document.getElementById("items-field").value
    .split("\\n")
    .map((item)=>item.trim())
    .filter(Boolean)
    .slice(0,16);

  content.items = items.length ? items : ["Small upkeep"];
  status("Saving…");

  const {error} = await supabase.rpc("save_porch_patrol_editor_landing_page",{
    p_token:token,
    p_slug:currentSlug,
    p_content:content
  });

  if(error){
    status("Save failed","error");
    throw error;
  }

  dirty = false;
  status("Draft saved","good");
  await loadPages();
}

async function publishCurrent(){
  await saveCurrent();
  status("Publishing…");

  const {error} = await supabase.rpc("publish_porch_patrol_editor_landing_page",{
    p_token:token,
    p_slug:currentSlug
  });

  if(error){
    status("Publish failed","error");
    throw error;
  }

  status("Published","good");
  await loadPages();
}

function previewCurrent(){
  if(!content || !currentSlug) return;
  content.items = document.getElementById("items-field").value
    .split("\\n")
    .map((item)=>item.trim())
    .filter(Boolean)
    .slice(0,16);

  localStorage.setItem("porchPatrolLandingPreview",JSON.stringify({
    slug:currentSlug,
    content
  }));
  window.open("/" + currentSlug + "?preview=1","_blank","noopener");
}

async function createPage(event){
  event.preventDefault();

  const raw = document.getElementById("new-page-slug").value.trim().toLowerCase();
  const suffix = raw
    .replace(/^new\\//,"")
    .replace(/[^a-z0-9-]+/g,"-")
    .replace(/^-+|-+$/g,"");

  const firstName = document.getElementById("new-page-name").value.trim();
  const locationLabel = document.getElementById("new-page-location").value.trim();

  if(!suffix || !firstName || !locationLabel) return;

  const slug = "new/" + suffix;
  const next = defaultContent(firstName,locationLabel);

  status("Creating…");
  const {error} = await supabase.rpc("save_porch_patrol_editor_landing_page",{
    p_token:token,
    p_slug:slug,
    p_content:next
  });

  if(error){
    status("Could not create page","error");
    throw error;
  }

  dialog.close();
  document.getElementById("new-page-form").reset();
  document.getElementById("new-page-location").value = "Coming to East Dallas";
  await loadPages();
  dirty = false;
  await openPage(slug);
}

editor.addEventListener("input",(event)=>{
  const control = event.target.closest("[data-path]");
  if(control && content){
    setByPath(content,control.dataset.path,control.value);
    markDirty();
  }

  if(event.target.id === "items-field" && content){
    markDirty();
  }
});

list.addEventListener("click",(event)=>{
  const button = event.target.closest("[data-slug]");
  if(button) openPage(button.dataset.slug).catch(console.error);
});

document.getElementById("new-page-button").addEventListener("click",()=>{
  dialog.showModal();
  requestAnimationFrame(()=>document.getElementById("new-page-slug").focus());
});

document.getElementById("cancel-new-page").addEventListener("click",()=>dialog.close());
document.getElementById("new-page-form").addEventListener("submit",(event)=>createPage(event).catch(console.error));
document.getElementById("save-page-button").addEventListener("click",()=>saveCurrent().catch(console.error));
document.getElementById("publish-page-button").addEventListener("click",()=>publishCurrent().catch(console.error));
document.getElementById("preview-page-button").addEventListener("click",previewCurrent);

window.addEventListener("beforeunload",(event)=>{
  if(!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

app.hidden = false;

if(!token){
  authNeeded.hidden = false;
  empty.hidden = true;
  document.getElementById("new-page-button").disabled = true;
  status("Sign in required","error");
}else{
  try{
    await loadPages();
    if(pages[0]) await openPage(pages[0].slug);
    else status("Ready");
  }catch(error){
    console.error(error);
    authNeeded.hidden = false;
    empty.hidden = true;
    editor.hidden = true;
    status("Editor session expired","error");
  }
}

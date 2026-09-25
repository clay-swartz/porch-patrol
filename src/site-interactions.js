const leadEndpoint =
  "https://uymwsivcgtapckzjoywk.supabase.co/functions/v1/submit-porch-patrol-lead";

async function submitLead(form, successEl, errorEl) {
  const submit = form.querySelector('button[type="submit"]');
  if (!submit || !successEl || !errorEl) return false;

  const originalText = submit.textContent;

  successEl.style.display = "none";
  errorEl.style.display = "none";
  submit.disabled = true;
  submit.setAttribute("aria-busy", "true");
  submit.textContent = "Sending…";

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get("Name") || "").trim(),
    home_address: String(formData.get("Home Address") || "").trim(),
    mobile: String(formData.get("Mobile") || "").trim(),
    plan: String(formData.get("Plan") || "Front Entry").trim(),
    _honey: String(formData.get("_honey") || "")
  };

  try {
    const response = await fetch(leadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Lead submission failed");

    const recipient = [
      99,108,97,121,116,111,110,46,115,119,97,114,116,122,
      64,103,109,97,105,108,46,99,111,109
    ].map((c) => String.fromCharCode(c)).join("");

    fetch("https://formsubmit.co/ajax/" + recipient, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: "New Porch Patrol service request",
        _template: "table",
        Name: payload.name,
        "Home Address": payload.home_address,
        Mobile: payload.mobile,
        Plan: payload.plan
      })
    }).catch(() => {});

    successEl.style.display = "block";
    return true;
  } catch (error) {
    errorEl.style.display = "block";
    return false;
  } finally {
    submit.disabled = false;
    submit.removeAttribute("aria-busy");
    submit.textContent = originalText;
  }
}

function initHeroForm() {
  const heroForm = document.getElementById("signup");
  if (!heroForm || heroForm.dataset.ppBound === "true") return;

  const heroPlanInput = document.getElementById("selected-plan");
  const heroPlanNote = document.getElementById("form-plan-note");
  const mobilePlanNote = document.getElementById("mobile-form-note");
  const heroSuccess = document.getElementById("form-success");
  const heroError = document.getElementById("form-error");

  if (!heroPlanInput || !heroPlanNote || !heroSuccess || !heroError) return;

  heroForm.dataset.ppBound = "true";

  heroForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ok = await submitLead(heroForm, heroSuccess, heroError);

    if (ok) {
      heroForm.reset();
      heroPlanInput.value = "Front Entry";
      heroPlanNote.textContent = "We’ll confirm your route day by text. Cancel anytime.";

      if (mobilePlanNote) {
        mobilePlanNote.textContent = "We’ll confirm your route day by text. Cancel anytime.";
      }
    }
  });
}

function initLeadDialog() {
  const dialog = document.getElementById("plan-dialog");
  if (!dialog || dialog.dataset.ppBound === "true") return;

  const dialogForm = document.getElementById("plan-dialog-form");
  const dialogPlan = document.getElementById("dialog-selected-plan");
  const dialogTitle = document.getElementById("plan-dialog-title");
  const dialogNote = document.getElementById("plan-dialog-note");
  const dialogPrice = document.getElementById("plan-dialog-price");
  const dialogSuccess = document.getElementById("dialog-success");
  const dialogError = document.getElementById("dialog-error");
  const closeButton = dialog.querySelector(".plan-dialog-close");

  if (
    !dialogForm ||
    !dialogPlan ||
    !dialogTitle ||
    !dialogNote ||
    !dialogPrice ||
    !dialogSuccess ||
    !dialogError ||
    !closeButton
  ) return;

  dialog.dataset.ppBound = "true";

  document.querySelectorAll(".plan-dialog-open").forEach((button) => {
    if (button.dataset.ppBound === "true") return;
    button.dataset.ppBound = "true";

    button.addEventListener("click", () => {
      dialogForm.reset();
      dialogSuccess.style.display = "none";
      dialogError.style.display = "none";
      dialogPlan.value = button.dataset.plan || "Help me choose";
      dialogTitle.textContent = button.dataset.dialogTitle || "Start service";
      dialogNote.textContent =
        button.dataset.dialogNote || "We’ll confirm your route day by text.";
      dialogPrice.textContent = button.dataset.dialogNote || "";
      dialog.showModal();

      requestAnimationFrame(() => {
        const firstField = dialogForm.querySelector(".field");
        if (firstField && window.innerWidth > 560) firstField.focus();
      });
    });
  });

  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("cancel", () => {
    dialogSuccess.style.display = "none";
    dialogError.style.display = "none";
  });

  dialogForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ok = await submitLead(dialogForm, dialogSuccess, dialogError);

    if (ok) {
      dialogForm.querySelectorAll(".field").forEach((field) => {
        field.value = "";
      });
    }
  });
}

function initCarousels() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-carousel]").forEach((carousel, carouselIndex) => {
    if (carousel.dataset.ppBound === "true") return;

    const track = carousel.querySelector(".carousel-track");
    const slides = track ? [...track.querySelectorAll("img")] : [];
    const dots = [...carousel.querySelectorAll(".carousel-dot")];
    const prev = carousel.querySelector(".carousel-prev");
    const next = carousel.querySelector(".carousel-next");

    if (!track || !prev || !next || slides.length < 2) return;

    carousel.dataset.ppBound = "true";

    let index = 0;
    let timer = null;
    let pointerStartX = null;
    let pointerStartY = null;
    let paused = false;

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      if (reduceMotion || paused || document.hidden) return;
      stop();
      timer = window.setInterval(
        () => show(index + 1),
        5200 + carouselIndex * 450
      );
    };

    const show = (nextIndex, userInitiated = false) => {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%,0,0)`;

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (userInitiated) {
        stop();
        window.setTimeout(() => {
          if (!paused && !reduceMotion) start();
        }, 8500);
      }
    };

    prev.addEventListener("click", () => show(index - 1, true));
    next.addEventListener("click", () => show(index + 1, true));

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => show(dotIndex, true));
    });

    carousel.addEventListener("mouseenter", () => {
      paused = true;
      stop();
    });

    carousel.addEventListener("mouseleave", () => {
      paused = false;
      start();
    });

    carousel.addEventListener("focusin", () => {
      paused = true;
      stop();
    });

    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) {
        paused = false;
        start();
      }
    });

    carousel.addEventListener("pointerdown", (event) => {
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      paused = true;
      stop();
    });

    carousel.addEventListener("pointerup", (event) => {
      if (pointerStartX == null || pointerStartY == null) return;

      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;
      pointerStartX = null;
      pointerStartY = null;

      if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        show(index + (dx < 0 ? 1 : -1), true);
      } else {
        paused = false;
        start();
      }
    });

    carousel.addEventListener("pointercancel", () => {
      pointerStartX = null;
      pointerStartY = null;
      paused = false;
      start();
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1, true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1, true);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    show(0);
    start();
  });
}

function initProcessSections() {
  document.querySelectorAll(".pp-process-section").forEach((section) => {
    if (section.dataset.ppBound === "true") return;

    const steps = [...section.querySelectorAll(".pp-process-step")];
    const photos = [...section.querySelectorAll(".pp-process-photo")];
    const label = section.querySelector(".pp-process-media-label");

    if (!steps.length || !photos.length || !label) return;

    section.dataset.ppBound = "true";

    const activate = (index) => {
      steps.forEach((step, stepIndex) => {
        const active = stepIndex === index;
        step.classList.toggle("active", active);
        step.setAttribute("aria-pressed", active ? "true" : "false");
      });

      photos.forEach((photo, photoIndex) => {
        photo.classList.toggle("active", photoIndex === index);
      });

      label.textContent = steps[index].dataset.processLabel || "";
    };

    steps.forEach((step, index) => {
      step.addEventListener("click", () => activate(index));
      step.addEventListener("focus", () => activate(index));

      if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
        step.addEventListener("mouseenter", () => activate(index));
      }
    });
  });
}

export function initSiteInteractions() {
  initHeroForm();
  initLeadDialog();
  initCarousels();
  initProcessSections();
}

/*
 * Bind immediately to the static fallback DOM so the site works even if the
 * content runtime is unavailable. If the runtime successfully replaces that
 * DOM, it emits porchpatrol:content-rendered and we bind the new elements.
 */
initSiteInteractions();
window.addEventListener("porchpatrol:content-rendered", initSiteInteractions);

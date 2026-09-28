const wrap = document.getElementById("frame-wrap");
const buttons = [...document.querySelectorAll("[data-device]")];

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const device = button.dataset.device;
    buttons.forEach((item) => item.classList.toggle("active", item === button));
    wrap.className = "frame-wrap" + (device === "desktop" ? "" : " " + device);
  });
});

document.getElementById("close-preview").addEventListener("click", () => window.close());

// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

// Highlight the current page in the nav
const current = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav a").forEach((a) => {
  if (a.getAttribute("href") === current) a.classList.add("active");
});

// Footer year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Homepage banner slider
const banner = document.querySelector(".banner");
if (banner) {
  const slides = banner.querySelectorAll(".slide");
  const dotsWrap = banner.querySelector(".banner-dots");
  let index = 0;
  let timer;

  const dots = [...slides].map((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => { show(i); restart(); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("active", n === index));
    dots.forEach((d, n) => d.classList.toggle("active", n === index));
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), 5000);
  }

  banner.querySelector(".prev").addEventListener("click", () => { show(index - 1); restart(); });
  banner.querySelector(".next").addEventListener("click", () => { show(index + 1); restart(); });
  banner.addEventListener("mouseenter", () => clearInterval(timer));
  banner.addEventListener("mouseleave", restart);

  show(0);
  restart();
}

// Product category filter
const filterBtns = document.querySelectorAll(".filter-btn");
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const cat = btn.dataset.filter;
    document.querySelectorAll("[data-category]").forEach((card) => {
      card.style.display = cat === "all" || card.dataset.category === cat ? "" : "none";
    });
  });
});

// Pre-select product on the quote form from ?product=...
const productSelect = document.getElementById("product");
const preset = new URLSearchParams(location.search).get("product");
if (productSelect && preset) productSelect.value = preset;

// Quote form: GitHub Pages has no backend, so the request is sent as a pre-filled WhatsApp message
const WHATSAPP_NUMBER = "923017090822";
document.querySelectorAll("form[data-whatsapp]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const select = form.querySelector("#product");
    const fields = [
      ["Name", data.get("name")],
      ["Company", data.get("company")],
      ["Email", data.get("email")],
      ["Phone", data.get("phone")],
      ["Product", select && select.value ? select.options[select.selectedIndex].text : ""],
      ["Quantity", data.get("quantity")],
      ["Dimensions", data.get("dimensions")],
      ["Details", data.get("message")],
    ];
    const lines = ["*New quote request (website)*"];
    fields.forEach(([label, value]) => {
      if (value && String(value).trim()) lines.push(`*${label}:* ${String(value).trim()}`);
    });
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
    const msg = form.querySelector(".form-msg");
    if (msg) msg.classList.add("show");
  });
});

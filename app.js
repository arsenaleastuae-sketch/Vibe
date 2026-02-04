// Координаты взяты из вашего файла: /mnt/data/новый 11.txt
// 7 хот-спотов: белая пульсирующая точка + модальное окно с фото/характеристиками/кнопкой.

const HOTSPOTS = [
  {
    "id": "c1",
    "yaw": 2.157386501787766,
    "pitch": 0.3930384318914921,
    "title": "Cocktail 1",
    "img": "assets/cocktail-1.svg",
    "specs": [
      "Base: Gin",
      "Taste: Fresh, citrus",
      "Strength: 12% ABV",
      "Volume: 220 ml",
      "Ice: Cubes"
    ]
  },
  {
    "id": "c2",
    "yaw": 1.1556169245064893,
    "pitch": 0.5057380053002518,
    "title": "Cocktail 2",
    "img": "assets/cocktail-2.svg",
    "specs": [
      "Base: Gin",
      "Taste: Fresh, citrus",
      "Strength: 12% ABV",
      "Volume: 220 ml",
      "Ice: Cubes"
    ]
  },
  {
    "id": "c3",
    "yaw": 0.5151470695995126,
    "pitch": 0.27640541564281484,
    "title": "Cocktail 3",
    "img": "assets/cocktail-3.svg",
    "specs": [
      "Base: Gin",
      "Taste: Fresh, citrus",
      "Strength: 12% ABV",
      "Volume: 220 ml",
      "Ice: Cubes"
    ]
  },
  {
    "id": "c4",
    "yaw": 0.37249814253287283,
    "pitch": 0.17097898253325283,
    "title": "Cocktail 4",
    "img": "assets/cocktail-4.svg",
    "specs": [
      "Base: Gin",
      "Taste: Fresh, citrus",
      "Strength: 12% ABV",
      "Volume: 220 ml",
      "Ice: Cubes"
    ]
  },
  {
    "id": "c5",
    "yaw": -0.1688296495581607,
    "pitch": 0.27517131401584827,
    "title": "Cocktail 5",
    "img": "assets/cocktail-5.svg",
    "specs": [
      "Base: Gin",
      "Taste: Fresh, citrus",
      "Strength: 12% ABV",
      "Volume: 220 ml",
      "Ice: Cubes"
    ]
  },
  {
    "id": "c6",
    "yaw": -0.9074040828985552,
    "pitch": 0.34260088147984114,
    "title": "Cocktail 6",
    "img": "assets/cocktail-6.svg",
    "specs": [
      "Base: Gin",
      "Taste: Fresh, citrus",
      "Strength: 12% ABV",
      "Volume: 220 ml",
      "Ice: Cubes"
    ]
  },
  {
    "id": "c7",
    "yaw": -1.74818485116905,
    "pitch": 0.41876780292626314,
    "title": "Cocktail 7",
    "img": "assets/cocktail-7.svg",
    "specs": [
      "Base: Gin",
      "Taste: Fresh, citrus",
      "Strength: 12% ABV",
      "Volume: 220 ml",
      "Ice: Cubes"
    ]
  }
];

const viewerEl = document.getElementById("viewer");

// Marzipano init
const viewer = new Marzipano.Viewer(viewerEl, {
  controls: { mouseViewMode: "drag" }
});

// Панорама: equirectangular 2048x1024 (assets/pano.webp)
const source = Marzipano.ImageUrlSource.fromString("assets/pano.webp");
const geometry = new Marzipano.EquirectGeometry([{ width: 2048 }]);
const limiter = Marzipano.util.compose(
  Marzipano.RectilinearView.limit.traditional(1024, (120 * Math.PI) / 180)
);
const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI / 2 }, limiter);

const scene = viewer.createScene({
  source,
  geometry,
  view,
  pinFirstLevel: true
});

scene.switchTo();

// -------- Modal logic --------
const overlay = document.getElementById("modalOverlay");
const closeBtn = document.getElementById("modalClose");
const imgEl = document.getElementById("modalImg");
const titleEl = document.getElementById("modalTitle");
const specsEl = document.getElementById("modalSpecs");
const orderBtn = document.getElementById("orderBtn");
const moreLink = document.getElementById("moreLink");

let activeHotspot = null;

function openModal(hs) {
  activeHotspot = hs;

  imgEl.src = hs.img;
  imgEl.alt = hs.title;

  titleEl.textContent = hs.title;

  specsEl.innerHTML = "";
  hs.specs.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    specsEl.appendChild(li);
  });

  // Куда вести "Подробнее"
  moreLink.href = hs.moreUrl || "#";

  overlay.classList.add("isOpen");
  overlay.setAttribute("aria-hidden", "false");
}

function closeModal() {
  overlay.classList.remove("isOpen");
  overlay.setAttribute("aria-hidden", "true");
  activeHotspot = null;
}

closeBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

orderBtn.addEventListener("click", () => {
  if (!activeHotspot) return;
  // Тут можно дернуть вашу CRM/бота/форму:
  // window.location.href = activeHotspot.orderUrl;
  alert("Заказ: " + activeHotspot.title + "\n(вставьте вашу интеграцию в app.js)");
});

// -------- Hotspots --------
function createHotspotElement(hs) {
  const el = document.createElement("div");
  el.className = "hotspot";
  el.title = hs.title;
  el.tabIndex = 0;
  el.addEventListener("click", () => openModal(hs));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openModal(hs);
  });
  return el;
}

HOTSPOTS.forEach(hs => {
  const el = createHotspotElement(hs);
  scene.hotspotContainer().createHotspot(el, { yaw: hs.yaw, pitch: hs.pitch });
});

/* =========================================================
   «Рівні складності» — фронтенд. Усі бали й прогрес — на сервері (MongoDB),
   сервер сам перевіряє рішення. Тут: інтерфейс, редактор, анімації.
   ========================================================= */

const TOKEN_KEY = "js-quest-app-token";
const THEME_KEY = "rs-theme";
const $ = (id) => document.getElementById(id);

/* ---------- Безпечний вивід тексту в HTML (захист від XSS) ---------- */
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Токен і запити до API ---------- */
function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setToken(t) { try { localStorage.setItem(TOKEN_KEY, t); } catch { } }
function clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch { } }

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...options, headers });
  if (res.status === 401 && !path.startsWith("/auth")) {
    clearToken();
    showAuthScreen();
    throw new Error("Сесія закінчилась, увійдіть ще раз");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Щось пішло не так");
  return data;
}

/* ---------- Дрібні помічники ---------- */
function initials(name) {
  const clean = (name || "").replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9]/g, "");
  return (clean.slice(0, 2) || "JS").toUpperCase();
}

function formatTime(ms) {
  if (ms == null) return "—";
  const total = Math.floor(ms / 100);                 // десяті частки секунди
  const tenths = total % 10;
  const sec = Math.floor(total / 10) % 60;
  const min = Math.floor(total / 600);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${tenths}`;
}

function starsHtml(count, max = 3) {
  let html = "";
  for (let i = 0; i < max; i++) html += `<span class="${i < count ? "on" : ""}">★</span>`;
  return `<span class="stars" aria-label="${count} з ${max} зірок">${html}</span>`;
}

function daysWord(n) {
  if (n % 10 === 1 && n % 100 !== 11) return "день";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "дні";
  return "днів";
}

function berriesWord(n) {
  if (n % 10 === 1 && n % 100 !== 11) return "ягода";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "ягоди";
  return "ягід";
}

/* ---------- Декор: туманний ліс і орнамент (SVG) ---------- */
function makeRandom(seed) {
  // Простий генератор псевдовипадкових чисел: однаковий seed → однаковий ліс
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function forestSvg(seed) {
  const rnd = makeRandom(seed);
  const W = 1200, H = 420;
  const layers = [
    { base: 300, min: 70, max: 130, gap: [22, 40], color: "var(--forest-1)" },
    { base: 340, min: 90, max: 170, gap: [26, 46], color: "var(--forest-2)" },
    { base: 385, min: 110, max: 210, gap: [30, 56], color: "var(--forest-3)" },
    { base: 425, min: 140, max: 260, gap: [38, 70], color: "var(--forest-4)" },
  ];
  let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--sky-top)"/>
        <stop offset="1" style="stop-color:var(--sky-bottom)"/>
      </linearGradient>
      <linearGradient id="mist${seed}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--mist);stop-opacity:0"/>
        <stop offset="1" style="stop-color:var(--mist);stop-opacity:.22"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky${seed})"/>
    <path d="M0 ${200 + rnd() * 40} Q 300 ${120 + rnd() * 50} 620 ${190 + rnd() * 40} T 1200 ${160 + rnd() * 40} V ${H} H 0 Z" fill="var(--forest-1)" opacity=".45"/>`;

  layers.forEach((layer, i) => {
    let d = "";
    for (let x = -30; x < W + 40; x += layer.gap[0] + rnd() * (layer.gap[1] - layer.gap[0])) {
      const h = layer.min + rnd() * (layer.max - layer.min);
      const w = h * (0.17 + rnd() * 0.06);
      const top = layer.base - h;
      // Ялинка з трьох ярусів
      d += `M${x - w} ${layer.base} L${x - w * 0.55} ${top + h * 0.62} L${x - w * 0.8} ${top + h * 0.62}`
        + ` L${x - w * 0.35} ${top + h * 0.3} L${x - w * 0.55} ${top + h * 0.3} L${x} ${top}`
        + ` L${x + w * 0.55} ${top + h * 0.3} L${x + w * 0.35} ${top + h * 0.3} L${x + w * 0.8} ${top + h * 0.62}`
        + ` L${x + w * 0.55} ${top + h * 0.62} L${x + w} ${layer.base} Z `;
    }
    svg += `<path d="${d}" fill="${layer.color}"/><rect y="${layer.base - 4}" width="${W}" height="${H}" fill="${layer.color}"/>`;
    if (i < layers.length - 1) svg += `<rect y="${layer.base - 120}" width="${W}" height="140" fill="url(#mist${seed})"/>`;
  });
  return svg + "</svg>";
}

function ornamentSvg() {
  let s = `<svg viewBox="-100 -100 200 200" aria-hidden="true">`;
  [18, 44, 70, 94].forEach((r) => { s += `<circle r="${r}"/>`; });
  for (let i = 0; i < 16; i++) s += `<path d="M0 -20 C 11 -36 11 -56 0 -66 C -11 -56 -11 -36 0 -20" transform="rotate(${i * 22.5})"/>`;
  for (let i = 0; i < 32; i++) s += `<path d="M0 -72 C 5 -80 5 -86 0 -92 C -5 -86 -5 -80 0 -72" transform="rotate(${i * 11.25})"/>`;
  for (let i = 0; i < 8; i++) s += `<circle cx="0" cy="-32" r="4" transform="rotate(${i * 45 + 11.25})"/>`;
  return s + "</svg>";
}

function decorate(root = document) {
  root.querySelectorAll(".forest:not(.is-ready)").forEach((el) => {
    el.innerHTML = forestSvg(Number(el.dataset.seed) || 1);
    el.classList.add("is-ready");
  });
  root.querySelectorAll(".ornament:not(.is-ready)").forEach((el) => {
    el.innerHTML = ornamentSvg();
    el.classList.add("is-ready");
  });
}

/* ---------- Тема ---------- */
function applyTheme(themeId) {
  const name = (themeId || "theme-karelia").replace("theme-", "");
  document.documentElement.dataset.theme = name;
  $("themeToggle").textContent = name === "white-nights" ? "☾" : "☀";   // значок показує, на яку тему перемкнемо
  try { localStorage.setItem(THEME_KEY, name); } catch { }
}

$("themeToggle").addEventListener("click", async () => {
  // Швидкий перемикач: світла «Білі ночі» ↔ темна «Карелія»
  const isLight = document.documentElement.dataset.theme === "white-nights";
  const next = isLight ? "theme-karelia" : "theme-white-nights";
  applyTheme(next);
  try { await api(`/shop/${next}/equip`, { method: "POST" }); if (state.data) state.data.equipped.theme = next; }
  catch (err) { showToast(err.message); }
});

/* ---------- Екрани входу і застосунку ---------- */
function showAuthScreen() { $("authScreen").hidden = false; $("appScreen").hidden = true; decorate(); }
function showAppScreen() { $("authScreen").hidden = true; $("appScreen").hidden = false; decorate(); }

document.querySelectorAll(".auth__tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth__tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const isLogin = tab.dataset.tab === "login";
    $("loginForm").hidden = !isLogin;
    $("registerForm").hidden = isLogin;
    $("authError").textContent = "";
  });
});

async function authSubmit(path, username, password) {
  $("authError").textContent = "";
  try {
    const data = await api(path, { method: "POST", body: JSON.stringify({ username, password }) });
    setToken(data.token);
    await bootApp();
  } catch (err) {
    $("authError").textContent = err.message;
  }
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  authSubmit("/auth/login", $("loginUsername").value.trim(), $("loginPassword").value);
});

$("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  authSubmit("/auth/register", $("registerUsername").value.trim(), $("registerPassword").value);
});

$("logoutBtn").addEventListener("click", () => { clearToken(); stopTimer(); showAuthScreen(); });

/* ---------- Тости, конфеті, святкування ---------- */
function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  $("toastContainer").appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => { toast.classList.remove("is-visible"); setTimeout(() => toast.remove(), 300); }, 4200);
}

function launchConfetti() {
  const colors = ["#8dc09a", "#d9ae63", "#c9706a", "#9fb7c0", "#e8e1d3"];   // мох, бурштин, ягода, туман, береста
  for (let i = 0; i < 46; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
    piece.style.animationDelay = Math.random() * 0.3 + "s";
    $("confettiLayer").appendChild(piece);
    setTimeout(() => piece.remove(), 3600);
  }
}

// Черга вікон-святкувань, щоб вони не перекривали одне одного
const overlayQueue = [];
function showOverlay(o) {
  overlayQueue.push(o);
  if (overlayQueue.length === 1) renderOverlay();
}
function renderOverlay() {
  const o = overlayQueue[0];
  if (!o) { $("overlay").hidden = true; return; }
  $("overlayIcon").textContent = o.icon || "🏆";
  $("overlayEyebrow").textContent = o.eyebrow || "";
  $("overlayTitle").textContent = o.title || "";
  $("overlayText").textContent = o.text || "";
  $("overlay").hidden = false;
  decorate($("overlay"));
  launchConfetti();
}
$("overlayBtn").addEventListener("click", () => { overlayQueue.shift(); renderOverlay(); });

/* ---------- Стан застосунку ---------- */
const state = {
  data: null,             // відповідь GET /quests
  view: "trail",
  ratingPeriod: "week",
};

// Знімок прогресу в браузері — щоб помітити новий рівень і нові досягнення
function snapshotKey(u) { return `js-quest-app-snapshot-${u}`; }
function loadSnapshot(u) { try { return JSON.parse(localStorage.getItem(snapshotKey(u)) || "null"); } catch { return null; } }
function saveSnapshot(u, data) {
  try {
    const badges = data.badges.filter((b) => b.unlocked).map((b) => b.id);
    localStorage.setItem(snapshotKey(u), JSON.stringify({ level: data.level, badges }));
  } catch { }
}

function detectAndCelebrate(data) {
  const prev = loadSnapshot(data.username);
  if (prev) {
    data.badges
      .filter((b) => b.unlocked && !prev.badges.includes(b.id))
      .forEach((b) => { showToast(`${b.icon} Нове досягнення: ${b.name}!`); launchConfetti(); });
    if (prev.level !== data.level) {
      showOverlay({ icon: "🏔️", eyebrow: "Новий рівень", title: data.level, text: "Стежка веде вище. Так тримати!" });
    }
  }
  saveSnapshot(data.username, data);
}

/* ---------- Навігація між розділами ---------- */
function showView(name) {
  state.view = name;
  ["trail", "badges", "shop", "rating", "profile", "quest"].forEach((v) => { $(`view-${v}`).hidden = v !== name; });
  document.querySelectorAll(".tabs__item").forEach((t) => t.classList.toggle("is-active", t.dataset.view === name));
  if (name !== "quest") stopTimer();
  if (name === "shop") loadShop();
  if (name === "rating") loadRating();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".tabs__item").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));
$("avatarBtn").addEventListener("click", () => showView("profile"));
$("questBackBtn").addEventListener("click", () => showView("trail"));

/* ---------- Завантаження і відмалювання ---------- */
async function loadAndRender() {
  const data = await api("/quests");
  state.data = data;
  applyTheme(data.equipped.theme);
  renderHud(data);
  renderTrail(data);
  renderBadges(data);
  renderProfile(data);
  renderLadder(data);
  detectAndCelebrate(data);
}

function applyFrame(el, frame) {
  el.classList.remove("frame-moss", "frame-birch", "frame-aurora");
  if (frame && frame !== "frame-none") el.classList.add(frame);
}

function renderHud(data) {
  $("avatar").textContent = initials(data.username);
  applyFrame($("avatar"), data.equipped.frame);
  $("hudUsername").textContent = data.username;
  $("hudTitle").textContent = data.equipped.title || "";
  $("levelName").textContent = data.level;
  $("xpNow").textContent = `${data.xp} XP`;
  $("hudStreak").textContent = data.streak > 0 ? `🔥 ${data.streak} ${daysWord(data.streak)} поспіль` : "";
  $("hudBerries").textContent = `🫐 ${data.berries}`;

  if (data.next) {
    $("xpTarget").textContent = `до «${data.next.name}» — ${data.next.xp - data.xp} XP`;
    const span = data.next.xp - data.levelFloor;
    $("barFill").style.width = `${Math.min(100, ((data.xp - data.levelFloor) / span) * 100)}%`;
  } else {
    $("xpTarget").textContent = "максимальний рівень";
    $("barFill").style.width = "100%";
  }
}

/** Поточна глава: перша відкрита, яку ще не пройдено повністю */
function currentChapter(data) {
  return data.chapters.find((c) => c.unlocked && c.done < c.total) || data.chapters[data.chapters.length - 1];
}

/** Перший відкритий і ще не виконаний квест глави — «наступний крок» */
function nextQuestIn(chapter) {
  return chapter.quests.find((q) => !q.locked && !q.done) || null;
}

function renderTrail(data) {
  // Герой
  const ch = currentChapter(data);
  $("heroEyebrow").textContent = `Глава ${ch.number} · ${ch.topic}`;
  $("heroTitle").textContent = ch.title.toUpperCase();
  $("heroDesc").textContent = ch.desc;

  // Великі цифри
  const tiles = [
    [data.xp, "XP зароблено на стежці — бали ніколи не купуються, лише заробляються"],
    [`${data.stats.stars}`, `зірок із ${data.stats.maxStars} — що менше підказок, то більше зірок`],
    [`${data.stats.questsDone}/${data.stats.questsTotal}`, "квестів пройдено у главах стежки"],
    [`🫐 ${data.berries}`, `${berriesWord(data.berries)} для крамниці — лише косметика`],
  ];
  $("statTiles").innerHTML = tiles.map(([v, l]) => `<div class="stat"><div class="stat__value">${esc(v)}</div><p class="stat__label">${esc(l)}</p></div>`).join("");

  // Щоденний виклик
  if (data.daily) {
    $("dailyPanel").hidden = false;
    $("dailyTitle").textContent = `${data.daily.title} · ${data.daily.chapter}`;
    $("dailyReward").textContent = data.daily.claimed
      ? "Сьогоднішній виклик виконано. Повертайся завтра!"
      : `Бонус за рішення: +${data.daily.bonusXp} XP і +${data.daily.bonusBerries} ягід`;
    $("dailyBtn").disabled = data.daily.claimed;
    $("dailyBtn").textContent = data.daily.claimed ? "Виконано сьогодні ✓" : "Почати виклик";
  } else {
    $("dailyPanel").hidden = true;
  }

  // Глави
  const list = $("chapterList");
  list.innerHTML = "";
  data.chapters.forEach((c) => list.appendChild(renderChapter(c, data)));
  if (data.secret) list.appendChild(renderSecret(data.secret));
  decorate(list);

  renderCustom(data);
}

function questNode(q, isNext, isDaily) {
  const li = document.createElement("li");
  li.className = "node" + (q.boss ? " is-boss" : "") + (q.secret ? " is-secret" : "")
    + (q.done ? " is-done" : "") + (q.locked ? " is-locked" : "") + (isNext ? " is-next" : "");
  li.tabIndex = q.locked ? -1 : 0;
  const typeLabel = q.type === "quiz" ? "квіз" : "код";
  li.innerHTML = `
    <div>
      <p class="node__title">${q.locked ? "🔒 " : ""}${esc(q.title)}
        ${q.boss ? '<span class="tag tag--boss">хранитель</span>' : `<span class="tag">${typeLabel}</span>`}
        ${isDaily ? '<span class="tag tag--daily">виклик дня</span>' : ""}</p>
      <p class="node__desc">${q.locked ? "Спочатку пройди попередній крок стежки" : esc(q.desc)}</p>
    </div>
    <div class="node__side">
      ${q.done ? starsHtml(q.stars) : ""}
      <span class="node__xp">+${q.xp} XP</span>
    </div>`;
  if (!q.locked) {
    li.addEventListener("click", () => openQuest(q.id));
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openQuest(q.id); } });
  }
  return li;
}

function renderChapter(c, data) {
  const el = document.createElement("article");
  el.className = "chapter" + (c.unlocked ? "" : " is-locked") + (c.bossDone ? " is-complete" : "");
  const next = c.unlocked ? nextQuestIn(c) : null;
  el.innerHTML = `
    <div class="chapter__side">
      <div class="forest" data-seed="${c.number * 13 + 5}"></div>
      <span class="chapter__num">${String(c.number).padStart(2, "0")}</span>
      <div>
        <h3 class="chapter__place">${esc(c.title)}</h3>
        <p class="chapter__topic">${esc(c.topic)}</p>
      </div>
    </div>
    <div class="chapter__main">
      <p class="chapter__desc">${esc(c.desc)}</p>
      <div class="chapter__meta">
        <span>${c.done}/${c.total} кроків</span>
        <span>★ ${c.stars}/${c.maxStars}</span>
        <div class="chapter__bar bar"><div class="bar__fill" style="width:${(c.done / c.total) * 100}%"></div></div>
      </div>
    </div>`;
  const main = el.querySelector(".chapter__main");
  if (!c.unlocked) {
    main.insertAdjacentHTML("beforeend", `<p class="lock-note">🔒 Здолай хранителя попередньої глави, щоб пройти далі.</p>`);
  } else {
    const ol = document.createElement("ol");
    ol.className = "trail";
    c.quests.forEach((q) => ol.appendChild(questNode(q, next && next.id === q.id, data.daily && data.daily.questId === q.id && !data.daily.claimed)));
    main.appendChild(ol);
  }
  return el;
}

function renderSecret(q) {
  const el = document.createElement("article");
  el.className = "chapter";
  el.innerHTML = `
    <div class="chapter__side">
      <div class="forest" data-seed="99"></div>
      <span class="chapter__num">🗝️</span>
      <div><h3 class="chapter__place">Таємна стежка</h3><p class="chapter__topic">Рекурсія</p></div>
    </div>
    <div class="chapter__main"><p class="chapter__desc">Стежка, яку бачать лише ті, хто дійшов до вершини.</p></div>`;
  const ol = document.createElement("ol");
  ol.className = "trail";
  ol.appendChild(questNode(q, !q.done, false));
  el.querySelector(".chapter__main").appendChild(ol);
  return el;
}

/* ---------- Власні задачі ---------- */
function renderCustom(data) {
  const list = $("customList");
  list.innerHTML = "";
  if (!data.customQuests.length) {
    list.innerHTML = `<li class="empty">Поки немає своїх задач — додай першу нижче.</li>`;
    return;
  }
  data.customQuests.forEach((q) => {
    const li = document.createElement("li");
    li.className = "custom-item" + (q.done ? " is-done" : "");
    li.innerHTML = `
      <button class="check ${q.done ? "is-on" : ""}" title="${q.done ? "Зняти позначку" : "Позначити виконаною"}">${q.done ? "✓" : ""}</button>
      <span class="custom-item__title">${esc(q.title)}</span>
      <span class="node__xp">+${q.xp} XP</span>
      <button class="delete-btn" title="Видалити" aria-label="Видалити задачу">×</button>`;
    li.querySelector(".check").addEventListener("click", async () => {
      try {
        const res = await api(`/quests/custom/${encodeURIComponent(q.id)}/toggle`, { method: "POST" });
        if (res.comboBonus) showToast(`🎯 Комбо дня! +${res.comboBonus} XP бонус`);
        await loadAndRender();
      } catch (err) { showToast(err.message); }
    });
    li.querySelector(".delete-btn").addEventListener("click", async () => {
      try { await api(`/quests/custom/${encodeURIComponent(q.id)}`, { method: "DELETE" }); await loadAndRender(); }
      catch (err) { showToast(err.message); }
    });
    list.appendChild(li);
  });
}

$("addQuestForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("newQuestTitle").value.trim();
  if (!title) return;
  try {
    await api("/quests/custom", { method: "POST", body: JSON.stringify({ title, xp: $("newQuestXp").value }) });
    $("newQuestTitle").value = "";
    $("newQuestXp").value = "10";
    await loadAndRender();
  } catch (err) { showToast(err.message); }
});

$("dailyBtn").addEventListener("click", () => { if (state.data && state.data.daily) openQuest(state.data.daily.questId); });

/* ---------- Досягнення ---------- */
function renderBadges(data) {
  const unlocked = data.badges.filter((b) => b.unlocked).length;
  $("badgeCount").textContent = `Відкрито ${unlocked} із ${data.badges.length}`;
  $("badgeList").innerHTML = data.badges.map((b) => `
    <li class="badge ${b.unlocked ? "is-unlocked" : ""}">
      <div class="badge__icon">${b.unlocked ? b.icon : "?"}</div>
      <div class="badge__name">${esc(b.name)}</div>
      <div class="badge__desc">${esc(b.desc)}</div>
    </li>`).join("");
}

/* ---------- Крамниця ---------- */
const THEME_SWATCHES = {
  "theme-karelia": ["#162026", "#4a5b60", "#9db8a6", "#d9ae63"],
  "theme-white-nights": ["#e9eeed", "#c6d2d0", "#3f6f5b", "#a8711b"],
  "theme-aurora": ["#120f24", "#3b3870", "#5fe1c8", "#f06a8a"],
  "theme-taiga": ["#1d1611", "#5a4636", "#e0954a", "#e8b94f"],
};

async function loadShop() {
  try { renderShop(await api("/shop")); }
  catch (err) { $("shopList").innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
}

function itemPreview(item) {
  if (item.type === "frame") {
    const initialsText = state.data ? initials(state.data.username) : "JS";
    return `<span class="avatar ${item.id === "frame-none" ? "" : item.id}">${esc(initialsText)}</span>`;
  }
  if (item.type === "title") return `<span class="item__title-preview">${esc(item.text || "—")}</span>`;
  const colors = THEME_SWATCHES[item.id] || [];
  return `<div class="swatches">${colors.map((c) => `<span style="background:${c}"></span>`).join("")}</div>`;
}

function renderShop(shop) {
  $("shopBalance").textContent = `🫐 ${shop.berries} ${berriesWord(shop.berries)} · заробляй за зірки, хранителів і щоденні виклики`;
  const groups = [["frame", "Рамки аватара"], ["title", "Титули"], ["theme", "Теми оформлення"]];
  $("shopList").innerHTML = groups.map(([type, title]) => `
    <section class="shop-group">
      <h3 class="shop-group__title">${title}</h3>
      <div class="shop-grid">
        ${shop.items.filter((i) => i.type === type).map((i) => `
          <article class="item ${i.equipped ? "is-equipped" : ""}">
            <div class="item__preview">${itemPreview(i)}</div>
            <div><h4 class="item__name">${esc(i.name)}</h4><p class="item__desc">${esc(i.desc)}</p></div>
            <div class="item__foot">
              <span class="price">${i.price ? `🫐 ${i.price}` : "Безкоштовно"}</span>
              ${i.equipped
                ? `<button class="btn btn--small" disabled>Обрано</button>`
                : i.owned
                  ? `<button class="btn btn--small" data-equip="${i.id}">Обрати</button>`
                  : `<button class="btn btn--small btn--accent" data-buy="${i.id}" ${shop.berries < i.price ? "disabled" : ""}>Купити</button>`}
            </div>
          </article>`).join("")}
      </div>
    </section>`).join("");

  $("shopList").querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => shopAction(b.dataset.buy, "buy")));
  $("shopList").querySelectorAll("[data-equip]").forEach((b) => b.addEventListener("click", () => shopAction(b.dataset.equip, "equip")));
}

async function shopAction(id, action) {
  try {
    const shop = await api(`/shop/${id}/${action}`, { method: "POST" });
    if (action === "buy") { showToast("🛍️ Покупка вдала!"); launchConfetti(); }
    renderShop(shop);
    await loadAndRender();
  } catch (err) { showToast(err.message); }
}

/* ---------- Рейтинг ---------- */
document.querySelectorAll("#ratingTabs .segmented__item").forEach((b) => {
  b.addEventListener("click", () => {
    state.ratingPeriod = b.dataset.period;
    document.querySelectorAll("#ratingTabs .segmented__item").forEach((x) => x.classList.toggle("is-active", x === b));
    loadRating();
  });
});

async function loadRating() {
  const board = $("leaderboard");
  try {
    const rows = await api(`/quests/leaderboard?period=${state.ratingPeriod}`);
    if (!rows.length) { board.innerHTML = `<li class="empty">Ще немає жодного результату</li>`; return; }
    const me = state.data ? state.data.username : "";
    board.innerHTML = rows.map((r, i) => `
      <li class="${r.username === me ? "is-me" : ""}">
        <span class="board__rank">${i + 1}</span>
        <span class="avatar avatar--small ${r.frame !== "frame-none" ? esc(r.frame) : ""}">${esc(initials(r.username))}</span>
        <span><span class="board__name">${esc(r.username)}</span><span class="board__sub">${esc(r.title ? r.title + " · " : "")}${esc(r.level)}</span></span>
        <span class="board__xp">${r.xp} XP</span>
      </li>`).join("");
  } catch {
    board.innerHTML = `<li class="empty">Не вдалося завантажити рейтинг</li>`;
  }
}

function renderLadder(data) {
  $("ladder").innerHTML = data.levels.map((lv) => {
    const cls = lv.name === data.level ? "is-current" : lv.xp < data.levelFloor ? "is-reached" : "";
    return `<li class="${cls}"><span>${esc(lv.name)}</span><span>${lv.xp} XP</span></li>`;
  }).join("");
}

/* ---------- Профіль ---------- */
function renderProfile(data) {
  $("profileAvatar").textContent = initials(data.username);
  applyFrame($("profileAvatar"), data.equipped.frame);
  $("profileUsername").textContent = data.username;
  const since = data.memberSince ? new Date(data.memberSince).toLocaleDateString("uk-UA") : "—";
  $("profileSince").textContent = `${data.equipped.title ? data.equipped.title + " · " : ""}На стежці з ${since}`;

  const unlockedBadges = data.badges.filter((b) => b.unlocked).length;
  const stats = [
    [data.level, "рівень"],
    [data.xp, "XP усього"],
    [`★ ${data.stats.stars}`, "зірок"],
    [data.streak > 0 ? `🔥 ${data.streak}` : "0", "днів поспіль"],
    [`${data.stats.questsDone}`, "квестів виконано"],
    [`${unlockedBadges}/${data.badges.length}`, "досягнень"],
  ];
  $("profileStats").innerHTML = stats.map(([v, l]) => `<div class="stat"><div class="stat__value">${esc(v)}</div><p class="stat__label">${esc(l)}</p></div>`).join("");

  // Календар: 12 тижнів, колонка = тиждень
  $("calendar").innerHTML = data.activity.map((d) => {
    const lvl = d.xp === 0 ? 0 : d.xp <= 20 ? 1 : d.xp <= 50 ? 2 : 3;
    return `<i class="c${lvl}" title="${d.date}: ${d.xp} XP"></i>`;
  }).join("");

  $("chapterProgress").innerHTML = data.chapters.map((c) => `
    <li>
      <span>${String(c.number).padStart(2, "0")} · ${esc(c.title)}</span>
      <span class="node__xp">★ ${c.stars}/${c.maxStars}</span>
      <div class="bar"><div class="bar__fill" style="width:${(c.done / c.total) * 100}%"></div></div>
    </li>`).join("");

  $("profileList").innerHTML = data.completedList.length
    ? data.completedList.map((q) => `<li><span>${esc(q.title)}</span><span>${q.stars ? "★".repeat(q.stars) + " · " : ""}+${q.xp} XP</span></li>`).join("")
    : `<li class="empty">Ще немає виконаних квестів</li>`;
}

/* =========================================================
   Редактор коду: textarea поверх підсвіченого <pre>
   ========================================================= */
const TOKEN_RE = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|(`(?:\\[\s\S]|[^`\\])*`?|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|\b(true|false|null|undefined|NaN)\b|\b(\d+(?:\.\d+)?)\b|\b(function|return|if|else|for|while|do|let|const|var|switch|case|break|continue|default|new|typeof|of|in|class|this)\b/g;

function highlight(code) {
  let out = "";
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(code))) {
    if (m[0] === "") { TOKEN_RE.lastIndex++; continue; }
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "b" : m[4] ? "n" : "k";
    out += `<span class="tok-${cls}">${esc(m[0])}</span>`;
    last = TOKEN_RE.lastIndex;
  }
  return out + esc(code.slice(last)) + "\n";
}

function createEditor(host, initial) {
  host.innerHTML = `
    <div class="editor">
      <div class="editor__gutter" aria-hidden="true"></div>
      <div class="editor__body">
        <pre class="editor__hl" aria-hidden="true"><code></code></pre>
        <textarea class="editor__input" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Редактор коду"></textarea>
      </div>
    </div>`;
  const ta = host.querySelector(".editor__input");
  const code = host.querySelector("code");
  const pre = host.querySelector(".editor__hl");
  const gutter = host.querySelector(".editor__gutter");

  function sync() {
    code.innerHTML = highlight(ta.value);
    const lines = ta.value.split("\n").length;
    gutter.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join("");
    syncScroll();
  }
  function syncScroll() {
    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
    gutter.scrollTop = ta.scrollTop;
  }
  function insert(text) {
    // execCommand зберігає історію Ctrl+Z; якщо не спрацює — вставляємо напряму
    if (!document.execCommand || !document.execCommand("insertText", false, text)) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
    }
    sync();
  }

  ta.addEventListener("input", sync);
  ta.addEventListener("scroll", syncScroll);
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {                                   // Tab — два пробіли замість переходу фокусу
      e.preventDefault();
      insert("  ");
    } else if (e.key === "Enter") {                          // Enter — зберігаємо відступ рядка
      const start = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
      const indent = (ta.value.slice(lineStart, start).match(/^[ \t]*/) || [""])[0];
      const extra = ta.value[start - 1] === "{" ? "  " : "";
      e.preventDefault();
      insert("\n" + indent + extra);
    }
  });

  ta.value = initial;
  sync();
  return { getValue: () => ta.value, focus: () => ta.focus() };
}

/* ---------- Перевірка коду у Web Worker з обмеженням часу ---------- */
function runInWorker(code, fnName, tests) {
  return new Promise((resolve) => {
    const worker = new Worker("worker.js");
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ error: "Код виконується занадто довго (понад 2 секунди) — можливо, нескінченний цикл", results: [] });
    }, 2000);
    worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ error: "Помилка в коді: " + e.message, results: [] }); };
    worker.postMessage({ code, fnName, tests });
  });
}

/* =========================================================
   Екран квесту
   ========================================================= */
const qs = { quest: null, chapter: null, editor: null, selected: null, startedAt: 0, timerId: null, solvedTime: null };

function findQuest(id) {
  const data = state.data;
  if (!data) return null;
  for (const c of data.chapters) {
    const q = c.quests.find((x) => x.id === id);
    if (q) return { quest: q, chapter: c };
  }
  if (data.secret && data.secret.id === id) return { quest: data.secret, chapter: { title: "Таємна стежка", number: "★" } };
  return null;
}

function startTimer() {
  stopTimer();
  qs.startedAt = Date.now();
  qs.solvedTime = null;
  qs.timerId = setInterval(() => { const el = $("qTimer"); if (el) el.textContent = formatTime(Date.now() - qs.startedAt); }, 100);
}
function stopTimer() { if (qs.timerId) clearInterval(qs.timerId); qs.timerId = null; }

function possibleStars(q) { return q.done ? q.stars : Math.max(1, 3 - q.hintsUsed); }

function openQuest(id) {
  const found = findQuest(id);
  if (!found || found.quest.locked) return;
  const { quest: q, chapter } = found;
  qs.quest = q;
  qs.chapter = chapter;
  qs.selected = null;

  const isDaily = state.data.daily && state.data.daily.questId === q.id && !state.data.daily.claimed;
  const card = $("questCard");
  card.className = "quest" + (q.boss ? " is-boss" : "");
  card.innerHTML = `
    <div class="ornament" aria-hidden="true"></div>
    <p class="eyebrow">Глава ${esc(chapter.number)} · ${esc(chapter.title)} · ${q.boss ? "хранитель" : q.type === "quiz" ? "квіз" : "задача з кодом"}</p>
    <h2 class="quest__title">${esc(q.title)}</h2>
    <div class="quest__meta">
      <span class="chip">⏱ <strong id="qTimer">00:00.0</strong></span>
      <span class="chip">🏁 рекорд <strong id="qBest">${formatTime(q.bestTime)}</strong></span>
      <span class="chip" id="qStars">${starsHtml(possibleStars(q))}</span>
      <span class="chip">+${q.xp} XP</span>
      ${isDaily ? '<span class="chip">🎁 виклик дня</span>' : ""}
      ${q.done ? '<span class="chip chip--done">✓ пройдено</span>' : ""}
    </div>
    <p class="quest__prompt">${esc(q.prompt)}</p>
    ${q.type === "code" ? '<div id="editorHost"></div>' : '<div class="options" id="optionsBox"></div>'}
    <div class="hint-box" id="hintBox">${q.hintsShown.map((h) => `<p>💡 ${esc(h)}</p>`).join("")}</div>
    <div class="test-results" id="testResults"></div>
    <div id="resultBox"></div>
    <p class="feedback" id="feedback"></p>
    <div class="actions" id="questActions">
      ${q.hintsTotal ? `<button class="btn" id="hintBtn"></button>` : ""}
      <button class="btn btn--accent" id="runBtn">${q.type === "code" ? "Перевірити код" : "Перевірити відповідь"}</button>
    </div>`;
  decorate(card);

  if (q.type === "code") {
    qs.editor = createEditor($("editorHost"), q.starter);
  } else {
    qs.editor = null;
    const box = $("optionsBox");
    q.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "option";
      b.textContent = opt;
      b.addEventListener("click", () => {
        qs.selected = i;
        box.querySelectorAll(".option").forEach((o) => o.classList.remove("is-selected", "is-wrong"));
        b.classList.add("is-selected");
      });
      box.appendChild(b);
    });
  }

  updateHintButton();
  if ($("hintBtn")) $("hintBtn").addEventListener("click", takeHint);
  $("runBtn").addEventListener("click", checkAnswer);

  showView("quest");
  startTimer();
}

function updateHintButton() {
  const btn = $("hintBtn");
  const q = qs.quest;
  if (!btn) return;
  if (q.hintsUsed >= q.hintsTotal) {
    btn.disabled = true;
    btn.textContent = "Підказок більше немає";
  } else {
    btn.disabled = false;
    btn.textContent = q.done ? "Показати підказку" : `Підказка (−1 ★) · ${q.hintsTotal - q.hintsUsed} лишилось`;
  }
  $("qStars").innerHTML = starsHtml(possibleStars(q));
}

async function takeHint() {
  try {
    const res = await api(`/quests/${qs.quest.id}/hint`, { method: "POST" });
    qs.quest.hintsUsed = res.hintsUsed;
    qs.quest.hintsShown.push(res.hint);
    $("hintBox").insertAdjacentHTML("beforeend", `<p>💡 ${esc(res.hint)}</p>`);
    updateHintButton();
  } catch (err) { showToast(err.message); }
}

function renderResults(results) {
  $("testResults").innerHTML = results.map((r) => `
    <div class="test-row ${r.pass ? "pass" : "fail"}">
      ${esc(r.call)} → ${r.error ? "помилка: " + esc(r.error) : `отримано: ${esc(r.actual)}, очікувалось: ${esc(r.expected)}`} ${r.pass ? "✅" : "❌"}
    </div>`).join("");
}

function setFeedback(text, ok) {
  const f = $("feedback");
  f.textContent = text;
  f.className = "feedback " + (ok ? "ok" : "bad");
}

async function checkAnswer() {
  const q = qs.quest;
  const runBtn = $("runBtn");
  runBtn.disabled = true;
  const timeMs = Date.now() - qs.startedAt;

  try {
    let body;
    if (q.type === "code") {
      const code = qs.editor.getValue();
      // 1. Швидка перевірка в браузері (з обмеженням часу)
      const local = await runInWorker(code, q.fnName, q.tests);
      if (local.error) { renderResults([]); setFeedback(local.error, false); return; }
      renderResults(local.results);
      if (!local.results.every((r) => r.pass)) { setFeedback("Поки не всі перевірки пройдені — онови код і спробуй ще раз.", false); return; }
      body = { code, timeMs };
    } else {
      if (qs.selected === null) { setFeedback("Спочатку обери один із варіантів.", false); return; }
      body = { answer: qs.selected, timeMs };
    }

    // 2. Сервер перевіряє ще раз і нараховує нагороди
    const res = await api(`/quests/${q.id}/submit`, { method: "POST", body: JSON.stringify(body) });
    if (!res.passed) {
      if (res.results && res.results.length) renderResults(res.results);
      if (q.type === "quiz") $("optionsBox").children[qs.selected].classList.add("is-wrong");
      setFeedback(res.error || (q.type === "quiz" ? "Поки що не так. Спробуй ще раз." : "Сервер не прийняв рішення — перевір код."), false);
      return;
    }
    await celebrateSolve(q, res);
  } catch (err) {
    setFeedback(err.message, false);
  } finally {
    if ($("runBtn")) $("runBtn").disabled = false;
  }
}

async function celebrateSolve(q, res) {
  stopTimer();
  setFeedback(res.firstTime ? "Прохід відкрито! Рішення зараховано." : "Правильно! Цей квест уже був пройдений раніше.", true);
  if (res.bestTime) $("qBest").textContent = formatTime(res.bestTime);

  // Блок результату із зірками
  const lines = [];
  if (res.xpGain) lines.push(`<strong>+${res.xpGain} XP</strong>`);
  if (res.berriesGain) lines.push(`<strong>🫐 +${res.berriesGain}</strong>`);
  if (res.newRecord) lines.push(`🏁 новий рекорд ${formatTime(res.bestTime)}`);
  $("resultBox").innerHTML = `
    <div class="result">
      <div class="result__stars">${[0, 1, 2].map((i) => `<span class="${i < res.stars ? "on" : ""}">★</span>`).join("")}</div>
      <p class="result__text">${lines.join(" · ") || "Рішення вірне"}</p>
    </div>`;

  if (res.dailyBonus) showToast(`🎁 Виклик дня виконано: +${res.dailyBonus.xp} XP і +${res.dailyBonus.berries} ягід`);
  if (res.comboBonus) showToast(`🎯 Комбо дня! +${res.comboBonus} XP бонус`);
  if (res.newRecord) showToast(`🏁 Новий рекорд: ${formatTime(res.bestTime)}`);
  launchConfetti();

  const wasBoss = res.boss && res.firstTime;
  const chapterTitle = qs.chapter.title;
  await loadAndRender();

  if (wasBoss) {
    const finalBoss = q.id === "boss-summit";
    showOverlay({
      icon: finalBoss ? "🏔️" : "🗿",
      eyebrow: "Хранителя здолано",
      title: q.title,
      text: finalBoss
        ? "Ти на вершині стежки! А неподалік з'явилася таємна стежка…"
        : `Глава «${chapterTitle}» пройдена. Попереду відкрилася нова локація.`,
    });
  }

  // Кнопки «далі»
  const nextQ = findNextQuest(q.id);
  const actions = $("questActions");
  actions.innerHTML = "";
  if (nextQ) {
    const b = document.createElement("button");
    b.className = "btn btn--accent";
    b.textContent = `Далі: ${nextQ.title} →`;
    b.addEventListener("click", () => openQuest(nextQ.id));
    actions.appendChild(b);
  }
  const back = document.createElement("button");
  back.className = "btn";
  back.textContent = "До стежки";
  back.addEventListener("click", () => showView("trail"));
  actions.appendChild(back);
}

/** Наступний відкритий невиконаний квест після поточного */
function findNextQuest(currentId) {
  const all = state.data.chapters.flatMap((c) => c.quests).concat(state.data.secret ? [state.data.secret] : []);
  const idx = all.findIndex((q) => q.id === currentId);
  return all.slice(idx + 1).find((q) => !q.locked && !q.done) || all.find((q) => !q.locked && !q.done) || null;
}

/* ---------- Старт ---------- */
async function bootApp() {
  if (!getToken()) { showAuthScreen(); return; }
  try {
    await loadAndRender();
    showAppScreen();
    showView("trail");
  } catch {
    showAuthScreen();
  }
}

applyTheme(document.documentElement.dataset.theme);
decorate();
bootApp();
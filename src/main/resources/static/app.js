// =====================
// Config / constants
// =====================
const TOKEN_KEY = "jwt_token";
const LANG_KEY = "lang"; // "no" | "en"
let currentFilter = "ALL";
let authMode = "login"; // "login" | "register"

// =====================
// i18n
// =====================
const i18n = {
  no: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    login: "Logg inn",
    logout: "Logg ut",
    register: "Opprett bruker",
    haveUser: "Har du bruker? Logg inn",
    emailPh: "E-post",
    passLoginPh: "Passord",
    passRegPh: "Passord (min 6 tegn)",
    appsTitle: "Søknader",
    newAppTitle: "Ny søknad",
    listTitle: "Liste",
    add: "Legg til",
    company: "Firma *",
    role: "Stilling *",
    link: "Link",
    deadline: "Frist",
    noResults: "Ingen treff.",
    noLink: "Ingen link",
    invalidAuth: "Skriv inn gyldig e-post og passord (minst 6 tegn).",
    authFailed: "Kunne ikke autentisere.",
    sessionExpired: "Sesjonen din er utløpt. Logg inn på nytt.",
    delete: "Slett",
    stats: (c) => `Planlagt: ${c.PLANLAGT||0} • Søkt: ${c.SOKT||0} • Intervju: ${c.INTERVJU||0} • Tilbud: ${c.TILBUD||0} • Avslått: ${c.AVSLATT||0}`,
    badge: { PLANLAGT:"Planlagt", SOKT:"Søkt", INTERVJU:"Intervju", AVSLATT:"Avslått", TILBUD:"Tilbud" },
    filters: { ALL:"Alle", PLANLAGT:"Planlagt", SOKT:"Søkt", INTERVJU:"Intervju", AVSLATT:"Avslått", TILBUD:"Tilbud" },
    footer: "Bygget med Java (Spring Boot) + vanilla JS + JWT."
  },
  en: {
    title: "Job Tracker",
    subtitle: "Track your job applications.",
    login: "Sign in",
    logout: "Sign out",
    register: "Create account",
    haveUser: "Already have an account? Sign in",
    emailPh: "Email",
    passLoginPh: "Password",
    passRegPh: "Password (min 6 chars)",
    appsTitle: "Applications",
    newAppTitle: "New application",
    listTitle: "List",
    add: "Add",
    company: "Company *",
    role: "Role *",
    link: "Link",
    deadline: "Deadline",
    noResults: "No results.",
    noLink: "No link",
    invalidAuth: "Enter a valid email and password (min 6 chars).",
    authFailed: "Authentication failed.",
    sessionExpired: "Session expired. Please sign in again.",
    delete: "Delete",
    stats: (c) => `Planned: ${c.PLANLAGT||0} • Applied: ${c.SOKT||0} • Interview: ${c.INTERVJU||0} • Offer: ${c.TILBUD||0} • Rejected: ${c.AVSLATT||0}`,
    badge: { PLANLAGT:"Planned", SOKT:"Applied", INTERVJU:"Interview", AVSLATT:"Rejected", TILBUD:"Offer" },
    filters: { ALL:"All", PLANLAGT:"Planned", SOKT:"Applied", INTERVJU:"Interview", AVSLATT:"Rejected", TILBUD:"Offer" },
    footer: "Built with Java (Spring Boot) + vanilla JS + JWT."
  }
};

function getLang() {
  return localStorage.getItem(LANG_KEY) || "no";
}
function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}
function t() {
  return i18n[getLang()];
}

// =====================
// JWT helpers
// =====================
function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function authHeaders() {
  const token = getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), ...authHeaders() };
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    setLoggedOutUI(t().sessionExpired);
  }
  return res;
}

// For UI only (display email), not security-critical
function parseJwtEmail(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => `%${("00"+c.charCodeAt(0).toString(16)).slice(-2)}`).join("")
    );
    return JSON.parse(json).sub || "User";
  } catch {
    return "User";
  }
}

// =====================
// DOM refs (from your HTML)
// =====================
const whoamiEl = document.getElementById("whoami");
const openLoginBtn = document.getElementById("openLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authModal = document.getElementById("authModal");
const closeAuthModal = document.getElementById("closeAuthModal");
const authTitle = document.getElementById("authTitle");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authMsg = document.getElementById("authMsg");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthMode = document.getElementById("toggleAuthMode");

const appCard = document.getElementById("appCard");
const listEl = document.getElementById("list");
const statsEl = document.getElementById("stats");
const createForm = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");

// Language buttons
const langNoBtn = document.getElementById("langNoBtn");
const langEnBtn = document.getElementById("langEnBtn");

// Text nodes in HTML
const titleEl = document.getElementById("t_title");
const subtitleEl = document.getElementById("t_subtitle");
const appsTitleEl = document.getElementById("t_appsTitle");
const newAppTitleEl = document.getElementById("t_newAppTitle");
const listTitleEl = document.getElementById("t_listTitle");
const addBtnEl = document.getElementById("t_addBtn");
const companyLabelEl = document.getElementById("t_companyLabel");
const roleLabelEl = document.getElementById("t_roleLabel");
const linkLabelEl = document.getElementById("t_linkLabel");
const deadlineLabelEl = document.getElementById("t_deadlineLabel");
const footerEl = document.getElementById("t_footer");

// Filter buttons
const filterBtnAll = document.getElementById("t_f_all");
const filterBtnPlanned = document.getElementById("t_f_planned");
const filterBtnApplied = document.getElementById("t_f_applied");
const filterBtnInterview = document.getElementById("t_f_interview");
const filterBtnRejected = document.getElementById("t_f_rejected");
const filterBtnOffer = document.getElementById("t_f_offer");

// =====================
// i18n apply
// =====================
function applyI18n() {
  const L = t();

  // header
  titleEl.textContent = L.title;
  subtitleEl.textContent = L.subtitle;

  // buttons
  openLoginBtn.textContent = L.login;
  logoutBtn.textContent = L.logout;

  // app headings
  appsTitleEl.textContent = L.appsTitle;
  newAppTitleEl.textContent = L.newAppTitle;
  listTitleEl.textContent = L.listTitle;
  addBtnEl.textContent = L.add;
  companyLabelEl.textContent = L.company;
  roleLabelEl.textContent = L.role;
  linkLabelEl.textContent = L.link;
  deadlineLabelEl.textContent = L.deadline;
  footerEl.textContent = L.footer;

  // filters
  filterBtnAll.textContent = L.filters.ALL;
  filterBtnPlanned.textContent = L.filters.PLANLAGT;
  filterBtnApplied.textContent = L.filters.SOKT;
  filterBtnInterview.textContent = L.filters.INTERVJU;
  filterBtnRejected.textContent = L.filters.AVSLATT;
  filterBtnOffer.textContent = L.filters.TILBUD;

  // modal
  authTitle.textContent = authMode === "login" ? L.login : L.register;
  authSubmitBtn.textContent = authMode === "login" ? L.login : L.register;
  toggleAuthMode.textContent = authMode === "login" ? L.register : L.haveUser;
  authEmail.placeholder = L.emailPh;
  authPassword.placeholder = authMode === "login" ? L.passLoginPh : L.passRegPh;

  // lang button active
  const lang = getLang();
  langNoBtn.classList.toggle("active", lang === "no");
  langEnBtn.classList.toggle("active", lang === "en");
}

// =====================
// Modal open/close
// =====================
function openModal() {
  authMsg.textContent = "";
  authModal.classList.remove("hidden");
  authModal.setAttribute("aria-hidden", "false");
  setTimeout(() => authEmail.focus(), 0);
}
function closeModal() {
  authModal.classList.add("hidden");
  authModal.setAttribute("aria-hidden", "true");
}

openLoginBtn.addEventListener("click", openModal);
closeAuthModal.addEventListener("click", closeModal);
authModal.addEventListener("click", (e) => {
  if (e.target === authModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !authModal.classList.contains("hidden")) closeModal();
});

// =====================
// Auth mode toggle
// =====================
toggleAuthMode.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  authMsg.textContent = "";
  applyI18n();
});

// =====================
// Auth submit
// =====================
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "";

  const email = (authEmail.value || "").trim().toLowerCase();
  const password = authPassword.value || "";

  if (!email || !password || password.length < 6) {
    authMsg.textContent = t().invalidAuth;
    return;
  }

  const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const text = await res.text();
    authMsg.textContent = text || t().authFailed;
    return;
  }

  const data = await res.json(); // { token: "..." }
  setToken(data.token);
  closeModal();
  setLoggedInUI();
  await load();
});

// =====================
// Logout
// =====================
logoutBtn.addEventListener("click", () => {
  clearToken();
  setLoggedOutUI("");
});

// =====================
// Language switch
// =====================
langNoBtn.addEventListener("click", () => {
  setLang("no");
  applyI18n();
  renderLast(); // refresh labels in list
});

langEnBtn.addEventListener("click", () => {
  setLang("en");
  applyI18n();
  renderLast();
});

// =====================
// Filters
// =====================
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    load();
  });
});

// =====================
// Create form
// =====================
createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  const data = new FormData(createForm);
  const payload = {
    company: data.get("company"),
    role: data.get("role"),
    link: data.get("link"),
    deadline: data.get("deadline")
  };

  const res = await apiFetch("/api/apps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    formMsg.textContent = text || "Noe gikk galt";
    return;
  }

  createForm.reset();
  await load();
});

// =====================
// App render logic (your existing UI)
// =====================
function fmtDate(d) {
  return d ? d : "—";
}

function isOverdue(deadline, status) {
  if (!deadline) return false;
  if (status === "AVSLATT" || status === "TILBUD") return false;
  const today = new Date();
  const dd = new Date(deadline + "T00:00:00");
  return dd < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

async function updateStatus(id, status) {
  const res = await apiFetch(`/api/apps/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) return;
  await load();
}

async function removeItem(id) {
  const res = await apiFetch(`/api/apps/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) return;
  await load();
}

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

let lastApps = [];
function renderLast() {
  if (getToken() && Array.isArray(lastApps)) render(lastApps);
}

function render(apps) {
  lastApps = apps;
  const L = t();

  const filtered = currentFilter === "ALL"
    ? apps
    : apps.filter(a => a.status === currentFilter);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  statsEl.textContent = L.stats(counts);

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted">${L.noResults}</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const a of filtered) {
    const el = document.createElement("div");
    el.className = "item" + (isOverdue(a.deadline, a.status) ? " overdue" : "");

    const link = a.link
      ? `<a href="${a.link}" target="_blank" rel="noreferrer">Link</a>`
      : `<span class="muted">${L.noLink}</span>`;

    const statusLabel = L.badge[a.status] ?? a.status;

    el.innerHTML = `
      <div class="top">
        <div>
          <div class="title">${escapeHtml(a.company)} — ${escapeHtml(a.role)}</div>
          <div class="meta">
            <span>${getLang()==="no" ? "Frist" : "Deadline"}: <span class="badge">${fmtDate(a.deadline)}</span></span>
            <span>${getLang()==="no" ? "Status" : "Status"}: <span class="badge">${statusLabel}</span></span>
            <span>${link}</span>
          </div>
        </div>
        <div class="actions">
          <select data-id="${a.id}" class="statusSelect">
            ${["PLANLAGT","SOKT","INTERVJU","AVSLATT","TILBUD"].map(s => {
              const label = L.badge[s] ?? s;
              return `<option value="${s}" ${s===a.status ? "selected" : ""}>${label}</option>`;
            }).join("")}
          </select>
          <button data-del="${a.id}">${L.delete}</button>
        </div>
      </div>
    `;

    listEl.appendChild(el);
  }

  document.querySelectorAll(".statusSelect").forEach(sel => {
    sel.addEventListener("change", (e) => updateStatus(e.target.dataset.id, e.target.value));
  });
  document.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => removeItem(btn.dataset.del));
  });
}

async function load() {
  if (!getToken()) return;

  const res = await apiFetch("/api/apps");
  if (!res.ok) return;

  const apps = await res.json();
  render(apps);
}

// =====================
// UI State
// =====================
function setLoggedInUI() {
  const email = parseJwtEmail(getToken());
  whoamiEl.textContent = email;
  whoamiEl.classList.remove("hidden");

  openLoginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");

  appCard.classList.remove("hidden");
}

function setLoggedOutUI(message) {
  whoamiEl.textContent = "";
  whoamiEl.classList.add("hidden");

  openLoginBtn.classList.remove("hidden");
  logoutBtn.classList.add("hidden");

  appCard.classList.add("hidden");

  if (message) {
    // show message inside modal if open, otherwise open modal with message
    authMsg.textContent = message;
  }
}

// =====================
// Init
// =====================
(function init() {
  if (!localStorage.getItem(LANG_KEY)) setLang("no");
  applyI18n();

  if (getToken()) {
    setLoggedInUI();
    load();
  } else {
    setLoggedOutUI("");
  }
})();

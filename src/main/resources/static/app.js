// -------------------- i18n --------------------
const I18N = {
  no: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    appsTitle: "Søknader",
    newAppTitle: "Ny søknad",
    listTitle: "Liste",
    companyLabel: "Firma *",
    companyPh: "F.eks. NAV / Telenor",
    roleLabel: "Stilling *",
    rolePh: "F.eks. Junior utvikler",
    linkLabel: "Link",
    linkPh: "https://...",
    deadlineLabel: "Frist",
    addBtn: "Legg til",
    filters: { all:"Alle", planned:"Planlagt", applied:"Søkt", interview:"Intervju", rejected:"Avslått", offer:"Tilbud" },
    footer: "Bygget med Java (Spring Boot) + vanilla JS + JWT.",
    login: "Logg inn",
    logout: "Logg ut",
    notLogged: "Ikke innlogget",
    loginHint: "Logg inn for å lagre og se dine søknader.",
    modalTitleLogin: "Logg inn",
    modalTitleRegister: "Opprett bruker",
    emailPh: "E-post",
    passPh: "Passord",
    badCreds: "Feil e-post eller passord.",
    genericErr: "Noe gikk galt",
    statusMap: { PLANLAGT:"Planlagt", SOKT:"Søkt", INTERVJU:"Intervju", AVSLATT:"Avslått", TILBUD:"Tilbud" },
    invalidStatus: "Ugyldig status",
    noHits: "Ingen treff.",
    mustLoginToAdd: "Du må logge inn for å legge til.",
  },
  en: {
    title: "Job Tracker",
    subtitle: "Keep track of your job applications.",
    appsTitle: "Applications",
    newAppTitle: "New application",
    listTitle: "List",
    companyLabel: "Company *",
    companyPh: "e.g. Telenor / NAV",
    roleLabel: "Role *",
    rolePh: "e.g. Junior developer",
    linkLabel: "Link",
    linkPh: "https://...",
    deadlineLabel: "Deadline",
    addBtn: "Add",
    filters: { all:"All", planned:"Planned", applied:"Applied", interview:"Interview", rejected:"Rejected", offer:"Offer" },
    footer: "Built with Java (Spring Boot) + vanilla JS + JWT.",
    login: "Sign in",
    logout: "Sign out",
    notLogged: "Not signed in",
    loginHint: "Sign in to save and view your applications.",
    modalTitleLogin: "Sign in",
    modalTitleRegister: "Create account",
    emailPh: "Email",
    passPh: "Password",
    badCreds: "Wrong email or password.",
    genericErr: "Something went wrong",
    statusMap: { PLANLAGT:"Planned", SOKT:"Applied", INTERVJU:"Interview", AVSLATT:"Rejected", TILBUD:"Offer" },
    invalidStatus: "Invalid status",
    noHits: "No results.",
    mustLoginToAdd: "You must sign in to add.",
  }
};

function getLang() {
  return localStorage.getItem("lang") || "no";
}
function setLang(lang) {
  localStorage.setItem("lang", lang);
}
function T() {
  return I18N[getLang()];
}

// -------------------- DOM --------------------
let currentFilter = "ALL";
let authMode = "login"; // "login" | "register"

const listEl = document.getElementById("list");
const statsEl = document.getElementById("stats");
const form = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");
const loginHint = document.getElementById("loginHint");

const whoamiEl = document.getElementById("whoami");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const langBtn = document.getElementById("langBtn");

const modal = document.getElementById("authModal");
const modalBackdrop = modal.querySelector(".modalBackdrop");
const authClose = document.getElementById("authClose");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthModeBtn = document.getElementById("toggleAuthMode");
const authMsg = document.getElementById("authMsg");

// i18n ids
const el = (id) => document.getElementById(id);

// -------------------- token helpers --------------------
const TOKEN_KEY = "jwt";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function setAuthUI(emailOrNull) {
  if (emailOrNull) {
    whoamiEl.textContent = emailOrNull;
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    loginHint.classList.add("hidden");
    form.querySelectorAll("input,button").forEach(x => x.disabled = false);
  } else {
    whoamiEl.textContent = T().notLogged;
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    loginHint.classList.remove("hidden");
    // Disable submit for add (but keep inputs visible)
    form.querySelectorAll("input").forEach(x => x.disabled = true);
    form.querySelector("button[type='submit']").disabled = true;
  }
}

// -------------------- modal helpers --------------------
function openModal() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  authMsg.textContent = "";
  authMsg.className = "msg";
  setMode("login");
  setTimeout(() => authEmail.focus(), 30);
}
function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function setMode(mode) {
  authMode = mode;
  if (mode === "login") {
    authTitle.textContent = T().modalTitleLogin;
    authSubmitBtn.textContent = T().login;
    toggleAuthModeBtn.textContent = T().modalTitleRegister;
    authPassword.autocomplete = "current-password";
  } else {
    authTitle.textContent = T().modalTitleRegister;
    authSubmitBtn.textContent = T().modalTitleRegister;
    toggleAuthModeBtn.textContent = T().modalTitleLogin;
    authPassword.autocomplete = "new-password";
  }
  authEmail.placeholder = T().emailPh;
  authPassword.placeholder = T().passPh;
}

// -------------------- API wrapper --------------------
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  // If we are unauthorized on protected endpoints, open modal (but do not spam)
  if (res.status === 401) {
    // token is invalid -> clear it
    if (token) clearToken();
    setAuthUI(null);
    // Only open modal if user is trying to access protected data
    if (url.startsWith("/api/apps") || url.startsWith("/api/auth/me")) {
      // Do not open if already open
      if (modal.classList.contains("hidden")) openModal();
    }
  }

  return res;
}

// -------------------- apps logic --------------------
function badge(status) {
  return T().statusMap[status] ?? status;
}
function fmtDate(d) {
  if (!d) return "—";
  return d;
}
function isOverdue(deadline, status) {
  if (!deadline) return false;
  if (status === "AVSLATT" || status === "TILBUD") return false;
  const today = new Date();
  const dd = new Date(deadline + "T00:00:00");
  return dd < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

async function updateStatus(id, status) {
  await apiFetch(`/api/apps/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  await load();
}

async function removeItem(id) {
  await apiFetch(`/api/apps/${id}`, { method: "DELETE" });
  await load();
}

function render(apps) {
  const filtered = currentFilter === "ALL"
    ? apps
    : apps.filter(a => a.status === currentFilter);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  statsEl.textContent =
    `${badge("PLANLAGT")}: ${counts.PLANLAGT || 0} • ${badge("SOKT")}: ${counts.SOKT || 0} • ${badge("INTERVJU")}: ${counts.INTERVJU || 0} • ${badge("TILBUD")}: ${counts.TILBUD || 0} • ${badge("AVSLATT")}: ${counts.AVSLATT || 0}`;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted">${T().noHits}</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const a of filtered) {
    const el = document.createElement("div");
    el.className = "item" + (isOverdue(a.deadline, a.status) ? " overdue" : "");

    const link = a.link
      ? `<a href="${a.link}" target="_blank" rel="noreferrer">Link</a>`
      : `<span class="muted">—</span>`;

    el.innerHTML = `
      <div class="top">
        <div>
          <div class="title">${escapeHtml(a.company)} — ${escapeHtml(a.role)}</div>
          <div class="meta">
            <span>Frist: <span class="badge">${fmtDate(a.deadline)}</span></span>
            <span>Status: <span class="badge">${badge(a.status)}</span></span>
            <span>${link}</span>
          </div>
        </div>
        <div class="actions">
          <select data-id="${a.id}" class="statusSelect">
            ${["PLANLAGT","SOKT","INTERVJU","AVSLATT","TILBUD"].map(s =>
              `<option value="${s}" ${s===a.status ? "selected" : ""}>${badge(s)}</option>`
            ).join("")}
          </select>
          <button data-del="${a.id}">Slett</button>
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
  if (!getToken()) {
    render([]);
    return;
  }
  const res = await apiFetch("/api/apps");
  if (!res.ok) return;
  const apps = await res.json();
  render(apps);
}

// -------------------- auth logic --------------------
async function fetchMe() {
  const token = getToken();
  if (!token) {
    setAuthUI(null);
    return;
  }
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) return;

  const me = await res.json(); // expects { email: "..." }
  setAuthUI(me.email || me.username || me.name || T().notLogged);
  closeModal();
  await load();
}

async function submitAuth(e) {
  e.preventDefault();
  authMsg.textContent = "";
  authMsg.className = "msg";

  const email = authEmail.value.trim();
  const password = authPassword.value;

  const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const text = await res.text();
    authMsg.textContent = text || T().badCreds;
    authMsg.classList.add("error");
    return;
  }

  // Expect JSON like { token: "..." }
  let data = null;
  try { data = await res.json(); } catch {}
  const token = data?.token || data?.jwt || data?.accessToken;

  if (!token) {
    authMsg.textContent = "Mangler token fra server (sjekk /api/auth/login respons)";
    authMsg.classList.add("error");
    return;
  }

  setToken(token);
  authMsg.textContent = "OK";
  authMsg.classList.add("ok");

  await fetchMe();
}

function logout() {
  clearToken();
  setAuthUI(null);
  render([]);
}

// -------------------- i18n apply --------------------
function applyLang() {
  const t = T();

  document.documentElement.lang = getLang();
  el("t_title").textContent = t.title;
  el("t_subtitle").textContent = t.subtitle;
  el("t_appsTitle").textContent = t.appsTitle;
  el("t_newAppTitle").textContent = t.newAppTitle;
  el("t_listTitle").textContent = t.listTitle;
  el("t_companyLabel").textContent = t.companyLabel;
  el("t_roleLabel").textContent = t.roleLabel;
  el("t_linkLabel").textContent = t.linkLabel;
  el("t_deadlineLabel").textContent = t.deadlineLabel;
  el("t_addBtn").textContent = t.addBtn;

  el("t_f_all").textContent = t.filters.all;
  el("t_f_planned").textContent = t.filters.planned;
  el("t_f_applied").textContent = t.filters.applied;
  el("t_f_interview").textContent = t.filters.interview;
  el("t_f_rejected").textContent = t.filters.rejected;
  el("t_f_offer").textContent = t.filters.offer;

  el("t_footer").textContent = t.footer;
  el("t_loginHint").textContent = t.loginHint;

  loginBtn.textContent = t.login;
  logoutBtn.textContent = t.logout;

  if (!getToken()) whoamiEl.textContent = t.notLogged;

  // update modal texts
  setMode(authMode);
  load();
}

// -------------------- events --------------------
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    load();
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";
  formMsg.className = "msg";

  if (!getToken()) {
    formMsg.textContent = T().mustLoginToAdd;
    formMsg.classList.add("error");
    openModal();
    return;
  }

  const data = new FormData(form);
  const payload = {
    company: data.get("company"),
    role: data.get("role"),
    link: data.get("link"),
    deadline: data.get("deadline")
  };

  const res = await apiFetch("/api/apps", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    formMsg.textContent = text || T().genericErr;
    formMsg.classList.add("error");
    return;
  }

  form.reset();
  await load();
});

loginBtn.addEventListener("click", openModal);
logoutBtn.addEventListener("click", logout);

authClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

toggleAuthModeBtn.addEventListener("click", () => {
  setMode(authMode === "login" ? "register" : "login");
});

authForm.addEventListener("submit", submitAuth);

langBtn.addEventListener("click", () => {
  const next = getLang() === "no" ? "en" : "no";
  setLang(next);
  applyLang();
});

// -------------------- helpers --------------------
function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

// -------------------- init --------------------
applyLang();
setAuthUI(null);
fetchMe(); // will only call /me if token exists
load();

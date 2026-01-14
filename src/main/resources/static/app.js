// -------------------------
// Settings / storage keys
// -------------------------
const STORAGE_TOKEN = "jt_token";
const STORAGE_LANG  = "jt_lang"; // "no" eller "en"

// -------------------------
// DOM
// -------------------------
let currentFilter = "ALL";

const listEl = document.getElementById("list");
const statsEl = document.getElementById("stats");
const form = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");

const whoamiEl = document.getElementById("whoami");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const langBtn = document.getElementById("langBtn");
const loginHint = document.getElementById("loginHint");

const modal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authMsg = document.getElementById("authMsg");
const authTitle = document.getElementById("authTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthModeBtn = document.getElementById("toggleAuthMode");

// -------------------------
// i18n
// -------------------------
const I18N = {
  no: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    appsTitle: "Søknader",
    newAppTitle: "Ny søknad",
    listTitle: "Liste",
    notLogged: "Ikke innlogget",
    login: "Logg inn",
    logout: "Logg ut",
    email: "E-post",
    password: "Passord",
    register: "Opprett bruker",
    loginTitle: "Logg inn",
    registerTitle: "Opprett bruker",
    add: "Legg til",
    company: "Firma *",
    role: "Stilling *",
    link: "Link",
    deadline: "Frist",
    hint: "Logg inn for å lagre og se dine søknader.",
    emptyListLoggedOut: "Ingen treff. Logg inn for å se dine søknader.",
    emptyList: "Ingen treff.",
    invalid: "Noe gikk galt",
    requiredCompanyRole: "Firma og stilling er påkrevd.",
    statusText: {
      PLANLAGT: "Planlagt",
      SOKT: "Søkt",
      INTERVJU: "Intervju",
      AVSLATT: "Avslått",
      TILBUD: "Tilbud"
    },
    statsLabel: (c) =>
      `Planlagt: ${c.PLANLAGT||0} • Søkt: ${c.SOKT||0} • Intervju: ${c.INTERVJU||0} • Tilbud: ${c.TILBUD||0} • Avslått: ${c.AVSLATT||0}`,
    filters: { ALL:"Alle", PLANLAGT:"Planlagt", SOKT:"Søkt", INTERVJU:"Intervju", AVSLATT:"Avslått", TILBUD:"Tilbud" }
  },
  en: {
    title: "Job Tracker",
    subtitle: "Keep track of your applications.",
    appsTitle: "Applications",
    newAppTitle: "New application",
    listTitle: "List",
    notLogged: "Not signed in",
    login: "Sign in",
    logout: "Sign out",
    email: "Email",
    password: "Password",
    register: "Create account",
    loginTitle: "Sign in",
    registerTitle: "Create account",
    add: "Add",
    company: "Company *",
    role: "Role *",
    link: "Link",
    deadline: "Deadline",
    hint: "Sign in to save and view your applications.",
    emptyListLoggedOut: "No results. Sign in to view your applications.",
    emptyList: "No results.",
    invalid: "Something went wrong",
    requiredCompanyRole: "Company and role are required.",
    statusText: {
      PLANLAGT: "Planned",
      SOKT: "Applied",
      INTERVJU: "Interview",
      AVSLATT: "Rejected",
      TILBUD: "Offer"
    },
    statsLabel: (c) =>
      `Planned: ${c.PLANLAGT||0} • Applied: ${c.SOKT||0} • Interview: ${c.INTERVJU||0} • Offer: ${c.TILBUD||0} • Rejected: ${c.AVSLATT||0}`,
    filters: { ALL:"All", PLANLAGT:"Planned", SOKT:"Applied", INTERVJU:"Interview", AVSLATT:"Rejected", TILBUD:"Offer" }
  }
};

function getLang(){
  return localStorage.getItem(STORAGE_LANG) || "no";
}
function setLang(lang){
  localStorage.setItem(STORAGE_LANG, lang);
  applyLang();
  // re-render list for translated labels
  if (window.__appsCache) render(window.__appsCache);
}
function t(){
  return I18N[getLang()];
}
function applyLang(){
  const L = t();
  document.documentElement.lang = getLang();

  // header
  document.getElementById("t_title").textContent = L.title;
  document.getElementById("t_subtitle").textContent = L.subtitle;

  // app
  document.getElementById("t_appsTitle").textContent = L.appsTitle;
  document.getElementById("t_newAppTitle").textContent = L.newAppTitle;
  document.getElementById("t_listTitle").textContent = L.listTitle;

  // filters
  document.getElementById("t_f_all").textContent = L.filters.ALL;
  document.getElementById("t_f_planned").textContent = L.filters.PLANLAGT;
  document.getElementById("t_f_applied").textContent = L.filters.SOKT;
  document.getElementById("t_f_interview").textContent = L.filters.INTERVJU;
  document.getElementById("t_f_rejected").textContent = L.filters.AVSLATT;
  document.getElementById("t_f_offer").textContent = L.filters.TILBUD;

  // form labels
  document.getElementById("t_companyLabel").textContent = L.company;
  document.getElementById("t_roleLabel").textContent = L.role;
  document.getElementById("t_linkLabel").textContent = L.link;
  document.getElementById("t_deadlineLabel").textContent = L.deadline;
  document.getElementById("t_addBtn").textContent = L.add;

  // auth buttons
  loginBtn.textContent = L.login;
  logoutBtn.textContent = L.logout;

  // modal placeholders/titles set by mode:
  updateAuthTexts();
  loginHint.textContent = L.hint;

  document.getElementById("t_footer").textContent =
    "Bygget med Java (Spring Boot) + vanilla JS + JWT.";
}

let authMode = "login"; // "login" | "register"
function updateAuthTexts(){
  const L = t();
  if (authMode === "login"){
    authTitle.textContent = L.loginTitle;
    authSubmitBtn.textContent = L.login;
    toggleAuthModeBtn.textContent = L.register;
    authEmail.placeholder = L.email;
    authPassword.placeholder = L.password;
    authPassword.autocomplete = "current-password";
  } else {
    authTitle.textContent = L.registerTitle;
    authSubmitBtn.textContent = L.register;
    toggleAuthModeBtn.textContent = L.login;
    authEmail.placeholder = L.email;
    authPassword.placeholder = L.password;
    authPassword.autocomplete = "new-password";
  }
}

// -------------------------
// Auth helpers
// -------------------------
function getToken(){
  return localStorage.getItem(STORAGE_TOKEN) || "";
}
function setToken(token){
  if (!token) localStorage.removeItem(STORAGE_TOKEN);
  else localStorage.setItem(STORAGE_TOKEN, token);
}
function setAuthMessage(msg, isError=false){
  authMsg.textContent = msg || "";
  authMsg.classList.toggle("error", !!isError);
}
function setFormMessage(msg, isError=false){
  formMsg.textContent = msg || "";
  formMsg.classList.toggle("error", !!isError);
}

function openModal(){
  modal.classList.remove("hidden");
  setAuthMessage("");
  // fokus på e-post
  setTimeout(() => authEmail.focus(), 0);
}
function closeModal(){
  modal.classList.add("hidden");
  setAuthMessage("");
}

// -------------------------
// fetch wrapper with JWT
// -------------------------
async function apiFetch(url, options = {}){
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  // Hvis token er feil/utløpt: rydde opp, men IKKE åpne modal automatisk
  if (res.status === 401 || res.status === 403){
    // Viktig: ikke loop
    if (getToken()){
      setToken("");
      setLoggedOutUI();
    }
  }
  return res;
}

// -------------------------
// UI state: logged in/out
// -------------------------
function setLoggedOutUI(){
  whoamiEl.textContent = t().notLogged;
  loginBtn.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
  loginHint.classList.remove("hidden");
  statsEl.textContent = "—";
  listEl.innerHTML = `<div class="muted">${t().emptyListLoggedOut}</div>`;
}

function setLoggedInUI(email){
  whoamiEl.textContent = email || "—";
  loginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  loginHint.classList.add("hidden");
}

// -------------------------
// App: filters
// -------------------------
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    if (window.__appsCache) render(window.__appsCache);
  });
});

// -------------------------
// Create application
// -------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setFormMessage("");

  // Ikke la folk poste hvis de ikke er logget inn
  if (!getToken()){
    openModal();
    return;
  }

  const data = new FormData(form);
  const payload = {
    company: (data.get("company") || "").trim(),
    role: (data.get("role") || "").trim(),
    link: (data.get("link") || "").trim(),
    deadline: data.get("deadline") || null
  };

  if (!payload.company || !payload.role){
    setFormMessage(t().requiredCompanyRole, true);
    return;
  }

  const res = await apiFetch("/api/apps", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await safeText(res);
    setFormMessage(text || t().invalid, true);
    return;
  }

  form.reset();
  await load();
});

function badge(status) {
  return t().statusText[status] ?? status;
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
  if (!getToken()) return;

  await apiFetch(`/api/apps/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  await load();
}

async function removeItem(id) {
  if (!getToken()) return;

  await apiFetch(`/api/apps/${id}`, { method: "DELETE" });
  await load();
}

function render(apps) {
  window.__appsCache = apps;

  const filtered = currentFilter === "ALL"
    ? apps
    : apps.filter(a => a.status === currentFilter);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  statsEl.textContent = t().statsLabel(counts);

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted">${getToken() ? t().emptyList : t().emptyListLoggedOut}</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const a of filtered) {
    const el = document.createElement("div");
    el.className = "item" + (isOverdue(a.deadline, a.status) ? " overdue" : "");

    const link = a.link
      ? `<a href="${escapeHtml(a.link)}" target="_blank" rel="noreferrer">Link</a>`
      : `<span class="muted">—</span>`;

    el.innerHTML = `
      <div class="top">
        <div>
          <div class="title">${escapeHtml(a.company)} — ${escapeHtml(a.role)}</div>
          <div class="meta">
            <span>${getLang()==="no" ? "Frist" : "Deadline"}: <span class="badge">${fmtDate(a.deadline)}</span></span>
            <span>${getLang()==="no" ? "Status" : "Status"}: <span class="badge">${badge(a.status)}</span></span>
            <span>${link}</span>
          </div>
        </div>
        <div class="actions">
          <select data-id="${a.id}" class="statusSelect">
            ${["PLANLAGT","SOKT","INTERVJU","AVSLATT","TILBUD"].map(s =>
              `<option value="${s}" ${s===a.status ? "selected" : ""}>${badge(s)}</option>`
            ).join("")}
          </select>
          <button class="btn ghost" data-del="${a.id}">${getLang()==="no" ? "Slett" : "Delete"}</button>
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
  // Ikke hent apps hvis ikke logget inn (hindrer 401-spam)
  if (!getToken()){
    render([]);
    return;
  }

  const res = await apiFetch("/api/apps");
  if (!res.ok) {
    // 401 håndteres i apiFetch (token fjernes)
    render([]);
    return;
  }
  const apps = await res.json();
  render(apps);
}

// -------------------------
// Auth: login/register/me/logout
// -------------------------
loginBtn.addEventListener("click", () => {
  authMode = "login";
  updateAuthTexts();
  openModal();
});

logoutBtn.addEventListener("click", async () => {
  setToken("");
  setLoggedOutUI();
  await load();
});

toggleAuthModeBtn.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  updateAuthTexts();
  setAuthMessage("");
});

closeAuth.addEventListener("click", closeModal);
modal.querySelector(".backdrop").addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthMessage("");

  const email = (authEmail.value || "").trim();
  const password = (authPassword.value || "").trim();

  if (!email || !password){
    setAuthMessage(t().invalid, true);
    return;
  }

  const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok){
    const txt = await safeText(res);
    setAuthMessage(txt || t().invalid, true);
    return;
  }

  const data = await safeJson(res);

  // Støtter flere vanlige feltnavn:
  const token = data?.token || data?.accessToken || data?.jwt || "";
  if (!token){
    setAuthMessage("Mangler token fra server.", true);
    return;
  }

  setToken(token);
  setAuthMessage("OK");

  // Hent hvem som er innlogget
  const meRes = await apiFetch("/api/auth/me");
  if (meRes.ok){
    const me = await safeJson(meRes);
    setLoggedInUI(me?.email || email);
    closeModal();
    await load();
  } else {
    // hvis /me feiler -> logg ut igjen (token ugyldig)
    setToken("");
    setLoggedOutUI();
    setAuthMessage("Innlogging feilet (token).", true);
  }
});

// -------------------------
// Language toggle
// -------------------------
langBtn.addEventListener("click", () => {
  setLang(getLang() === "no" ? "en" : "no");
});

// -------------------------
// Utils
// -------------------------
function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

async function safeText(res){
  try { return (await res.text())?.trim(); } catch { return ""; }
}
async function safeJson(res){
  try { return await res.json(); } catch { return null; }
}

// -------------------------
// Boot
// -------------------------
applyLang();

(async function init(){
  // Hvis vi har token: prøv /me. Hvis ikke: vis logged out.
  if (getToken()){
    const meRes = await apiFetch("/api/auth/me");
    if (meRes.ok){
      const me = await safeJson(meRes);
      setLoggedInUI(me?.email || "—");
      await load();
      return;
    }
    // apiFetch fjerner token ved 401/403
  }

  setLoggedOutUI();
  await load();
})();

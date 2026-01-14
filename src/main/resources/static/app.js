// ---------- i18n ----------
const LANG_KEY = "lang"; // "no" | "en"
const dict = {
  no: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    loginTitle: "Logg inn",
    registerTitle: "Opprett bruker",
    emailPh: "E-post",
    passPh: "Passord",
    loginBtn: "Logg inn",
    registerBtn: "Registrer",
    toggleToRegister: "Opprett bruker",
    toggleToLogin: "Har du bruker? Logg inn",
    loggedOut: "Ikke innlogget",
    logout: "Logg ut",
    appsTitle: "Søknader",
    newAppTitle: "Ny søknad",
    listTitle: "Liste",
    addBtn: "Legg til",
    companyLabel: "Firma *",
    roleLabel: "Stilling *",
    linkLabel: "Link",
    deadlineLabel: "Frist",
    companyPh: "F.eks. DNB / Telenor",
    rolePh: "F.eks. Junior utvikler",
    linkPh: "https://...",
    f_all: "Alle",
    f_planned: "Planlagt",
    f_applied: "Søkt",
    f_interview: "Intervju",
    f_rejected: "Avslått",
    f_offer: "Tilbud",
    footer: "Bygget med Java (Spring Boot) + vanilla JS + JWT.",
    invalidAuth: "Skriv inn gyldig e-post og passord (minst 6 tegn).",
    authFailed: "Kunne ikke autentisere.",
    sessionExpired: "Sesjonen din er utløpt. Logg inn på nytt.",
    noResults: "Ingen treff.",
    noLink: "Ingen link",
    errGeneric: "Noe gikk galt"
  },
  en: {
    title: "Job Tracker",
    subtitle: "Track your job applications.",
    loginTitle: "Login",
    registerTitle: "Create account",
    emailPh: "Email",
    passPh: "Password",
    loginBtn: "Login",
    registerBtn: "Sign up",
    toggleToRegister: "Create account",
    toggleToLogin: "Already have an account? Login",
    loggedOut: "Not logged in",
    logout: "Logout",
    appsTitle: "Applications",
    newAppTitle: "New application",
    listTitle: "List",
    addBtn: "Add",
    companyLabel: "Company *",
    roleLabel: "Role *",
    linkLabel: "Link",
    deadlineLabel: "Deadline",
    companyPh: "e.g. DNB / Telenor",
    rolePh: "e.g. Junior developer",
    linkPh: "https://...",
    f_all: "All",
    f_planned: "Planned",
    f_applied: "Applied",
    f_interview: "Interview",
    f_rejected: "Rejected",
    f_offer: "Offer",
    footer: "Built with Java (Spring Boot) + vanilla JS + JWT.",
    invalidAuth: "Enter a valid email and password (min 6 chars).",
    authFailed: "Authentication failed.",
    sessionExpired: "Session expired. Please login again.",
    noResults: "No results.",
    noLink: "No link",
    errGeneric: "Something went wrong"
  }
};

function getLang() {
  return localStorage.getItem(LANG_KEY) || "no";
}
function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}
function t(key) {
  return dict[getLang()][key] ?? key;
}

function applyI18n() {
  document.getElementById("t_title").textContent = t("title");
  document.getElementById("t_subtitle").textContent = t("subtitle");
  document.getElementById("t_loginTitle").textContent = authMode === "login" ? t("loginTitle") : t("registerTitle");
  document.getElementById("authEmail").placeholder = t("emailPh");
  document.getElementById("authPassword").placeholder = t("passPh");
  document.getElementById("authSubmitBtn").textContent = authMode === "login" ? t("loginBtn") : t("registerBtn");
  document.getElementById("toggleAuthMode").textContent = authMode === "login" ? t("toggleToRegister") : t("toggleToLogin");
  document.getElementById("logoutBtn").textContent = t("logout");

  document.getElementById("t_appsTitle").textContent = t("appsTitle");
  document.getElementById("t_newAppTitle").textContent = t("newAppTitle");
  document.getElementById("t_listTitle").textContent = t("listTitle");
  document.getElementById("t_addBtn").textContent = t("addBtn");

  document.getElementById("t_companyLabel").textContent = t("companyLabel");
  document.getElementById("t_roleLabel").textContent = t("roleLabel");
  document.getElementById("t_linkLabel").textContent = t("linkLabel");
  document.getElementById("t_deadlineLabel").textContent = t("deadlineLabel");

  // placeholders i inputs (de ligger som attributt)
  const companyInput = document.querySelector('input[name="company"]');
  const roleInput = document.querySelector('input[name="role"]');
  const linkInput = document.querySelector('input[name="link"]');
  if (companyInput) companyInput.placeholder = t("companyPh");
  if (roleInput) roleInput.placeholder = t("rolePh");
  if (linkInput) linkInput.placeholder = t("linkPh");

  document.getElementById("t_f_all").textContent = t("f_all");
  document.getElementById("t_f_planned").textContent = t("f_planned");
  document.getElementById("t_f_applied").textContent = t("f_applied");
  document.getElementById("t_f_interview").textContent = t("f_interview");
  document.getElementById("t_f_rejected").textContent = t("f_rejected");
  document.getElementById("t_f_offer").textContent = t("f_offer");

  document.getElementById("t_footer").textContent = t("footer");

  // lang button label = det andre språket
  const langBtn = document.getElementById("langBtn");
  langBtn.textContent = getLang() === "no" ? "EN" : "NO";
}

// ---------- JWT ----------
const TOKEN_KEY = "jwt_token";
let authMode = "login"; // login | register

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
    setLoggedOutUI(t("sessionExpired"));
  }
  return res;
}

function parseJwtEmail(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(base64).split("").map(c => `%${("00"+c.charCodeAt(0).toString(16)).slice(-2)}`).join(""));
    return JSON.parse(json).sub || "User";
  } catch {
    return "User";
  }
}

// ---------- DOM ----------
const whoamiEl = document.getElementById("whoami");
const logoutBtn = document.getElementById("logoutBtn");
const langBtn = document.getElementById("langBtn");

const authCard = document.getElementById("authCard");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authMsg = document.getElementById("authMsg");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthModeBtn = document.getElementById("toggleAuthMode");

const appCard = document.getElementById("appCard");

let currentFilter = "ALL";
const listEl = document.getElementById("list");
const statsEl = document.getElementById("stats");
const form = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");

// ---------- language toggle ----------
langBtn.addEventListener("click", () => {
  const next = getLang() === "no" ? "en" : "no";
  setLang(next);
  applyI18n();
  // re-render stats text after language change
  load();
});

// ---------- auth mode toggle ----------
toggleAuthModeBtn.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  authMsg.textContent = "";
  applyI18n();
});

// ---------- auth submit ----------
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "";

  const email = (authEmail.value || "").trim().toLowerCase();
  const password = authPassword.value || "";

  if (!email || !password || password.length < 6) {
    authMsg.textContent = t("invalidAuth");
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
    authMsg.textContent = text || t("authFailed");
    return;
  }

  const data = await res.json(); // { token: "..." }
  setToken(data.token);
  setLoggedInUI();
  await load();
});

logoutBtn.addEventListener("click", () => {
  clearToken();
  setLoggedOutUI("");
});

// ---------- filters ----------
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    load();
  });
});

// ---------- create form ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  const data = new FormData(form);
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
    formMsg.textContent = text || t("errGeneric");
    return;
  }

  form.reset();
  await load();
});

// ---------- app helpers ----------
function badge(status) {
  const mapNo = { PLANLAGT: "Planlagt", SOKT: "Søkt", INTERVJU: "Intervju", AVSLATT: "Avslått", TILBUD: "Tilbud" };
  const mapEn = { PLANLAGT: "Planned", SOKT: "Applied", INTERVJU: "Interview", AVSLATT: "Rejected", TILBUD: "Offer" };
  const map = getLang() === "no" ? mapNo : mapEn;
  return map[status] ?? status;
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

function render(apps) {
  const filtered = currentFilter === "ALL"
    ? apps
    : apps.filter(a => a.status === currentFilter);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  // stats tekst i begge språk
  if (getLang() === "no") {
    statsEl.textContent =
      `Planlagt: ${counts.PLANLAGT || 0} • Søkt: ${counts.SOKT || 0} • Intervju: ${counts.INTERVJU || 0} • Tilbud: ${counts.TILBUD || 0} • Avslått: ${counts.AVSLATT || 0}`;
  } else {
    statsEl.textContent =
      `Planned: ${counts.PLANLAGT || 0} • Applied: ${counts.SOKT || 0} • Interview: ${counts.INTERVJU || 0} • Offer: ${counts.TILBUD || 0} • Rejected: ${counts.AVSLATT || 0}`;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted">${t("noResults")}</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const a of filtered) {
    const el = document.createElement("div");
    el.className = "item" + (isOverdue(a.deadline, a.status) ? " overdue" : "");

    const link = a.link
      ? `<a href="${a.link}" target="_blank" rel="noreferrer">Link</a>`
      : `<span class="muted">${t("noLink")}</span>`;

    el.innerHTML = `
      <div class="top">
        <div>
          <div class="title">${escapeHtml(a.company)} — ${escapeHtml(a.role)}</div>
          <div class="meta">
            <span>${getLang() === "no" ? "Frist" : "Deadline"}: <span class="badge">${fmtDate(a.deadline)}</span></span>
            <span>${getLang() === "no" ? "Status" : "Status"}: <span class="badge">${badge(a.status)}</span></span>
            <span>${link}</span>
          </div>
        </div>
        <div class="actions">
          <select data-id="${a.id}" class="statusSelect">
            ${["PLANLAGT","SOKT","INTERVJU","AVSLATT","TILBUD"].map(s =>
              `<option value="${s}" ${s===a.status ? "selected" : ""}>${badge(s)}</option>`
            ).join("")}
          </select>
          <button data-del="${a.id}">${getLang() === "no" ? "Slett" : "Delete"}</button>
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
  // bare last hvis innlogget
  if (!getToken()) return;

  const res = await apiFetch("/api/apps");
  if (!res.ok) return;
  const apps = await res.json();
  render(apps);
}

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

// ---------- UI state ----------
function setLoggedInUI() {
  const email = parseJwtEmail(getToken());
  whoamiEl.textContent = email;
  logoutBtn.classList.remove("hidden");

  authCard.classList.add("hidden");
  appCard.classList.remove("hidden");
}

function setLoggedOutUI(message) {
  whoamiEl.textContent = t("loggedOut");
  logoutBtn.classList.add("hidden");

  authCard.classList.remove("hidden");
  appCard.classList.add("hidden");

  authMsg.textContent = message || "";
}

// ---------- init ----------
(function init() {
  // default språk (hvis bruker ikke har valgt)
  if (!localStorage.getItem(LANG_KEY)) setLang("no");

  applyI18n();

  if (getToken()) {
    setLoggedInUI();
    load();
  } else {
    setLoggedOutUI("");
  }
})();

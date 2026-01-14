/* =========================
   Job Tracker - app.js (JWT + NO/EN + Modal)
   Matches your HTML ids
   ========================= */

const LS_TOKEN = "jt_token";
const LS_EMAIL = "jt_email";
const LS_LANG  = "jt_lang";

/* ---------- DOM ---------- */
const langBtn   = document.getElementById("langBtn");
const whoamiEl  = document.getElementById("whoami");
const logoutBtn = document.getElementById("logoutBtn");
const loginBtn  = document.getElementById("loginBtn");

const listEl  = document.getElementById("list");
const statsEl = document.getElementById("stats");
const form    = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");

const loginHint = document.getElementById("t_loginHint");
const emptyLogin = document.getElementById("t_emptyLogin");

/* ---------- Modal ---------- */
const authModal         = document.getElementById("authModal");
const authTitle         = document.getElementById("authTitle");
const authForm          = document.getElementById("authForm");
const authEmail         = document.getElementById("authEmail");
const authPassword      = document.getElementById("authPassword");
const authMsg           = document.getElementById("authMsg");
const authSubmitBtn     = document.getElementById("authSubmitBtn");
const toggleAuthModeBtn = document.getElementById("toggleAuthMode");
const closeAuthBtn      = document.getElementById("closeAuth");

/* ---------- state ---------- */
let currentFilter = "ALL";
let lang = (localStorage.getItem(LS_LANG) || "no").toLowerCase();
let authMode = "login"; // login | register

/* ---------- i18n ---------- */
const T = {
  no: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    login: "Logg inn",
    logout: "Logg ut",
    notLoggedIn: "Ikke innlogget",
    email: "E-post",
    password: "Passord",
    createUser: "Opprett bruker",
    loginTitle: "Logg inn",
    registerTitle: "Opprett bruker",
    loginHint: "Logg inn for å lagre og se dine søknader.",
    emptyLogin: "Ingen treff. Logg inn for å se dine søknader.",
    ok: "OK",
    invalid: "Ugyldig",
    loginFailed: "Innlogging feilet.",
    registerFailed: "Registrering feilet.",
    tokenNotAccepted: "Token ble ikke akseptert (/api/auth/me 401).",
    noHits: "Ingen treff.",
    planned: "Planlagt",
    applied: "Søkt",
    interview: "Intervju",
    rejected: "Avslått",
    offer: "Tilbud",
    all: "Alle",
    delete: "Slett",
    linkNone: "Ingen link",
    deadline: "Frist",
    status: "Status",
    builtWith: "Bygget med Java (Spring Boot) + vanilla JS + JWT."
  },
  en: {
    title: "Job Tracker",
    subtitle: "Keep track of your job applications.",
    login: "Sign in",
    logout: "Sign out",
    notLoggedIn: "Not signed in",
    email: "Email",
    password: "Password",
    createUser: "Create account",
    loginTitle: "Sign in",
    registerTitle: "Create account",
    loginHint: "Sign in to save and view your applications.",
    emptyLogin: "No results. Sign in to view your applications.",
    ok: "OK",
    invalid: "Invalid",
    loginFailed: "Login failed.",
    registerFailed: "Registration failed.",
    tokenNotAccepted: "Token not accepted (/api/auth/me 401).",
    noHits: "No results.",
    planned: "Planned",
    applied: "Applied",
    interview: "Interview",
    rejected: "Rejected",
    offer: "Offer",
    all: "All",
    delete: "Delete",
    linkNone: "No link",
    deadline: "Deadline",
    status: "Status",
    builtWith: "Built with Java (Spring Boot) + vanilla JS + JWT."
  }
};

function tr(key) {
  return (T[lang] && T[lang][key]) ? T[lang][key] : (T.no[key] || key);
}

/* ---------- storage ---------- */
function getToken() { return localStorage.getItem(LS_TOKEN) || ""; }
function setToken(token, email) {
  localStorage.setItem(LS_TOKEN, token);
  if (email) localStorage.setItem(LS_EMAIL, email);
}
function clearToken() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_EMAIL);
}

/* ---------- api ---------- */
async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = (typeof data === "string" && data) ? data : (data?.message || res.statusText);
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ---------- modal ---------- */
function openModal() {
  authMsg.textContent = "";
  authModal.classList.remove("hidden");
  document.body.classList.add("modalOpen"); // ✅ enables blur CSS
  setTimeout(() => authEmail?.focus(), 50);
}
function closeModal() {
  authModal.classList.add("hidden");
  document.body.classList.remove("modalOpen"); // ✅ remove blur
  authMsg.textContent = "";
}

/* ---------- auth mode ---------- */
function setAuthMode(mode) {
  authMode = mode;
  authMsg.textContent = "";

  if (mode === "login") {
    authTitle.textContent = tr("loginTitle");
    authSubmitBtn.textContent = tr("login");
    toggleAuthModeBtn.textContent = tr("createUser");
    authPassword.autocomplete = "current-password";
  } else {
    authTitle.textContent = tr("registerTitle");
    authSubmitBtn.textContent = tr("createUser");
    toggleAuthModeBtn.textContent = tr("login");
    authPassword.autocomplete = "new-password";
  }
}

/* ---------- ui ---------- */
function show(el){ el?.classList?.remove("hidden"); }
function hide(el){ el?.classList?.add("hidden"); }

function setLoggedOutUI() {
  hide(whoamiEl);
  hide(logoutBtn);
  show(loginBtn);

  if (loginHint) loginHint.textContent = tr("loginHint");
  if (emptyLogin) emptyLogin.textContent = tr("emptyLogin");

  statsEl.textContent = "—";
  listEl.innerHTML = `<div class="muted">${tr("emptyLogin")}</div>`;
}

function setLoggedInUI(email) {
  whoamiEl.textContent = email || localStorage.getItem(LS_EMAIL) || tr("ok");
  show(whoamiEl);
  show(logoutBtn);
  hide(loginBtn);
}

/* ---------- helpers ---------- */
function badge(status) {
  const map = {
    PLANLAGT: tr("planned"),
    SOKT: tr("applied"),
    INTERVJU: tr("interview"),
    AVSLATT: tr("rejected"),
    TILBUD: tr("offer")
  };
  return map[status] ?? status;
}

function fmtDate(d){ return d || "—"; }

function isOverdue(deadline, status) {
  if (!deadline) return false;
  if (status === "AVSLATT" || status === "TILBUD") return false;
  const today = new Date();
  const dd = new Date(deadline + "T00:00:00");
  return dd < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

/* ---------- render ---------- */
function render(apps) {
  if (!getToken()) { setLoggedOutUI(); return; }

  const filtered = currentFilter === "ALL" ? apps : apps.filter(a => a.status === currentFilter);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  statsEl.textContent =
    `${tr("planned")}: ${counts.PLANLAGT || 0} • ${tr("applied")}: ${counts.SOKT || 0} • ` +
    `${tr("interview")}: ${counts.INTERVJU || 0} • ${tr("offer")}: ${counts.TILBUD || 0} • ${tr("rejected")}: ${counts.AVSLATT || 0}`;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted">${tr("noHits")}</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const a of filtered) {
    const el = document.createElement("div");
    el.className = "item" + (isOverdue(a.deadline, a.status) ? " overdue" : "");

    const link = a.link
      ? `<a href="${a.link}" target="_blank" rel="noreferrer">Link</a>`
      : `<span class="muted">${tr("linkNone")}</span>`;

    el.innerHTML = `
      <div class="top">
        <div>
          <div class="title">${escapeHtml(a.company)} — ${escapeHtml(a.role)}</div>
          <div class="meta">
            <span>${tr("deadline")}: <span class="badge">${fmtDate(a.deadline)}</span></span>
            <span>${tr("status")}: <span class="badge">${badge(a.status)}</span></span>
            <span>${link}</span>
          </div>
        </div>
        <div class="actions">
          <select data-id="${a.id}" class="statusSelect">
            ${["PLANLAGT","SOKT","INTERVJU","AVSLATT","TILBUD"].map(s =>
              `<option value="${s}" ${s===a.status ? "selected" : ""}>${badge(s)}</option>`
            ).join("")}
          </select>
          <button class="btn ghost" data-del="${a.id}">${tr("delete")}</button>
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

/* ---------- data ---------- */
async function load() {
  if (!getToken()) { setLoggedOutUI(); return; }

  try {
    const apps = await api("/api/apps");
    render(apps);
  } catch (e) {
    if (e.status === 401) {
      clearToken();
      setLoggedOutUI();
      setAuthMode("login");
      openModal();
      authMsg.textContent = tr("loginFailed");
      return;
    }
    listEl.innerHTML = `<div class="muted">${escapeHtml(e.message || "Error")}</div>`;
  }
}

async function updateStatus(id, status) {
  await api(`/api/apps/${id}/status`, { method: "PUT", body: { status } });
  await load();
}

async function removeItem(id) {
  await api(`/api/apps/${id}`, { method: "DELETE" });
  await load();
}

/* ---------- auth ---------- */
async function fetchMe() {
  try { return await api("/api/auth/me"); } catch { return null; }
}

async function doLogin(email, password) {
  const data = await api("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password }
  });

  if (!data?.token) throw new Error("Mangler token fra server");
  setToken(data.token, email);

  const me = await fetchMe();
  if (!me) throw new Error(tr("tokenNotAccepted"));

  setLoggedInUI(me.email || email);
  closeModal();
  await load();
}

async function doRegister(email, password) {
  await api("/api/auth/register", {
    method: "POST",
    auth: false,
    body: { email, password }
  });
  await doLogin(email, password);
}

/* ---------- language ---------- */
function applyLanguage() {
  // Button text shows the OTHER language
  langBtn.textContent = (lang === "no") ? "EN" : "NO";

  authEmail.placeholder = tr("email");
  authPassword.placeholder = tr("password");
  setAuthMode(authMode);

  loginBtn.textContent = tr("login");
  logoutBtn.textContent = tr("logout");

  // update visible “static” texts
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("t_title", tr("title"));
  setText("t_subtitle", tr("subtitle"));
  setText("t_newAppTitle", tr("newApp"));
  setText("t_appsTitle", tr("applications"));
  setText("t_footer", tr("builtWith"));

  // filters
  setText("t_f_all", tr("all"));
  setText("t_f_planned", tr("planned"));
  setText("t_f_applied", tr("applied"));
  setText("t_f_interview", tr("interview"));
  setText("t_f_rejected", tr("rejected"));
  setText("t_f_offer", tr("offer"));

  if (loginHint) loginHint.textContent = tr("loginHint");
  if (emptyLogin) emptyLogin.textContent = tr("emptyLogin");

  load();
}

/* ---------- events ---------- */
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    await load();
  });
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  if (!getToken()) {
    setAuthMode("login");
    openModal();
    formMsg.textContent = tr("loginFailed");
    return;
  }

  const data = new FormData(form);
  const payload = {
    company: data.get("company"),
    role: data.get("role"),
    link: data.get("link"),
    deadline: data.get("deadline")
  };

  try {
    await api("/api/apps", { method: "POST", body: payload });
    form.reset();
    await load();
  } catch (err) {
    formMsg.textContent = err.message || "Error";
  }
});

// Open login modal
loginBtn?.addEventListener("click", () => {
  setAuthMode("login");
  openModal();
});

// Close modal
closeAuthBtn?.addEventListener("click", closeModal);
authModal?.addEventListener("click", (e) => {
  if (e.target === authModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !authModal.classList.contains("hidden")) closeModal();
});

// Toggle login/register
toggleAuthModeBtn?.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

// Submit auth
authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "";

  const email = (authEmail.value || "").trim();
  const password = (authPassword.value || "").trim();

  if (!email || !password) {
    authMsg.textContent = tr("invalid");
    return;
  }

  try {
    if (authMode === "login") await doLogin(email, password);
    else await doRegister(email, password);
  } catch (err) {
    authMsg.textContent =
      (authMode === "login" ? tr("loginFailed") : tr("registerFailed")) +
      " " + (err.message || "");
  }
});

// Logout
logoutBtn?.addEventListener("click", () => {
  clearToken();
  setLoggedOutUI();
  setAuthMode("login");
  openModal();
});

// Language switch
langBtn?.addEventListener("click", () => {
  lang = (lang === "no") ? "en" : "no";
  localStorage.setItem(LS_LANG, lang);
  applyLanguage();
});

/* ---------- boot ---------- */
(async function boot() {
  applyLanguage();

  if (!getToken()) {
    setLoggedOutUI();
    return;
  }

  const me = await fetchMe();
  if (!me) {
    clearToken();
    setLoggedOutUI();
    return;
  }

  setLoggedInUI(me.email || localStorage.getItem(LS_EMAIL) || tr("ok"));
  await load();
})();

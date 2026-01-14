// ====== STATE ======
let currentFilter = "ALL";
let authMode = "login"; // "login" | "register"

const TOKEN_KEY = "jobtracker_token";
const LANG_KEY = "jobtracker_lang";

const listEl = document.getElementById("list");
const statsEl = document.getElementById("stats");
const form = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const whoamiEl = document.getElementById("whoami");
const langBtn = document.getElementById("langBtn");

const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authTitle = document.getElementById("authTitle");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthModeBtn = document.getElementById("toggleAuthMode");
const authMsg = document.getElementById("authMsg");

// ====== I18N ======
const I18N = {
  no: {
    t_title: "Jobbsøker-tracker",
    t_subtitle: "Hold oversikt over søknadene dine.",
    login: "Logg inn",
    logout: "Logg ut",
    notLoggedIn: "Ikke innlogget",
    auth_login_title: "Logg inn",
    auth_register_title: "Opprett bruker",
    email_ph: "E-post",
    pass_ph: "Passord",
    btn_login: "Logg inn",
    btn_register: "Opprett bruker",
    hint_login: "Logg inn for å lagre og se dine søknader.",
    empty_login: "Ingen treff. Logg inn for å se dine søknader.",
    apps_title: "Søknader",
    new_app: "Ny søknad",
    company_label: "Firma *",
    company_ph: "F.eks. NAV / Telenor",
    role_label: "Stilling *",
    role_ph: "F.eks. Junior utvikler",
    link_label: "Link",
    link_ph: "https://...",
    deadline_label: "Frist",
    add_btn: "Legg til",
    filters: {
      ALL: "Alle",
      PLANLAGT: "Planlagt",
      SOKT: "Søkt",
      INTERVJU: "Intervju",
      AVSLATT: "Avslått",
      TILBUD: "Tilbud"
    },
    statsFmt: (c) => `Planlagt: ${c.PLANLAGT||0} • Søkt: ${c.SOKT||0} • Intervju: ${c.INTERVJU||0} • Tilbud: ${c.TILBUD||0} • Avslått: ${c.AVSLATT||0}`,
    noHits: "Ingen treff.",
    err_generic: "Noe gikk galt",
    ok_login: "Innlogget!",
    ok_register: "Bruker opprettet! Du kan logge inn nå.",
    err_token: "Innlogging feilet (token).",
    err_me401: "Innlogging feilet. Token ble ikke akseptert (/api/auth/me 401).",
    footer: "Bygget med Java (Spring Boot) + vanilla JS + JWT."
  },
  en: {
    t_title: "Job tracker",
    t_subtitle: "Keep track of your job applications.",
    login: "Sign in",
    logout: "Sign out",
    notLoggedIn: "Not signed in",
    auth_login_title: "Sign in",
    auth_register_title: "Create account",
    email_ph: "Email",
    pass_ph: "Password",
    btn_login: "Sign in",
    btn_register: "Sign up",
    hint_login: "Sign in to save and view your applications.",
    empty_login: "No results. Sign in to view your applications.",
    apps_title: "Applications",
    new_app: "New application",
    company_label: "Company *",
    company_ph: "e.g. DNB / Telenor",
    role_label: "Role *",
    role_ph: "e.g. Junior developer",
    link_label: "Link",
    link_ph: "https://...",
    deadline_label: "Deadline",
    add_btn: "Add",
    filters: {
      ALL: "All",
      PLANLAGT: "Planned",
      SOKT: "Applied",
      INTERVJU: "Interview",
      AVSLATT: "Rejected",
      TILBUD: "Offer"
    },
    statsFmt: (c) => `Planned: ${c.PLANLAGT||0} • Applied: ${c.SOKT||0} • Interview: ${c.INTERVJU||0} • Offer: ${c.TILBUD||0} • Rejected: ${c.AVSLATT||0}`,
    noHits: "No results.",
    err_generic: "Something went wrong",
    ok_login: "Signed in!",
    ok_register: "Account created! You can sign in now.",
    err_token: "Sign in failed (token).",
    err_me401: "Sign in failed. Token was not accepted (/api/auth/me 401).",
    footer: "Built with Java (Spring Boot) + vanilla JS + JWT."
  }
};

function getLang() {
  return localStorage.getItem(LANG_KEY) || "no";
}
function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyLang();
}
function tr() {
  return I18N[getLang()];
}

function applyLang() {
  const t = tr();
  document.documentElement.lang = getLang();

  // Header
  setText("t_title", t.t_title);
  setText("t_subtitle", t.t_subtitle);
  loginBtn.textContent = t.login;
  logoutBtn.textContent = t.logout;
  if (!getToken()) whoamiEl.textContent = t.notLoggedIn;

  // Left
  setText("t_newAppTitle", t.new_app);
  setText("t_companyLabel", t.company_label);
  setAttr("t_companyPh", "placeholder", t.company_ph);
  setText("t_roleLabel", t.role_label);
  setAttr("t_rolePh", "placeholder", t.role_ph);
  setText("t_linkLabel", t.link_label);
  setAttr("t_linkPh", "placeholder", t.link_ph);
  setText("t_deadlineLabel", t.deadline_label);
  setText("t_addBtn", t.add_btn);
  setText("t_loginHint", t.hint_login);

  // Right
  setText("t_appsTitle", t.apps_title);
  setText("t_f_all", t.filters.ALL);
  setText("t_f_planned", t.filters.PLANLAGT);
  setText("t_f_applied", t.filters.SOKT);
  setText("t_f_interview", t.filters.INTERVJU);
  setText("t_f_rejected", t.filters.AVSLATT);
  setText("t_f_offer", t.filters.TILBUD);
  setText("t_emptyLogin", t.empty_login);

  // Footer
  setText("t_footer", t.footer);

  // Modal
  authEmail.placeholder = t.email_ph;
  authPassword.placeholder = t.pass_ph;
  syncAuthModeText();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function setAttr(id, attr, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, value);
}

// ====== TOKEN HELPERS ======
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
function decodeJwtSub(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json.sub || "";
  } catch {
    return "";
  }
}

// ====== API (inject Bearer token everywhere) ======
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, { ...options, headers });

  // Hvis token ugyldig/utløpt → logg ut UI
  if (res.status === 401) {
    // Ikke auto-logout hvis vi er midt i login/register (da er det normalt å få 401 på /me hvis token aldri ble lagret)
    // Men for alle andre kall: rydde.
    if (!path.startsWith("/api/auth/")) {
      doLogout(true);
    }
  }
  return res;
}

// ====== UI STATE ======
function setLoggedInUI(email) {
  loginBtn.classList.add("hidden");
  whoamiEl.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  whoamiEl.textContent = email || tr().notLoggedIn;

  // Hint bort når innlogget
  document.getElementById("t_loginHint")?.classList.add("hidden");
}

function setLoggedOutUI() {
  loginBtn.classList.remove("hidden");
  whoamiEl.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  whoamiEl.textContent = tr().notLoggedIn;

  // Hint vises når ikke innlogget
  document.getElementById("t_loginHint")?.classList.remove("hidden");

  statsEl.textContent = "—";
  listEl.innerHTML = `<div class="muted" id="t_emptyLogin">${tr().empty_login}</div>`;
  applyLang(); // re-oversett teksten vi nettopp injiserte
}

// ====== MODAL ======
function openModal() {
  authMsg.textContent = "";
  authMsg.classList.remove("ok");
  authModal.classList.remove("hidden");
  document.body.classList.add("modalOpen");
  setTimeout(() => authEmail.focus(), 0);
}
function closeModal() {
  authModal.classList.add("hidden");
  document.body.classList.remove("modalOpen");
}
function syncAuthModeText() {
  const t = tr();
  if (authMode === "login") {
    authTitle.textContent = t.auth_login_title;
    authSubmitBtn.textContent = t.btn_login;
    toggleAuthModeBtn.textContent = t.btn_register;
    authPassword.setAttribute("autocomplete", "current-password");
  } else {
    authTitle.textContent = t.auth_register_title;
    authSubmitBtn.textContent = t.btn_register;
    toggleAuthModeBtn.textContent = t.btn_login;
    authPassword.setAttribute("autocomplete", "new-password");
  }
}

// ====== APP LOGIC ======
function badge(status) {
  const mapNO = { PLANLAGT:"Planlagt", SOKT:"Søkt", INTERVJU:"Intervju", AVSLATT:"Avslått", TILBUD:"Tilbud" };
  const mapEN = { PLANLAGT:"Planned", SOKT:"Applied", INTERVJU:"Interview", AVSLATT:"Rejected", TILBUD:"Offer" };
  const map = getLang() === "no" ? mapNO : mapEN;
  return map[status] ?? status;
}
function fmtDate(d) {
  return d || "—";
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
  await loadApps();
}

async function removeItem(id) {
  await apiFetch(`/api/apps/${id}`, { method: "DELETE" });
  await loadApps();
}

function render(apps) {
  const filtered = currentFilter === "ALL"
    ? apps
    : apps.filter(a => a.status === currentFilter);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  statsEl.textContent = tr().statsFmt(counts);

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted">${tr().noHits}</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const a of filtered) {
    const el = document.createElement("div");
    el.className = "item" + (isOverdue(a.deadline, a.status) ? " overdue" : "");

    const link = a.link
      ? `<a href="${escapeHtmlAttr(a.link)}" target="_blank" rel="noreferrer">Link</a>`
      : `<span class="muted">${getLang()==="no" ? "Ingen link" : "No link"}</span>`;

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

async function loadApps() {
  if (!getToken()) {
    setLoggedOutUI();
    return;
  }

  const res = await apiFetch("/api/apps");
  if (!res.ok) {
    // 401 håndteres i apiFetch
    return;
  }
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
function escapeHtmlAttr(str) {
  return escapeHtml(str).replaceAll("'","&#39;");
}

// ====== AUTH ======
async function doLoginOrRegister(email, password) {
  const t = tr();
  authMsg.textContent = "";
  authMsg.classList.remove("ok");

  const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const text = await res.text();
    authMsg.textContent = text || t.err_generic;
    return;
  }

  // register kan være "OK" uten token (avhengig av backend).
  // login skal returnere {token:"..."}
  let data = {};
  try { data = await res.json(); } catch { data = {}; }

  if (authMode === "register") {
    authMsg.textContent = t.ok_register;
    authMsg.classList.add("ok");
    authMode = "login";
    syncAuthModeText();
    return;
  }

  const token = data.token || "";
  if (!token) {
    authMsg.textContent = t.err_token;
    return;
  }

  setToken(token);

  // Finn e-post: prøv /me først, fallback til JWT sub
  const meRes = await apiFetch("/api/auth/me");
  if (meRes.ok) {
    const me = await meRes.json().catch(() => ({}));
    const emailFromMe = me.email || me.username || me.user || "";
    setLoggedInUI(emailFromMe || decodeJwtSub(token));
    closeModal();
    await loadApps();
    return;
  }

  // Hvis /me gir 401, men token finnes -> vi viser feilen (du ser dette nå)
  // Ofte betyr det at token ikke sendes korrekt. Men her sendes det via apiFetch.
  // Da er det sannsynlig backend forventer annen header eller prefix.
  // Likevel: vi viser fallback og lar deg teste videre.
  const sub = decodeJwtSub(token);
  setLoggedInUI(sub || email);
  authMsg.textContent = t.err_me401;
}

function doLogout(silent = false) {
  clearToken();
  setLoggedOutUI();
  if (!silent) {
    closeModal();
  }
}

// ====== EVENTS ======
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    loadApps();
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";
  formMsg.classList.remove("ok");

  if (!getToken()) {
    formMsg.textContent = getLang()==="no" ? "Du må logge inn først." : "You must sign in first.";
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
    formMsg.textContent = text || tr().err_generic;
    return;
  }

  form.reset();
  await loadApps();
});

loginBtn.addEventListener("click", openModal);
closeAuth.addEventListener("click", closeModal);
authModal.addEventListener("click", (e) => {
  if (e.target === authModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !authModal.classList.contains("hidden")) closeModal();
});

toggleAuthModeBtn.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  authMsg.textContent = "";
  authMsg.classList.remove("ok");
  syncAuthModeText();
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;
  await doLoginOrRegister(email, password);
});

logoutBtn.addEventListener("click", () => doLogout(false));

langBtn.addEventListener("click", () => {
  const next = getLang() === "no" ? "en" : "no";
  setLang(next);
});

// ====== BOOT ======
(function init() {
  applyLang();

  // Hvis token finnes, sett UI og last apps
  const token = getToken();
  if (token) {
    const email = decodeJwtSub(token);
    setLoggedInUI(email || tr().notLoggedIn);
    loadApps();
  } else {
    setLoggedOutUI();
  }
})();

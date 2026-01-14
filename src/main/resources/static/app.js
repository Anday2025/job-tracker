// ====== STATE ======
let currentFilter = "ALL";
let authMode = "login"; // "login" | "register"
let lang = localStorage.getItem("lang") || "no"; // husk språkvalg
let token = localStorage.getItem("token") || null;
let meEmail = null;

// ====== ELEMENTS ======
const listEl = document.getElementById("list");
const statsEl = document.getElementById("stats");
const form = document.getElementById("createForm");
const formMsg = document.getElementById("formMsg");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const whoamiEl = document.getElementById("whoami");
const langBtn = document.getElementById("langBtn");

const modal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthModeBtn = document.getElementById("toggleAuthMode");
const authMsg = document.getElementById("authMsg");
const authTitle = document.getElementById("authTitle");

// ====== i18n ======
const I18N = {
  no: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    login: "Logg inn",
    logout: "Logg ut",
    notLogged: "Ikke innlogget",
    newApp: "Ny søknad",
    company: "Firma *",
    companyPh: "F.eks. NAV / Telenor",
    role: "Stilling *",
    rolePh: "F.eks. Junior utvikler",
    link: "Link",
    linkPh: "https://...",
    deadline: "Frist",
    add: "Legg til",
    apps: "Søknader",
    listTitle: "Liste",
    hint: "Logg inn for å lagre og se dine søknader.",
    emptyLogin: "Ingen treff. Logg inn for å se dine søknader.",
    filters: { ALL:"Alle", PLANLAGT:"Planlagt", SOKT:"Søkt", INTERVJU:"Intervju", AVSLATT:"Avslått", TILBUD:"Tilbud" },
    modalLoginTitle: "Logg inn",
    modalRegisterTitle: "Opprett bruker",
    emailPh: "E-post",
    passPh: "Passord",
    createUser: "Opprett bruker",
    switchToRegister: "Opprett bruker",
    switchToLogin: "Tilbake til innlogging",
    okLogin: "Innlogget.",
    okRegister: "Bruker opprettet. Du kan logge inn.",
    badCredentials: "Feil e-post eller passord.",
    genericErr: "Noe gikk galt.",
    invalidToken: "Innlogging feilet (token).",
    built: "Bygget med Java (Spring Boot) + vanilla JS + JWT."
  },
  en: {
    title: "Job tracker",
    subtitle: "Keep track of your applications.",
    login: "Sign in",
    logout: "Sign out",
    notLogged: "Not signed in",
    newApp: "New application",
    company: "Company *",
    companyPh: "e.g. NAV / Telenor",
    role: "Role *",
    rolePh: "e.g. Junior developer",
    link: "Link",
    linkPh: "https://...",
    deadline: "Deadline",
    add: "Add",
    apps: "Applications",
    listTitle: "List",
    hint: "Sign in to save and view your applications.",
    emptyLogin: "No results. Sign in to view your applications.",
    filters: { ALL:"All", PLANLAGT:"Planned", SOKT:"Applied", INTERVJU:"Interview", AVSLATT:"Rejected", TILBUD:"Offer" },
    modalLoginTitle: "Sign in",
    modalRegisterTitle: "Create account",
    emailPh: "Email",
    passPh: "Password",
    createUser: "Create account",
    switchToRegister: "Create account",
    switchToLogin: "Back to sign in",
    okLogin: "Signed in.",
    okRegister: "Account created. You can sign in now.",
    badCredentials: "Wrong email or password.",
    genericErr: "Something went wrong.",
    invalidToken: "Sign-in failed (token).",
    built: "Built with Java (Spring Boot) + vanilla JS + JWT."
  }
};

function t() { return I18N[lang]; }

function applyI18n(){
  document.documentElement.lang = lang;

  document.getElementById("t_title").textContent = t().title;
  document.getElementById("t_subtitle").textContent = t().subtitle;

  loginBtn.textContent = t().login;
  logoutBtn.textContent = t().logout;

  document.getElementById("t_newAppTitle").textContent = t().newApp;
  document.getElementById("t_companyLabel").textContent = t().company;
  document.getElementById("t_companyPh").setAttribute("placeholder", t().companyPh);
  document.getElementById("t_roleLabel").textContent = t().role;
  document.getElementById("t_rolePh").setAttribute("placeholder", t().rolePh);
  document.getElementById("t_linkLabel").textContent = t().link;
  document.getElementById("t_linkPh").setAttribute("placeholder", t().linkPh);
  document.getElementById("t_deadlineLabel").textContent = t().deadline;
  document.getElementById("t_addBtn").textContent = t().add;

  document.getElementById("t_appsTitle").textContent = t().apps;
  document.getElementById("t_loginHint").textContent = t().hint;
  document.getElementById("t_emptyLogin").textContent = t().emptyLogin;

  document.getElementById("t_f_all").textContent = t().filters.ALL;
  document.getElementById("t_f_planned").textContent = t().filters.PLANLAGT;
  document.getElementById("t_f_applied").textContent = t().filters.SOKT;
  document.getElementById("t_f_interview").textContent = t().filters.INTERVJU;
  document.getElementById("t_f_rejected").textContent = t().filters.AVSLATT;
  document.getElementById("t_f_offer").textContent = t().filters.TILBUD;

  document.getElementById("t_footer").textContent = t().built;

  // modal
  authEmail.setAttribute("placeholder", t().emailPh);
  authPassword.setAttribute("placeholder", t().passPh);
  renderAuthMode();
}

// ====== AUTH UI ======
function openModal(){
  modal.classList.remove("hidden");
  document.body.classList.add("modalOpen");
  authMsg.textContent = "";
  authMsg.classList.remove("ok");
  setTimeout(()=>authEmail.focus(), 0);
}
function closeModal(){
  modal.classList.add("hidden");
  document.body.classList.remove("modalOpen");
}

function setLoggedInUI(email){
  meEmail = email;
  whoamiEl.textContent = email;
  whoamiEl.classList.remove("hidden");

  loginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");

  enableApp(true);
}

function setLoggedOutUI(){
  meEmail = null;
  whoamiEl.textContent = t().notLogged;
  whoamiEl.classList.add("hidden"); // i dine bilder vises ikke pill når du ikke er innlogget

  loginBtn.classList.remove("hidden");
  logoutBtn.classList.add("hidden");

  enableApp(false);
  render([]); // tom liste med login-tekst
}

function enableApp(enabled){
  // når ikke innlogget: la designet vises, men ikke la submit/kall gå.
  const inputs = form.querySelectorAll("input, button");
  inputs.forEach(el => {
    if (el.id === "t_addBtn" || el.tagName === "INPUT") {
      el.disabled = !enabled;
    }
  });

  // filter-knapper skal fortsatt kunne trykkes (men liste lastes ikke)
}

function renderAuthMode(){
  if (authMode === "login"){
    authTitle.textContent = t().modalLoginTitle;
    authSubmitBtn.textContent = t().login;
    toggleAuthModeBtn.textContent = t().switchToRegister;
    authPassword.autocomplete = "current-password";
  } else {
    authTitle.textContent = t().modalRegisterTitle;
    authSubmitBtn.textContent = t().createUser;
    toggleAuthModeBtn.textContent = t().switchToLogin;
    authPassword.autocomplete = "new-password";
  }
}

// ====== TOKEN / FETCH ======
function saveToken(newToken){
  token = newToken;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

async function authFetch(url, options = {}){
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

// Denne gjør at vi tåler ulike backend-svar: {token}, {accessToken}, {jwt}, {data:{token}}, string osv.
async function readTokenFromResponse(res){
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")){
    const data = await res.json();
    const maybe =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.access_token ||
      data?.data?.token ||
      data?.data?.accessToken ||
      null;
    return { token: maybe, data };
  } else {
    const text = await res.text();
    // hvis backend returnerer raw token-string
    const trimmed = (text || "").trim();
    return { token: trimmed || null, data: text };
  }
}

// ====== API: AUTH ======
async function apiMe(){
  if (!token) return null;
  const res = await authFetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  // backend kan returnere {email:".."} eller {username:".."}
  return data.email || data.username || data.user || null;
}

async function apiLogin(email, password){
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // send både email og username for å være kompatibel med ulike backend-DTOer
    body: JSON.stringify({ email, username: email, password })
  });

  if (!res.ok){
    const text = await res.text().catch(()=> "");
    throw new Error(text || String(res.status));
  }

  const { token: tok } = await readTokenFromResponse(res);
  if (!tok) throw new Error("NO_TOKEN");
  return tok;
}

async function apiRegister(email, password){
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username: email, password })
  });

  if (!res.ok){
    const text = await res.text().catch(()=> "");
    throw new Error(text || String(res.status));
  }
  return true;
}

// ====== APP LOGIC ======
function badge(status) {
  const mapNo = {
    PLANLAGT: "Planlagt",
    SOKT: "Søkt",
    INTERVJU: "Intervju",
    AVSLATT: "Avslått",
    TILBUD: "Tilbud"
  };
  const mapEn = {
    PLANLAGT: "Planned",
    SOKT: "Applied",
    INTERVJU: "Interview",
    AVSLATT: "Rejected",
    TILBUD: "Offer"
  };
  const map = (lang === "no") ? mapNo : mapEn;
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

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function render(apps) {
  // hvis ikke innlogget: behold teksten “logg inn”
  if (!token){
    statsEl.textContent = "—";
    listEl.innerHTML = `<div class="muted" id="t_emptyLogin">${t().emptyLogin}</div>`;
    return;
  }

  const filtered = currentFilter === "ALL"
    ? apps
    : apps.filter(a => a.status === currentFilter);

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  statsEl.textContent =
    `${badge("PLANLAGT")}: ${counts.PLANLAGT || 0} • ` +
    `${badge("SOKT")}: ${counts.SOKT || 0} • ` +
    `${badge("INTERVJU")}: ${counts.INTERVJU || 0} • ` +
    `${badge("TILBUD")}: ${counts.TILBUD || 0} • ` +
    `${badge("AVSLATT")}: ${counts.AVSLATT || 0}`;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="muted">${lang==="no" ? "Ingen treff." : "No results."}</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const a of filtered) {
    const el = document.createElement("div");
    el.className = "item" + (isOverdue(a.deadline, a.status) ? " overdue" : "");

    const link = a.link
      ? `<a href="${a.link}" target="_blank" rel="noreferrer">Link</a>`
      : `<span class="muted">${lang==="no" ? "Ingen link" : "No link"}</span>`;

    el.innerHTML = `
      <div class="top">
        <div>
          <div class="title">${escapeHtml(a.company)} — ${escapeHtml(a.role)}</div>
          <div class="meta">
            <span>${lang==="no" ? "Frist" : "Deadline"}: <span class="badge">${fmtDate(a.deadline)}</span></span>
            <span>${lang==="no" ? "Status" : "Status"}: <span class="badge">${badge(a.status)}</span></span>
            <span>${link}</span>
          </div>
        </div>

        <div class="actions">
          <select data-id="${a.id}" class="statusSelect">
            ${["PLANLAGT","SOKT","INTERVJU","AVSLATT","TILBUD"].map(s =>
              `<option value="${s}" ${s===a.status ? "selected" : ""}>${badge(s)}</option>`
            ).join("")}
          </select>
          <button class="btn ghost" data-del="${a.id}" type="button">${lang==="no" ? "Slett" : "Delete"}</button>
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
  if (!token){
    render([]);
    return;
  }

  const res = await authFetch("/api/apps");
  if (res.status === 401){
    // token ugyldig/utløpt
    saveToken(null);
    setLoggedOutUI();
    openModal();
    return;
  }

  const apps = await res.json();
  render(apps);
}

async function updateStatus(id, status) {
  const res = await authFetch(`/api/apps/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  if (res.status === 401){
    saveToken(null);
    setLoggedOutUI();
    openModal();
    return;
  }
  await load();
}

async function removeItem(id) {
  const res = await authFetch(`/api/apps/${id}`, { method: "DELETE" });
  if (res.status === 401){
    saveToken(null);
    setLoggedOutUI();
    openModal();
    return;
  }
  await load();
}

// ====== EVENTS ======
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
  formMsg.classList.remove("ok");

  if (!token){
    formMsg.textContent = lang==="no" ? "Du må logge inn." : "You must sign in.";
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

  const res = await authFetch("/api/apps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.status === 401){
    saveToken(null);
    setLoggedOutUI();
    openModal();
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    formMsg.textContent = text || t().genericErr;
    return;
  }

  form.reset();
  await load();
});

loginBtn.addEventListener("click", () => openModal());
closeAuth.addEventListener("click", () => closeModal());
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

toggleAuthModeBtn.addEventListener("click", () => {
  authMode = (authMode === "login") ? "register" : "login";
  authMsg.textContent = "";
  authMsg.classList.remove("ok");
  renderAuthMode();
});

logoutBtn.addEventListener("click", async () => {
  saveToken(null);
  setLoggedOutUI();
  render([]);
});

langBtn.addEventListener("click", () => {
  lang = (lang === "no") ? "en" : "no";
  localStorage.setItem("lang", lang);
  applyI18n();
  // rerender med nye labels
  load();
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "";
  authMsg.classList.remove("ok");

  const email = (authEmail.value || "").trim();
  const password = (authPassword.value || "").trim();

  try {
    if (authMode === "register") {
      await apiRegister(email, password);
      authMsg.textContent = t().okRegister;
      authMsg.classList.add("ok");
      // Bytt automatisk til login
      authMode = "login";
      renderAuthMode();
      return;
    }

    // login
    const tok = await apiLogin(email, password);
    saveToken(tok);

    // Hent /me for å få e-post som skal vises oppe til høyre
    const me = await apiMe();
    if (!me){
      // token lagret men /me feiler => backend mismatch / token ugyldig
      saveToken(null);
      throw new Error("NO_ME");
    }

    authMsg.textContent = t().okLogin;
    authMsg.classList.add("ok");

    setLoggedInUI(me);
    closeModal();
    await load();

  } catch (err) {
    const msg = String(err?.message || "");
    if (msg === "NO_TOKEN" || msg === "NO_ME") {
      authMsg.textContent = t().invalidToken;
    } else if (msg.includes("401")) {
      authMsg.textContent = t().badCredentials;
    } else if (msg.includes("400")) {
      authMsg.textContent = lang==="no"
        ? "Ugyldig input (sjekk passordkrav)."
        : "Invalid input (check password rules).";
    } else {
      authMsg.textContent = t().genericErr;
    }
  }
});

// ====== INIT ======
applyI18n();

// Start: hvis token finnes -> prøv auto-login via /me
(async function init(){
  if (token){
    const me = await apiMe();
    if (me){
      setLoggedInUI(me);
      await load();
      return;
    }
    // ugyldig token
    saveToken(null);
  }

  setLoggedOutUI();
  render([]);
})();

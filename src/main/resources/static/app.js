/*
API KONFIGURASJON
Alle backend-endpoints som brukes i appen.
Dette gjør det enkelt å endre API senere.
*/
const API = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
  logout: "/api/auth/logout",

  resendVerification: "/api/auth/resend-verification",
  forgotPassword: "/api/auth/forgot-password",
  resetPassword: "/api/auth/reset-password",

  apps: "/api/apps",
};

const STORAGE_LANG = "lang";


/*
GLOBAL STATE
Holder data som brukes i hele applikasjonen:
bruker, søknader, språk og modal-status
*/
const state = {
  me: null,
  apps: [],
  filter: "ALL",
  lang: localStorage.getItem(STORAGE_LANG) || "no",

  authView: "login",
  resetToken: null,
};


/*
SPRÅKSYSTEM (i18n)
Oversettelser for norsk og engelsk.
t() brukes for å hente riktig tekst.
*/
const T = { ... }  // (samme innhold som din kode)


function t(key) {
  return (T[state.lang] && T[state.lang][key]) || key;
}


/*
DOM ELEMENTER
Henter elementer fra HTML slik at JavaScript kan manipulere dem
*/
const $ = (sel) => document.querySelector(sel);

const loginBtn = $("#loginBtn");
const logoutBtn = $("#logoutBtn");
const whoami = $("#whoami");
const langBtn = $("#langBtn");

const authModal = $("#authModal");
const closeAuth = $("#closeAuth");
const authForm = $("#authForm");
const authTitle = $("#authTitle");

const createForm = $("#createForm");
const formMsg = $("#formMsg");
const stats = $("#stats");
const listEl = $("#list");
const filterBtns = Array.from(document.querySelectorAll(".filter"));

const progressLabel = $("#progressLabel");
const progressPct = $("#progressPct");
const progressFill = $("#progressFill");


/*
HJELPEFUNKSJONER
Små funksjoner som brukes mange steder i koden
*/
function setMsg(el, text, ok = false) {
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("ok", !!ok);
}

function show(el) { el?.classList.remove("hidden"); }
function hide(el) { el?.classList.add("hidden"); }


/*
MODAL FUNKSJONER
Åpner og lukker login/register popup
*/
function openModal() {
  if (!authModal) return;
  authModal.classList.remove("hidden");
  renderAuthView();
  setTimeout(() => authForm?.querySelector("input")?.focus(), 40);
}

function closeModal() {
  if (!authModal) return;
  authModal.classList.add("hidden");
}


/*
FORMATTERING
Formatterer dato og status tekst
*/
function fmtDate(iso) {
  if (!iso) return "";
  if (state.lang === "no") {
    const [y,m,d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  return iso;
}

function statusLabel(s) {
  switch (s) {
    case "PLANLAGT": return t("planned");
    case "SOKT": return t("applied");
    case "INTERVJU": return t("interview");
    case "AVSLATT": return t("rejected");
    case "TILBUD": return t("offer");
    default: return s;
  }
}


/*
STATUS CSS KLASSER
Returnerer riktig CSS-klasse basert på status
*/
function statusClass(status) {
  switch ((status || "").trim().toUpperCase()) {
    case "PLANLAGT": return "status-planlagt";
    case "SOKT": return "status-sokt";
    case "INTERVJU": return "status-intervju";
    case "TILBUD": return "status-tilbud";
    case "AVSLATT": return "status-avslatt";
    default: return "";
  }
}


/*
API FETCH
Wrapper rundt fetch som alltid sender cookies
(for login-session)
*/
async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}


/*
FEILHÅNDTERING FRA API
Leser error-melding fra backend
*/
async function readError(res) {
  const txt = await res.text().catch(() => "");
  if (!txt) return `HTTP ${res.status}`;
  try {
    const obj = JSON.parse(txt);
    return obj?.error || obj?.message || txt;
  } catch {
    return txt;
  }
}


/*
RESET TOKEN FRA URL
Brukes i password reset flow
*/
function getQueryToken() {
  const url = new URL(window.location.href);
  return url.searchParams.get("token");
}

function clearQueryToken() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());
}


/*
AUTH MODAL RENDERING
Bygger login/register/reset form dynamisk
*/
function renderAuthView(message = "", ok = false) {
  ...
}


/*
ENDRE MODAL VIEW
Setter hvilken auth-side som vises
*/
function setAuthView(view, message = "", ok = false) {
  state.authView = view;
  renderAuthView(message, ok);
}


/*
OPPDATER SPRÅK I UI
Setter alle tekster basert på valgt språk
*/
function applyI18n() {
  ...
}


/*
OPPDATER LOGIN UI
Viser bruker-email hvis man er logget inn
og skjuler login-knapp
*/
function updateAuthUI() {

  if (state.me?.email) {
    whoami.textContent = state.me.email;
    show(whoami);
    show(logoutBtn);
    hide(loginBtn);
  } else {
    whoami.textContent = "—";
    hide(whoami);
    hide(logoutBtn);
    show(loginBtn);
  }

  document.querySelector("#t_loginHint")?.classList.toggle("hidden", !!state.me);

  applyI18n();
}


/*
FILTER SØKNADER
Returnerer søknader basert på valgt filter
*/
function filteredApps() {
  if (state.filter === "ALL") return state.apps;
  return state.apps.filter(a => a.status === state.filter);
}


/*
RENDER STATISTIKK OG PROGRESSBAR
Viser antall søknader og progresjon
*/
function renderStats() {
  ...
}


/*
RENDER LISTE
Bygger søknadslisten dynamisk i DOM
*/
function renderList() {
  ...
}


/*
API FUNKSJONER
Alle kall til backend
*/
async function loadMe(){...}
async function loadApps(){...}
async function doLogin(email,password){...}
async function doRegister(email,password){...}
async function doResendVerification(email){...}
async function doForgotPassword(email){...}
async function doResetPassword(token,password){...}
async function doLogout(){...}
async function createApp(payload){...}
async function updateStatus(id,status){...}
async function deleteApp(id){...}


/*
EVENT LISTENERS
Reagerer på brukerhandlinger:
klikk, submit, filter, språk osv.
*/
loginBtn?.addEventListener("click", ...);
logoutBtn?.addEventListener("click", ...);
createForm?.addEventListener("submit", ...);
filterBtns.forEach(...);
langBtn?.addEventListener("click", ...);


/*
INIT FUNKSJON
Kjører når siden lastes.
Laster brukerdata og søknader.
*/
(async function init() {

  applyI18n();
  updateAuthUI();

  const token = getQueryToken();

  if (token) {
    state.resetToken = token;
    setAuthView("reset");
    openModal();
  }

  await loadMe();
  await loadApps();

})();
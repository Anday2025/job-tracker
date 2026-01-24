// =========================
// Config
// =========================


const API = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
  logout: "/api/auth/logout",
  apps: "/api/apps",

  forgotPassword: "/api/auth/forgot-password",
  resendVerification: "/api/auth/resend-verification",
  resetPassword: "/api/auth/reset-password",


  // ✅ Reset password endpoint (må finnes i backend)
  resetPassword: "/api/auth/reset-password",
};

const STORAGE_LANG = "lang"; // "no" | "en"

// =========================
// State
// =========================
const state = {
  me: null,              // { email }
  apps: [],              // array of JobApplicationDto
  filter: "ALL",         // ALL | PLANLAGT | SOKT | INTERVJU | AVSLATT | TILBUD
  lang: localStorage.getItem(STORAGE_LANG) || "no",

  // authMode: "login" | "register" | "reset"
  authMode: "login",

  // ✅ reset password
  resetToken: null,
};

// =========================
// i18n (minimal)
// =========================
const T = {
  no: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    login: "Logg inn",
    logout: "Logg ut",
    register: "Opprett bruker",
    email: "E-post",
    password: "Passord",
    newPassword: "Nytt passord",
    confirmPassword: "Bekreft passord",
    resetPassword: "Reset passord",
    resetBtn: "Reset",
    back: "Tilbake",
    newApp: "Ny søknad",
    apps: "Søknader",
    add: "Legg til",
    companyReq: "Firma og stilling er påkrevd",
    loginHint: "Logg inn for å lagre og se dine søknader.",
    emptyLogin: "Ingen treff. Logg inn for å se dine søknader.",
    empty: "Ingen treff.",
    link: "Link",
    deadline: "Frist",
    status: "Status",
    del: "Slett",
    planned: "Planlagt",
    applied: "Søkt",
    interview: "Intervju",
    rejected: "Avslått",
    offer: "Tilbud",
    all: "Alle",
    regOk: "Bruker opprettet. Sjekk e-posten din for bekreftelseslenke.",
    pwMismatch: "Passordene matcher ikke.",
    missingToken: "Mangler token i URL.",
    resetOk: "Passord oppdatert! Du kan logge inn nå.",
  },
  en: {
    title: "Job tracker",
    subtitle: "Keep track of your applications.",
    login: "Sign in",
    logout: "Sign out",
    register: "Create account",
    email: "Email",
    password: "Password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    resetPassword: "Reset password",
    resetBtn: "Reset",
    back: "Back",
    newApp: "New application",
    apps: "Applications",
    add: "Add",
    companyReq: "Company and role are required",
    loginHint: "Sign in to save and view your applications.",
    emptyLogin: "No results. Sign in to view your applications.",
    empty: "No results.",
    link: "Link",
    deadline: "Deadline",
    status: "Status",
    del: "Delete",
    planned: "Planned",
    applied: "Applied",
    interview: "Interview",
    rejected: "Rejected",
    offer: "Offer",
    all: "All",
    regOk: "Account created. Check your email to verify your account.",
    pwMismatch: "Passwords do not match.",
    missingToken: "Missing token in URL.",
    resetOk: "Password updated! You can sign in now.",
  }
};

function t(key) {
  return (T[state.lang] && T[state.lang][key]) || key;
}

// =========================
// DOM
// =========================
const $ = (sel) => document.querySelector(sel);

const loginBtn = $("#loginBtn");
const logoutBtn = $("#logoutBtn");
const whoami = $("#whoami");
const langBtn = $("#langBtn");

const authModal = $("#authModal");
const closeAuth = $("#closeAuth");
const authForm = $("#authForm");
const authEmail = $("#authEmail");
const authPassword = $("#authPassword");
const authSubmitBtn = $("#authSubmitBtn");
const toggleAuthMode = $("#toggleAuthMode");
const backToLoginBtn = $("#backToLoginBtn");
const authMsg = $("#authMsg");

const resetFields = $("#resetFields");
const newPassword = $("#newPassword");
const confirmPassword = $("#confirmPassword");

const authEmailRow = $("#authEmailRow");
const authPasswordRow = $("#authPasswordRow");

const createForm = $("#createForm");
const formMsg = $("#formMsg");

const stats = $("#stats");
const listEl = $("#list");

const filterBtns = Array.from(document.querySelectorAll(".filter"));

// =========================
// Helpers
// =========================
function setMsg(el, text, ok = false) {
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("ok", !!ok);
}

function show(el) { el?.classList.remove("hidden"); }
function hide(el) { el?.classList.add("hidden"); }

function openModal() {
  if (!authModal) return;
  authModal.classList.remove("hidden");
  setMsg(authMsg, "");
  setTimeout(() => {
    if (state.authMode === "reset") newPassword?.focus();
    else authEmail?.focus();
  }, 30);
}

function closeModal() {
  if (!authModal) return;
  authModal.classList.add("hidden");
  setMsg(authMsg, "");
}

function fmtDate(iso) {
  if (!iso) return "";
  if (state.lang === "no") {
    const [y, m, d] = iso.split("-");
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

// Cookie-auth: viktig at vi inkluderer cookies
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  return res;
}

async function readError(res) {
  const txt = await res.text().catch(() => "");
  return txt || `HTTP ${res.status}`;
}

// =========================
// Auth modal mode switching
// =========================
function setAuthMode(mode) {
  state.authMode = mode;

  // Title + buttons
  const authTitle = $("#authTitle");
  if (authTitle) {
    authTitle.textContent =
        mode === "login" ? t("login") :
            mode === "register" ? t("register") :
                t("resetPassword");
  }

  // Toggle which fields show
  if (mode === "reset") {
    hide(authEmailRow);
    hide(authPasswordRow);
    show(resetFields);

    if (authSubmitBtn) authSubmitBtn.textContent = t("resetBtn");
    hide(toggleAuthMode);
    show(backToLoginBtn);
  } else {
    show(authEmailRow);
    show(authPasswordRow);
    hide(resetFields);

    if (authSubmitBtn) authSubmitBtn.textContent = mode === "login" ? t("login") : t("register");
    show(toggleAuthMode);
    hide(backToLoginBtn);
  }

  // Placeholders
  if (authEmail) authEmail.setAttribute("placeholder", t("email"));
  if (authPassword) authPassword.setAttribute("placeholder", t("password"));
  if (newPassword) newPassword.setAttribute("placeholder", t("newPassword"));
  if (confirmPassword) confirmPassword.setAttribute("placeholder", t("confirmPassword"));

  if (toggleAuthMode) toggleAuthMode.textContent = mode === "login" ? t("register") : t("login");
  if (backToLoginBtn) backToLoginBtn.textContent = t("back");

  setMsg(authMsg, "");
}

// =========================
// Rendering
// =========================
function applyI18n() {
  const titleEl = $("#t_title");
  const subEl = $("#t_subtitle");
  if (titleEl) titleEl.textContent = t("title");
  if (subEl) subEl.textContent = t("subtitle");

  if (loginBtn) loginBtn.textContent = t("login");
  if (logoutBtn) logoutBtn.textContent = t("logout");
  if (langBtn) langBtn.textContent = state.lang === "no" ? "NO/EN" : "EN/NO";

  const newAppTitle = $("#t_newAppTitle");
  const appsTitle = $("#t_appsTitle");
  const addBtn = $("#t_addBtn");
  if (newAppTitle) newAppTitle.textContent = t("newApp");
  if (appsTitle) appsTitle.textContent = t("apps");
  if (addBtn) addBtn.textContent = t("add");

  const fAll = $("#t_f_all");
  const fPlanned = $("#t_f_planned");
  const fApplied = $("#t_f_applied");
  const fInterview = $("#t_f_interview");
  const fRejected = $("#t_f_rejected");
  const fOffer = $("#t_f_offer");

  if (fAll) fAll.textContent = t("all");
  if (fPlanned) fPlanned.textContent = t("planned");
  if (fApplied) fApplied.textContent = t("applied");
  if (fInterview) fInterview.textContent = t("interview");
  if (fRejected) fRejected.textContent = t("rejected");
  if (fOffer) fOffer.textContent = t("offer");

  const companyLabel = $("#t_companyLabel");
  const roleLabel = $("#t_roleLabel");
  const linkLabel = $("#t_linkLabel");
  const deadlineLabel = $("#t_deadlineLabel");

  if (companyLabel) companyLabel.textContent = state.lang === "no" ? "Firma *" : "Company *";
  if (roleLabel) roleLabel.textContent = state.lang === "no" ? "Stilling *" : "Role *";
  if (linkLabel) linkLabel.textContent = t("link");
  if (deadlineLabel) deadlineLabel.textContent = t("deadline");

  const companyPh = $("#t_companyPh");
  const rolePh = $("#t_rolePh");
  const linkPh = $("#t_linkPh");

  if (companyPh) companyPh.setAttribute("placeholder", state.lang === "no" ? "F.eks. NAV / Telenor" : "e.g. NAV / Telenor");
  if (rolePh) rolePh.setAttribute("placeholder", state.lang === "no" ? "F.eks. Junior utvikler" : "e.g. Junior developer");
  if (linkPh) linkPh.setAttribute("placeholder", "https://...");

  const loginHint = $("#t_loginHint");
  const emptyLogin = $("#t_emptyLogin");
  if (loginHint) loginHint.textContent = t("loginHint");
  if (emptyLogin) emptyLogin.textContent = state.me ? t("empty") : t("emptyLogin");

  // Re-apply auth modal mode labels
  setAuthMode(state.authMode);
}

function updateAuthUI() {
  if (state.me?.email) {
    if (whoami) whoami.textContent = state.me.email;
    show(whoami);
    show(logoutBtn);
    hide(loginBtn);
  } else {
    if (whoami) whoami.textContent = "—";
    hide(whoami);
    hide(logoutBtn);
    show(loginBtn);
  }
  applyI18n();
}

function filteredApps() {
  if (state.filter === "ALL") return state.apps;
  return state.apps.filter(a => a.status === state.filter);
}

function renderStats() {
  if (!stats) return;

  const counts = { PLANLAGT: 0, SOKT: 0, INTERVJU: 0, TILBUD: 0, AVSLATT: 0 };
  for (const a of state.apps) {
    if (counts[a.status] !== undefined) counts[a.status]++;
  }
  const total = state.apps.length;

  stats.textContent =
      `${t("planned")}: ${counts.PLANLAGT} • ` +
      `${t("applied")}: ${counts.SOKT} • ` +
      `${t("interview")}: ${counts.INTERVJU} • ` +
      `${t("offer")}: ${counts.TILBUD} • ` +
      `${t("rejected")}: ${counts.AVSLATT} • ` +
      `Total: ${total}`;
}

function renderList() {
  if (!listEl) return;

  const apps = filteredApps();
  renderStats();

  listEl.innerHTML = "";

  if (!state.me) {
    const div = document.createElement("div");
    div.className = "muted";
    div.textContent = t("emptyLogin");
    listEl.appendChild(div);
    return;
  }

  if (apps.length === 0) {
    const div = document.createElement("div");
    div.className = "muted";
    div.textContent = t("empty");
    listEl.appendChild(div);
    return;
  }

  const today = new Date();
  const toISODate = (d) => d.toISOString().slice(0, 10);

  for (const a of apps) {
    const item = document.createElement("div");
    item.className = "item";

    if (a.deadline && a.status !== "AVSLATT" && a.status !== "TILBUD") {
      if (a.deadline < toISODate(today)) item.classList.add("overdue");
    }

    const top = document.createElement("div");
    top.className = "top";

    const left = document.createElement("div");

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = `${a.company} — ${a.role}`;
    left.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";

    const d = document.createElement("span");
    d.className = "badge";
    d.textContent = `${t("deadline")}: ${a.deadline ? fmtDate(a.deadline) : "—"}`;
    meta.appendChild(d);

    const s = document.createElement("span");
    s.className = "badge";
    s.textContent = `${t("status")}: ${statusLabel(a.status)}`;
    meta.appendChild(s);

    if (a.link) {
      const link = document.createElement("a");
      link.href = a.link;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = t("link");
      meta.appendChild(link);
    }

    left.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const select = document.createElement("select");
    ["PLANLAGT", "SOKT", "INTERVJU", "AVSLATT", "TILBUD"].forEach(st => {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = statusLabel(st);
      if (st === a.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", async () => {
      try {
        await updateStatus(a.id, select.value);
      } catch (e) {
        select.value = a.status;
        console.error(e);
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn ghost";
    delBtn.textContent = t("del");
    delBtn.addEventListener("click", async () => {
      try {
        await deleteApp(a.id);
      } catch (e) {
        console.error(e);
      }
    });

    actions.appendChild(select);
    actions.appendChild(delBtn);

    top.appendChild(left);
    top.appendChild(actions);

    item.appendChild(top);
    listEl.appendChild(item);
  }
}

// =========================
// API actions
// =========================
async function loadMe() {
  try {
    const res = await apiFetch(API.me, { method: "GET" });
    if (!res.ok) {
      state.me = null;
      updateAuthUI();
      return;
    }
    state.me = await res.json();
    updateAuthUI();
  } catch {
    state.me = null;
    updateAuthUI();
  }
}

async function loadApps() {
  if (!state.me) {
    state.apps = [];
    renderList();
    return;
  }
  const res = await apiFetch(API.apps, { method: "GET" });
  if (!res.ok) {
    state.apps = [];
    renderList();
    return;
  }
  state.apps = await res.json();
  renderList();
}

async function doLogin(email, password) {
  const res = await apiFetch(API.login, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readError(res));

  state.me = await res.json();
  updateAuthUI();
  await loadApps();
}

async function doRegister(email, password) {
  const res = await apiFetch(API.register, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

async function doResetPassword(token, password) {
  const res = await apiFetch(API.resetPassword, {
    method: "POST",
    body: JSON.stringify({
      token,
      password,
      newPassword: password, // ekstra felt (ufarlig)
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

async function doLogout() {
  await apiFetch(API.logout, { method: "POST" });
  state.me = null;
  state.apps = [];
  updateAuthUI();
  renderList();
}

async function createApp(payload) {
  const res = await apiFetch(API.apps, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));

  const created = await res.json();
  state.apps = [created, ...state.apps];
  renderList();
}

async function updateStatus(id, status) {
  const res = await apiFetch(`${API.apps}/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readError(res));

  const updated = await res.json();
  state.apps = state.apps.map(a => (a.id === id ? updated : a));
  renderList();
}

async function deleteApp(id) {
  const res = await apiFetch(`${API.apps}/${id}`, { method: "DELETE" });
  if (!(res.status === 204 || res.ok)) throw new Error(await readError(res));

  state.apps = state.apps.filter(a => a.id !== id);
  renderList();
}

// =========================
// Events
// =========================
loginBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  setAuthMode("login");
  openModal();
});

closeAuth?.addEventListener("click", (e) => {
  e.preventDefault();
  closeModal();
});

// close modal by clicking backdrop
authModal?.addEventListener("click", (e) => {
  if (e.target === authModal) closeModal();
});

// toggle login/register (NOT reset)
toggleAuthMode?.addEventListener("click", () => {
  const next = state.authMode === "login" ? "register" : "login";
  setAuthMode(next);
});

// back from reset to login
backToLoginBtn?.addEventListener("click", () => {
  state.resetToken = null;
  // optional: fjern token fra URL (så den ikke åpner reset igjen)
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());

  setAuthMode("login");
});

// auth submit
authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(authMsg, "");

  try {
    if (state.authMode === "reset") {
      const token = state.resetToken;
      if (!token) {
        setMsg(authMsg, t("missingToken"));
        return;
      }

      const p1 = (newPassword?.value || "").trim();
      const p2 = (confirmPassword?.value || "").trim();

      if (!p1 || !p2) {
        setMsg(authMsg, state.lang === "no" ? "Fyll inn begge passordfeltene" : "Fill in both password fields");
        return;
      }
      if (p1 !== p2) {
        setMsg(authMsg, t("pwMismatch"));
        return;
      }

      await doResetPassword(token, p1);

      setMsg(authMsg, t("resetOk"), true);

      // etter reset → bytt til login
      setTimeout(() => {
        // fjern token fra URL
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());

        state.resetToken = null;
        setAuthMode("login");
        newPassword.value = "";
        confirmPassword.value = "";
        authEmail?.focus();
      }, 350);

      return;
    }

    // login/register
    const email = (authEmail?.value || "").trim().toLowerCase();
    const password = authPassword?.value || "";

    if (!email || !password) {
      setMsg(authMsg, state.lang === "no" ? "Fyll inn e-post og passord" : "Enter email and password");
      return;
    }

    if (state.authMode === "register") {
      await doRegister(email, password);
      setMsg(authMsg, t("regOk"), true);
      setAuthMode("login");
      return;
    }

    // login
    await doLogin(email, password);
    closeModal();

  } catch (err) {
    setMsg(authMsg, err?.message || (state.lang === "no" ? "Noe gikk galt" : "Something went wrong"));
    console.error(err);
  }
});

// logout
logoutBtn?.addEventListener("click", async () => {
  try {
    await doLogout();
  } catch (e) {
    console.error(e);
  }
});

// create app
createForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(formMsg, "");

  if (!state.me) {
    setMsg(formMsg, t("loginHint"));
    setAuthMode("login");
    openModal();
    return;
  }

  const fd = new FormData(createForm);
  const company = (fd.get("company") || "").toString().trim();
  const role = (fd.get("role") || "").toString().trim();
  const link = (fd.get("link") || "").toString().trim();
  const deadline = (fd.get("deadline") || "").toString().trim();

  if (!company || !role) {
    setMsg(formMsg, t("companyReq"));
    return;
  }

  try {
    await createApp({ company, role, link, deadline });
    createForm.reset();
    setMsg(formMsg, "", true);
  } catch (err) {
    setMsg(formMsg, err?.message || "Error");
    console.error(err);
  }
});

// filters
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.filter = btn.dataset.filter || "ALL";
    renderList();
  });
});

// language
langBtn?.addEventListener("click", () => {
  state.lang = state.lang === "no" ? "en" : "no";
  localStorage.setItem(STORAGE_LANG, state.lang);
  applyI18n();
  renderList();
});

// =========================
// Init
// =========================
(async function init() {
  // ✅ auto-open reset modal if URL has ?token=
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (token) {
    state.resetToken = token;
    setAuthMode("reset");
    openModal();
  } else {
    setAuthMode("login");
  }

  applyI18n();
  updateAuthUI();
  await loadMe();
  await loadApps();
})();

async function doForgotPassword(email) {
  const res = await apiFetch(API.forgotPassword, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return await res.json().catch(() => ({}));
}

async function doResendVerification(email) {
  const res = await apiFetch(API.resendVerification, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return await res.json().catch(() => ({}));
}


const forgotBtn = document.querySelector("#forgotBtn");
const resendBtn = document.querySelector("#resendBtn");

forgotBtn?.addEventListener("click", async () => {
  setMsg(authMsg, "");
  const email = (authEmail?.value || "").trim().toLowerCase();
  if (!email) {
    setMsg(authMsg, state.lang === "no" ? "Skriv inn e-posten din først" : "Enter your email first");
    return;
  }
  try {
    await doForgotPassword(email);
    setMsg(authMsg, state.lang === "no"
        ? "Hvis e-post finnes, har vi sendt reset-link."
        : "If the email exists, a reset link was sent.", true);
  } catch (e) {
    setMsg(authMsg, e.message || "Error");
  }
});

resendBtn?.addEventListener("click", async () => {
  setMsg(authMsg, "");
  const email = (authEmail?.value || "").trim().toLowerCase();
  if (!email) {
    setMsg(authMsg, state.lang === "no" ? "Skriv inn e-posten din først" : "Enter your email first");
    return;
  }
  try {
    await doResendVerification(email);
    setMsg(authMsg, state.lang === "no"
        ? "Ny bekreftelse sendt (hvis e-post finnes)."
        : "Verification email resent (if the email exists).", true);
  } catch (e) {
    setMsg(authMsg, e.message || "Error");
  }
});


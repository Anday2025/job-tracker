// =========================
// Config
// =========================
const API = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/auth/me",
  logout: "/api/auth/logout",
  apps: "/api/apps",

  // NEW
  resendVerification: "/api/auth/resend-verification",
  forgotPassword: "/api/auth/forgot-password",
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
  authMode: "login",     // "login" | "register"
  authView: "login",     // login | register | forgot | reset | resend
  resetToken: null,
};

// =========================
// i18n
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
    newPass: "Nytt passord",
    confirmPass: "Bekreft passord",
    reset: "Reset",
    back: "Tilbake",
    forgot: "Forgot password?",
    resend: "Resend verification",
    forgotTitle: "Glemt passord",
    resetTitle: "Reset passord",
    resendTitle: "Send verifisering på nytt",
    send: "Send",
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
    forgotOk: "Hvis e-posten finnes, har vi sendt en reset-lenke. Sjekk innboksen din.",
    resendOk: "Ny verifiseringslenke er sendt (hvis e-posten finnes).",
    resetOk: "Passord er endret. Sjekk e-posten din for bekreftelse.",
    passMismatch: "Passord er ikke samme",
    fillEmail: "Fyll inn e-post",
    fillAll: "Fyll inn alle felter",
  },
  en: {
    title: "Job tracker",
    subtitle: "Keep track of your applications.",
    login: "Sign in",
    logout: "Sign out",
    register: "Create account",
    email: "Email",
    password: "Password",
    newPass: "New password",
    confirmPass: "Confirm password",
    reset: "Reset",
    back: "Back",
    forgot: "Forgot password?",
    resend: "Resend verification",
    forgotTitle: "Forgot password",
    resetTitle: "Reset password",
    resendTitle: "Resend verification",
    send: "Send",
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
    forgotOk: "If the email exists, we sent a reset link. Check your inbox.",
    resendOk: "Verification email sent (if the email exists).",
    resetOk: "Password changed. Check your email for confirmation.",
    passMismatch: "Passwords do not match",
    fillEmail: "Enter email",
    fillAll: "Fill in all fields",
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
const authMsg = $("#authMsg");

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
  document.body.classList.add("modalOpen");
  setTimeout(() => {
    // focus riktig felt
    if (state.authView === "reset") {
      $("#authPasswordNew")?.focus();
    } else {
      authEmail?.focus();
    }
  }, 30);
}

function closeModal() {
  if (!authModal) return;
  authModal.classList.add("hidden");
  document.body.classList.remove("modalOpen");
  setMsg(authMsg, "");
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
  // prøv JSON først
  try {
    const j = await res.json();
    if (j?.error) return j.error;
    if (j?.message) return j.message;
  } catch {}
  // fallback text
  const txt = await res.text().catch(() => "");
  return txt || `HTTP ${res.status}`;
}

// =========================
// Rendering (Main UI)
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
  if (newAppTitle) newAppTitle.textContent = state.lang === "no" ? "Ny søknad" : "New application";
  if (appsTitle) appsTitle.textContent = t("apps");
  if (addBtn) addBtn.textContent = t("add") || (state.lang === "no" ? "Legg til" : "Add");

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

  // Modal i18n styres i setAuthView()
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

// =========================
// Apps list rendering
// =========================
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
// Modal logic (Login/Register/Forgot/Reset/Resend)
// =========================
function ensureResetUI() {
  // Lager "Bekreft passord" input hvis den ikke finnes
  let confirm = $("#authPasswordConfirm");
  if (!confirm && authPassword?.parentElement) {
    confirm = document.createElement("input");
    confirm.id = "authPasswordConfirm";
    confirm.type = "password";
    confirm.autocomplete = "new-password";
    confirm.placeholder = t("confirmPass");
    confirm.className = authPassword.className; // samme stil
    authPassword.insertAdjacentElement("afterend", confirm);
  }

  // Lager ekstra lenker under knapper hvis de ikke finnes
  let extraRow = $("#authExtraRow");
  if (!extraRow && authForm) {
    extraRow = document.createElement("div");
    extraRow.id = "authExtraRow";
    extraRow.style.display = "flex";
    extraRow.style.justifyContent = "space-between";
    extraRow.style.marginTop = "10px";

    const forgot = document.createElement("button");
    forgot.type = "button";
    forgot.id = "forgotBtn";
    forgot.className = "linkBtn";
    forgot.textContent = t("forgot");

    const resend = document.createElement("button");
    resend.type = "button";
    resend.id = "resendBtn";
    resend.className = "linkBtn";
    resend.textContent = t("resend");

    extraRow.appendChild(forgot);
    extraRow.appendChild(resend);
    authForm.appendChild(extraRow);
  }
}

function setAuthView(view, opts = {}) {
  state.authView = view;
  if (opts.token !== undefined) state.resetToken = opts.token;

  ensureResetUI();

  const title = $("#authTitle");
  const confirm = $("#authPasswordConfirm");
  const forgotBtn = $("#forgotBtn");
  const resendBtn = $("#resendBtn");

  setMsg(authMsg, "");

  // default visning
  show(authEmail);
  show(authPassword);
  hide(confirm);

  // standard buttons
  if (authSubmitBtn) authSubmitBtn.textContent = t("login");
  if (toggleAuthMode) {
    toggleAuthMode.style.display = "inline-flex";
    toggleAuthMode.textContent = t("register");
  }

  // ekstra lenker vises alltid, men kan være disabled i reset-view
  if (forgotBtn) forgotBtn.style.display = "inline-flex";
  if (resendBtn) resendBtn.style.display = "inline-flex";

  // LOGIN/REGISTER switch
  if (view === "login") {
    state.authMode = "login";
    if (title) title.textContent = t("login");
    if (authEmail) authEmail.placeholder = t("email");
    if (authPassword) authPassword.placeholder = t("password");
    if (authSubmitBtn) authSubmitBtn.textContent = t("login");
    if (toggleAuthMode) toggleAuthMode.textContent = t("register");
  }

  if (view === "register") {
    state.authMode = "register";
    if (title) title.textContent = t("register");
    if (authEmail) authEmail.placeholder = t("email");
    if (authPassword) authPassword.placeholder = t("password");
    if (authSubmitBtn) authSubmitBtn.textContent = t("register");
    if (toggleAuthMode) toggleAuthMode.textContent = t("login");
  }

  if (view === "forgot") {
    if (title) title.textContent = t("forgotTitle");
    if (authSubmitBtn) authSubmitBtn.textContent = t("send");
    hide(authPassword);
    hide(confirm);
    if (toggleAuthMode) toggleAuthMode.textContent = t("back");
  }

  if (view === "resend") {
    if (title) title.textContent = t("resendTitle");
    if (authSubmitBtn) authSubmitBtn.textContent = t("send");
    hide(authPassword);
    hide(confirm);
    if (toggleAuthMode) toggleAuthMode.textContent = t("back");
  }

  if (view === "reset") {
    if (title) title.textContent = t("resetTitle");
    hide(authEmail);
    show(authPassword);
    show(confirm);

    if (authPassword) authPassword.placeholder = t("newPass");
    if (confirm) confirm.placeholder = t("confirmPass");
    if (authSubmitBtn) authSubmitBtn.textContent = t("reset");
    if (toggleAuthMode) toggleAuthMode.textContent = t("back");

    // i reset-view skjuler vi resend/forgot linker (du har allerede "Tilbake")
    if (forgotBtn) forgotBtn.style.display = "none";
    if (resendBtn) resendBtn.style.display = "none";
  }

  applyI18n();
}

function clearResetTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());
}

// =========================
// API actions (Auth)
// =========================
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

async function doResendVerification(email) {
  const res = await apiFetch(API.resendVerification, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

async function doForgotPassword(email) {
  const res = await apiFetch(API.forgotPassword, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

async function doResetPassword(token, newPassword) {
  const res = await apiFetch(API.resetPassword, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
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

// =========================
// API actions (Apps)
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
  setAuthView("login");
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

// Toggle / Back button
toggleAuthMode?.addEventListener("click", () => {
  setMsg(authMsg, "");

  if (state.authView === "forgot" || state.authView === "reset" || state.authView === "resend") {
    setAuthView("login");
    return;
  }

  if (state.authMode === "login") {
    setAuthView("register");
  } else {
    setAuthView("login");
  }
});

// Forgot + Resend buttons
document.addEventListener("click", (e) => {
  const id = e.target?.id;

  if (id === "forgotBtn") {
    setAuthView("forgot");
    return;
  }

  if (id === "resendBtn") {
    setAuthView("resend");
    return;
  }
});

// auth submit (all views)
authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(authMsg, "");

  try {
    // RESET
    if (state.authView === "reset") {
      const newPass = (authPassword?.value || "").trim();
      const confirm = ($("#authPasswordConfirm")?.value || "").trim();

      if (!newPass || !confirm) {
        setMsg(authMsg, t("fillAll"));
        return;
      }

      if (newPass !== confirm) {
        setMsg(authMsg, t("passMismatch"));
        return;
      }

      if (!state.resetToken) {
        setMsg(authMsg, "Token mangler");
        return;
      }

      await doResetPassword(state.resetToken, newPass);

      setMsg(authMsg, t("resetOk"), true);

      // rydde token i url + gå tilbake til login
      clearResetTokenFromUrl();
      state.resetToken = null;

      setTimeout(() => {
        setAuthView("login");
        // du kan velge closeModal() hvis du vil lukke automatisk:
        // closeModal();
      }, 900);

      return;
    }

    // FORGOT
    if (state.authView === "forgot") {
      const email = (authEmail?.value || "").trim().toLowerCase();
      if (!email) {
        setMsg(authMsg, t("fillEmail"));
        return;
      }

      await doForgotPassword(email);
      setMsg(authMsg, t("forgotOk"), true);

      setTimeout(() => setAuthView("login"), 900);
      return;
    }

    // RESEND
    if (state.authView === "resend") {
      const email = (authEmail?.value || "").trim().toLowerCase();
      if (!email) {
        setMsg(authMsg, t("fillEmail"));
        return;
      }

      await doResendVerification(email);
      setMsg(authMsg, t("resendOk"), true);

      setTimeout(() => setAuthView("login"), 900);
      return;
    }

    // LOGIN / REGISTER
    const email = (authEmail?.value || "").trim().toLowerCase();
    const password = (authPassword?.value || "").trim();

    if (!email || !password) {
      setMsg(authMsg, state.lang === "no" ? "Fyll inn e-post og passord" : "Enter email and password");
      return;
    }

    if (state.authView === "register") {
      await doRegister(email, password);
      setMsg(authMsg, t("regOk"), true);

      // switch til login automatisk
      setTimeout(() => setAuthView("login"), 900);
      return;
    }

    // login
    await doLogin(email, password);
    closeModal();
  } catch (err) {
    setMsg(authMsg, err?.message || "Noe gikk galt");
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
    setAuthView("login");
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

  // oppdater placeholders/labels i modal også
  setAuthView(state.authView);
  applyI18n();
  renderList();
});

// =========================
// Init
// =========================
(function initAutoResetFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    // hvis URL har ?token=... → åpne reset view automatisk
    state.resetToken = token;
    setAuthView("reset", { token });
    openModal();
  } else {
    setAuthView("login");
  }
})();

(async function init() {
  applyI18n();
  updateAuthUI();
  await loadMe();
  await loadApps();
})();

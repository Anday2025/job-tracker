/* =========================
   Jobbsøker-tracker (B1: HttpOnly SESSION cookie on HTTPS Render)
   Backend routes (matches your controller):
   - GET    /api/apps
   - POST   /api/apps
   - PUT    /api/apps/{id}/status
   - DELETE /api/apps/{id}
   Auth routes:
   - POST /api/auth/register
   - POST /api/auth/login   (sets HttpOnly cookie SESSION)
   - GET  /api/auth/me
   - POST /api/auth/logout  (clears cookie)
   ========================= */

const API = ""; // same origin on Render

const $ = (id) => document.getElementById(id);

function setMsg(el, text, ok = false) {
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("ok", !!ok);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    method: options.method || "GET",
    credentials: "include", // 👈 REQUIRED for HttpOnly cookie
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const msg =
      (typeof data === "string" && data) ||
      (data && (data.message || data.error)) ||
      `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ---------- modal ---------- */
function openModal() {
  $("authModal").classList.remove("hidden");
  document.body.classList.add("modalOpen");
  $("authEmail")?.focus();
}
function closeModal() {
  $("authModal").classList.add("hidden");
  document.body.classList.remove("modalOpen");
}

/* ---------- i18n ---------- */
const dict = {
  NO: {
    title: "Jobbsøker-tracker",
    subtitle: "Hold oversikt over søknadene dine.",
    login: "Logg inn",
    logout: "Logg ut",
    register: "Opprett bruker",
    email: "E-post",
    password: "Passord",
    newApp: "Ny søknad",
    company: "Firma *",
    role: "Stilling *",
    link: "Link",
    deadline: "Frist",
    add: "Legg til",
    apps: "Søknader",
    all: "Alle",
    planned: "Planlagt",
    applied: "Søkt",
    interview: "Intervju",
    rejected: "Avslått",
    offer: "Tilbud",
    emptyLogin: "Ingen treff. Logg inn for å se dine søknader.",
    loginHint: "Logg inn for å lagre og se dine søknader.",
    built: "Bygget med Java (Spring Boot) + vanilla JS + JWT.",
    added: "Lagt til.",
    mustLogin: "Du må logge inn først.",
  },
  EN: {
    title: "Job tracker",
    subtitle: "Keep track of your applications.",
    login: "Sign in",
    logout: "Sign out",
    register: "Create account",
    email: "Email",
    password: "Password",
    newApp: "New application",
    company: "Company *",
    role: "Role *",
    link: "Link",
    deadline: "Deadline",
    add: "Add",
    apps: "Applications",
    all: "All",
    planned: "Planned",
    applied: "Applied",
    interview: "Interview",
    rejected: "Rejected",
    offer: "Offer",
    emptyLogin: "No results. Sign in to see your applications.",
    loginHint: "Sign in to save and see your applications.",
    built: "Built with Java (Spring Boot) + vanilla JS + JWT.",
    added: "Added.",
    mustLogin: "You must sign in first.",
  },
};

let LANG = localStorage.getItem("lang") || "NO";
let authMode = "login"; // login | register
let currentEmail = null;
let apps = [];
let activeFilter = "ALL";

function t(key) {
  return (dict[LANG] && dict[LANG][key]) || key;
}

function applyLang() {
  document.documentElement.lang = LANG === "NO" ? "no" : "en";

  $("t_title").textContent = t("title");
  $("t_subtitle").textContent = t("subtitle");

  $("loginBtn").textContent = t("login");
  $("logoutBtn").textContent = t("logout");
  $("langBtn").textContent = LANG === "NO" ? "EN" : "NO";

  $("t_newAppTitle").textContent = t("newApp");
  $("t_companyLabel").textContent = t("company");
  $("t_roleLabel").textContent = t("role");
  $("t_linkLabel").textContent = t("link");
  $("t_deadlineLabel").textContent = t("deadline");
  $("t_addBtn").textContent = t("add");
  $("t_loginHint").textContent = t("loginHint");

  $("t_appsTitle").textContent = t("apps");
  $("t_f_all").textContent = t("all");
  $("t_f_planned").textContent = t("planned");
  $("t_f_applied").textContent = t("applied");
  $("t_f_interview").textContent = t("interview");
  $("t_f_rejected").textContent = t("rejected");
  $("t_f_offer").textContent = t("offer");

  $("t_footer").textContent = t("built");

  $("authTitle").textContent = authMode === "login" ? t("login") : t("register");
  $("authEmail").placeholder = t("email");
  $("authPassword").placeholder = t("password");
  $("authSubmitBtn").textContent = authMode === "login" ? t("login") : t("register");
  $("toggleAuthMode").textContent = authMode === "login" ? t("register") : t("login");

  // refresh list empty text
  renderList();
  renderStats();
}

/* ---------- auth state ---------- */
function setLoggedIn(email) {
  currentEmail = email;

  $("whoami").textContent = email || "—";
  $("whoami").classList.toggle("hidden", !email);

  $("logoutBtn").classList.toggle("hidden", !email);
  $("loginBtn").classList.toggle("hidden", !!email);

  $("t_loginHint").classList.toggle("hidden", !!email);

  if (!email) {
    apps = [];
  }
  renderList();
  renderStats();
}

async function refreshMe() {
  try {
    const me = await apiFetch("/api/auth/me");
    setLoggedIn(me.email);
    await loadApps();
  } catch {
    setLoggedIn(null);
  }
}

/* ---------- apps ---------- */
function normalizeStatus(s) {
  return (s || "PLANLAGT").toUpperCase();
}

function statusLabel(s) {
  const st = normalizeStatus(s);
  if (LANG === "EN") {
    return { PLANLAGT: "Planned", SOKT: "Applied", INTERVJU: "Interview", AVSLATT: "Rejected", TILBUD: "Offer" }[st] || st;
  }
  return { PLANLAGT: "Planlagt", SOKT: "Søkt", INTERVJU: "Intervju", AVSLATT: "Avslått", TILBUD: "Tilbud" }[st] || st;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function filteredApps() {
  if (activeFilter === "ALL") return apps;
  return apps.filter((a) => normalizeStatus(a.status) === activeFilter);
}

function renderStats() {
  const counts = { PLANLAGT: 0, SOKT: 0, INTERVJU: 0, TILBUD: 0, AVSLATT: 0 };
  for (const a of apps) {
    const st = normalizeStatus(a.status);
    if (counts[st] !== undefined) counts[st]++;
  }
  $("stats").textContent =
    LANG === "NO"
      ? `Planlagt: ${counts.PLANLAGT} • Søkt: ${counts.SOKT} • Intervju: ${counts.INTERVJU} • Tilbud: ${counts.TILBUD} • Avslått: ${counts.AVSLATT}`
      : `Planned: ${counts.PLANLAGT} • Applied: ${counts.SOKT} • Interview: ${counts.INTERVJU} • Offer: ${counts.TILBUD} • Rejected: ${counts.AVSLATT}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function itemHtml(a) {
  const link = a.link ? `<a href="${a.link}" target="_blank" rel="noopener">Link</a>` : "";
  return `
    <div class="item" data-id="${a.id}">
      <div class="top">
        <div>
          <div class="title">${escapeHtml(a.company)} — ${escapeHtml(a.role)}</div>
          <div class="meta">
            <span>${LANG === "NO" ? "Frist" : "Deadline"}: <span class="badge">${fmtDate(a.deadline)}</span></span>
            <span>${LANG === "NO" ? "Status" : "Status"}: <span class="badge">${statusLabel(a.status)}</span></span>
            ${link ? `<span>${link}</span>` : ""}
          </div>
        </div>
        <div class="actions">
          <select class="statusSelect">
            ${["PLANLAGT", "SOKT", "INTERVJU", "AVSLATT", "TILBUD"]
              .map(
                (st) => `<option value="${st}" ${normalizeStatus(a.status) === st ? "selected" : ""}>${statusLabel(st)}</option>`
              )
              .join("")}
          </select>
          <button class="btn ghost deleteBtn" type="button">${LANG === "NO" ? "Slett" : "Delete"}</button>
        </div>
      </div>
    </div>
  `;
}

function renderList() {
  const list = $("list");
  if (!list) return;

  if (!currentEmail) {
    list.innerHTML = `<div class="muted">${t("emptyLogin")}</div>`;
    return;
  }

  const data = filteredApps();
  if (!data.length) {
    list.innerHTML = `<div class="muted">${LANG === "NO" ? "Ingen treff." : "No results."}</div>`;
    return;
  }

  list.innerHTML = data.map(itemHtml).join("");

  list.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.closest(".item")?.dataset?.id;
      if (!id) return;
      try {
        await apiFetch(`/api/apps/${id}`, { method: "DELETE" });
        await loadApps();
      } catch (err) {
        setMsg($("formMsg"), err.message);
      }
    });
  });

  list.querySelectorAll(".statusSelect").forEach((sel) => {
    sel.addEventListener("change", async (e) => {
      const id = e.target.closest(".item")?.dataset?.id;
      const status = e.target.value;
      if (!id) return;
      try {
        await apiFetch(`/api/apps/${id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status }),
        });
        await loadApps();
      } catch (err) {
        setMsg($("formMsg"), err.message);
      }
    });
  });
}

async function loadApps() {
  if (!currentEmail) return;
  apps = await apiFetch("/api/apps");
  renderStats();
  renderList();
}

/* ---------- event wiring ---------- */
$("loginBtn").addEventListener("click", () => {
  authMode = "login";
  applyLang();
  setMsg($("authMsg"), "");
  $("authForm").reset();
  openModal();
});

$("logoutBtn").addEventListener("click", async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    setLoggedIn(null);
  }
});

$("langBtn").addEventListener("click", () => {
  LANG = LANG === "NO" ? "EN" : "NO";
  localStorage.setItem("lang", LANG);
  applyLang();
});

$("closeAuth").addEventListener("click", closeModal);
$("authModal").addEventListener("click", (e) => {
  if (e.target === $("authModal")) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("authModal").classList.contains("hidden")) closeModal();
});

$("toggleAuthMode").addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  applyLang();
  setMsg($("authMsg"), "");
});

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  try {
    if (authMode === "register") {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setMsg($("authMsg"), LANG === "NO" ? "Bruker opprettet. Du kan logge inn." : "Account created. You can sign in.", true);
      authMode = "login";
      applyLang();
      return;
    }

    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    await refreshMe();
    closeModal();
  } catch (err) {
    setMsg($("authMsg"), (LANG === "NO" ? "Innlogging feilet: " : "Login failed: ") + err.message);
  }
});

$("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const msg = $("formMsg");
  setMsg(msg, "");

  if (!currentEmail) {
    setMsg(msg, t("mustLogin"));
    openModal();
    return;
  }

  const fd = new FormData(e.target);
  const payload = {
    company: (fd.get("company") || "").toString().trim(),
    role: (fd.get("role") || "").toString().trim(),
    link: (fd.get("link") || "").toString().trim(),
    deadline: (fd.get("deadline") || "").toString().trim() || null, // backend parser LocalDate
  };

  try {
    await apiFetch("/api/apps", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    e.target.reset();
    setMsg(msg, t("added"), true);
    await loadApps();
  } catch (err) {
    // This is your current issue:
    // If 401 here, cookie was not included => credentials/include or cookie flags
    setMsg(msg, err.message || "Error");
  }
});

document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderList();
  });
});

/* ---------- init ---------- */
applyLang();
renderStats();
renderList();
refreshMe();

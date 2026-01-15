/* =========================
   Jobbsøker-tracker (B1 cookie auth)
   - Auth via HttpOnly SESSION cookie
   - All fetch uses credentials: "include"
   ========================= */

const API = ""; // samme origin (Render). Hvis du senere bruker annen backend: sett f.eks. "https://..."

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);

function setMsg(el, text, ok = false) {
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("ok", !!ok);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    credentials: "include", // 👈 VIKTIG for cookie
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const errText =
      (typeof data === "string" && data) ||
      (data && (data.message || data.error)) ||
      `${res.status} ${res.statusText}`;
    const e = new Error(errText);
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
}

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
    unauthorized: "Unauthorized",
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
    unauthorized: "Unauthorized",
  },
};

let LANG = localStorage.getItem("lang") || "NO";
function t(key) {
  return (dict[LANG] && dict[LANG][key]) || key;
}
function applyLang() {
  document.documentElement.lang = LANG === "NO" ? "no" : "en";

  // header texts
  $("t_title").textContent = t("title");
  $("t_subtitle").textContent = t("subtitle");

  // buttons
  $("loginBtn").textContent = t("login");
  $("logoutBtn").textContent = t("logout");
  $("langBtn").textContent = LANG === "NO" ? "EN" : "NO"; // toggle label

  // left card
  $("t_newAppTitle").textContent = t("newApp");
  $("t_companyLabel").textContent = t("company");
  $("t_roleLabel").textContent = t("role");
  $("t_linkLabel").textContent = t("link");
  $("t_deadlineLabel").textContent = t("deadline");
  $("t_addBtn").textContent = t("add");
  $("t_loginHint").textContent = t("loginHint");

  // placeholders
  $("t_companyPh").placeholder = LANG === "NO" ? "F.eks. NAV / Telenor" : "e.g. NAV / Telenor";
  $("t_rolePh").placeholder = LANG === "NO" ? "F.eks. Junior utvikler" : "e.g. Junior developer";
  $("t_linkPh").placeholder = "https://...";

  // right card
  $("t_appsTitle").textContent = t("apps");
  $("t_f_all").textContent = t("all");
  $("t_f_planned").textContent = t("planned");
  $("t_f_applied").textContent = t("applied");
  $("t_f_interview").textContent = t("interview");
  $("t_f_rejected").textContent = t("rejected");
  $("t_f_offer").textContent = t("offer");
  $("t_emptyLogin").textContent = t("emptyLogin");

  // footer
  $("t_footer").textContent = t("built");

  // modal
  $("authTitle").textContent = authMode === "login" ? t("login") : t("register");
  $("authEmail").placeholder = t("email");
  $("authPassword").placeholder = t("password");
  $("authSubmitBtn").textContent = authMode === "login" ? t("login") : t("register");
  $("toggleAuthMode").textContent = authMode === "login" ? t("register") : t("login");
}

/* ---------- state ---------- */
let currentUserEmail = null;
let apps = [];
let activeFilter = "ALL";
let authMode = "login"; // "login" | "register"

/* ---------- auth UI ---------- */
function setLoggedIn(email) {
  currentUserEmail = email;

  $("whoami").textContent = email || "—";
  $("whoami").classList.toggle("hidden", !email);

  $("logoutBtn").classList.toggle("hidden", !email);
  $("loginBtn").classList.toggle("hidden", !!email);

  // hint i venstre
  $("t_loginHint").classList.toggle("hidden", !!email);

  // i listen (høyre)
  $("t_emptyLogin").textContent = email ? (LANG === "NO" ? "Ingen treff." : "No results.") : t("emptyLogin");
}

async function refreshMe() {
  try {
    const me = await apiFetch("/api/auth/me", { method: "GET" });
    setLoggedIn(me.email);
    await loadApps(); // henter brukerens apps
  } catch (e) {
    // ikke innlogget
    setLoggedIn(null);
    apps = [];
    renderList();
    renderStats();
  }
}

/* ---------- apps ---------- */
function normalizeStatus(s) {
  // backend bruker kanskje PLANLAGT/SOKT/INTERVJU/AVSLATT/TILBUD
  return (s || "PLANLAGT").toUpperCase();
}

function statusLabel(s) {
  const st = normalizeStatus(s);
  if (LANG === "EN") {
    return {
      PLANLAGT: "Planned",
      SOKT: "Applied",
      INTERVJU: "Interview",
      AVSLATT: "Rejected",
      TILBUD: "Offer",
    }[st] || st;
  }
  return {
    PLANLAGT: "Planlagt",
    SOKT: "Søkt",
    INTERVJU: "Intervju",
    AVSLATT: "Avslått",
    TILBUD: "Tilbud",
  }[st] || st;
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    // iso kan være "2026-01-18"
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
  const txt =
    LANG === "NO"
      ? `Planlagt: ${counts.PLANLAGT} • Søkt: ${counts.SOKT} • Intervju: ${counts.INTERVJU} • Tilbud: ${counts.TILBUD} • Avslått: ${counts.AVSLATT}`
      : `Planned: ${counts.PLANLAGT} • Applied: ${counts.SOKT} • Interview: ${counts.INTERVJU} • Offer: ${counts.TILBUD} • Rejected: ${counts.AVSLATT}`;
  $("stats").textContent = txt;
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
            ${["PLANLAGT","SOKT","INTERVJU","AVSLATT","TILBUD"].map(st => `
              <option value="${st}" ${normalizeStatus(a.status)===st ? "selected" : ""}>${statusLabel(st)}</option>
            `).join("")}
          </select>
          <button class="btn ghost deleteBtn" type="button">${LANG === "NO" ? "Slett" : "Delete"}</button>
        </div>
      </div>
    </div>
  `;
}

function renderList() {
  const list = $("list");
  const data = filteredApps();

  if (!currentUserEmail) {
    list.innerHTML = `<div class="muted" id="t_emptyLogin">${t("emptyLogin")}</div>`;
    return;
  }

  if (!data.length) {
    list.innerHTML = `<div class="muted">${LANG === "NO" ? "Ingen treff." : "No results."}</div>`;
    return;
  }

  list.innerHTML = data.map(itemHtml).join("");

  // wire events
  list.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const card = e.target.closest(".item");
      const id = card?.dataset?.id;
      if (!id) return;
      await deleteApp(id);
    });
  });

  list.querySelectorAll(".statusSelect").forEach((sel) => {
    sel.addEventListener("change", async (e) => {
      const card = e.target.closest(".item");
      const id = card?.dataset?.id;
      const status = e.target.value;
      if (!id) return;
      await updateStatus(id, status);
    });
  });
}

async function loadApps() {
  if (!currentUserEmail) return;
  try {
    apps = await apiFetch("/api/apps", { method: "GET" });
    renderStats();
    renderList();
  } catch (e) {
    // hvis cookie ikke sendes -> Unauthorized
    renderStats();
    renderList();
    throw e;
  }
}

async function createApp(payload) {
  const created = await apiFetch("/api/apps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // backend kan returnere created entity eller bare ok
  await loadApps();
  return created;
}

async function updateStatus(id, status) {
  // Tilpass til din backend: enten PUT /api/apps/{id}/status eller PUT /api/apps/{id}
  // Jeg prøver først /status, hvis 404/405 -> fallback
  try {
    await apiFetch(`/api/apps/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    if (e.status === 404 || e.status === 405) {
      await apiFetch(`/api/apps/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    } else {
      throw e;
    }
  }
  await loadApps();
}

async function deleteApp(id) {
  await apiFetch(`/api/apps/${id}`, { method: "DELETE" });
  await loadApps();
}

/* ---------- escape ---------- */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- events ---------- */
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
    apps = [];
    renderList();
    renderStats();
  }
});

$("langBtn").addEventListener("click", () => {
  LANG = LANG === "NO" ? "EN" : "NO";
  localStorage.setItem("lang", LANG);
  applyLang();
  renderStats();
  renderList();
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

    // login
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // VIKTIG: etter login, kjør /me (cookie må være satt)
    await refreshMe();
    setMsg($("authMsg"), "", true);
    closeModal();
  } catch (err) {
    setMsg($("authMsg"), (LANG === "NO" ? "Innlogging feilet: " : "Login failed: ") + err.message);
  }
});

$("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("formMsg");
  setMsg(msg, "");

  if (!currentUserEmail) {
    setMsg(msg, LANG === "NO" ? "Du må logge inn først." : "You must sign in first.");
    openModal();
    return;
  }

  const fd = new FormData(e.target);
  const payload = {
    company: (fd.get("company") || "").toString().trim(),
    role: (fd.get("role") || "").toString().trim(),
    link: (fd.get("link") || "").toString().trim(),
    deadline: (fd.get("deadline") || "").toString().trim() || null,
  };

  try {
    await createApp(payload);
    e.target.reset();
    setMsg(msg, LANG === "NO" ? "Lagt til." : "Added.", true);
  } catch (err) {
    // Hvis du fortsatt får Unauthorized her: cookie sendes ikke => credentials / SameSite / Secure / origin
    if (err.status === 401) {
      setMsg(msg, (LANG === "NO" ? "Unauthorized – cookies ble ikke sendt. " : "Unauthorized – cookies not sent. ") + err.message);
    } else {
      setMsg(msg, err.message);
    }
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

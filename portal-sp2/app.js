const CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwdYPJRIQytV1mZ7IxkHgWrxm3DrZQXODdBmkBYaYASKlVReYijAMpgOYhZ4pHt9JTYPA/exec",
  APP_VERSION: "1.0.16",
  DEMO_STORAGE_KEY: "portal-sp2-items-v1",
  DEMO_HISTORY_KEY: "portal-sp2-history-v1",
  CLOUD_CACHE_KEY: "portal-sp2-cloud-cache-v1",
  ADMIN_SESSION_KEY: "portal-sp2-admin-session",
  LAST_ACTOR_KEY: "portal-sp2-last-actor",
};

const PRIORITIES = ["Não aplicável", "Alta", "Média", "Baixa"];
const PRIORITY_RANK = {
  Alta: 1,
  Média: 2,
  Baixa: 3,
  "Não aplicável": 4,
};

const TAGS = [
  { name: "Eventos MKT", color: "purple" },
  { name: "Congresso", color: "purple" },
  { name: "Eventos FV", color: "yellow" },
  { name: "Reunião", color: "blue" },
  { name: "Treinamento", color: "blue" },
  { name: "Dual Day", color: "blue" },
  { name: "Ação Flexível", color: "orange" },
  { name: "Prazo Final", color: "red" },
  { name: "Aniversário", color: "green" },
  { name: "Lembrete", color: "black" },
];

const TAG_EMOJIS = {
  "Prazo Final": "🔴",
  "Eventos FV": "🟡",
  "Eventos MKT": "🟣",
  Reunião: "🔵",
  Lembrete: "⚫️",
  "Ação Flexível": "🟠",
  Aniversário: "🟢",
  "Dual Day": "🔵",
  Congresso: "🟣",
  Treinamento: "🔵",
};

const TAG_RULES = {
  "Prazo Final": { type: "Task/Prazo", dateRequired: true, timeRequired: false, defaultTimeWhenDateOnly: true },
  "Eventos FV": { type: "Evento/Compromisso", dateRequired: true, timeRequired: true, defaultTimeWhenDateOnly: false },
  "Eventos MKT": { type: "Evento/Compromisso", dateRequired: true, timeRequired: true, defaultTimeWhenDateOnly: false },
  Reunião: { type: "Evento/Compromisso", dateRequired: true, timeRequired: true, defaultTimeWhenDateOnly: false },
  Lembrete: { type: "Lembrete", dateRequired: false, timeRequired: false, defaultTimeWhenDateOnly: true },
  "Ação Flexível": { type: "Ação Flexível", dateRequired: false, timeRequired: false, defaultTimeWhenDateOnly: true },
  Aniversário: { type: "Aniversário", dateRequired: true, timeRequired: false, defaultTimeWhenDateOnly: false },
  "Dual Day": { type: "Evento/Compromisso", dateRequired: true, timeRequired: true, defaultTimeWhenDateOnly: false },
  Congresso: { type: "Evento/Compromisso", dateRequired: true, timeRequired: true, defaultTimeWhenDateOnly: false },
  Treinamento: { type: "Evento/Compromisso", dateRequired: true, timeRequired: true, defaultTimeWhenDateOnly: false },
};

const PEOPLE = [
  "Ana",
  "Carol",
  "Dani",
  "Edison",
  "João",
  "Nicole",
  "Raquel",
  "Roberta",
  "Rodrigo",
  "Samantha",
  "Vinicius",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAYS_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const DEFAULT_RECURRENCE = {
  enabled: false,
  frequency: "weekly",
  interval: 1,
  weekdays: [],
  endMode: "never",
  until: "",
  count: "",
};

const els = {};

const state = {
  view: "today",
  previousView: "today",
  items: [],
  history: [],
  loading: false,
  currentDate: toISODate(new Date()),
  expanded: new Set(),
  pendingExpanded: false,
  collapsedSections: new Set(["next-seven"]),
  filters: {
    tag: "all",
    priority: "all",
    responsible: "all",
    sort: "datetime",
  },
  editingOccurrence: null,
  detailOccurrence: null,
  lastSync: null,
  adminToken: "",
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  populateStaticControls();
  bindEvents();
  hydrateAdminSession();
  updateResponsibleControls();
  updateDateTimeControls();
  hydrateCachedItems();
  render();
  loadItems({ showLoading: state.items.length === 0, renderAfter: true });
}

function cacheElements() {
  Object.assign(els, {
    viewRoot: document.getElementById("viewRoot"),
    viewTitle: document.getElementById("viewTitle"),
    currentScopeLabel: document.getElementById("currentScopeLabel"),
    syncLabel: document.getElementById("syncLabel"),
    toastHost: document.getElementById("toastHost"),
    scopeDateInput: document.getElementById("scopeDateInput"),
    tagFilter: document.getElementById("tagFilter"),
    priorityFilter: document.getElementById("priorityFilter"),
    responsibleFilter: document.getElementById("responsibleFilter"),
    sortFilter: document.getElementById("sortFilter"),
    prevPeriodButton: document.getElementById("prevPeriodButton"),
    nextPeriodButton: document.getElementById("nextPeriodButton"),
    todayButton: document.getElementById("todayButton"),
    newItemButton: document.getElementById("newItemButton"),
    mobileFab: document.getElementById("mobileFab"),
    refreshButton: document.getElementById("refreshButton"),
    mobileNavDrawer: document.getElementById("mobileNavDrawer"),
    adminBanner: document.getElementById("adminBanner"),
    adminExitButton: document.getElementById("adminExitButton"),
    adminExitButtonTop: document.getElementById("adminExitButtonTop"),
    itemModal: document.getElementById("itemModal"),
    detailModal: document.getElementById("detailModal"),
    detailModalTitle: document.getElementById("detailModalTitle"),
    detailContent: document.getElementById("detailContent"),
    itemForm: document.getElementById("itemForm"),
    itemModalTitle: document.getElementById("itemModalTitle"),
    formError: document.getElementById("formError"),
    itemTitle: document.getElementById("itemTitle"),
    itemDate: document.getElementById("itemDate"),
    itemStartTime: document.getElementById("itemStartTime"),
    itemEndTime: document.getElementById("itemEndTime"),
    itemDuration: document.getElementById("itemDuration"),
    itemTag: document.getElementById("itemTag"),
    itemPriority: document.getElementById("itemPriority"),
    itemCreatedBy: document.getElementById("itemCreatedBy"),
    responsibleName: document.getElementById("responsibleName"),
    itemLocation: document.getElementById("itemLocation"),
    itemLink: document.getElementById("itemLink"),
    itemDescription: document.getElementById("itemDescription"),
    recurrenceEnabled: document.getElementById("recurrenceEnabled"),
    recurrenceFields: document.getElementById("recurrenceFields"),
    recurrenceFrequency: document.getElementById("recurrenceFrequency"),
    recurrenceInterval: document.getElementById("recurrenceInterval"),
    weekdayPicker: document.getElementById("weekdayPicker"),
    recurrenceUntil: document.getElementById("recurrenceUntil"),
    recurrenceCount: document.getElementById("recurrenceCount"),
    adminModal: document.getElementById("adminModal"),
    adminForm: document.getElementById("adminForm"),
    adminPassword: document.getElementById("adminPassword"),
    adminError: document.getElementById("adminError"),
    confirmModal: document.getElementById("confirmModal"),
    confirmForm: document.getElementById("confirmForm"),
    confirmEyebrow: document.getElementById("confirmEyebrow"),
    confirmTitle: document.getElementById("confirmTitle"),
    confirmMessage: document.getElementById("confirmMessage"),
    confirmNote: document.getElementById("confirmNote"),
    confirmActionButton: document.getElementById("confirmActionButton"),
    scopeModal: document.getElementById("scopeModal"),
    scopeForm: document.getElementById("scopeForm"),
    scopeTitle: document.getElementById("scopeTitle"),
  });
}

function populateStaticControls() {
  els.scopeDateInput.value = state.currentDate;
  fillSelect(els.itemPriority, PRIORITIES.map((value) => ({ value, label: value })));
  fillSelect(
    els.priorityFilter,
    [{ value: "all", label: "Todas" }].concat(PRIORITIES.map((value) => ({ value, label: value }))),
  );
  fillSelect(
    els.responsibleFilter,
    [{ value: "all", label: "Todos" }, { value: "everyone", label: "Responsável: Todos" }].concat(
      PEOPLE.map((value) => ({ value, label: value })),
    ),
  );
  fillTagSelect(els.itemTag, false);
  fillTagSelect(els.tagFilter, true);
  fillSelect(els.responsibleName, PEOPLE.map((value) => ({ value, label: value })));
}

function fillTagSelect(select, includeAll) {
  const options = includeAll ? [{ value: "all", label: "Todas" }] : [{ value: "", label: "Selecione a tag" }];
  fillSelect(
    select,
    options.concat(TAGS.map((tag) => ({ value: tag.name, label: `${getTagEmoji(tag.name)} ${tag.name}` }))),
  );
}

function fillSelect(select, options) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeAttr(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
}

function bindEvents() {
  document.querySelectorAll(".nav-item, .mobile-nav-brand").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  els.newItemButton.addEventListener("click", () => openItemModal());
  els.mobileFab.addEventListener("click", () => openItemModal());
  els.refreshButton.addEventListener("click", refreshAll);

  els.prevPeriodButton.addEventListener("click", () => shiftPeriod(-1));
  els.nextPeriodButton.addEventListener("click", () => shiftPeriod(1));
  els.todayButton.addEventListener("click", () => {
    state.currentDate = toISODate(new Date());
    els.scopeDateInput.value = state.currentDate;
    render();
  });

  els.scopeDateInput.addEventListener("change", () => {
    state.currentDate = els.scopeDateInput.value || toISODate(new Date());
    render();
  });

  els.tagFilter.addEventListener("change", () => {
    state.filters.tag = els.tagFilter.value;
    render();
  });
  els.priorityFilter.addEventListener("change", () => {
    state.filters.priority = els.priorityFilter.value;
    render();
  });
  els.responsibleFilter.addEventListener("change", () => {
    state.filters.responsible = els.responsibleFilter.value;
    render();
  });
  els.sortFilter.addEventListener("change", () => {
    state.filters.sort = els.sortFilter.value;
    render();
  });

  els.viewRoot.addEventListener("click", handleViewClick);
  els.detailModal.addEventListener("click", handleDetailModalClick);
  els.itemForm.addEventListener("submit", handleItemSubmit);
  els.adminForm.addEventListener("submit", handleAdminSubmit);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeNearestDialog(button));
  });

  document.querySelectorAll('input[name="responsibilityMode"]').forEach((input) => {
    input.addEventListener("change", updateResponsibleControls);
  });

  els.itemTag.addEventListener("change", updateDateTimeControls);
  els.recurrenceEnabled.addEventListener("change", updateRecurrenceControls);
  els.recurrenceFrequency.addEventListener("change", updateRecurrenceControls);
  document.querySelectorAll('input[name="recurrenceEndMode"]').forEach((input) => {
    input.addEventListener("change", updateRecurrenceControls);
  });

  [els.adminExitButton, els.adminExitButtonTop].forEach((button) => {
    button.addEventListener("click", exitAdminMode);
  });
}

async function setView(view) {
  if (view === "history") {
    const ok = await ensureAdmin();
    if (!ok) return;
    state.previousView = state.view;
    state.view = view;
    await loadHistory();
  } else {
    state.previousView = state.view;
    state.view = view;
  }

  render();
}

async function refreshAll() {
  await loadItems();
  if (state.view === "history" && state.adminToken) {
    await loadHistory();
  }
  render();
  toast("Dados atualizados.", "success");
}

function hydrateAdminSession() {
  try {
    const raw = sessionStorage.getItem(CONFIG.ADMIN_SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    if (session && session.token && session.expiresAt && new Date(session.expiresAt) > new Date()) {
      state.adminToken = session.token;
    }
  } catch {
    state.adminToken = "";
  }
}

function saveAdminSession(token, expiresAt) {
  state.adminToken = token;
  sessionStorage.setItem(
    CONFIG.ADMIN_SESSION_KEY,
    JSON.stringify({ token, expiresAt: expiresAt || addHours(new Date(), 6).toISOString() }),
  );
  renderAdminState();
}

function exitAdminMode() {
  state.adminToken = "";
  sessionStorage.removeItem(CONFIG.ADMIN_SESSION_KEY);
  if (state.view === "history") state.view = "today";
  render();
  toast("Modo administrador encerrado.", "success");
}

async function loadItems(options = {}) {
  const showLoading = options.showLoading === true;
  if (showLoading) {
    state.loading = true;
    renderLoading();
  }
  try {
    const result = await apiRequest("listItems", {});
    if (!result.ok) throw new Error(result.error || "Falha ao listar itens.");
    state.items = (result.items || []).map(normalizeItem);
    state.lastSync = result.serverNow || new Date().toISOString();
    cacheCloudItems();
  } catch (error) {
    toast("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.", "error");
    console.error(error);
  } finally {
    state.loading = false;
    if (options.renderAfter) render();
  }
}

function hydrateCachedItems() {
  if (!CONFIG.WEB_APP_URL) return;
  try {
    const cached = JSON.parse(localStorage.getItem(CONFIG.CLOUD_CACHE_KEY) || "{}");
    if (!Array.isArray(cached.items)) return;
    state.items = cached.items.map(normalizeItem);
    state.lastSync = cached.lastSync || "";
  } catch (error) {
    localStorage.removeItem(CONFIG.CLOUD_CACHE_KEY);
  }
}

function cacheCloudItems() {
  if (!CONFIG.WEB_APP_URL) return;
  try {
    localStorage.setItem(
      CONFIG.CLOUD_CACHE_KEY,
      JSON.stringify({
        items: state.items,
        lastSync: state.lastSync,
        cachedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.warn("Não foi possível salvar cache local.", error);
  }
}

async function loadHistory() {
  try {
    const result = await apiRequest("getHistory", { adminToken: state.adminToken });
    if (!result.ok) throw new Error(result.error || "Falha ao consultar histórico.");
    state.history = result.history || [];
  } catch (error) {
    toast("Não foi possível carregar o histórico.", "error");
    console.error(error);
  }
}

function renderLoading() {
  if (!els.viewRoot || !state.loading) return;
  els.viewRoot.innerHTML = '<div class="loading-bar" aria-label="Carregando"></div>';
}

function render() {
  if (state.loading) {
    renderLoading();
    return;
  }

  renderTopState();
  renderAdminState();

  const renderers = {
    today: renderTodayView,
    month: renderMonthView,
    week: renderWeekView,
    day: renderDayView,
    agenda: renderAgendaView,
    history: renderHistoryView,
  };

  els.viewRoot.innerHTML = renderers[state.view]();
  refreshIcons();
}

function renderTopState() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });

  els.scopeDateInput.value = state.currentDate;
  const labels = {
    today: ["Hoje", "Painel principal"],
    month: ["Mês", formatMonthYear(state.currentDate)],
    week: ["Semana", formatWeekRange(getWeekRange(state.currentDate))],
    day: ["Dia", formatLongDate(state.currentDate)],
    agenda: ["Programação", "Lista agrupada por dia"],
    history: ["Acesso Editor", "Acesso administrativo"],
  };
  els.viewTitle.textContent = labels[state.view][0];
  els.currentScopeLabel.textContent = labels[state.view][1];
  els.syncLabel.textContent = CONFIG.WEB_APP_URL
    ? `Nuvem ${state.lastSync ? "sincronizada" : "pendente"}`
    : "Modo demonstração/local";
}

function renderAdminState() {
  const active = Boolean(state.adminToken);
  els.adminBanner.hidden = !active;
  els.adminExitButton.hidden = !active;
  refreshIcons();
}

function renderTodayView() {
  const today = toISODate(new Date());
  const todayItems = applyFiltersAndSort(buildOccurrences(today, today));
  const nextItems = applyFiltersAndSort(buildOccurrences(addDaysISO(today, 1), addDaysISO(today, 7)));
  const previous = getPreviousOccurrences();

  return `
    <section class="section" aria-label="Resumo de hoje">
      <div class="quick-metrics">
        ${metricCard(todayItems.length, "Itens de hoje")}
        ${metricCard(nextItems.length, "Próximos 7 dias")}
        ${metricCard(previous.length, getPreviousSectionLabel())}
      </div>
    </section>
    ${renderPreviousSection(previous)}
    ${renderCollapsibleSection("today-items", "Hoje", "", todayItems, {
      bodyClass: "agenda-list nested-day-list",
      contentHtml: renderGroupedDayList(todayItems, today, today, { onlyWithItems: true }),
    })}
    ${renderCollapsibleSection("next-seven", "Próximos 7 dias", "", nextItems, {
      bodyClass: "agenda-list nested-day-list",
      contentHtml: renderGroupedDayList(nextItems, addDaysISO(today, 1), addDaysISO(today, 7), { onlyWithItems: true }),
    })}
  `;
}

function renderMonthView() {
  const range = getMonthGridRange(state.currentDate);
  const monthStart = startOfMonthISO(state.currentDate);
  const monthEnd = endOfMonthISO(state.currentDate);
  const occurrences = applyFiltersAndSort(buildOccurrences(range.start, range.end));
  const monthOccurrences = applyFiltersAndSort(buildOccurrences(monthStart, monthEnd));
  const byDate = groupByDate(occurrences);
  const previous = getPreviousOccurrences();
  const cells = [];

  for (let cursor = parseISODate(range.start); cursor <= parseISODate(range.end); cursor = addDays(cursor, 1)) {
    const iso = toISODate(cursor);
    const items = byDate.get(iso) || [];
    const outside = iso.slice(0, 7) !== state.currentDate.slice(0, 7);
    cells.push(`
      <div class="month-day ${outside ? "is-outside" : ""} ${iso === toISODate(new Date()) ? "is-today" : ""}">
        <div class="day-number">
          <span>${cursor.getDate()}</span>
          ${items.length ? `<span class="badge">${items.length}</span>` : ""}
        </div>
        <div class="month-chip-list">
          ${items
            .slice(0, 4)
            .map((item) => monthChip(item))
            .join("")}
          ${items.length > 4 ? `<button class="month-chip" type="button" data-jump-day="${iso}">+${items.length - 4} itens</button>` : ""}
        </div>
      </div>
    `);
  }

  return `
    ${renderPreviousSection(previous)}
    <section class="section" aria-label="Calendário mensal">
      ${renderSectionTitle("Mês", formatMonthYear(state.currentDate))}
      <div class="month-grid">
        ${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => `<div class="weekday-cell">${day}</div>`).join("")}
        ${cells.join("")}
      </div>
      <div class="month-mobile-list">
        ${renderGroupedDayList(monthOccurrences, monthStart, monthEnd)}
      </div>
    </section>
  `;
}

function renderWeekView() {
  const range = getWeekRange(state.currentDate);
  const occurrences = applyFiltersAndSort(buildOccurrences(range.start, range.end));
  const previous = getPreviousOccurrences();

  return `
    ${renderPreviousSection(previous)}
    <section class="section" aria-label="Semana">
      ${renderSectionTitle("Semana", formatWeekRange(range))}
      <div class="agenda-list week-agenda-list">
        ${renderGroupedDayList(occurrences, range.start, range.end, { showEmptyDays: true })}
      </div>
    </section>
  `;
}

function renderDayView() {
  const occurrences = applyFiltersAndSort(buildOccurrences(state.currentDate, state.currentDate));
  const previous = getPreviousOccurrences();
  return `
    ${renderPreviousSection(previous)}
    ${renderSection("Dia", formatLongDate(state.currentDate), occurrences)}
  `;
}

function renderAgendaView() {
  const today = toISODate(new Date());
  const start = state.currentDate > today ? state.currentDate : today;
  const end = addDaysISO(start, 90);
  const occurrences = applyFiltersAndSort(buildOccurrences(start, end));
  const previous = getPreviousOccurrences();

  return `
    ${renderPreviousSection(previous)}
    <section class="section" aria-label="Programação">
      ${renderSectionTitle("Programação", "Agrupada por dia", `<button class="secondary-button" type="button" data-action="export-agenda"><i data-lucide="file-down"></i>Exportar</button>`)}
      <div class="agenda-list">
        ${renderGroupedDayList(occurrences, start, end, { onlyWithItems: true })}
      </div>
    </section>
  `;
}

function renderHistoryView() {
  if (!state.adminToken) {
    return `<p class="empty-state">Área restrita ao administrador.</p>`;
  }

  return `
    <section class="section" aria-label="Histórico imutável">
      ${renderSectionTitle("Histórico", `${state.history.length} ação(ões) registrada(s)`)}
      <div class="history-list">
        ${state.history.length ? state.history.map(renderHistoryItem).join("") : `<p class="empty-state">Sem histórico registrado.</p>`}
      </div>
    </section>
  `;
}

function renderPreviousSection(items) {
  const open = state.pendingExpanded;
  const label = getPreviousSectionLabel();
  return `
    <section class="section pending-section" aria-label="${escapeAttr(label)}">
      <button class="pending-summary" type="button" data-action="toggle-pending" aria-expanded="${open}">
        <span><i data-lucide="${open ? "chevron-down" : "chevron-right"}"></i><span class="section-heading-line"><strong>${escapeHtml(label)}</strong> <span class="section-count">${items.length}</span></span></span>
      </button>
      ${
        open
          ? items.length
            ? `<div class="item-list pending-list">${items.map((item) => renderItemCard(item, { showDateInMeta: true })).join("")}</div>`
            : `<p class="empty-state compact-empty">Sem eventos anteriores nesta janela.</p>`
          : ""
      }
    </section>
  `;
}

function renderCollapsibleSection(sectionId, title, subtitle, items, options = {}) {
  const open = !state.collapsedSections.has(sectionId);
  const bodyClass = options.bodyClass || "item-list";
  const content = options.contentHtml || (items.length ? items.map(renderItemCard).join("") : `<p class="empty-state">Sem itens nesta seleção.</p>`);

  return `
    <section class="section section-panel collapsible-section" aria-label="${escapeAttr(title)}">
      <button class="section-summary" type="button" data-action="toggle-section" data-section-id="${escapeAttr(sectionId)}" aria-expanded="${open}">
        <span class="section-summary-title">
          <i data-lucide="${open ? "chevron-down" : "chevron-right"}"></i>
          <span>
            <span class="section-heading-line"><strong>${escapeHtml(title)}</strong><span class="section-count">${items.length}</span></span>
            ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
          </span>
        </span>
      </button>
      ${open ? `<div class="${escapeAttr(bodyClass)}">${content}</div>` : ""}
    </section>
  `;
}

function renderSection(title, subtitle, items) {
  return `
    <section class="section section-panel" aria-label="${escapeAttr(title)}">
      ${renderSectionTitle(title, subtitle)}
      ${items.length ? `<div class="item-list">${items.map(renderItemCard).join("")}</div>` : `<p class="empty-state">Sem itens nesta seleção.</p>`}
    </section>
  `;
}

function renderSectionTitle(title, subtitle, actions = "") {
  return `
    <div class="section-title">
      <div>
        <h2>${escapeHtml(title)}</h2>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
      ${actions ? `<div class="section-actions">${actions}</div>` : ""}
    </div>
  `;
}

function metricCard(value, label) {
  return `
    <div class="metric">
      <strong>${Number(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function renderGroupedDayList(items, start, end, options = {}) {
  const byDate = groupByDate(items);
  const blocks = [];
  for (let cursor = parseISODate(start); cursor <= parseISODate(end); cursor = addDays(cursor, 1)) {
    const iso = toISODate(cursor);
    const dayItems = byDate.get(iso) || [];
    if (options.onlyWithItems && !dayItems.length) continue;
    if (!options.onlyWithItems && !options.showEmptyDays && !dayItems.length) continue;
    blocks.push(`
      <div class="agenda-day">
        <div class="period-heading">
          <h3>${formatDayHeading(iso)} <span class="section-count">${dayItems.length}</span></h3>
        </div>
        ${
          dayItems.length
            ? `<div class="item-list day-item-list">${dayItems.map(renderItemCard).join("")}</div>`
            : `<p class="empty-state compact-empty day-empty">Sem itens.</p>`
        }
      </div>
    `);
  }

  return blocks.length ? blocks.join("") : `<p class="empty-state">Sem itens nesta seleção.</p>`;
}

function renderItemCard(item, options = {}) {
  const tagColor = getTagColor(item.tag);
  const timeText = formatTimeRange(item);
  const responsibility = formatResponsible(item);
  const priority = formatPriorityInline(item.priority);
  const title = getItemDisplayTitle(item);
  const dateText = options.showDateInMeta ? formatDayMonth(item.occurrenceDate || item.date) : "";
  const metaParts = [
    priority ? `<span class="priority-mini">${escapeHtml(priority)}</span>` : "",
    `<span class="responsible-mini">${escapeHtml(responsibility)}</span>`,
    dateText ? `<span class="date-mini">${escapeHtml(dateText)}</span>` : "",
    `<span class="time-mini">${escapeHtml(timeText || "Sem horário")}</span>`,
  ].filter(Boolean);

  return `
    <article class="item-card" data-id="${escapeAttr(item.id)}" data-occurrence-id="${escapeAttr(item.occurrenceId || item.id)}" data-occurrence-date="${escapeAttr(item.occurrenceDate || item.date || "")}" data-tag-color="${tagColor}">
      <div class="item-card-header">
        <button class="card-toggle" type="button" data-action="open-detail" aria-label="Abrir detalhes de ${escapeAttr(item.title || "item")}">
          <div class="item-main-line">
            <div class="item-title-row">
              <h3>${escapeHtml(title)}</h3>
            </div>
            <div class="item-meta item-meta-right">
              ${metaParts.map((part, index) => `${index ? `<span class="meta-separator">|</span>` : ""}${part}`).join("")}
            </div>
          </div>
        </button>
        <div class="card-actions">
          <button class="icon-button" type="button" data-action="edit" aria-label="Editar"><i data-lucide="pencil"></i></button>
          <button class="icon-button" type="button" data-action="delete" aria-label="Excluir"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    </article>
  `;
}

function detailLine(icon, label, value) {
  return `<div class="detail-line"><i data-lucide="${icon}"></i><span><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</span></div>`;
}

function openDetailModal(item) {
  state.detailOccurrence = item;
  els.detailModalTitle.textContent = getItemDisplayTitle(item);
  els.detailContent.innerHTML = renderDetailContent(item);
  showModal(els.detailModal);
}

function renderDetailContent(item) {
  const tagColor = getTagColor(item.tag);
  const title = getItemDisplayTitle(item);
  const timeText = formatTimeRange(item) || "Sem horário";
  const dateText = item.occurrenceDate || item.date ? formatLongDate(item.occurrenceDate || item.date) : "Sem data definida";
  const responsibility = formatResponsible(item);
  const statusBadges = [
    `<span class="badge tag-badge">${escapeHtml(item.tag || "Sem tag")}</span>`,
    item.priority && item.priority !== "Não aplicável" ? `<span class="badge ${priorityClass(item.priority)}">${escapeHtml(item.priority)}</span>` : "",
    item.recurrence?.enabled || item.recurrenceParentId ? `<span class="badge">Recorrente</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `
    <div class="detail-hero" data-tag-color="${tagColor}">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <div class="badge-row">${statusBadges}</div>
      </div>
    </div>
    <div class="detail-grid">
      ${detailLine("calendar", "Data", dateText)}
      ${detailLine("clock", "Horário", timeText)}
      ${detailLine("users", "Responsável", responsibility)}
      ${detailLine("user-plus", "Inserido por", item.createdBy || "Não informado.")}
      ${detailLine("map-pin", "Local", item.location || "Não informado.")}
      ${detailLine("repeat-2", "Recorrência", getRecurrenceText(item))}
      ${detailLine("align-left", "Descrição", item.description || "Sem descrição.")}
      ${detailLine("history", "Histórico resumido", getHistorySummary(item))}
    </div>
    ${
      item.link
        ? `<a class="secondary-button link-button" href="${escapeAttr(item.link)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i>Abrir link</a>`
        : `<div class="detail-line"><i data-lucide="link"></i><span><strong>Link:</strong> Não informado.</span></div>`
    }
    <div class="detail-actions">
      <button class="secondary-button" type="button" data-detail-action="edit"><i data-lucide="pencil"></i>Editar</button>
      <button class="danger-button" type="button" data-detail-action="delete"><i data-lucide="trash-2"></i>Excluir</button>
    </div>
  `;
}

function monthChip(item) {
  const tagColor = getTagColor(item.tag);
  const title = getItemDisplayTitle(item);
  return `<button class="month-chip" type="button" data-open-occurrence="${escapeAttr(item.occurrenceId || item.id)}" data-tag-color="${tagColor}"><span>${escapeHtml(formatTimeRange(item) ? `${formatTimeRange(item)} · ${title}` : title)}</span></button>`;
}

function renderHistoryItem(entry) {
  const action = entry.action || "ação";
  const actor = entry.actor || "Não informado";
  const at = entry.actionAt || entry.createdAt || "";
  const note = entry.note ? `<p><strong>Observação:</strong> ${escapeHtml(entry.note)}</p>` : "";
  const canRestore = ["excluído", "excluido"].includes(String(action).toLowerCase());
  return `
    <article class="history-item" data-history-item-id="${escapeAttr(entry.itemId || "")}">
      <div class="badge-row">
        <span class="badge">${escapeHtml(action)}</span>
        <span class="badge">${escapeHtml(actor)}</span>
        <span class="badge">${escapeHtml(formatDateTime(at))}</span>
      </div>
      <strong>${escapeHtml(entry.title || entry.itemId || "Item")}</strong>
      ${note}
      ${canRestore ? `<button class="secondary-button history-restore-button" type="button" data-action="restore-history" data-id="${escapeAttr(entry.itemId || "")}"><i data-lucide="rotate-ccw"></i>Restaurar</button>` : ""}
      <pre>${escapeHtml(compactHistoryPayload(entry))}</pre>
    </article>
  `;
}

function compactHistoryPayload(entry) {
  const data = {
    original: safeJson(entry.originalData),
    atualizado: safeJson(entry.newData),
  };
  return JSON.stringify(data, null, 2);
}

async function handleViewClick(event) {
  const actionButton = event.target.closest("[data-action]");
  const openOccurrence = event.target.closest("[data-open-occurrence]");
  const jumpDay = event.target.closest("[data-jump-day]");

  if (jumpDay) {
    state.currentDate = jumpDay.dataset.jumpDay;
    state.view = "day";
    render();
    return;
  }

  if (openOccurrence) {
    const occurrence = findOccurrence(openOccurrence.dataset.openOccurrence);
    if (occurrence) {
      openDetailModal(occurrence);
    }
    return;
  }

  if (!actionButton) return;
  const action = actionButton.dataset.action;

  if (action === "toggle-pending") {
    state.pendingExpanded = !state.pendingExpanded;
    render();
    return;
  }

  if (action === "toggle-section") {
    const sectionId = actionButton.dataset.sectionId;
    if (!sectionId) return;
    if (state.collapsedSections.has(sectionId)) state.collapsedSections.delete(sectionId);
    else state.collapsedSections.add(sectionId);
    render();
    return;
  }

  if (action === "export-agenda") {
    exportAgendaPdf();
    return;
  }

  if (action === "restore-history") {
    await restoreHistoryItem(actionButton.dataset.id);
    return;
  }

  const card = actionButton.closest(".item-card");
  const occurrence = card ? findOccurrence(card.dataset.occurrenceId, card.dataset.id, card.dataset.occurrenceDate) : null;
  if (!occurrence) return;

  if (action === "open-detail" || action === "toggle-card") openDetailModal(occurrence);
  if (action === "edit") await editOccurrence(occurrence);
  if (action === "delete") await deleteOccurrence(occurrence);
}

async function handleDetailModalClick(event) {
  const button = event.target.closest("[data-detail-action]");
  if (!button || !state.detailOccurrence) return;

  const occurrence = state.detailOccurrence;
  const action = button.dataset.detailAction;
  closeModal(els.detailModal);

  if (action === "edit") await editOccurrence(occurrence);
  if (action === "delete") await deleteOccurrence(occurrence);
}

function openItemModal(occurrence = null) {
  state.editingOccurrence = occurrence;
  els.itemForm.reset();
  els.formError.hidden = true;
  els.itemModalTitle.textContent = occurrence ? "Editar item" : "Novo item";

  const base = occurrence || {
    date: "",
    tag: "",
    priority: "Não aplicável",
    responsibilityMode: "Todos",
    responsibleName: PEOPLE[0],
    recurrence: DEFAULT_RECURRENCE,
  };

  els.itemTitle.value = base.title || "";
  els.itemDate.value = sanitizeDateValue(base.occurrenceDate || base.date);
  els.itemStartTime.value = sanitizeTimeValue(base.startTime);
  els.itemEndTime.value = sanitizeTimeValue(base.endTime);
  els.itemDuration.value = base.durationMinutes || "";
  els.itemTag.value = base.tag || "";
  els.itemPriority.value = base.priority || "Não aplicável";
  els.itemCreatedBy.value = base.createdBy || localStorage.getItem(CONFIG.LAST_ACTOR_KEY) || "";
  els.itemLocation.value = base.location || "";
  els.itemLink.value = base.link || "";
  els.itemDescription.value = base.description || "";

  const mode = base.responsibilityMode || "Todos";
  document.querySelectorAll('input[name="responsibilityMode"]').forEach((input) => {
    input.checked = input.value === mode;
  });
  els.responsibleName.value = base.responsibleName || PEOPLE[0];

  const recurrence = occurrence && occurrence.recurrenceParentId ? DEFAULT_RECURRENCE : normalizeRecurrence(base.recurrence);
  els.recurrenceEnabled.checked = Boolean(recurrence.enabled);
  els.recurrenceFrequency.value = recurrence.frequency || "weekly";
  els.recurrenceInterval.value = recurrence.interval || 1;
  document.querySelectorAll("#weekdayPicker input").forEach((input) => {
    input.checked = (recurrence.weekdays || []).map(String).includes(input.value);
  });
  document.querySelectorAll('input[name="recurrenceEndMode"]').forEach((input) => {
    input.checked = input.value === (recurrence.endMode || "never");
  });
  els.recurrenceUntil.value = recurrence.until || "";
  els.recurrenceCount.value = recurrence.count || 10;

  updateResponsibleControls();
  updateDateTimeControls();
  updateRecurrenceControls();
  showModal(els.itemModal);
  setTimeout(() => els.itemTitle.focus(), 80);
}

async function editOccurrence(occurrence) {
  const ok = await ensureAdmin();
  if (!ok) return;
  openItemModal(occurrence);
}

async function handleItemSubmit(event) {
  event.preventDefault();
  const payload = collectFormPayload();
  if (!payload.ok) {
    showFormError(payload.error);
    return;
  }

  try {
    const actor = payload.item.createdBy;
    localStorage.setItem(CONFIG.LAST_ACTOR_KEY, actor);
    if (state.editingOccurrence) {
      let scope = "series";
      if (requiresRecurrenceScope(state.editingOccurrence)) {
        scope = await askScope("Editar item recorrente");
        if (!scope) return;
      }
      const result = await mutate("editItem", {
        id: state.editingOccurrence.id,
        occurrenceDate: state.editingOccurrence.occurrenceDate || state.editingOccurrence.date,
        scope,
        item: payload.item,
        actor,
      });
      syncMutatedItem(result);
      toast("Item editado com sucesso. A atualização já está disponível para todos os usuários.", "success");
    } else {
      const result = await mutate("createItem", { item: payload.item, actor });
      syncMutatedItem(result);
      toast("Item adicionado com sucesso. Ele já está disponível para todos os usuários.", "success");
    }
    closeModal(els.itemModal);
    render();
    loadItems({ renderAfter: true });
  } catch (error) {
    console.error(error);
    toast(error.message || "Não foi possível salvar. Verifique sua conexão e tente novamente.", "error");
  }
}

function syncMutatedItem(result) {
  if (!result?.item) return false;
  const item = normalizeItem(result.item);
  const index = state.items.findIndex((current) => current.id === item.id);
  if (index >= 0) state.items[index] = item;
  else state.items.push(item);
  state.lastSync = result.serverNow || new Date().toISOString();
  cacheCloudItems();
  return true;
}

function collectFormPayload() {
  const responsibilityMode = document.querySelector('input[name="responsibilityMode"]:checked')?.value || "Todos";
  const tag = els.itemTag.value;
  const rule = getTagRule(tag);
  let date = els.itemDate.value;
  let startTime = els.itemStartTime.value;

  if (!els.itemTitle.value.trim()) return { ok: false, error: "Informe o título do item." };
  if (!tag) return { ok: false, error: "Selecione a tag/categoria." };
  if (startTime && !date) return { ok: false, error: "Informe a data para usar horário." };
  if (rule.dateRequired && !date) return { ok: false, error: `${tag} precisa de data.` };
  if (rule.timeRequired && !startTime) return { ok: false, error: `${tag} precisa de horário inicial.` };
  if (date && !startTime && rule.defaultTimeWhenDateOnly) startTime = "17:00";
  if (responsibilityMode === "Individual" && !els.responsibleName.value) {
    return { ok: false, error: "Selecione o responsável individual." };
  }
  if (els.recurrenceEnabled.checked && !date) {
    return { ok: false, error: "Itens recorrentes precisam de data inicial." };
  }

  const item = {
    type: rule.type,
    title: els.itemTitle.value.trim(),
    date,
    startTime,
    endTime: els.itemEndTime.value,
    durationMinutes: els.itemDuration.value,
    tag,
    priority: els.itemPriority.value,
    createdBy: els.itemCreatedBy.value.trim(),
    responsibilityMode,
    responsibleName: responsibilityMode === "Individual" ? els.responsibleName.value : "",
    location: els.itemLocation.value.trim(),
    link: els.itemLink.value.trim(),
    description: els.itemDescription.value.trim(),
    recurrence: collectRecurrence(),
  };

  if (!item.createdBy) return { ok: false, error: "Informe o nome da pessoa que está inserindo." };

  return { ok: true, item };
}

function collectRecurrence() {
  if (!els.recurrenceEnabled.checked) return { ...DEFAULT_RECURRENCE };
  const endMode = document.querySelector('input[name="recurrenceEndMode"]:checked')?.value || "never";
  return {
    enabled: true,
    frequency: els.recurrenceFrequency.value,
    interval: Math.max(1, Number(els.recurrenceInterval.value) || 1),
    weekdays: Array.from(document.querySelectorAll("#weekdayPicker input:checked")).map((input) => Number(input.value)),
    endMode,
    until: endMode === "on" ? els.recurrenceUntil.value : "",
    count: endMode === "after" ? Number(els.recurrenceCount.value) || 1 : "",
  };
}

function updateResponsibleControls() {
  const mode = document.querySelector('input[name="responsibilityMode"]:checked')?.value || "Todos";
  const individual = mode === "Individual";
  els.responsibleName.disabled = !individual;
  els.responsibleName.hidden = !individual;
}

function updateDateTimeControls() {
  const hasTag = Boolean(els.itemTag.value);
  [els.itemDate, els.itemStartTime, els.itemEndTime, els.itemDuration].forEach((control) => {
    control.disabled = !hasTag;
  });
  els.recurrenceEnabled.disabled = !hasTag;
  if (!hasTag) {
    els.itemDate.value = "";
    els.itemStartTime.value = "";
    els.itemEndTime.value = "";
    els.itemDuration.value = "";
    els.recurrenceEnabled.checked = false;
  }
  updateRecurrenceControls();
}

function getTagRule(tag) {
  return TAG_RULES[tag] || { type: "Lembrete", dateRequired: false, timeRequired: false, defaultTimeWhenDateOnly: true };
}

function updateRecurrenceControls() {
  const enabled = els.recurrenceEnabled.checked;
  els.recurrenceFields.hidden = !enabled;
  const frequency = els.recurrenceFrequency.value;
  els.weekdayPicker.hidden = frequency !== "weekly";
  const endMode = document.querySelector('input[name="recurrenceEndMode"]:checked')?.value || "never";
  els.recurrenceUntil.disabled = endMode !== "on";
  els.recurrenceCount.disabled = endMode !== "after";
}

async function deleteOccurrence(occurrence) {
  const ok = await ensureAdmin();
  if (!ok) return;

  let scope = "series";
  if (requiresRecurrenceScope(occurrence)) {
    scope = await askScope("Excluir item recorrente");
    if (!scope) return;
  }

  const confirmed = await confirmAction({
    eyebrow: "Excluir item",
    title: "Confirmar exclusão",
    message: "O item será marcado como excluído/inativo e preservado no histórico.",
    actionLabel: "Excluir",
  });
  if (!confirmed.ok) return;

  try {
    await mutate("deleteItem", {
      id: occurrence.id,
      occurrenceDate: occurrence.occurrenceDate || occurrence.date,
      scope,
      actor: confirmed.actor,
      note: confirmed.note,
    });
    toast("Item excluído e preservado no histórico.", "success");
    await loadItems();
    render();
  } catch (error) {
    toast(error.message || "Não foi possível excluir o item.", "error");
  }
}

async function restoreHistoryItem(itemId) {
  if (!itemId) return;
  const ok = await ensureAdmin();
  if (!ok) return;

  const confirmed = await confirmAction({
    eyebrow: "Restaurar item",
    title: "Confirmar restauração",
    message: "O item voltará para a lista ativa. Esta ação será registrada no histórico.",
    actionLabel: "Restaurar",
    defaultActor: "Administrador",
  });
  if (!confirmed.ok) return;

  try {
    await mutate("restoreItem", {
      id: itemId,
      adminToken: state.adminToken,
      actor: confirmed.actor,
      note: confirmed.note,
    });
    toast("Item restaurado com sucesso.", "success");
    await loadItems();
    if (state.view === "history") await loadHistory();
    render();
  } catch (error) {
    toast(error.message || "Não foi possível restaurar o item.", "error");
  }
}

function exportAgendaPdf() {
  const PDFCtor = window.jspdf?.jsPDF;
  if (!PDFCtor) {
    toast("Não foi possível carregar o gerador de PDF. Verifique a conexão e tente novamente.", "error");
    return;
  }

  const today = toISODate(new Date());
  const start = state.currentDate > today ? state.currentDate : today;
  const end = addDaysISO(start, 90);
  const agendaItems = applyFiltersAndSort(buildOccurrences(start, end));
  const previous = getPreviousOccurrences();
  const byDate = groupByDate(agendaItems);
  const doc = new PDFCtor({ unit: "pt", format: "a4" });
  const page = { width: 595.28, height: 841.89, margin: 44 };
  let y = page.margin;

  const ensureSpace = (height = 24) => {
    if (y + height <= page.height - page.margin) return;
    doc.addPage();
    y = page.margin;
  };
  const pdfSafe = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "-");

  const line = (text, size = 10, color = [16, 24, 40], spacing = 15) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const chunks = doc.splitTextToSize(pdfSafe(text), page.width - page.margin * 2);
    chunks.forEach((chunk) => {
      ensureSpace(spacing);
      doc.text(chunk, page.margin, y);
      y += spacing;
    });
  };

  const heading = (text, size = 14) => {
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(16, 24, 40);
    doc.text(pdfSafe(text), page.margin, y);
    y += size + 10;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Portal SP2 - Programacao", page.margin, y);
  y += 24;
  line(`Período: ${formatShortDate(start)} a ${formatShortDate(end)}`, 10, [82, 97, 115]);
  line(`Filtros: Tag ${filterLabel(state.filters.tag)} | Prioridade ${filterLabel(state.filters.priority)} | Responsável ${responsibleFilterLabel(state.filters.responsible)}`, 9, [82, 97, 115], 13);
  y += 10;

  if (previous.length) {
    heading(`${getPreviousSectionLabel()} (${previous.length})`, 12);
    previous.forEach((item) => {
      line(`- ${item.title} | ${item.tag} | ${item.occurrenceDate || item.date ? formatShortDate(item.occurrenceDate || item.date) : "Sem data"} | ${formatTimeRange(item) || "Sem horário"} | ${formatResponsible(item)}`, 9, [49, 65, 87], 13);
    });
    y += 8;
  }

  heading("Programação", 14);
  let hasAny = false;
  for (let cursor = parseISODate(start); cursor <= parseISODate(end); cursor = addDays(cursor, 1)) {
    const iso = toISODate(cursor);
    const dayItems = byDate.get(iso) || [];
    if (!dayItems.length) continue;
    hasAny = true;
    heading(formatDayHeading(iso), 11);
    dayItems.forEach((item) => {
      line(`- ${formatTimeRange(item) || "Sem horário"} | ${item.title} | ${item.tag} | ${formatResponsible(item)} | ${item.priority}`, 9, [49, 65, 87], 13);
    });
    y += 4;
  }

  if (!hasAny) line("Sem itens na programação filtrada.", 10);
  doc.save(`portal-sp2-programacao-${start}.pdf`);
  toast("PDF da Programação gerado.", "success");
}

function requiresRecurrenceScope(occurrence) {
  return Boolean(occurrence?.recurrence?.enabled && !occurrence.recurrenceParentId);
}

function askScope(title) {
  els.scopeTitle.textContent = title;
  showModal(els.scopeModal);
  return new Promise((resolve) => {
    const cleanup = () => {
      els.scopeModal.removeEventListener("close", onClose);
      els.scopeModal.querySelectorAll("[data-scope]").forEach((button) => {
        button.removeEventListener("click", onClick);
      });
    };
    const onClose = () => {
      cleanup();
      resolve(null);
    };
    const onClick = (event) => {
      const scope = event.currentTarget.dataset.scope;
      cleanup();
      closeModal(els.scopeModal);
      resolve(scope);
    };
    els.scopeModal.addEventListener("close", onClose, { once: true });
    els.scopeModal.querySelectorAll("[data-scope]").forEach((button) => {
      button.addEventListener("click", onClick);
    });
  });
}

function confirmAction({ eyebrow, title, message, actionLabel, defaultActor = "" }) {
  els.confirmEyebrow.textContent = eyebrow;
  els.confirmTitle.textContent = title;
  els.confirmMessage.textContent = message;
  els.confirmActionButton.textContent = actionLabel;
  els.confirmNote.value = "";

  let actorInput = document.getElementById("confirmActor");
  if (!actorInput) {
    const label = document.createElement("label");
    label.className = "field";
    label.innerHTML = '<span>Quem está fazendo a ação</span><input id="confirmActor" type="text" required maxlength="80" />';
    els.confirmNote.closest(".field").before(label);
    actorInput = document.getElementById("confirmActor");
  }
  actorInput.value = defaultActor || localStorage.getItem(CONFIG.LAST_ACTOR_KEY) || "";

  showModal(els.confirmModal);
  setTimeout(() => actorInput.focus(), 80);

  return new Promise((resolve) => {
    const onSubmit = (event) => {
      event.preventDefault();
      const actor = actorInput.value.trim();
      if (!actor) {
        actorInput.focus();
        return;
      }
      localStorage.setItem(CONFIG.LAST_ACTOR_KEY, actor);
      cleanup();
      closeModal(els.confirmModal);
      resolve({ ok: true, actor, note: els.confirmNote.value.trim() });
    };
    const onClose = () => {
      cleanup();
      resolve({ ok: false });
    };
    const cleanup = () => {
      els.confirmForm.removeEventListener("submit", onSubmit);
      els.confirmModal.removeEventListener("close", onClose);
    };
    els.confirmForm.addEventListener("submit", onSubmit);
    els.confirmModal.addEventListener("close", onClose, { once: true });
  });
}

async function ensureAdmin() {
  if (state.adminToken) return true;
  showModal(els.adminModal);
  els.adminPassword.value = "";
  els.adminError.hidden = true;
  setTimeout(() => els.adminPassword.focus(), 80);

  return new Promise((resolve) => {
    const onClose = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      els.adminModal.removeEventListener("close", onClose);
    };
    els.adminModal.addEventListener("close", onClose, { once: true });
    els.adminForm.dataset.resolveAdmin = "pending";
    els.adminForm._resolveAdmin = (value) => {
      cleanup();
      resolve(value);
    };
  });
}

async function handleAdminSubmit(event) {
  event.preventDefault();
  const password = els.adminPassword.value;
  if (!password) return;

  try {
    const result = await apiRequest("validateAdmin", { password });
    if (!result.ok || !result.token) throw new Error(result.error || "Senha inválida.");
    saveAdminSession(result.token, result.expiresAt);
    if (typeof els.adminForm._resolveAdmin === "function") {
      els.adminForm._resolveAdmin(true);
      els.adminForm._resolveAdmin = null;
    }
    closeModal(els.adminModal);
    toast("Modo administrador liberado nesta sessão.", "success");
  } catch (error) {
    els.adminError.textContent = error.message || "Senha inválida.";
    els.adminError.hidden = false;
  }
}

async function mutate(action, payload) {
  const result = await apiRequest(action, payload, { mutation: true });
  if (!result.ok) throw new Error(result.error || "Ação não concluída.");
  return result;
}

async function apiRequest(action, payload = {}, options = {}) {
  if (!CONFIG.WEB_APP_URL) {
    return demoApi(action, payload);
  }

  return jsonpRequest(action, payload, {
    requestId: options.mutation ? createId("req") : "",
  });
}

function jsonpRequest(action, payload = {}, options = {}) {
  return new Promise((resolve, reject) => {
    const callback = `portalSp2Callback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Tempo de resposta excedido."));
    }, 18000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callback];
      script.remove();
    }

    window[callback] = (data) => {
      cleanup();
      resolve(data);
    };

    const url = new URL(CONFIG.WEB_APP_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("payload", JSON.stringify(payload));
    url.searchParams.set("callback", callback);
    if (options.requestId) url.searchParams.set("requestId", options.requestId);
    url.searchParams.set("_", Date.now().toString());
    script.onerror = () => {
      cleanup();
      reject(new Error("Não foi possível conectar ao Google Apps Script."));
    };
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

function demoApi(action, payload = {}) {
  const items = readDemoItems();
  const history = readDemoHistory();
  const now = new Date().toISOString();

  if (action === "validateAdmin") {
    if (!payload.password) return Promise.resolve({ ok: false, error: "Informe a senha." });
    if (payload.password !== "tempero") return Promise.resolve({ ok: false, error: "Senha de administrador inválida." });
    return Promise.resolve({
      ok: true,
      token: createId("demo-admin"),
      expiresAt: addHours(new Date(), 6).toISOString(),
    });
  }

  if (action === "listItems") {
    return Promise.resolve({ ok: true, items, serverNow: now });
  }

  if (action === "getHistory") {
    if (!payload.adminToken) return Promise.resolve({ ok: false, error: "Acesso administrativo obrigatório." });
    return Promise.resolve({ ok: true, history: history.slice().reverse() });
  }

  const actor = payload.actor || payload.item?.createdBy || "Não informado";
  let nextItems = items.slice();

  if (action === "createItem") {
    const item = normalizeItem({
      ...payload.item,
      id: createId("item"),
      status: "active",
      deleted: false,
      createdAt: now,
      updatedAt: now,
      exceptionDates: [],
      completedOccurrences: {},
    });
    nextItems.push(item);
    appendDemoHistory(history, "criado", item, null, item, actor, payload.note);
  }

  if (action === "editItem") {
    nextItems = editDemoItem(nextItems, history, payload, actor, now);
  }

  if (action === "deleteItem") {
    nextItems = deleteDemoItem(nextItems, history, payload, actor, now);
  }

  if (action === "completeItem" || action === "reopenItem") {
    return Promise.resolve({ ok: false, error: "A conclusão de itens foi desativada no Portal SP2." });
  }

  if (action === "restoreItem") {
    if (!payload.adminToken) return Promise.resolve({ ok: false, error: "Acesso administrativo obrigatório." });
    nextItems = nextItems.map((item) => {
      if (item.id !== payload.id) return item;
      const original = { ...item };
      const updated = {
        ...item,
        active: true,
        deleted: false,
        deletedAt: "",
        deletedBy: "",
        status: "active",
        completedAt: "",
        completedBy: "",
        completedFromDate: "",
        completedOccurrences: {},
        updatedAt: now,
      };
      appendDemoHistory(history, "restaurado", updated, original, updated, payload.actor || "Administrador", payload.note);
      return updated;
    });
  }

  writeDemoItems(nextItems);
  writeDemoHistory(history);
  return Promise.resolve({ ok: true });
}

function readDemoItems() {
  const raw = localStorage.getItem(CONFIG.DEMO_STORAGE_KEY);
  if (raw) return JSON.parse(raw).map(normalizeItem);
  const seeded = seedDemoItems();
  writeDemoItems(seeded);
  return seeded;
}

function writeDemoItems(items) {
  localStorage.setItem(CONFIG.DEMO_STORAGE_KEY, JSON.stringify(items));
}

function readDemoHistory() {
  const raw = localStorage.getItem(CONFIG.DEMO_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeDemoHistory(history) {
  localStorage.setItem(CONFIG.DEMO_HISTORY_KEY, JSON.stringify(history));
}

function seedDemoItems() {
  const today = toISODate(new Date());
  return [
    normalizeItem({
      id: createId("item"),
      type: "Task/Prazo",
      title: "Revisar entregáveis pendentes da semana",
      date: addDaysISO(today, -2),
      startTime: "17:00",
      tag: "Prazo Final",
      priority: "Alta",
      createdBy: "Vinicius",
      responsibilityMode: "Todos",
      description: "Item de demonstração anterior para validar a área de últimos eventos.",
      status: "active",
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    normalizeItem({
      id: createId("item"),
      type: "Evento/Compromisso",
      title: "Reunião SP2",
      date: today,
      startTime: "09:00",
      endTime: "09:45",
      tag: "Reunião",
      priority: "Média",
      createdBy: "Ana",
      responsibilityMode: "Todos",
      location: "Teams",
      link: "https://teams.microsoft.com/",
      description: "Alinhamento diário.",
      status: "active",
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    normalizeItem({
      id: createId("item"),
      type: "Ação Flexível",
      title: "Mapear próximos treinamentos",
      date: "",
      tag: "Ação Flexível",
      priority: "Baixa",
      createdBy: "Carol",
      responsibilityMode: "Individual",
      responsibleName: "Carol",
      status: "active",
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    normalizeItem({
      id: createId("item"),
      type: "Evento/Compromisso",
      title: "Treinamento recorrente de campo",
      date: today,
      startTime: "14:00",
      endTime: "15:00",
      tag: "Treinamento",
      priority: "Média",
      createdBy: "Dani",
      responsibilityMode: "Todos",
      recurrence: {
        enabled: true,
        frequency: "weekly",
        interval: 1,
        weekdays: [parseISODate(today).getDay()],
        endMode: "after",
        count: 8,
      },
      status: "active",
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ];
}

function editDemoItem(items, history, payload, actor, now) {
  const target = items.find((item) => item.id === payload.id);
  if (!target) return items;
  const scope = payload.scope || "series";
  if (requiresRecurrenceScope(target) && scope === "single") {
    const updatedParent = addExceptionDate(target, payload.occurrenceDate);
    const child = normalizeItem({
      ...target,
      ...payload.item,
      id: createId("item"),
      date: payload.item.date || payload.occurrenceDate,
      recurrence: DEFAULT_RECURRENCE,
      recurrenceParentId: target.id,
      recurrenceOriginalDate: payload.occurrenceDate,
      createdAt: now,
      updatedAt: now,
    });
    appendDemoHistory(history, "editado", child, target, child, actor, payload.note);
    return items.map((item) => (item.id === target.id ? updatedParent : item)).concat(child);
  }
  if (requiresRecurrenceScope(target) && scope === "future") {
    const splitParent = closeSeriesBefore(target, payload.occurrenceDate, now);
    const child = normalizeItem({
      ...target,
      ...payload.item,
      id: createId("item"),
      date: payload.item.date || payload.occurrenceDate,
      createdAt: now,
      updatedAt: now,
    });
    appendDemoHistory(history, "editado", child, target, child, actor, payload.note);
    return items.map((item) => (item.id === target.id ? splitParent : item)).concat(child);
  }
  const updated = normalizeItem({ ...target, ...payload.item, id: target.id, createdAt: target.createdAt, updatedAt: now });
  appendDemoHistory(history, "editado", updated, target, updated, actor, payload.note);
  return items.map((item) => (item.id === target.id ? updated : item));
}

function deleteDemoItem(items, history, payload, actor, now) {
  return items.map((item) => {
    if (item.id !== payload.id) return item;
    const original = { ...item };
    let updated = item;
    if (requiresRecurrenceScope(item) && payload.scope === "single") updated = addExceptionDate(item, payload.occurrenceDate);
    else if (requiresRecurrenceScope(item) && payload.scope === "future") updated = closeSeriesBefore(item, payload.occurrenceDate, now);
    else updated = { ...item, deleted: true, active: false, deletedAt: now, deletedBy: actor, updatedAt: now };
    appendDemoHistory(history, "excluído", updated, original, updated, actor, payload.note);
    return normalizeItem(updated);
  });
}

function appendDemoHistory(history, action, item, original, next, actor, note = "") {
  history.push({
    id: createId("hist"),
    itemId: item.id,
    title: item.title,
    action,
    actor,
    actionAt: new Date().toISOString(),
    note,
    originalData: JSON.stringify(original || {}),
    newData: JSON.stringify(next || {}),
  });
}

function addExceptionDate(item, occurrenceDate) {
  const exceptionDates = Array.from(new Set([...(item.exceptionDates || []), occurrenceDate].filter(Boolean)));
  return normalizeItem({ ...item, exceptionDates, updatedAt: new Date().toISOString() });
}

function closeSeriesBefore(item, occurrenceDate, now) {
  const previousDay = addDaysISO(occurrenceDate, -1);
  const recurrence = normalizeRecurrence(item.recurrence);
  recurrence.endMode = "on";
  recurrence.until = previousDay;
  recurrence.count = "";
  return normalizeItem({ ...item, recurrence, updatedAt: now || new Date().toISOString() });
}

function buildOccurrences(startISO, endISO, options = {}) {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const occurrences = [];

  getActiveItems(options.includeCompleted).forEach((item) => {
    if (!item.date) {
      if (options.includeUndated) occurrences.push(toOccurrence(item));
      return;
    }

    if (item.recurrence?.enabled && !item.recurrenceParentId) {
      occurrences.push(...expandRecurringItem(item, start, end));
      return;
    }

    const date = parseISODate(item.date);
    if (date >= start && date <= end) {
      occurrences.push(toOccurrence(item, item.date));
    }
  });

  return occurrences;
}

function getActiveItems() {
  return state.items.filter((item) => {
    if (item.deleted || item.active === false) return false;
    return true;
  });
}

function expandRecurringItem(item, rangeStart, rangeEnd) {
  const recurrence = normalizeRecurrence(item.recurrence);
  const firstDate = parseISODate(item.date);
  const until = recurrence.endMode === "on" && recurrence.until ? parseISODate(recurrence.until) : rangeEnd;
  const limit = until < rangeEnd ? until : rangeEnd;
  const dates = [];
  let seen = 0;
  let guard = 0;

  for (let cursor = firstDate; cursor <= limit && guard < 3000; cursor = addDays(cursor, 1), guard += 1) {
    const iso = toISODate(cursor);
    if (!matchesRecurrencePattern(item.date, recurrence, iso)) continue;
    seen += 1;
    if (recurrence.endMode === "after" && recurrence.count && seen > Number(recurrence.count)) break;
    if (cursor < rangeStart || cursor > rangeEnd) continue;
    if (isSkippedOccurrence(item, iso)) continue;
    dates.push(toOccurrence(item, iso));
  }

  return dates;
}

function matchesRecurrencePattern(startISO, recurrence, candidateISO) {
  const start = parseISODate(startISO);
  const candidate = parseISODate(candidateISO);
  if (candidate < start) return false;

  const interval = Math.max(1, Number(recurrence.interval) || 1);
  if (recurrence.frequency === "daily") {
    return differenceInDays(start, candidate) % interval === 0;
  }

  if (recurrence.frequency === "weekly") {
    const weeks = Math.floor(differenceInDays(startOfWeek(start), startOfWeek(candidate)) / 7);
    const weekdays = recurrence.weekdays?.length ? recurrence.weekdays.map(Number) : [start.getDay()];
    return weeks % interval === 0 && weekdays.includes(candidate.getDay());
  }

  if (recurrence.frequency === "monthly") {
    const monthDiff = (candidate.getFullYear() - start.getFullYear()) * 12 + candidate.getMonth() - start.getMonth();
    return monthDiff >= 0 && monthDiff % interval === 0 && candidate.getDate() === clampDay(start.getDate(), candidate.getFullYear(), candidate.getMonth());
  }

  if (recurrence.frequency === "yearly") {
    const yearDiff = candidate.getFullYear() - start.getFullYear();
    return yearDiff >= 0 && yearDiff % interval === 0 && candidate.getMonth() === start.getMonth() && candidate.getDate() === start.getDate();
  }

  return false;
}

function isSkippedOccurrence(item, iso) {
  if ((item.exceptionDates || []).includes(iso)) return true;
  return false;
}

function toOccurrence(item, occurrenceDate = item.date || "") {
  const occurrence = normalizeItem({ ...item });
  occurrence.occurrenceDate = occurrenceDate;
  occurrence.occurrenceId = item.recurrence?.enabled && occurrenceDate ? `${item.id}:${occurrenceDate}` : item.id;
  occurrence.isRecurringOccurrence = Boolean(item.recurrence?.enabled && occurrenceDate);
  return occurrence;
}

function getPreviousSectionLabel() {
  if (state.view === "month") return "Últimos 30 dias";
  if (state.view === "agenda") return "Todos os eventos anteriores";
  return "Últimos 7 dias";
}

function getPreviousOccurrences() {
  const today = toISODate(new Date());
  const end = addDaysISO(today, -1);
  if (end >= today) return [];

  let start = addDaysISO(today, -7);
  if (state.view === "month") start = addDaysISO(today, -30);
  if (state.view === "agenda") start = getEarliestActiveDate() || addDaysISO(today, -365);

  if (start > end) return [];
  return applyFilters(buildOccurrences(start, end)).sort(compareItemsNewestFirst);
}

function applyFiltersAndSort(items) {
  return applyFilters(items).sort(compareItems);
}

function applyFilters(items) {
  return items.filter((item) => {
    if (state.filters.tag !== "all" && item.tag !== state.filters.tag) return false;
    if (state.filters.priority !== "all" && item.priority !== state.filters.priority) return false;
    if (state.filters.responsible === "everyone" && item.responsibilityMode !== "Todos") return false;
    if (
      state.filters.responsible !== "all" &&
      state.filters.responsible !== "everyone" &&
      (item.responsibilityMode !== "Individual" || item.responsibleName !== state.filters.responsible)
    ) {
      return false;
    }
    return true;
  });
}

function compareItems(a, b) {
  if (state.filters.sort === "priority") {
    const priority = (PRIORITY_RANK[a.priority] || 99) - (PRIORITY_RANK[b.priority] || 99);
    if (priority) return priority;
  }
  if (state.filters.sort === "tag") {
    const tag = String(a.tag || "").localeCompare(String(b.tag || ""), "pt-BR");
    if (tag) return tag;
  }
  const dateA = a.occurrenceDate || a.date || "9999-12-31";
  const dateB = b.occurrenceDate || b.date || "9999-12-31";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  return String(a.startTime || "99:99").localeCompare(String(b.startTime || "99:99"));
}

function compareItemsNewestFirst(a, b) {
  const dateA = a.occurrenceDate || a.date || "0000-00-00";
  const dateB = b.occurrenceDate || b.date || "0000-00-00";
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  return String(b.startTime || "00:00").localeCompare(String(a.startTime || "00:00"));
}

function getEarliestActiveDate() {
  const dates = getActiveItems()
    .map((item) => item.date)
    .filter(Boolean)
    .sort();
  return dates[0] || "";
}

function groupByDate(items) {
  const map = new Map();
  items.forEach((item) => {
    const date = item.occurrenceDate || item.date;
    if (!date) return;
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(item);
  });
  return map;
}

function findOccurrence(occurrenceId, fallbackId = "", occurrenceDate = "") {
  const ranges = {
    today: [addDaysISO(toISODate(new Date()), -365), addDaysISO(toISODate(new Date()), 14)],
    month: [getMonthGridRange(state.currentDate).start, getMonthGridRange(state.currentDate).end],
    week: [getWeekRange(state.currentDate).start, getWeekRange(state.currentDate).end],
    day: [state.currentDate, state.currentDate],
    agenda: [addDaysISO(toISODate(new Date()), -365), addDaysISO(toISODate(new Date()), 120)],
    history: [addDaysISO(toISODate(new Date()), -365), addDaysISO(toISODate(new Date()), 365)],
  };
  const [start, end] = ranges[state.view] || ranges.today;
  const occurrences = buildOccurrences(start, end, { includeUndated: true }).concat(getPreviousOccurrences());
  return (
    occurrences.find((item) => item.occurrenceId === occurrenceId) ||
    occurrences.find((item) => item.id === fallbackId && (!occurrenceDate || item.occurrenceDate === occurrenceDate)) ||
    state.items.find((item) => item.id === fallbackId || item.id === occurrenceId)
  );
}

function normalizeItem(item) {
  const tag = item.tag || "Reunião";
  return {
    id: item.id || createId("item"),
    type: item.type || getTagRule(tag).type,
    title: item.title || "",
    date: sanitizeDateValue(item.date),
    startTime: sanitizeTimeValue(item.startTime),
    endTime: sanitizeTimeValue(item.endTime),
    durationMinutes: item.durationMinutes || "",
    tag,
    priority: item.priority || "Não aplicável",
    createdBy: item.createdBy || "",
    responsibilityMode: item.responsibilityMode || "Todos",
    responsibleName: item.responsibleName || "",
    location: item.location || "",
    link: item.link || "",
    description: item.description || "",
    recurrence: normalizeRecurrence(item.recurrence),
    recurrenceParentId: item.recurrenceParentId || "",
    recurrenceOriginalDate: sanitizeDateValue(item.recurrenceOriginalDate),
    exceptionDates: Array.isArray(item.exceptionDates) ? item.exceptionDates : safeJson(item.exceptionDates, []),
    completedOccurrences: item.completedOccurrences && typeof item.completedOccurrences === "object" ? item.completedOccurrences : safeJson(item.completedOccurrences, {}),
    completedFromDate: sanitizeDateValue(item.completedFromDate),
    status: item.status || "active",
    active: item.active === false || item.active === "FALSE" ? false : true,
    deleted: item.deleted === true || item.deleted === "TRUE",
    deletedAt: item.deletedAt || "",
    deletedBy: item.deletedBy || "",
    completedAt: item.completedAt || "",
    completedBy: item.completedBy || "",
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || "",
  };
}

function sanitizeDateValue(value) {
  const text = String(value || "").trim();
  if (!text || text === "1899-12-30") return "";
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoDate ? isoDate[1] : text;
}

function sanitizeTimeValue(value) {
  const text = String(value || "").trim();
  if (!text || text === "1899-12-30") return "";

  const plainTime = text.match(/^(\d{1,2}):(\d{2})/);
  if (plainTime) return `${plainTime[1].padStart(2, "0")}:${plainTime[2]}`;

  const embeddedTime = text.match(/[T\s](\d{1,2}):(\d{2})/);
  if (embeddedTime) return `${embeddedTime[1].padStart(2, "0")}:${embeddedTime[2]}`;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  return text;
}

function normalizeRecurrence(recurrence) {
  const parsed = typeof recurrence === "string" ? safeJson(recurrence, {}) : recurrence || {};
  return {
    ...DEFAULT_RECURRENCE,
    ...parsed,
    enabled: parsed.enabled === true || parsed.enabled === "TRUE",
    interval: Number(parsed.interval) || 1,
    weekdays: Array.isArray(parsed.weekdays) ? parsed.weekdays.map(Number) : [],
  };
}

function safeJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatTimeRange(item) {
  if (!item.startTime && !item.endTime && !item.durationMinutes) return "";
  if (item.startTime && item.endTime) return `${item.startTime} - ${item.endTime}`;
  if (item.startTime && item.durationMinutes) return `${item.startTime} · ${item.durationMinutes} min`;
  return item.startTime || item.endTime || "";
}

function getRecurrenceText(item) {
  if (item.recurrenceParentId) return "Ocorrência editada da série.";
  const recurrence = normalizeRecurrence(item.recurrence);
  if (!recurrence.enabled) return "Não recorrente.";
  const unit = {
    daily: "dia(s)",
    weekly: "semana(s)",
    monthly: "mês(es)",
    yearly: "ano(s)",
  }[recurrence.frequency];
  const weekdays =
    recurrence.frequency === "weekly" && recurrence.weekdays?.length
      ? ` · ${recurrence.weekdays.map((day) => WEEKDAYS[day]).join(", ")}`
      : "";
  const end =
    recurrence.endMode === "on"
      ? ` · até ${formatShortDate(recurrence.until)}`
      : recurrence.endMode === "after"
        ? ` · ${recurrence.count} ocorrência(s)`
        : " · sem fim definido";
  return `A cada ${recurrence.interval} ${unit}${weekdays}${end}`;
}

function getHistorySummary(item) {
  if (item.updatedAt) return `Última atualização em ${formatDateTime(item.updatedAt)}.`;
  if (item.createdAt) return `Criado em ${formatDateTime(item.createdAt)}.`;
  return "Sem histórico resumido disponível.";
}

function priorityClass(priority) {
  if (priority === "Alta") return "priority-high";
  if (priority === "Média") return "priority-medium";
  if (priority === "Baixa") return "priority-low";
  return "";
}

function formatResponsible(item) {
  return item.responsibilityMode === "Individual" ? item.responsibleName || "Individual" : "Todos";
}

function filterLabel(value) {
  return value === "all" ? "Todas" : value;
}

function responsibleFilterLabel(value) {
  if (value === "all") return "Todos";
  if (value === "everyone") return "Responsável: Todos";
  return value;
}

function formatPriorityInline(priority) {
  return priority && priority !== "Não aplicável" ? `Prior. ${priority}` : "";
}

function getItemDisplayTitle(item) {
  return `${getTagEmoji(item.tag)} ${item.title || "Sem título"}`;
}

function getTagEmoji(tagName) {
  return TAG_EMOJIS[tagName] || "⚫️";
}

function getTagColor(tagName) {
  return TAGS.find((tag) => tag.name === tagName)?.color || "black";
}

function shiftPeriod(delta) {
  if (state.view === "month") state.currentDate = addMonthsISO(state.currentDate, delta);
  else if (state.view === "week") state.currentDate = addDaysISO(state.currentDate, delta * 7);
  else state.currentDate = addDaysISO(state.currentDate, delta);
  els.scopeDateInput.value = state.currentDate;
  render();
}

function getWeekRange(iso) {
  const start = startOfWeek(parseISODate(iso));
  return { start: toISODate(start), end: toISODate(addDays(start, 6)) };
}

function getMonthGridRange(iso) {
  const first = parseISODate(startOfMonthISO(iso));
  const start = startOfWeek(first);
  return { start: toISODate(start), end: toISODate(addDays(start, 41)) };
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function startOfMonthISO(iso) {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonthISO(iso) {
  const date = parseISODate(iso);
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function addMonthsISO(iso, amount) {
  const date = parseISODate(iso);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  target.setDate(Math.min(day, lastDayOfMonth(target.getFullYear(), target.getMonth())));
  return toISODate(target);
}

function addDaysISO(iso, amount) {
  return toISODate(addDays(parseISODate(iso), amount));
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addHours(date, amount) {
  const copy = new Date(date);
  copy.setHours(copy.getHours() + amount);
  return copy;
}

function parseISODate(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, month - 1, day || 1, 12, 0, 0);
}

function toISODate(date) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function differenceInDays(start, end) {
  const ms = parseISODate(toISODate(end)).getTime() - parseISODate(toISODate(start)).getTime();
  return Math.round(ms / 86400000);
}

function clampDay(day, year, monthIndex) {
  return Math.min(day, lastDayOfMonth(year, monthIndex));
}

function lastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatMonthYear(iso) {
  const date = parseISODate(iso);
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatWeekRange(range) {
  return `${formatShortDate(range.start)} a ${formatShortDate(range.end)}`;
}

function formatLongDate(iso) {
  if (!iso) return "Sem data";
  const date = parseISODate(iso);
  return `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatShortDate(iso) {
  if (!iso) return "Sem data";
  const date = parseISODate(iso);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatDayMonth(iso) {
  if (!iso) return "Sem data";
  const date = parseISODate(iso);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDayHeading(iso) {
  const today = toISODate(new Date());
  if (iso === today) return formatLongDate(iso);
  if (iso === addDaysISO(today, 1)) return `Amanhã · ${formatShortDate(iso)}`;
  return formatLongDate(iso);
}

function formatDateTime(value) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showFormError(message) {
  els.formError.textContent = message;
  els.formError.hidden = false;
}

function toast(message, type = "info") {
  const node = document.createElement("div");
  node.className = `toast is-${type}`;
  node.textContent = message;
  els.toastHost.appendChild(node);
  setTimeout(() => node.remove(), 5200);
}

function showModal(dialog) {
  if (!dialog.open) dialog.showModal();
  refreshIcons();
}

function closeModal(dialog) {
  if (dialog.open) dialog.close();
}

function closeNearestDialog(button) {
  const dialog = button.closest("dialog");
  if (dialog) closeModal(dialog);
}

function refreshIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function createId(prefix) {
  if (crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

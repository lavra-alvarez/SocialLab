const state = {
  originalScenario: null,
  scenario: null,
  analysis: null,
  selectedPersonId: null,
  networkMode: "social",
  selectedNetworkPersonId: null,
};

const elements = {
  status: document.querySelector("#status"),
  scenarioTitle: document.querySelector("#scenario-title"),
  personSelect: document.querySelector("#person-select"),
  personSummary: document.querySelector("#person-summary"),
  preferencesEditor: document.querySelector("#preferences-editor"),
  outsideOption: document.querySelector("#outside-option"),
  resetButton: document.querySelector("#reset-button"),
  analyzeButton: document.querySelector("#analyze-button"),
  summaryCards: document.querySelector("#summary-cards"),
  assignmentComparison: document.querySelector("#assignment-comparison"),
  affinityMatrix: document.querySelector("#affinity-matrix"),
  networkGraph: document.querySelector("#network-graph"),
  networkDetails: document.querySelector("#network-details"),
  networkTabs: document.querySelectorAll("[data-network-mode]"),
};

const criterionLabels = {
  organizacion: "Organización",
  sociabilidad: "Sociabilidad",
  creatividad: "Creatividad",
  competitividad: "Competitividad",
};

initialize();

async function initialize() {
  bindEvents();
  await loadExample();
}

function bindEvents() {
  elements.personSelect.addEventListener("change", (event) => {
    state.selectedPersonId = event.target.value;
    renderPersonEditor();
  });

  elements.scenarioTitle.addEventListener("input", (event) => {
    state.scenario.title = event.target.value;
  });

  elements.outsideOption.addEventListener("input", (event) => {
    selectedPerson().outsideOption = Number(event.target.value);
  });

  elements.preferencesEditor.addEventListener("input", (event) => {
    const input = event.target;
    const criterion = input.dataset.criterion;
    const property = input.dataset.property;
    if (!criterion || !property) return;
    selectedPerson().preferences[criterion][property] = Number(input.value);
  });

  elements.networkTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.networkMode = tab.dataset.networkMode;
      state.selectedNetworkPersonId = null;
      renderNetwork();
    });
  });

  elements.networkGraph.addEventListener("click", (event) => {
    const node = event.target.closest("[data-person-id]");
    if (!node) return;
    selectNetworkPerson(node.dataset.personId);
  });

  elements.networkGraph.addEventListener("keydown", (event) => {
    const node = event.target.closest("[data-person-id]");
    if (!node || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    selectNetworkPerson(node.dataset.personId);
  });

  elements.networkDetails.addEventListener("click", (event) => {
    if (!event.target.closest("[data-clear-network-selection]")) return;
    state.selectedNetworkPersonId = null;
    renderNetwork();
  });

  elements.resetButton.addEventListener("click", () => {
    state.scenario = structuredClone(state.originalScenario);
    state.selectedPersonId = state.scenario.people[0].id;
    state.selectedNetworkPersonId = null;
    renderEditor();
    analyzeScenario();
  });

  elements.analyzeButton.addEventListener("click", analyzeScenario);
}

async function loadExample() {
  setStatus("Cargando…");
  try {
    const response = await fetch("/api/scenario");
    if (!response.ok) throw new Error("No fue posible cargar el escenario.");
    state.originalScenario = await response.json();
    state.scenario = structuredClone(state.originalScenario);
    state.selectedPersonId = state.scenario.people[0].id;
    renderEditor();
    await analyzeScenario();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderEditor() {
  elements.scenarioTitle.value = state.scenario.title;
  elements.personSelect.innerHTML = state.scenario.people
    .map((person) => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name)}</option>`)
    .join("");
  elements.personSelect.value = state.selectedPersonId;
  renderPersonEditor();
}

function renderPersonEditor() {
  const person = selectedPerson();
  if (!person) return;

  elements.outsideOption.value = person.outsideOption;
  elements.personSummary.innerHTML = Object.entries(person.traits)
    .map(
      ([criterion, value]) =>
        `<span class="trait-pill">${labelFor(criterion)} <strong>${format(value, 0)}</strong></span>`,
    )
    .join("");

  const rows = Object.entries(person.preferences)
    .map(
      ([criterion, preference]) => `
        <div class="preference-row">
          <span>${labelFor(criterion)}</span>
          <input
            aria-label="Ideal de ${labelFor(criterion)}"
            type="number" min="0" max="10" step="1"
            value="${preference.ideal}"
            data-criterion="${criterion}" data-property="ideal"
          />
          <input
            aria-label="Peso de ${labelFor(criterion)}"
            type="number" min="0" max="10" step="1"
            value="${preference.weight}"
            data-criterion="${criterion}" data-property="weight"
          />
        </div>`,
    )
    .join("");

  elements.preferencesEditor.innerHTML = `
    <div class="preference-row preference-header">
      <span>Criterio</span><span>Ideal</span><span>Peso</span>
    </div>
    ${rows}`;
}

async function analyzeScenario() {
  elements.analyzeButton.disabled = true;
  setStatus("Analizando…");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.scenario),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error((payload.messages || ["Escenario inválido."]).join(" "));
    }

    state.analysis = payload;
    if (!payload.scenario.people.some((person) => person.id === state.selectedNetworkPersonId)) {
      state.selectedNetworkPersonId = null;
    }
    renderAnalysis();
    setStatus(
      `${payload.totalAssignments} asignaciones · ${payload.nashEquilibria.length} equilibrios Nash`,
      "success",
    );
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    elements.analyzeButton.disabled = false;
  }
}

function renderAnalysis() {
  const analysis = state.analysis;
  const socialMetrics = analysis.socialOptimum.metrics;
  const bestNash = analysis.nashEquilibria[0];

  elements.summaryCards.innerHTML = [
    summaryCard("Asignaciones", analysis.totalAssignments),
    summaryCard("Equilibrios Nash", analysis.nashEquilibria.length),
    summaryCard("Mejor bienestar", format(socialMetrics.collectiveWelfare)),
    summaryCard("Mejor piso", format(analysis.fairOptimum.metrics.minimumSatisfaction)),
  ].join("");

  const cards = [
    assignmentCard("Óptimo social", "Mayor promedio", analysis.socialOptimum),
    assignmentCard("Solución equitativa", "Mayor satisfacción mínima", analysis.fairOptimum),
    bestNash
      ? assignmentCard("Mejor equilibrio Nash", "Sin mejoras unilaterales", bestNash)
      : emptyNashCard(),
  ];
  elements.assignmentComparison.innerHTML = cards.join("");
  renderNetwork();
  elements.affinityMatrix.innerHTML = affinityTable(analysis);
}

function summaryCard(label, value) {
  return `<article class="summary-card"><span>${label}</span><strong>${value}</strong></article>`;
}

function assignmentCard(title, subtitle, result) {
  const groups = groupMembers(result.assignment);
  const metrics = result.metrics;
  const deviation = result.deviations[0];

  return `
    <article class="assignment-card" data-nash="${result.isNash}">
      <header>
        <p>${subtitle}</p>
        <h3>${title}</h3>
      </header>
      ${groups
        .map(
          (members, index) => `
            <div class="group-block">
              <strong>Grupo ${groupLabel(index)}</strong>
              <div class="chip-row">
                ${members.map((person) => `<span class="person-chip">${escapeHtml(person.name)}</span>`).join("") || "<span class=\"person-chip\">Vacío</span>"}
              </div>
            </div>`,
        )
        .join("")}
      <div class="metrics-list">
        <div><span>Bienestar</span><strong>${format(metrics.collectiveWelfare)}</strong></div>
        <div><span>Piso</span><strong>${format(metrics.minimumSatisfaction)}</strong></div>
        <div><span>Brecha</span><strong>${format(metrics.satisfactionGap)}</strong></div>
        <div><span>Nash</span><strong>${result.isNash ? "Sí" : "No"}</strong></div>
      </div>
      <span class="utility-label">Utilidad individual</span>
      ${utilityRows(metrics.individualUtilities)}
      ${
        result.isNash
          ? '<p class="deviation-note nash-note">Desviaciones rentables: <strong>0</strong></p>'
          : `<p class="deviation-note">Mejor desviación: <strong>${personName(deviation.personId)} → ${groupLabel(deviation.toGroup)} · +${format(deviation.gain)}</strong></p>`
      }
    </article>`;
}

function emptyNashCard() {
  return `
    <article class="assignment-card">
      <header><p>Estabilidad estratégica</p><h3>Sin equilibrio puro</h3></header>
      <p class="deviation-note">Equilibrios puros: <strong>0</strong></p>
    </article>`;
}

function utilityRows(utilities) {
  return Object.entries(utilities)
    .sort(([firstId], [secondId]) => personName(firstId).localeCompare(personName(secondId)))
    .map(
      ([personId, utility]) => `
        <div class="utility-row">
          <span>${escapeHtml(personName(personId))}</span>
          <div class="utility-track"><div class="utility-fill" style="width:${clamp(utility, 0, 100)}%"></div></div>
          <strong>${format(utility, 0)}</strong>
        </div>`,
    )
    .join("");
}

function renderNetwork() {
  if (!state.analysis) return;

  const hasNash = state.analysis.nashEquilibria.length > 0;
  if (state.networkMode === "nash" && !hasNash) {
    state.networkMode = "social";
  }

  const result = selectedNetworkResult();
  const people = state.analysis.scenario.people;
  const positions = circularPositions(people);
  const selectedId = state.selectedNetworkPersonId;

  elements.networkTabs.forEach((tab) => {
    const isActive = tab.dataset.networkMode === state.networkMode;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
    tab.disabled = tab.dataset.networkMode === "nash" && !hasNash;
  });

  const edges = [...state.analysis.compatibilities]
    .sort((first, second) => first.score - second.score)
    .map((connection) => networkEdge(connection, positions, selectedId))
    .join("");

  const nodes = people
    .map((person) => networkNode(person, result, positions.get(person.id), selectedId))
    .join("");

  elements.networkGraph.innerHTML = `
    <g class="network-edges">${edges}</g>
    <g class="network-nodes">${nodes}</g>`;
  elements.networkDetails.innerHTML = networkDetail(result, selectedId);
}

function circularPositions(people) {
  const centerX = 360;
  const centerY = 222;
  const radius = people.length > 6 ? 168 : 154;

  return new Map(
    people.map((person, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / people.length;
      return [
        person.id,
        {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        },
      ];
    }),
  );
}

function networkEdge(connection, positions, selectedId) {
  const first = positions.get(connection.firstId);
  const second = positions.get(connection.secondId);
  const isIncident =
    !selectedId || connection.firstId === selectedId || connection.secondId === selectedId;
  const className = selectedId
    ? `network-edge ${isIncident ? "is-active" : "is-muted"}`
    : "network-edge";
  const width = 1.2 + connection.score / 24;
  const opacity = 0.16 + connection.score / 150;

  return `
    <g class="${className}" style="--edge-opacity:${opacity}">
      <line
        x1="${first.x}" y1="${first.y}"
        x2="${second.x}" y2="${second.y}"
        stroke-width="${width}"
      />
      <title>${escapeHtml(personName(connection.firstId))} · ${escapeHtml(personName(connection.secondId))}: ${format(connection.score)}</title>
    </g>`;
}

function networkNode(person, result, position, selectedId) {
  const groupId = result.assignment[person.id];
  const utility = result.metrics.individualUtilities[person.id];
  const selectedClass = selectedId === person.id ? " is-selected" : "";

  return `
    <g
      class="network-node group-${groupId}${selectedClass}"
      data-person-id="${escapeHtml(person.id)}"
      transform="translate(${position.x} ${position.y})"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(person.name)}, grupo ${groupLabel(groupId)}, utilidad ${format(utility)}"
    >
      <circle r="39"></circle>
      <text class="network-node-name" text-anchor="middle" y="-2">${escapeHtml(person.name)}</text>
      <text class="network-node-value" text-anchor="middle" y="17">${groupLabel(groupId)} · ${format(utility, 0)}</text>
    </g>`;
}

function networkDetail(result, selectedId) {
  if (selectedId) return selectedPersonNetworkDetail(result, selectedId);

  const metrics = result.metrics;
  const groups = groupMembers(result.assignment);

  return `
    <div class="network-detail-header">
      <span>${networkModeTitle()}</span>
      <strong>Nash: ${result.isNash ? "Sí" : "No"}</strong>
    </div>
    <div class="network-detail-grid">
      <div><span>Bienestar</span><strong>${format(metrics.collectiveWelfare)}</strong></div>
      <div><span>Piso</span><strong>${format(metrics.minimumSatisfaction)}</strong></div>
      <div><span>Brecha</span><strong>${format(metrics.satisfactionGap)}</strong></div>
    </div>
    <div class="network-groups">
      ${groups
        .map(
          (members, groupId) => `
            <div>
              <span class="group-dot group-${groupId}">${groupLabel(groupId)}</span>
              <strong>${members.map((person) => escapeHtml(person.name)).join(" · ") || "Vacío"}</strong>
            </div>`,
        )
        .join("")}
    </div>`;
}

function selectedPersonNetworkDetail(result, selectedId) {
  const person = state.scenario.people.find((candidate) => candidate.id === selectedId);
  const groupId = result.assignment[selectedId];
  const utility = result.metrics.individualUtilities[selectedId];
  const connections = state.analysis.compatibilities
    .filter((connection) => connection.firstId === selectedId || connection.secondId === selectedId)
    .map((connection) => ({
      personId:
        connection.firstId === selectedId ? connection.secondId : connection.firstId,
      score: connection.score,
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 4);

  return `
    <div class="network-detail-header">
      <span>${escapeHtml(person.name)}</span>
      <button type="button" class="network-clear" data-clear-network-selection>Todos</button>
    </div>
    <div class="network-detail-grid">
      <div><span>Grupo</span><strong>${groupLabel(groupId)}</strong></div>
      <div><span>Utilidad</span><strong>${format(utility)}</strong></div>
      <div><span>Reserva</span><strong>${format(person.outsideOption)}</strong></div>
    </div>
    <div class="connection-list">
      ${connections
        .map(
          (connection) => `
            <div>
              <span>${escapeHtml(personName(connection.personId))}</span>
              <strong>${format(connection.score)}</strong>
            </div>`,
        )
        .join("")}
    </div>`;
}

function selectedNetworkResult() {
  if (state.networkMode === "fair") return state.analysis.fairOptimum;
  if (state.networkMode === "nash") return state.analysis.nashEquilibria[0];
  return state.analysis.socialOptimum;
}

function networkModeTitle() {
  if (state.networkMode === "fair") return "Solución equitativa";
  if (state.networkMode === "nash") return "Mejor Nash";
  return "Óptimo social";
}

function selectNetworkPerson(personId) {
  state.selectedNetworkPersonId =
    state.selectedNetworkPersonId === personId ? null : personId;
  renderNetwork();
}

function affinityTable(analysis) {
  const people = analysis.scenario.people;
  const scores = new Map(
    analysis.affinities.map((cell) => [`${cell.fromId}:${cell.toId}`, cell.score]),
  );

  return `
    <table class="affinity-table">
      <thead>
        <tr><th>Evalúa ↓</th>${people.map((person) => `<th>${escapeHtml(person.name)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${people
          .map(
            (source) => `
              <tr>
                <td>${escapeHtml(source.name)}</td>
                ${people
                  .map((target) => {
                    if (source.id === target.id) return "<td>—</td>";
                    const value = scores.get(`${source.id}:${target.id}`);
                    return `<td style="background:${heatColor(value)}">${format(value, 0)}</td>`;
                  })
                  .join("")}
              </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

function groupMembers(assignment) {
  return Array.from({ length: state.scenario.groupCount }, (_, groupId) =>
    state.scenario.people.filter((person) => assignment[person.id] === groupId),
  );
}

function selectedPerson() {
  return state.scenario?.people.find((person) => person.id === state.selectedPersonId);
}

function personName(personId) {
  return state.scenario.people.find((person) => person.id === personId)?.name || personId;
}

function labelFor(criterion) {
  return criterionLabels[criterion] || criterion;
}

function groupLabel(index) {
  return String.fromCharCode(65 + index);
}

function format(value, digits = 1) {
  return Number(value).toFixed(digits);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function heatColor(score) {
  const intensity = clamp(score / 100, 0, 1);
  const alpha = 0.08 + intensity * 0.36;
  return `rgba(37, 104, 79, ${alpha})`;
}

function setStatus(message, kind = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


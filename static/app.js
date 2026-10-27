const state = {
  originalScenarios: [],
  scenarios: [],
  scenario: null,
  analysis: null,
  selectedPersonId: null,
  networkMode: "social",
  selectedNetworkPersonId: null,
  networkTransition: null,
  transitionTimer: null,
};

const elements = {
  status: document.querySelector("#status"),
  scenarioMode: document.querySelector("#scenario-mode"),
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
  stabilityTab: document.querySelector("#stability-tab"),
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
  elements.scenarioMode.addEventListener("change", (event) => {
    state.scenario = state.scenarios.find((scenario) => scenario.mode === event.target.value);
    state.analysis = null;
    state.selectedPersonId = state.scenario.people[0].id;
    state.selectedNetworkPersonId = null;
    state.networkMode = "social";
    clearNetworkTransition();
    renderEditor();
    analyzeScenario({ animate: false });
  });

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
      clearNetworkTransition();
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
    const previousSnapshot = captureNetworkSnapshot();
    const original = state.originalScenarios.find((scenario) => scenario.mode === state.scenario.mode);
    const scenarioIndex = state.scenarios.findIndex((scenario) => scenario.mode === state.scenario.mode);
    state.scenarios[scenarioIndex] = structuredClone(original);
    state.scenario = state.scenarios[scenarioIndex];
    state.selectedPersonId = state.scenario.people[0].id;
    state.selectedNetworkPersonId = null;
    renderEditor();
    analyzeScenario({ previousSnapshot });
  });

  elements.analyzeButton.addEventListener("click", () => analyzeScenario());
}

async function loadExample() {
  setStatus("Cargando…");
  try {
    const response = await fetch("/api/scenarios");
    if (!response.ok) throw new Error("No fue posible cargar los escenarios.");
    state.originalScenarios = await response.json();
    state.scenarios = structuredClone(state.originalScenarios);
    state.scenario = state.scenarios[0];
    state.selectedPersonId = state.scenario.people[0].id;
    renderEditor();
    await analyzeScenario({ animate: false });
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderEditor() {
  elements.scenarioMode.innerHTML = state.scenarios
    .map(
      (scenario) =>
        `<option value="${scenario.mode}">${scenario.mode === "pairs" ? "Tres parejas" : "Dos equipos"}</option>`,
    )
    .join("");
  elements.scenarioMode.value = state.scenario.mode;
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

async function analyzeScenario({ animate = true, previousSnapshot = null } = {}) {
  const snapshot = previousSnapshot || (animate ? captureNetworkSnapshot() : null);
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
    state.networkTransition =
      snapshot && snapshot.scenarioMode === payload.scenario.mode ? snapshot : null;
    if (!payload.scenario.people.some((person) => person.id === state.selectedNetworkPersonId)) {
      state.selectedNetworkPersonId = null;
    }
    renderAnalysis();
    setStatus(
      `${payload.totalAssignments} asignaciones · ${payload.stableAssignments.length} ${stabilityPluralLabel()}`,
      "success",
    );
    scheduleTransitionCleanup();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    elements.analyzeButton.disabled = false;
  }
}

function renderAnalysis() {
  const analysis = state.analysis;
  const socialMetrics = analysis.socialOptimum.metrics;
  const bestStable = analysis.stableAssignments[0];
  const isPairs = analysis.scenario.mode === "pairs";

  elements.summaryCards.innerHTML = [
    summaryCard("Asignaciones", analysis.totalAssignments),
    summaryCard(isPairs ? "Matchings estables" : "Equilibrios Nash", analysis.stableAssignments.length),
    summaryCard("Mejor bienestar", format(socialMetrics.collectiveWelfare)),
    summaryCard("Mejor piso", format(analysis.fairOptimum.metrics.minimumSatisfaction)),
  ].join("");

  const cards = [
    assignmentCard("Óptimo social", "Mayor promedio", analysis.socialOptimum),
    assignmentCard("Solución equitativa", "Mayor satisfacción mínima", analysis.fairOptimum),
    bestStable
      ? assignmentCard(
          isPairs ? "Mejor matching estable" : "Mejor equilibrio Nash",
          isPairs ? "Sin parejas bloqueantes" : "Sin mejoras unilaterales",
          bestStable,
        )
      : emptyStableCard(),
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
  const blockingPair = result.blockingPairs[0];
  const isPairs = state.scenario.mode === "pairs";

  return `
    <article class="assignment-card" data-stable="${result.isStable}">
      <header>
        <p>${subtitle}</p>
        <h3>${title}</h3>
      </header>
      ${groups
        .map(
          (members, index) => `
            <div class="group-block">
              <strong>${groupTitle(index)}</strong>
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
        <div><span>${isPairs ? "Estable" : "Nash"}</span><strong>${result.isStable ? "Sí" : "No"}</strong></div>
      </div>
      <span class="utility-label">Utilidad individual</span>
      ${utilityRows(metrics.individualUtilities)}
      ${
        result.isStable
          ? `<p class="deviation-note stable-note">${isPairs ? "Parejas bloqueantes" : "Desviaciones rentables"}: <strong>0</strong></p>`
          : isPairs
            ? `<p class="deviation-note">Bloqueo: <strong>${personName(blockingPair.firstId)} + ${personName(blockingPair.secondId)} · +${format(blockingPair.firstGain)}/+${format(blockingPair.secondGain)}</strong></p>`
            : `<p class="deviation-note">Mejor desviación: <strong>${personName(deviation.personId)} → ${groupLabel(deviation.toGroup)} · +${format(deviation.gain)}</strong></p>`
      }
    </article>`;
}

function emptyStableCard() {
  const isPairs = state.scenario.mode === "pairs";
  return `
    <article class="assignment-card">
      <header><p>Estabilidad</p><h3>${isPairs ? "Sin matching estable" : "Sin equilibrio puro"}</h3></header>
      <p class="deviation-note">Resultados estables: <strong>0</strong></p>
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

  const hasStable = state.analysis.stableAssignments.length > 0;
  if (state.networkMode === "stable" && !hasStable) {
    state.networkMode = "social";
  }

  const result = selectedNetworkResult();
  const people = state.analysis.scenario.people;
  const positions = circularPositions(people);
  const selectedId = state.selectedNetworkPersonId;
  const transition = state.networkTransition;
  const isPairs = state.analysis.scenario.mode === "pairs";

  elements.stabilityTab.textContent = isPairs ? "Estable" : "Nash";

  elements.networkTabs.forEach((tab) => {
    const isActive = tab.dataset.networkMode === state.networkMode;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
    tab.disabled = tab.dataset.networkMode === "stable" && !hasStable;
  });

  const edges = [...state.analysis.compatibilities]
    .sort((first, second) => first.score - second.score)
    .map((connection) => networkEdge(connection, positions, selectedId, transition))
    .join("");

  const relations = networkRelations(result, positions, selectedId, transition);

  const nodes = people
    .map((person) => networkNode(person, result, positions.get(person.id), selectedId, transition))
    .join("");

  elements.networkGraph.innerHTML = `
    <g class="network-edges">${edges}</g>
    <g class="network-relations">${relations}</g>
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

function networkEdge(connection, positions, selectedId, transition) {
  const first = positions.get(connection.firstId);
  const second = positions.get(connection.secondId);
  const isIncident =
    !selectedId || connection.firstId === selectedId || connection.secondId === selectedId;
  const key = edgeKey(connection.firstId, connection.secondId);
  const previousScore = transition?.compatibilityScores.get(key);
  const scoreChanged = previousScore !== undefined && Math.abs(previousScore - connection.score) >= 0.5;
  const selectionClass = selectedId ? (isIncident ? " is-active" : " is-muted") : "";
  const changedClass = scoreChanged ? " has-score-change" : "";
  const width = 1.2 + connection.score / 24;
  const previousWidth = previousScore === undefined ? width : 1.2 + previousScore / 24;
  const opacity = 0.16 + connection.score / 150;
  const previousOpacity = previousScore === undefined ? opacity : 0.16 + previousScore / 150;

  return `
    <g class="network-edge${selectionClass}${changedClass}" style="--edge-opacity:${opacity};--previous-opacity:${previousOpacity};--edge-width:${width};--previous-width:${previousWidth}">
      <line
        x1="${first.x}" y1="${first.y}"
        x2="${second.x}" y2="${second.y}"
        stroke-width="${width}"
      />
      <title>${escapeHtml(personName(connection.firstId))} · ${escapeHtml(personName(connection.secondId))}: ${format(connection.score)}</title>
    </g>`;
}

function networkRelations(result, positions, selectedId, transition) {
  const currentKeys = activeConnectionKeys(result, state.analysis);
  const previousKeys = transition?.activeEdgeKeys || new Set();
  const visibleKeys = transition ? new Set([...currentKeys, ...previousKeys]) : currentKeys;
  const compatibilityByKey = new Map(
    state.analysis.compatibilities.map((connection) => [
      edgeKey(connection.firstId, connection.secondId),
      connection,
    ]),
  );

  return [...visibleKeys]
    .map((key) => {
      const connection = compatibilityByKey.get(key);
      if (!connection) return "";
      const first = positions.get(connection.firstId);
      const second = positions.get(connection.secondId);
      const isCurrent = currentKeys.has(key);
      const wasPrevious = previousKeys.has(key);
      const transitionClass = transition
        ? isCurrent && !wasPrevious
          ? " is-added"
          : !isCurrent && wasPrevious
            ? " is-removed"
            : " is-retained"
        : " is-retained";
      const incident =
        !selectedId || connection.firstId === selectedId || connection.secondId === selectedId;
      const selectionClass = selectedId ? (incident ? " is-active" : " is-muted") : "";
      const assignment = isCurrent ? result.assignment : transition?.assignment;
      const groupId = assignment?.[connection.firstId] ?? 0;

      return `
        <g class="network-relation group-${groupId}${transitionClass}${selectionClass}">
          <line pathLength="1" x1="${first.x}" y1="${first.y}" x2="${second.x}" y2="${second.y}" />
        </g>`;
    })
    .join("");
}

function networkNode(person, result, position, selectedId, transition) {
  const groupId = result.assignment[person.id];
  const utility = result.metrics.individualUtilities[person.id];
  const selectedClass = selectedId === person.id ? " is-selected" : "";
  const currentCompanions = companionSignature(person.id, result.assignment);
  const previousCompanions = transition?.companionsByPerson.get(person.id);
  const reassignedClass =
    previousCompanions !== undefined && previousCompanions !== currentCompanions
      ? " is-reassigned"
      : "";

  return `
    <g
      class="network-node group-${groupId}${selectedClass}${reassignedClass}"
      data-person-id="${escapeHtml(person.id)}"
      transform="translate(${position.x} ${position.y})"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(person.name)}, ${groupTitle(groupId)}, utilidad ${format(utility)}"
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
      <strong>${stabilityLabel()}: ${result.isStable ? "Sí" : "No"}</strong>
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
      <div><span>${state.scenario.mode === "pairs" ? "Pareja" : "Equipo"}</span><strong>${groupLabel(groupId)}</strong></div>
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
  if (state.networkMode === "stable") return state.analysis.stableAssignments[0];
  return state.analysis.socialOptimum;
}

function networkModeTitle() {
  if (state.networkMode === "fair") return "Solución equitativa";
  if (state.networkMode === "stable") {
    return state.scenario.mode === "pairs" ? "Mejor matching estable" : "Mejor Nash";
  }
  return "Óptimo social";
}

function captureNetworkSnapshot() {
  if (!state.analysis) return null;

  const result = selectedNetworkResult();
  if (!result) return null;

  return {
    scenarioMode: state.analysis.scenario.mode,
    assignment: { ...result.assignment },
    activeEdgeKeys: activeConnectionKeys(result, state.analysis),
    compatibilityScores: new Map(
      state.analysis.compatibilities.map((connection) => [
        edgeKey(connection.firstId, connection.secondId),
        connection.score,
      ]),
    ),
    companionsByPerson: new Map(
      state.analysis.scenario.people.map((person) => [
        person.id,
        companionSignature(person.id, result.assignment),
      ]),
    ),
  };
}

function activeConnectionKeys(result, analysis) {
  return new Set(
    analysis.compatibilities
      .filter(
        (connection) =>
          result.assignment[connection.firstId] === result.assignment[connection.secondId],
      )
      .map((connection) => edgeKey(connection.firstId, connection.secondId)),
  );
}

function companionSignature(personId, assignment) {
  const groupId = assignment[personId];
  return Object.entries(assignment)
    .filter(([candidateId, candidateGroup]) => candidateId !== personId && candidateGroup === groupId)
    .map(([candidateId]) => candidateId)
    .sort()
    .join(":");
}

function edgeKey(firstId, secondId) {
  return [firstId, secondId].sort().join("::");
}

function scheduleTransitionCleanup() {
  if (state.transitionTimer) window.clearTimeout(state.transitionTimer);
  if (!state.networkTransition) return;
  state.transitionTimer = window.setTimeout(() => {
    state.networkTransition = null;
    state.transitionTimer = null;
  }, 1200);
}

function clearNetworkTransition() {
  if (state.transitionTimer) window.clearTimeout(state.transitionTimer);
  state.transitionTimer = null;
  state.networkTransition = null;
}

function selectNetworkPerson(personId) {
  clearNetworkTransition();
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

function groupTitle(index) {
  return `${state.scenario.mode === "pairs" ? "Pareja" : "Equipo"} ${groupLabel(index)}`;
}

function stabilityLabel() {
  return state.scenario.mode === "pairs" ? "Estable" : "Nash";
}

function stabilityPluralLabel() {
  return state.scenario.mode === "pairs" ? "matchings estables" : "equilibrios Nash";
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


const state = {
  originalScenario: null,
  scenario: null,
  analysis: null,
  selectedPersonId: null,
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

  elements.resetButton.addEventListener("click", () => {
    state.scenario = structuredClone(state.originalScenario);
    state.selectedPersonId = state.scenario.people[0].id;
    renderEditor();
    analyzeScenario();
  });

  elements.analyzeButton.addEventListener("click", analyzeScenario);
}

async function loadExample() {
  setStatus("Cargando escenario de demostración…");
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
  setStatus("Haskell está evaluando todas las asignaciones…");

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
    renderAnalysis();
    setStatus(
      `Análisis completo: ${payload.totalAssignments} asignaciones evaluadas y ${payload.nashEquilibria.length} equilibrios encontrados.`,
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
          ? '<p class="deviation-note nash-note">Nadie obtiene una mejora estricta al cambiarse por sí sola.</p>'
          : `<p class="deviation-note">${personName(deviation.personId)} ganaría <strong>${format(deviation.gain)}</strong> puntos al pasar al grupo ${groupLabel(deviation.toGroup)}.</p>`
      }
    </article>`;
}

function emptyNashCard() {
  return `
    <article class="assignment-card">
      <header><p>Estabilidad estratégica</p><h3>Sin equilibrio puro</h3></header>
      <p class="deviation-note">En este escenario todas las asignaciones permiten al menos una mejora unilateral.</p>
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


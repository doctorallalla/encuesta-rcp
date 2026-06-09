const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyXW1IFMxof4aVeGEdZDW2kmchrAQzTBXzLQJClOax69So6mfMzUwNTMnk4WWWGPDVu/exec"
};

const FORM_FIELDS = [
  "submitted_at_client",
  "user_agent",
  "elapsed_seconds",
  "q01_edad",
  "q02_genero",
  "q03_provincia",
  "q04_anio_carrera",
  "q05_entrenamiento_rcp",
  "q06_realizo_rcp_comunidad",
  "q07_cantidad_rcp",
  "q08_edad_victima",
  "q09_activo_sem",
  "q10_utilizo_dea",
  "q11_motivo_no_dea",
  "q11_motivo_no_dea_otro",
  "q12_resultado_dea",
  "q13_duracion_rcp",
  "q14_rce",
  "q15_finalizacion_rcp",
  "q15_finalizacion_arribo_sem",
  "q15_finalizacion_rce",
  "q15_finalizacion_exhausto",
  "q15_finalizacion_escena_insegura",
  "q15_finalizacion_suspension_sin_rce",
  "q15_finalizacion_otra",
  "q15_finalizacion_otro_texto",
  "q16_satisfaccion_ayudar",
  "q17_afectado_emocionalmente",
  "q18_triste_deprimido",
  "q19_ansiedad_preocupacion",
  "q20_volveria_realizar_rcp",
  "q21_interes_capacitacion",
  "q22_confianza_rcp",
  "q23_disponibilidad_dea"
];

const RCP_ONLY_FIELDS = [
  "q07_cantidad_rcp",
  "q08_edad_victima",
  "q09_activo_sem",
  "q10_utilizo_dea",
  "q11_motivo_no_dea",
  "q11_motivo_no_dea_otro",
  "q12_resultado_dea",
  "q13_duracion_rcp",
  "q14_rce",
  "q15_finalizacion_rcp",
  "q15_finalizacion_arribo_sem",
  "q15_finalizacion_rce",
  "q15_finalizacion_exhausto",
  "q15_finalizacion_escena_insegura",
  "q15_finalizacion_suspension_sin_rce",
  "q15_finalizacion_otra",
  "q15_finalizacion_otro_texto",
  "q16_satisfaccion_ayudar",
  "q17_afectado_emocionalmente",
  "q18_triste_deprimido",
  "q19_ansiedad_preocupacion",
  "q20_volveria_realizar_rcp",
  "q21_interes_capacitacion"
];

const FINALIZATION_MAP = {
  1: "q15_finalizacion_arribo_sem",
  2: "q15_finalizacion_rce",
  3: "q15_finalizacion_exhausto",
  4: "q15_finalizacion_escena_insegura",
  5: "q15_finalizacion_suspension_sin_rce",
  0: "q15_finalizacion_otra"
};

const startTime = Date.now();
const screens = Array.from(document.querySelectorAll(".screen"));
const form = document.getElementById("surveyForm");
const submitState = document.getElementById("submitState");
const stepLabel = document.getElementById("stepLabel");
const progressBar = document.getElementById("progressBar");
const successModal = document.getElementById("successModal");
const successClose = document.getElementById("successClose");
let currentScreen = 0;
let submitStarted = false;

buildLikertScales();
wireNavigation();
wireConditionalInputs();
wireSuccessModal();
updateScreen();
startEcgCanvas();

function buildLikertScales() {
  document.querySelectorAll(".scale").forEach((scale) => {
    const name = scale.dataset.name;
    const labels = {
      1: "Totalmente en desacuerdo",
      3: "Neutral",
      5: "Totalmente de acuerdo"
    };

    for (let value = 1; value <= 5; value += 1) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = String(value);
      if (value === 1) input.required = true;

      const number = document.createElement("span");
      number.textContent = value;
      const helper = document.createElement("small");
      helper.textContent = labels[value] || "";

      label.append(input, number, helper);
      scale.append(label);
    }
  });
}

function wireNavigation() {
  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!validateCurrentScreen()) return;
      currentScreen = getNextScreen();
      updateScreen();
    });
  });

  document.querySelectorAll("[data-prev]").forEach((button) => {
    button.addEventListener("click", () => {
      currentScreen = getPreviousScreen();
      updateScreen();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateCurrentScreen()) return;
    submitSurvey();
  });
}

function wireConditionalInputs() {
  document.querySelectorAll("input[name='q06_realizo_rcp_comunidad']").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.value === "0" && input.checked) clearRcpOnlyAnswers();
    });
  });

  document.querySelectorAll("input[name='q10_utilizo_dea']").forEach((input) => {
    input.addEventListener("change", updateDeaBranch);
  });

  document.querySelectorAll("input[name='q11_motivo_no_dea']").forEach((input) => {
    input.addEventListener("change", updateOtherRequirements);
  });

  document.querySelectorAll("input[name='q15_finalizacion_rcp']").forEach((input) => {
    input.addEventListener("change", updateOtherRequirements);
  });
}

function wireSuccessModal() {
  if (!successClose) return;
  successClose.addEventListener("click", () => {
    successModal.hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function getNextScreen() {
  const didRcp = getRadioValue("q06_realizo_rcp_comunidad") === "1";
  if (currentScreen === 0 && !didRcp) return 3;
  return Math.min(currentScreen + 1, screens.length - 1);
}

function getPreviousScreen() {
  const didRcp = getRadioValue("q06_realizo_rcp_comunidad") === "1";
  if (currentScreen === 3 && !didRcp) return 0;
  return Math.max(currentScreen - 1, 0);
}

function updateScreen() {
  screens.forEach((screen, index) => {
    screen.classList.toggle("active", index === currentScreen);
  });

  const rcpAnswer = getRadioValue("q06_realizo_rcp_comunidad");
  const skipsRcpScreens = rcpAnswer === "0";
  const logicalTotal = skipsRcpScreens ? 2 : 4;
  const logicalStep = skipsRcpScreens ? (currentScreen === 3 ? 2 : 1) : currentScreen + 1;

  stepLabel.textContent = `Pantalla ${logicalStep} de ${logicalTotal}`;
  progressBar.style.width = `${(logicalStep / logicalTotal) * 100}%`;
  updateDeaBranch();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateDeaBranch() {
  const value = getRadioValue("q10_utilizo_dea");
  const yesBlock = document.querySelector("[data-dea='yes']");
  const noBlock = document.querySelector("[data-dea='no']");

  yesBlock.classList.toggle("visible", value === "1");
  noBlock.classList.toggle("visible", value === "0");
  setRadiosRequired("q11_motivo_no_dea", value === "0");
  setRadiosRequired("q12_resultado_dea", value === "1");

  if (value === "1") {
    clearRadioGroup("q11_motivo_no_dea");
    document.getElementById("q11_motivo_no_dea_otro").value = "";
  }

  if (value === "0") clearRadioGroup("q12_resultado_dea");
  updateOtherRequirements();
}

function updateOtherRequirements() {
  const q11Other = getRadioValue("q11_motivo_no_dea") === "0";
  document.getElementById("q11_motivo_no_dea_otro").required = q11Other;

  const q15Other = getRadioValue("q15_finalizacion_rcp") === "0";
  document.getElementById("q15_finalizacion_otro_texto").required = q15Other;
}

function validateCurrentScreen() {
  const screen = screens[currentScreen];
  const fields = Array.from(screen.querySelectorAll("input, select, textarea"))
    .filter((field) => !field.disabled && field.offsetParent !== null);

  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  const radioGroup = screen.querySelector("[data-radio-group='q15_finalizacion_rcp']");
  if (radioGroup) {
    const checked = radioGroup.querySelectorAll("input[type='radio']:checked").length;
    radioGroup.classList.toggle("invalid-group", checked !== 1);
    if (checked !== 1) {
      radioGroup.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
  }

  return true;
}

function collectPayload() {
  const payload = Object.fromEntries(FORM_FIELDS.map((field) => [field, ""]));

  payload.submitted_at_client = new Date().toISOString();
  payload.user_agent = navigator.userAgent;
  payload.elapsed_seconds = String(Math.round((Date.now() - startTime) / 1000));

  setFromRadio(payload, "q02_genero");
  setFromRadio(payload, "q04_anio_carrera");
  setFromRadio(payload, "q05_entrenamiento_rcp");
  setFromRadio(payload, "q06_realizo_rcp_comunidad");
  setFromRadio(payload, "q07_cantidad_rcp");
  setFromRadio(payload, "q08_edad_victima");
  setFromRadio(payload, "q09_activo_sem");
  setFromRadio(payload, "q10_utilizo_dea");
  setFromRadio(payload, "q11_motivo_no_dea");
  setFromRadio(payload, "q12_resultado_dea");
  setFromRadio(payload, "q13_duracion_rcp");
  setFromRadio(payload, "q14_rce");
  setFromRadio(payload, "q15_finalizacion_rcp");
  setFromRadio(payload, "q16_satisfaccion_ayudar");
  setFromRadio(payload, "q17_afectado_emocionalmente");
  setFromRadio(payload, "q18_triste_deprimido");
  setFromRadio(payload, "q19_ansiedad_preocupacion");
  setFromRadio(payload, "q20_volveria_realizar_rcp");
  setFromRadio(payload, "q21_interes_capacitacion");
  setFromRadio(payload, "q22_confianza_rcp");
  setFromRadio(payload, "q23_disponibilidad_dea");

  payload.q01_edad = document.getElementById("q01_edad").value.trim();
  payload.q03_provincia = document.getElementById("q03_provincia").value;
  payload.q11_motivo_no_dea_otro = document.getElementById("q11_motivo_no_dea_otro").value.trim();
  payload.q15_finalizacion_otro_texto = document.getElementById("q15_finalizacion_otro_texto").value.trim();

  Object.values(FINALIZATION_MAP).forEach((field) => {
    payload[field] = "0";
  });

  if (payload.q15_finalizacion_rcp !== "") {
    payload[FINALIZATION_MAP[payload.q15_finalizacion_rcp]] = "1";
  }

  normalizeBranchValues(payload);
  return payload;
}

function normalizeBranchValues(payload) {
  if (payload.q06_realizo_rcp_comunidad === "0") {
    RCP_ONLY_FIELDS.forEach((field) => {
      payload[field] = "NA";
    });
    return;
  }

  if (payload.q10_utilizo_dea === "1") {
    payload.q11_motivo_no_dea = "NA";
    payload.q11_motivo_no_dea_otro = "NA";
  }

  if (payload.q10_utilizo_dea === "0") {
    payload.q12_resultado_dea = "NA";
  }

  if (payload.q15_finalizacion_rcp !== "0") {
    payload.q15_finalizacion_otro_texto = "";
  }

  if (payload.q11_motivo_no_dea !== "0") {
    payload.q11_motivo_no_dea_otro = payload.q11_motivo_no_dea === "NA" ? "NA" : "";
  }
}

function submitSurvey() {
  const url = CONFIG.APPS_SCRIPT_URL.trim();
  if (!url || url.includes("PEGAR_AQUI")) {
    submitState.textContent = "Falta configurar la URL del Web App de Google Apps Script en app.js.";
    submitState.classList.add("error");
    return;
  }

  const payload = collectPayload();
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitState.classList.remove("error");
  submitState.textContent = "Enviando respuesta...";

  const transport = document.createElement("form");
  transport.method = "POST";
  transport.action = url;
  transport.target = "submitFrame";
  transport.hidden = true;

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify(payload);
  transport.append(input);

  document.body.append(transport);
  submitStarted = true;
  transport.submit();
  transport.remove();

  window.setTimeout(() => {
    if (!submitStarted) return;
    markSubmitSuccess(submitButton);
  }, 1300);
}

document.getElementById("submitFrame").addEventListener("load", () => {
  if (!submitStarted) return;
  const submitButton = form.querySelector("button[type='submit']");
  markSubmitSuccess(submitButton);
});

function markSubmitSuccess(submitButton) {
  submitState.textContent = "Respuesta enviada con éxito. Muchas gracias por participar.";
  submitButton.disabled = true;
  Array.from(form.elements).forEach((element) => {
    if (element.tagName !== "BUTTON") element.disabled = true;
  });
  successModal.hidden = false;
  successClose.focus();
}

function setFromRadio(payload, name) {
  payload[name] = getRadioValue(name);
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[name='${name}']:checked`);
  return selected ? selected.value : "";
}

function setRadiosRequired(name, required) {
  document.querySelectorAll(`input[name='${name}']`).forEach((input, index) => {
    input.required = required && index === 0;
  });
}

function clearRadioGroup(name) {
  document.querySelectorAll(`input[name='${name}']`).forEach((input) => {
    input.checked = false;
  });
}

function clearRcpOnlyAnswers() {
  RCP_ONLY_FIELDS.forEach((field) => {
    const element = document.querySelector(`[name='${field}']`);
    if (!element) return;
    if (element.type === "radio" || element.type === "checkbox") {
      document.querySelectorAll(`[name='${field}']`).forEach((input) => {
        input.checked = false;
      });
    } else {
      element.value = "";
    }
  });

  document.querySelectorAll("input[name='q15_finalizacion_rcp']").forEach((input) => {
    input.checked = false;
  });
  updateDeaBranch();
}

function startEcgCanvas() {
  const canvas = document.getElementById("ecgCanvas");
  const context = canvas.getContext("2d");
  const pointer = { x: 0.5, y: 0.5 };

  function resize() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth;
    pointer.y = event.clientY / window.innerHeight;
  });
  resize();

  function rhythm(kind, x, width, time) {
    const p = ((x + time) % width) / width;
    if (kind === "vf") {
      return Math.sin(p * Math.PI * 18) * 10 + Math.sin(p * Math.PI * 41) * 5;
    }
    if (kind === "tv") {
      return Math.sin(p * Math.PI * 10) * 18 + Math.sin(p * Math.PI * 20) * 6;
    }
    if (kind === "asistolia") {
      return Math.sin(p * Math.PI * 4) * 1.2;
    }
    if (p < 0.05) return -5;
    if (p < 0.075) return -24;
    if (p < 0.105) return 34;
    if (p < 0.135) return -10;
    if (p < 0.22) return 6;
    return 0;
  }

  function drawLine(y, kind, color, alpha, time, amplitude = 1) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const offset = (pointer.x - 0.5) * 22;
    context.beginPath();
    for (let x = -20; x <= width + 20; x += 3) {
      const wave = rhythm(kind, x, width * 0.34, time) * amplitude;
      const yy = y + wave + (pointer.y - 0.5) * 8;
      if (x === -20) context.moveTo(x + offset, yy);
      else context.lineTo(x + offset, yy);
    }
    context.strokeStyle = color;
    context.globalAlpha = alpha;
    context.lineWidth = 1.8;
    context.shadowColor = color;
    context.shadowBlur = 10;
    context.stroke();
    context.shadowBlur = 0;
    context.globalAlpha = 1;
  }

  function drawGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    context.strokeStyle = "rgba(139, 230, 219, 0.055)";
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 38) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 38) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }

  function frame(now) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    context.clearRect(0, 0, width, height);
    drawGrid();
    const t = now * 0.018;
    drawLine(height * 0.18, "vf", "#7dd3c7", 0.2, t, 0.62);
    drawLine(height * 0.52, "tv", "#f87171", 0.17, t * 0.7, 0.74);
    drawLine(height * 0.82, "asistolia", "#d1fae5", 0.16, t * 0.45, 1);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

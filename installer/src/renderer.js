// Suncord Installer — Renderer Process

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Window Controls ──

$("#btnMinimize").addEventListener("click", () => {
  window.electron?.minimize?.();
});

$("#btnClose").addEventListener("click", () => {
  window.close();
});

// ── Step Navigation ──

function showStep(id) {
  $$(".step").forEach((s) => s.classList.add("hidden"));
  $(`#${id}`).classList.remove("hidden");
}

// ── State ──

let selectedDiscord = null;
let detectedDiscords = [];

// ── Init ──

async function init() {
  showStep("stepDetect");

  try {
    detectedDiscords = await window.suncord.detectDiscord();
  } catch (e) {
    detectedDiscords = [];
  }

  if (detectedDiscords.length === 0) {
    showNoDiscord();
    return;
  }

  // Check patch status for each
  for (const d of detectedDiscords) {
    try {
      const status = await window.suncord.checkPatched(d.path);
      d.patched = status.patched;
    } catch {
      d.patched = false;
    }
  }

  renderDiscordList();
  showStep("stepSelect");
}

function showNoDiscord() {
  const step = $("#stepSelect");
  step.querySelector("h2").textContent = "Discord Not Found";
  step.querySelector(".step-icon").textContent = "😢";
  step.querySelector(".dim").textContent = "We couldn't find Discord on your system.";

  const list = $("#discordList");
  list.innerHTML = `
    <div class="no-discord">
      <p>Make sure Discord is installed. If it's installed in a custom location, let us know on GitHub.</p>
      <a href="#" id="linkDownload">Download Discord →</a>
    </div>
    <button class="btn btn-secondary" style="margin-top:12px" onclick="init()">Scan Again</button>
  `;

  $("#linkDownload")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.suncord.openUrl("https://discord.com/download");
  });

  showStep("stepSelect");
}

function renderDiscordList() {
  const list = $("#discordList");
  list.innerHTML = "";

  for (const d of detectedDiscords) {
    const item = document.createElement("div");
    item.className = "discord-item";
    item.innerHTML = `
      <div class="discord-item-icon">${d.patched ? "✅" : "📁"}</div>
      <div class="discord-item-info">
        <div class="discord-item-name">${d.name}</div>
        <div class="discord-item-path">${d.path}</div>
      </div>
      <span class="discord-item-badge ${d.patched ? "badge-patched" : "badge-clean"}">
        ${d.patched ? "Suncord Installed" : "Not Patched"}
      </span>
    `;

    item.addEventListener("click", () => selectDiscord(d));
    list.appendChild(item);
  }
}

// ── Select Discord ──

async function selectDiscord(discord) {
  selectedDiscord = discord;

  if (discord.patched) {
    showStep("stepPatched");
  } else {
    // Install
    await installSuncord();
  }
}

// ── Install ──

async function installSuncord() {
  showStep("stepPatching");
  $("#patchingTitle").textContent = "Installing Suncord...";
  $("#patchingStatus").textContent = "Patching Discord";

  try {
    const result = await window.suncord.install(selectedDiscord.path);

    if (result.success) {
      showStep("stepDone");
      if (result.alreadyPatched) {
        $("#doneTitle").textContent = "Already Installed";
        $("#doneMessage").textContent = "Suncord was already installed on this Discord.";
      } else {
        $("#doneTitle").textContent = "Suncord Installed!";
        $("#doneMessage").textContent = "Discord has been patched. Launch it to start using Suncord.";
      }
    } else {
      showError(result.error || "Failed to install Suncord");
    }
  } catch (e) {
    showError(e.message || "Installation failed");
  }
}

// ── Uninstall ──

async function uninstallSuncord() {
  showStep("stepPatching");
  $("#patchingTitle").textContent = "Uninstalling Suncord...";
  $("#patchingStatus").textContent = "Restoring Discord";

  try {
    const result = await window.suncord.uninstall(selectedDiscord.path);

    if (result.success) {
      selectedDiscord.patched = false;
      showStep("stepDone");
      $("#doneTitle").textContent = "Suncord Removed";
      $("#doneMessage").textContent = "Discord has been restored to its original state.";
    } else {
      showError(result.error || "Failed to uninstall Suncord");
    }
  } catch (e) {
    showError(e.message || "Uninstall failed");
  }
}

// ── Launch Discord ──

async function launchDiscord() {
  try {
    await window.suncord.launchDiscord(selectedDiscord.path);
    window.close();
  } catch {}
}

// ── Error ──

function showError(msg) {
  $("#errorMessage").textContent = msg;
  showStep("stepError");
}

// ── Button Bindings ──

$("#btnLaunch").addEventListener("click", launchDiscord);
$("#btnDoneBack").addEventListener("click", init);
$("#btnUninstall").addEventListener("click", uninstallSuncord);
$("#btnLaunchFromPatched").addEventListener("click", launchDiscord);
$("#btnPatchedBack").addEventListener("click", init);
$("#btnErrorBack").addEventListener("click", init);

$("#linkGitHub")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.suncord.openUrl("https://github.com/Sunny-son-sahur/suncord");
});

$("#linkDiscord")?.addEventListener("click", (e) => {
  e.preventDefault();
  window.suncord.openUrl("https://discord.gg/suncord");
});

// ── Start ──

init();

// Suncord Installer — Renderer

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Window Controls ──
$("#btnClose").addEventListener("click", () => window.close());

// ── State ──
let detectedDiscords = [];
let selectedIndex = -1;

// ── Helpers ──
function setStatus(msg, type) {
  const bar = $("#statusBar");
  bar.textContent = msg;
  bar.className = "status-bar" + (type ? " " + type : "");
}

function setLoading(on) {
  $("#loadingState").classList.toggle("hidden", !on);
  $("#installerUI").classList.toggle("hidden", on);
}

// ── Discord Detection ──
async function detectDiscord() {
  setLoading(true);
  setStatus("Scanning for Discord installations...", "working");

  try {
    detectedDiscords = await window.suncord.detectDiscord();
  } catch (e) {
    detectedDiscords = [];
  }

  if (detectedDiscords.length === 0) {
    setLoading(false);
    $("#installerUI").classList.add("hidden");
    $("#noDiscord").classList.remove("hidden");
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

  // Set install path
  const platform = await window.suncord.getPlatform();
  if (platform === "win32") {
    $("#installPath").textContent = process.env.LOCALAPPDATA || "C:\\Users\\...\\AppData\\Local";
  } else if (platform === "linux") {
    $("#installPath").textContent = "/usr/lib/suncord";
  } else {
    $("#installPath").textContent = "/Applications/Suncord.app";
  }

  renderDiscordList();
  setLoading(false);
  setStatus(`Found ${detectedDiscords.length} Discord installation(s)`);
}

// ── Render Discord List ──
function renderDiscordList() {
  const list = $("#discordList");
  list.innerHTML = "";

  for (let i = 0; i < detectedDiscords.length; i++) {
    const d = detectedDiscords[i];
    const item = document.createElement("div");
    item.className = "discord-item";
    item.dataset.index = i;

    const statusLabel = d.patched ? "PATCHED" : "NOT PATCHED";
    const statusClass = d.patched ? "badge-patched" : "badge-not-patched";

    item.innerHTML = `
      <div class="discord-radio"></div>
      <div class="discord-info">
        <div class="discord-name">[${statusLabel}] ${d.name}</div>
        <div class="discord-path">${d.path}</div>
      </div>
      <span class="discord-badge ${statusClass}">${statusLabel}</span>
    `;

    item.addEventListener("click", () => selectDiscord(i));
    list.appendChild(item);
  }

  // Auto-select first
  if (detectedDiscords.length > 0) {
    selectDiscord(0);
  }
}

// ── Select Discord ──
function selectDiscord(index) {
  selectedIndex = index;
  $$(".discord-item").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
  $("#customRadio").checked = false;
  $("#customPathInput").classList.add("hidden");

  const d = detectedDiscords[index];
  if (d.patched) {
    setStatus(`Suncord is installed on ${d.name}`);
  } else {
    setStatus(`${d.name} is not patched`);
  }
}

// ── Custom Location ──
$("#customRadio").addEventListener("change", () => {
  if ($("#customRadio").checked) {
    selectedIndex = -1;
    $$(".discord-item").forEach((el) => el.classList.remove("selected"));
    $("#customPathInput").classList.remove("hidden");
    $("#customPathInput").focus();
    setStatus("Enter the path to your Discord installation");
  }
});

// ── Open Directory ──
$("#openDirBtn").addEventListener("click", async () => {
  const platform = await window.suncord.getPlatform();
  if (platform === "win32") {
    window.suncord.openPath(process.env.LOCALAPPDATA || "C:\\");
  } else {
    window.suncord.openPath("/usr/lib");
  }
});

// ── Install ──
$("#btnInstall").addEventListener("click", async () => {
  const path = getSelectedPath();
  if (!path) {
    setStatus("Please select a Discord installation", "error");
    return;
  }

  setStatus("Installing Suncord...", "working");
  disableButtons(true);

  try {
    const result = await window.suncord.install(path);
    if (result.success) {
      setStatus(result.alreadyPatched ? "Already installed" : "Suncord installed successfully!", "success");
      await refreshStatus();
    } else {
      setStatus("Error: " + (result.error || "Installation failed"), "error");
    }
  } catch (e) {
    setStatus("Error: " + (e.message || "Installation failed"), "error");
  }

  disableButtons(false);
});

// ── Uninstall ──
$("#btnUninstall").addEventListener("click", async () => {
  const path = getSelectedPath();
  if (!path) {
    setStatus("Please select a Discord installation", "error");
    return;
  }

  setStatus("Uninstalling Suncord...", "working");
  disableButtons(true);

  try {
    const result = await window.suncord.uninstall(path);
    if (result.success) {
      setStatus("Suncord removed. Discord restored to original state.", "success");
      await refreshStatus();
    } else {
      setStatus("Error: " + (result.error || "Uninstall failed"), "error");
    }
  } catch (e) {
    setStatus("Error: " + (e.message || "Uninstall failed"), "error");
  }

  disableButtons(false);
});

// ── Update ──
$("#btnUpdate").addEventListener("click", async () => {
  const path = getSelectedPath();
  if (!path) {
    setStatus("Please select a Discord installation", "error");
    return;
  }

  setStatus("Updating Suncord...", "working");
  disableButtons(true);

  try {
    // Uninstall first, then reinstall
    await window.suncord.uninstall(path);
    const result = await window.suncord.install(path);
    if (result.success) {
      setStatus("Suncord updated successfully!", "success");
      await refreshStatus();
    } else {
      setStatus("Error: " + (result.error || "Update failed"), "error");
    }
  } catch (e) {
    setStatus("Error: " + (e.message || "Update failed"), "error");
  }

  disableButtons(false);
});

// ── Install OpenAsar ──
$("#btnInstallOpenAsar").addEventListener("click", async () => {
  const path = getSelectedPath();
  if (!path) {
    setStatus("Please select a Discord installation", "error");
    return;
  }

  setStatus("OpenAsar is not yet bundled. Use the Install button for Suncord.", "error");
});

// ── Helpers ──
function getSelectedPath() {
  if (selectedIndex >= 0 && selectedIndex < detectedDiscords.length) {
    return detectedDiscords[selectedIndex].path;
  }
  if ($("#customRadio").checked) {
    return $("#customPathInput").value.trim();
  }
  return null;
}

function disableButtons(on) {
  ["btnInstall", "btnUninstall", "btnUpdate", "btnInstallOpenAsar"].forEach((id) => {
    $(`#${id}`).disabled = on;
  });
}

async function refreshStatus() {
  for (let i = 0; i < detectedDiscords.length; i++) {
    try {
      const status = await window.suncord.checkPatched(detectedDiscords[i].path);
      detectedDiscords[i].patched = status.patched;
    } catch {
      detectedDiscords[i].patched = false;
    }
  }
  renderDiscordList();
}

// ── Download Discord ──
$("#btnDownloadDiscord")?.addEventListener("click", () => {
  window.suncord.openUrl("https://discord.com/download");
});

// ── Init ──
detectDiscord();

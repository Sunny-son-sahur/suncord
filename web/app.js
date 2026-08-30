// Suncord Landing Page — Platform logic

const REPO = "Sunny-son-sahur/suncord";
const GITHUB_BASE = `https://github.com/${REPO}/releases/latest/download`;
const SITE_BASE = "https://sunny-son-sahur.github.io/suncord";

const PLATFORMS = {
  windows: {
    label: "Windows",
    version: "v1.0.0",
    note: "Windows 10/11",
    fileType: "GUI Installer",
    fileName: "SuncordInstaller.exe",
    instructions: `
      <h3>Install on Windows</h3>
      <ol>
        <li>Click the download button above to get <strong>SuncordInstaller.exe</strong>.</li>
        <li>Run the installer.</li>
        <li>Select your Discord installation (auto-detected).</li>
        <li>Click <strong>Install</strong>.</li>
        <li>Restart Discord.</li>
      </ol>
      <div class="note">
        <strong>To uninstall:</strong> Open the installer again and click <strong>Uninstall</strong>.
      </div>
    `
  },
  linux: {
    label: "Linux",
    version: "v1.0.0",
    note: "Any distro with Discord",
    fileType: null,
    installCmd: `sh -c "$(curl -sS ${SITE_BASE}/install.sh)"`,
    instructions: `
      <h3>Install on Linux</h3>
      <p>Open a terminal and paste this:</p>
      <div class="code-block">
        <code>sh -c "$(curl -sS ${SITE_BASE}/install.sh)"</code>
      </div>
      <p style="margin-top:12px;color:#b9bbbe;">That's it. It finds Discord, backs up the original, and patches it.</p>

      <h4 style="color:#dcddde;margin:20px 0 8px;">To uninstall:</h4>
      <div class="code-block">
        <code>curl -sS ${SITE_BASE}/uninstall.sh | sh</code>
      </div>
    `
  },
  mac: {
    label: "Mac",
    version: "v1.0.0",
    note: "macOS 12+ — Intel & Apple Silicon",
    fileType: "GUI Installer",
    fileName: "SuncordInstaller.dmg",
    instructions: `
      <h3>Install on macOS</h3>
      <ol>
        <li>Click the download button above to get <strong>SuncordInstaller.dmg</strong>.</li>
        <li>Open the .drag and drag <strong>Suncord Installer</strong> to Applications.</li>
        <li>Open the installer from Applications.</li>
        <li>Click <strong>Install</strong>.</li>
        <li>Restart Discord.</li>
      </ol>
      <div class="warning">
        <strong>macOS security:</strong> If you get "unidentified developer" errors, right-click the app and select "Open", or go to <strong>System Settings → Privacy & Security</strong> and click "Open Anyway".
      </div>
    `
  },
  browser: {
    label: "Browser",
    version: "v1.0.0",
    note: "Via Discord Web",
    fileType: "Userscript",
    instructions: `
      <h3>Use in Browser</h3>
      <ol>
        <li>Install a userscript manager: <strong>Violentmonkey</strong> or <strong>Tampermonkey</strong>.</li>
        <li>Click the button above to install the Suncord userscript.</li>
        <li>Navigate to <strong>discord.com/app</strong>.</li>
        <li>Suncord loads automatically.</li>
      </ol>
      <div class="note">
        <strong>Note:</strong> Browser support is limited compared to desktop.
      </div>
    `
  }
};

// Auto-detect platform
function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac") || ua.includes("darwin")) return "mac";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

// State
let currentPlatform = detectPlatform();

// DOM
const tabs = document.querySelectorAll(".tab");
const downloadBtn = document.getElementById("downloadBtn");
const downloadText = document.getElementById("downloadText");
const downloadMeta = document.getElementById("downloadMeta");
const instructionContent = document.getElementById("instructionContent");

function updateUI(platform) {
  const p = PLATFORMS[platform];
  if (!p) return;

  // Update tabs
  tabs.forEach(t => {
    t.classList.toggle("active", t.dataset.platform === platform);
  });

  // Update download button
  if (p.fileName) {
    // Direct download from GitHub releases
    downloadBtn.href = `${GITHUB_BASE}/${p.fileName}`;
    downloadBtn.style.display = "inline-flex";
    downloadText.textContent = `Download Suncord for ${p.label}`;
    downloadMeta.textContent = `${p.version} — ${p.note} — ${p.fileType}`;
  } else if (p.installCmd) {
    // Linux — copy-to-clipboard
    downloadBtn.href = "#";
    downloadBtn.style.display = "inline-flex";
    downloadText.textContent = `Install Suncord on ${p.label}`;
    downloadMeta.textContent = `${p.version} — ${p.note} — Copy command to terminal`;

    downloadBtn.onclick = (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(p.installCmd).then(() => {
        downloadText.textContent = "Copied! Paste in terminal";
        setTimeout(() => {
          downloadText.textContent = `Install Suncord on ${p.label}`;
        }, 2000);
      }).catch(() => {
        // Fallback: select text
        const ta = document.createElement("textarea");
        ta.value = p.installCmd;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        downloadText.textContent = "Copied! Paste in terminal";
        setTimeout(() => {
          downloadText.textContent = `Install Suncord on ${p.label}`;
        }, 2000);
      });
    };
  } else {
    // Browser — userscript
    downloadBtn.href = `https://raw.githubusercontent.com/${REPO}/main/scripts/suncord.user.js`;
    downloadBtn.style.display = "inline-flex";
    downloadText.textContent = "Get Suncord Userscript";
    downloadMeta.textContent = `${p.version} — ${p.note} — ${p.fileType}`;
    downloadBtn.onclick = null;
  }

  // Update instructions
  instructionContent.innerHTML = p.instructions;

  // Add copy button to code blocks
  instructionContent.querySelectorAll(".code-block").forEach(block => {
    block.style.cursor = "pointer";
    block.title = "Click to copy";
    block.addEventListener("click", () => {
      const code = block.querySelector("code");
      if (code) {
        navigator.clipboard.writeText(code.textContent).then(() => {
          const orig = block.style.outline;
          block.style.outline = "2px solid #f0b232";
          setTimeout(() => { block.style.outline = orig; }, 500);
        });
      }
    });
  });
}

// Tab click handlers
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    currentPlatform = tab.dataset.platform;
    updateUI(currentPlatform);
  });
});

// Init
updateUI(currentPlatform);

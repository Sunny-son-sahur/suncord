// Suncord Landing Page — Platform logic

const PLATFORMS = {
  windows: {
    label: "Windows",
    fileName: "suncord-windows.zip",
    fileType: "Portable zip",
    version: "v1.0.0",
    note: "Windows 10/11",
    instructions: `
      <h3>Install on Windows</h3>
      <ol>
        <li>Download the <strong>zip file</strong> above.</li>
        <li>Extract it to a folder — e.g. <code>C:\\Suncord</code></li>
        <li><strong>Close Discord</strong> completely (check system tray).</li>
        <li>Open a terminal in the extracted folder and run:
          <br><code>node dist/injector.js</code>
        </li>
        <li>Discord will launch with Suncord loaded.</li>
      </ol>
      <div class="note">
        <strong>Tip:</strong> Create a <code>suncord-launcher.bat</code> in the folder so you can double-click to launch.
      </div>
    `
  },
  linux: {
    label: "Linux",
    fileName: "suncord_1.0.0_amd64.deb",
    fileType: ".deb package",
    version: "v1.0.0",
    note: "Debian/Ubuntu — AMD64",
    instructions: `
      <h3>Install on Linux</h3>
      <ol>
        <li>Download the <strong>.deb package</strong> above.</li>
        <li>Install it:
          <br><code>sudo dpkg -i suncord_1.0.0_amd64.deb</code>
        </li>
        <li>Fix any missing dependencies:
          <br><code>sudo apt-get install -f</code>
        </li>
        <li>Launch from your app menu, or run:
          <br><code>suncord</code>
        </li>
      </ol>
      <div class="note">
        <strong>Also available:</strong> Grab the portable zip if you prefer no-install. Extract and run <code>bash scripts/suncord.sh launch</code>.
      </div>
    `
  },
  mac: {
    label: "Mac",
    fileName: "suncord-mac.zip",
    fileType: "Portable zip",
    version: "v1.0.0",
    note: "macOS 12+ — Intel & Apple Silicon",
    instructions: `
      <h3>Install on macOS</h3>
      <ol>
        <li>Download the <strong>zip file</strong> above.</li>
        <li>Extract it — double-click the .zip in Finder.</li>
        <li><strong>Close Discord</strong> completely (Cmd+Q, check dock).</li>
        <li>Open Terminal, navigate to the extracted folder:
          <br><code>cd ~/Downloads/suncord</code>
        </li>
        <li>Run the loader:
          <br><code>bash scripts/suncord.sh launch</code>
        </li>
        <li>Discord will launch with Suncord loaded.</li>
      </ol>
      <div class="warning">
        <strong>macOS security:</strong> If you get "unidentified developer" errors, go to <strong>System Settings → Privacy & Security</strong> and click "Open Anyway". For macOS Sonoma and earlier, right-click the app and select "Open".
      </div>
    `
  },
  browser: {
    label: "Browser",
    fileName: null,
    fileType: "Userscript",
    version: "v1.0.0",
    note: "Via Discord Web",
    instructions: `
      <h3>Use in Browser</h3>
      <ol>
        <li>Install a userscript manager: <strong>Violentmonkey</strong> or <strong>Tampermonkey</strong>.</li>
        <li>Open the Suncord userscript file from the GitHub repo:
          <br><code>scripts/suncord.user.js</code>
        </li>
        <li>Click "Install" in your userscript manager.</li>
        <li>Navigate to <strong>discord.com/app</strong>.</li>
        <li>Suncord will load automatically with the web version.</li>
      </ol>
      <div class="note">
        <strong>Note:</strong> Browser support is limited compared to desktop. Some plugins that rely on desktop APIs won't work.
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
  return "windows"; // default
}

// State
let currentPlatform = detectPlatform();
const GITHUB_BASE = "https://github.com/Sunny-son-sahur/suncord/releases/latest/download";

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
    downloadBtn.href = `${GITHUB_BASE}/${p.fileName}`;
    downloadBtn.style.display = "inline-flex";
    downloadText.textContent = `Download Suncord for ${p.label}`;
    downloadMeta.textContent = `${p.version} — ${p.note} — ${p.fileType}`;
  } else {
    // Browser — link to GitHub repo
    downloadBtn.href = "https://github.com/Sunny-son-sahur/suncord/tree/main/scripts";
    downloadBtn.style.display = "inline-flex";
    downloadText.textContent = "Get Suncord Userscript";
    downloadMeta.textContent = `${p.version} — ${p.note} — ${p.fileType}`;
  }

  // Update instructions
  instructionContent.innerHTML = p.instructions;
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

// SUNCORD Built-in Plugin: Message Logger
// Logs all messages to console for debugging

module.exports = {
  name: "Message Logger",
  description: "Logs all received messages to the console",
  version: "1.0",
  author: "SUNCORD",

  settings: {
    logEdited: true,
    logDeleted: true,
  },

  settingsDefinition: [
    {
      key: "logEdited",
      label: "Log Edited Messages",
      type: "boolean",
      default: true,
    },
    {
      key: "logDeleted",
      label: "Log Deleted Messages",
      type: "boolean",
      default: true,
    },
  ],

  start() {
    console.log("[SUNCORD:MessageLogger] Plugin started");

    // Listen for new messages
    document.addEventListener("suncord:message", (e) => {
      const msg = (e as CustomEvent).detail;
      console.log(`[MSG] ${msg.author}: ${msg.content}`);
    });
  },

  stop() {
    console.log("[SUNCORD:MessageLogger] Plugin stopped");
  },
};

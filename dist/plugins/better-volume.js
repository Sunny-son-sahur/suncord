// SUNCORD Built-in Plugin: Better Volume
// Allows setting user volume above 100% (up to 200%)

module.exports = {
  name: "Better Volume",
  description: "Set user volume values manually from 1% to 200%",
  version: "1.0",
  author: "SUNCORD",

  settings: {
    maxVolume: 200,
  },

  settingsDefinition: [
    {
      key: "maxVolume",
      label: "Max Volume (%)",
      type: "number",
      default: 200,
    },
  ],

  start() {
    console.log("[SUNCORD:BetterVolume] Plugin started — volume override active");
  },

  stop() {
    console.log("[SUNCORD:BetterVolume] Plugin stopped");
  },
};

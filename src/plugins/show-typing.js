// SUNCORD Built-in Plugin: Typing Indicator Fix
// Shows typing indicators for all users, even if Discord hides them

module.exports = {
  name: "Show Typing",
  description: "Always show typing indicators, even when Discord hides them",
  version: "1.0",
  author: "SUNCORD",

  start() {
    console.log("[SUNCORD:ShowTyping] Plugin started");
  },

  stop() {
    console.log("[SUNCORD:ShowTyping] Plugin stopped");
  },
};

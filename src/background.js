chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "MARKLOG_TOGGLE_PANEL" });
  } catch (e) {
    // Content script not injected on this page — ignore.
  }
});

// Rooz Daily Operating System Content Script

console.log("[Rooz Daily Operating System] Content script successfully injected onto page:", window.location.href);

// Listen to messages from side panel or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE_PAGE_METADATA") {
    const pageData = {
      title: document.title,
      url: window.location.href,
      description: document.querySelector("meta[name='description']")?.getAttribute("content") || "",
    };
    sendResponse({ success: true, data: pageData });
  }
  return true;
});

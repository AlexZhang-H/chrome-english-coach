chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[AI Coach] setPanelBehavior failed:', err));

  chrome.contextMenus.create({
    id: 'ai-coach-analyze-selection',
    title: '发送给 AI 英语教练',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'ai-coach-analyze-selection' || !tab?.id) return;
  const payload = {
    text: info.selectionText ?? '',
    pageUrl: info.pageUrl ?? tab.url ?? '',
    capturedAt: new Date().toISOString(),
  };
  await chrome.storage.session.set({ pendingSelection: payload });
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.error('[AI Coach] sidePanel.open failed:', err);
  }
  chrome.runtime
    .sendMessage({ type: 'ANALYZE_SELECTION', payload })
    .catch(() => {});
});

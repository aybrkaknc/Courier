const DEV_SERVER = 'ws://127.0.0.1:35871';
const KEEPALIVE_MS = 20000;
const RETRY_MS = 2000;

async function reloadPages() {
  const base = chrome.runtime.getURL('');
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url?.startsWith(base)) chrome.tabs.reload(tab.id);
  }
}

// A build made while disconnected is detected here. The first connection only records the id.
async function syncBuild(id, isHello) {
  const { devBuild } = await chrome.storage.session.get('devBuild');
  await chrome.storage.session.set({ devBuild: id });
  if (devBuild !== id && (!isHello || devBuild)) chrome.runtime.reload();
}

function connect() {
  const socket = new WebSocket(DEV_SERVER);
  let keepalive;

  socket.onopen = () => {
    // Regular traffic keeps the service worker alive so it can receive reload signals.
    keepalive = setInterval(() => socket.send('ping'), KEEPALIVE_MS);
  };
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.type === 'page') reloadPages();
    else syncBuild(message.id, message.type === 'hello');
  };
  socket.onclose = () => {
    clearInterval(keepalive);
    setTimeout(connect, RETRY_MS);
  };
}

connect();

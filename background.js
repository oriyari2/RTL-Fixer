chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: manualFixRTL
  });
});

function manualFixRTL() {
  document.documentElement.dir = "rtl";
  document.body.style.textAlign = "right";
  
  if (!document.getElementById('rtl-fix-style-manual')) {
    const style = document.createElement('style');
    style.id = 'rtl-fix-style-manual';
    style.textContent = 'h1, h2, h3, h4, h5, h6, p, span, a, div, li { text-align: right !important; direction: rtl !important; }';
    document.head.appendChild(style);
  }
}
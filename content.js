function applyRTLFix() {
  document.documentElement.dir = "rtl";
  document.body.style.textAlign = "right";
  
  if (!document.getElementById('rtl-fix-style')) {
    const style = document.createElement('style');
    style.id = 'rtl-fix-style';
    style.textContent = 'h1, h2, h3, h4, h5, h6, p, span, a, div, li { text-align: right !important; direction: rtl !important; }';
    document.head.appendChild(style);
  }
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class' || mutation.attributeName === 'lang') {
      const htmlElem = document.documentElement;
      // ברגע שמזהים את המחלקה של התרגום, מפעילים את התיקון
      if (htmlElem.classList.contains('translated-ltr') || htmlElem.classList.contains('translated-rtl')) {
        applyRTLFix();
      }
    }
  });
});

observer.observe(document.documentElement, { attributes: true });

if (document.documentElement.classList.contains('translated-ltr')) {
  applyRTLFix();
}
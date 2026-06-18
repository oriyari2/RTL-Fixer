chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: manualFixRTL
  });
});

function manualFixRTL() {
  const rtlFixStyleId = 'rtl-fix-style-manual';
  const autoRtlTextClass = 'rtl-fixer-text';
  const autoRtlListClass = 'rtl-fixer-list';
  const autoLtrInlineClass = 'rtl-fixer-ltr-inline';
  const rtlTextClass = 'rtl-fixer-text-manual';
  const rtlListClass = 'rtl-fixer-list-manual';
  const ltrInlineClass = 'rtl-fixer-ltr-inline-manual';
  const hebrewTextPattern = /[\u0590-\u05FF]/;
  const hebrewWordPattern = /[\u0590-\u05FF]{2,}/g;
  const englishRunPattern = /[A-Za-z0-9][A-Za-z0-9+#/@&()_.:,'’"-]*(?:\s+[A-Za-z0-9+#/@&()_.:,'’"-]+)*/g;
  const textContainerSelector = [
    'p',
    'li',
    'blockquote',
    'dd',
    'dt',
    'td',
    'th',
    'caption',
    'figcaption',
    'summary',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    '[role="heading"]'
  ].join(',');

  function ensureRTLTextStyle() {
    let style = document.getElementById(rtlFixStyleId);

    if (!style) {
      style = document.createElement('style');
      style.id = rtlFixStyleId;
      (document.head || document.documentElement).appendChild(style);
    }

    style.textContent = `
      .${autoRtlTextClass},
      .${rtlTextClass} {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }

      .${autoRtlListClass},
      .${rtlListClass} {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate !important;
      }

      .${autoLtrInlineClass},
      .${ltrInlineClass} {
        direction: ltr !important;
        unicode-bidi: isolate !important;
      }
    `;

    const legacyAutoStyle = document.getElementById('rtl-fix-style');
    if (legacyAutoStyle) {
      legacyAutoStyle.textContent = style.textContent;
    }
  }

  function containsHebrewThatNeedsRTL(text) {
    if (!hebrewTextPattern.test(text)) {
      return false;
    }

    const hebrewWords = text.match(hebrewWordPattern) || [];
    return hebrewWords.length > 0;
  }

  function isIgnoredElement(element) {
    return Boolean(element.closest(`script, style, noscript, textarea, input, select, option, code, pre, .${autoLtrInlineClass}, .${ltrInlineClass}`));
  }

  function getTextContainer(textNode) {
    const parentElement = textNode.parentElement;

    if (!parentElement || isIgnoredElement(parentElement)) {
      return null;
    }

    if (parentElement.matches(textContainerSelector)) {
      return parentElement;
    }

    const semanticContainer = parentElement.closest(textContainerSelector);
    if (semanticContainer && semanticContainer !== document.body && semanticContainer !== document.documentElement) {
      return semanticContainer;
    }

    return parentElement;
  }

  function applyRTLClass(element) {
    element.classList.add(rtlTextClass);

    const listItem = element.closest('li');
    if (listItem && listItem !== document.body && listItem !== document.documentElement) {
      listItem.classList.add(rtlListClass);
    }
  }

  function isolateEnglishRuns(textNode) {
    const text = textNode.nodeValue || '';

    if (!hebrewTextPattern.test(text) || !/[A-Za-z0-9]/.test(text)) {
      return;
    }

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let hasReplacement = false;

    text.replace(englishRunPattern, (match, index) => {
      if (index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
      }

      const isolate = document.createElement('bdi');
      isolate.className = ltrInlineClass;
      isolate.dir = 'ltr';
      isolate.textContent = match;
      fragment.appendChild(isolate);

      lastIndex = index + match.length;
      hasReplacement = true;
      return match;
    });

    if (!hasReplacement) {
      return;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  function unwrapInlineIsolates() {
    document
      .querySelectorAll(`.${autoLtrInlineClass}, .${ltrInlineClass}`)
      .forEach((element) => {
        element.replaceWith(document.createTextNode(element.textContent || ''));
      });
  }

  function clearPreviousRTLClasses() {
    unwrapInlineIsolates();

    document
      .querySelectorAll(`.${autoRtlTextClass}, .${autoRtlListClass}, .rtl-fixer-ltr-start-text, .rtl-fixer-ltr-start-list, .${rtlTextClass}, .${rtlListClass}, .rtl-fixer-ltr-start-text-manual, .rtl-fixer-ltr-start-list-manual`)
      .forEach((element) => {
        element.classList.remove(
          autoRtlTextClass,
          autoRtlListClass,
          'rtl-fixer-ltr-start-text',
          'rtl-fixer-ltr-start-list',
          rtlTextClass,
          rtlListClass,
          'rtl-fixer-ltr-start-text-manual',
          'rtl-fixer-ltr-start-list-manual'
        );
      });
  }

  ensureRTLTextStyle();
  clearPreviousRTLClasses();

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(textNode) {
        if (containsHebrewThatNeedsRTL(textNode.nodeValue || '')) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  let textNode = walker.nextNode();

  while (textNode) {
    textNodes.push(textNode);
    textNode = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const container = getTextContainer(textNode);

    if (container) {
      applyRTLClass(container);
      isolateEnglishRuns(textNode);
    }
  });
}

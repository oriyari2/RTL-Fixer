const RTL_FIX_STYLE_ID = 'rtl-fix-style';
const RTL_TEXT_CLASS = 'rtl-fixer-text';
const RTL_LIST_CLASS = 'rtl-fixer-list';
const LTR_INLINE_CLASS = 'rtl-fixer-ltr-inline';
const MANUAL_RTL_TEXT_CLASS = 'rtl-fixer-text-manual';
const MANUAL_RTL_LIST_CLASS = 'rtl-fixer-list-manual';
const MANUAL_LTR_INLINE_CLASS = 'rtl-fixer-ltr-inline-manual';
const HEBREW_TEXT_PATTERN = /[\u0590-\u05FF]/;
const HEBREW_WORD_PATTERN = /[\u0590-\u05FF]{2,}/g;
const ENGLISH_RUN_PATTERN = /[A-Za-z0-9][A-Za-z0-9+#/@&()_.:,'’"-]*(?:\s+[A-Za-z0-9+#/@&()_.:,'’"-]+)*/g;
const TEXT_CONTAINER_SELECTOR = [
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

let pendingAutoFixCheck = null;

function ensureRTLTextStyle() {
  let style = document.getElementById(RTL_FIX_STYLE_ID);

  if (!style) {
    style = document.createElement('style');
    style.id = RTL_FIX_STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
  }

  style.textContent = `
    .${RTL_TEXT_CLASS},
    .${MANUAL_RTL_TEXT_CLASS} {
      direction: rtl !important;
      text-align: right !important;
      unicode-bidi: isolate !important;
    }

    .${RTL_LIST_CLASS},
    .${MANUAL_RTL_LIST_CLASS} {
      direction: rtl !important;
      text-align: right !important;
      unicode-bidi: isolate !important;
    }

    .${LTR_INLINE_CLASS},
    .${MANUAL_LTR_INLINE_CLASS} {
      direction: ltr !important;
      unicode-bidi: isolate !important;
    }
  `;

  const legacyManualStyle = document.getElementById('rtl-fix-style-manual');
  if (legacyManualStyle) {
    legacyManualStyle.textContent = style.textContent;
  }
}

function containsHebrewThatNeedsRTL(text) {
  if (!HEBREW_TEXT_PATTERN.test(text)) {
    return false;
  }

  const hebrewWords = text.match(HEBREW_WORD_PATTERN) || [];
  return hebrewWords.length > 0;
}

function isIgnoredElement(element) {
  return Boolean(element.closest(`script, style, noscript, textarea, input, select, option, code, pre, .${LTR_INLINE_CLASS}, .${MANUAL_LTR_INLINE_CLASS}`));
}

function getTextContainer(textNode) {
  const parentElement = textNode.parentElement;

  if (!parentElement || isIgnoredElement(parentElement)) {
    return null;
  }

  if (parentElement.matches(TEXT_CONTAINER_SELECTOR)) {
    return parentElement;
  }

  const semanticContainer = parentElement.closest(TEXT_CONTAINER_SELECTOR);
  if (semanticContainer && semanticContainer !== document.body && semanticContainer !== document.documentElement) {
    return semanticContainer;
  }

  return parentElement;
}

function applyRTLClass(element) {
  element.classList.add(RTL_TEXT_CLASS);

  const listItem = element.closest('li');
  if (listItem && listItem !== document.body && listItem !== document.documentElement) {
    listItem.classList.add(RTL_LIST_CLASS);
  }
}

function isolateEnglishRuns(textNode) {
  const text = textNode.nodeValue || '';

  if (!HEBREW_TEXT_PATTERN.test(text) || !/[A-Za-z0-9]/.test(text)) {
    return;
  }

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let hasReplacement = false;

  text.replace(ENGLISH_RUN_PATTERN, (match, index) => {
    if (index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
    }

    const isolate = document.createElement('bdi');
    isolate.className = LTR_INLINE_CLASS;
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
    .querySelectorAll(`.${LTR_INLINE_CLASS}, .${MANUAL_LTR_INLINE_CLASS}`)
    .forEach((element) => {
      element.replaceWith(document.createTextNode(element.textContent || ''));
    });
}

function clearPreviousRTLClasses() {
  unwrapInlineIsolates();

  document
    .querySelectorAll(`.${RTL_TEXT_CLASS}, .${RTL_LIST_CLASS}, .rtl-fixer-ltr-start-text, .rtl-fixer-ltr-start-list, .${MANUAL_RTL_TEXT_CLASS}, .${MANUAL_RTL_LIST_CLASS}, .rtl-fixer-ltr-start-text-manual, .rtl-fixer-ltr-start-list-manual`)
    .forEach((element) => {
      element.classList.remove(
        RTL_TEXT_CLASS,
        RTL_LIST_CLASS,
        'rtl-fixer-ltr-start-text',
        'rtl-fixer-ltr-start-list',
        MANUAL_RTL_TEXT_CLASS,
        MANUAL_RTL_LIST_CLASS,
        'rtl-fixer-ltr-start-text-manual',
        'rtl-fixer-ltr-start-list-manual'
      );
    });
}

function applyRTLFix() {
  if (!document.body) {
    return false;
  }

  ensureRTLTextStyle();
  clearPreviousRTLClasses();

  let fixedAnyText = false;
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
      fixedAnyText = true;
    }
  });

  return fixedAnyText;
}

function scheduleAutoFixCheck() {
  clearTimeout(pendingAutoFixCheck);
  pendingAutoFixCheck = setTimeout(applyRTLFix, 150);
}

const observer = new MutationObserver((mutations) => {
  const shouldCheck = mutations.some((mutation) =>
    mutation.type === 'childList' ||
    (mutation.attributeName === 'class' && mutation.target === document.documentElement) ||
    mutation.attributeName === 'lang' ||
    mutation.attributeName === 'dir'
  );

  if (shouldCheck) {
    scheduleAutoFixCheck();
  }
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class', 'lang', 'dir'],
  childList: true,
  subtree: true
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyRTLFix, { once: true });
} else {
  applyRTLFix();
}

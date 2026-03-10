RTL Fixer - Chrome Extension 🌐
A lightweight and fast Google Chrome extension that automatically fixes text direction (Right-to-Left) and layout alignment after using Google's built-in translation to Hebrew.

When Chrome translates pages from English to Hebrew, it usually keeps the original Left-to-Right (LTR) structure. This results in hard-to-read Hebrew text, broken layouts, and sidebars remaining on the wrong side. This extension detects the translation event and instantly applies CSS rules to correct the page's directionality.

📸 Demo (Before & After)
Before (Without the extension)
The page structure remains LTR. The sidebar is on the left, and the text is misaligned and hard to read:
<img width="1906" height="852" alt="image" src="https://github.com/user-attachments/assets/a19bc749-3cf8-4373-8915-7d3e88d9aa55" />

After (With the extension)
The extension detects the translation, changes the direction to RTL, and aligns the text to the right. The sidebar moves to its natural place on the right, making reading comfortable:
<img width="1856" height="758" alt="image" src="https://github.com/user-attachments/assets/d82db0fd-dfb2-401a-a167-4a22982a4026" />

✨ Key Features
Fully Automatic: Uses a MutationObserver to detect translation in real-time and instantly aligns the text, requiring no user action.

Manual Fallback: Includes a toolbar action button to force text alignment on demand (useful for edge-case websites where automatic detection is delayed).

Highly Optimized: Minimal and efficient codebase. The extension only listens to specific DOM mutations and does not consume unnecessary CPU or memory resources.

Secure & Private: Built on the strict Manifest V3 standard. It runs entirely locally, does not collect telemetry, does not communicate with external servers, and does not read sensitive page content.

🚀 Installation (Developer Mode)
Since the extension is not currently published on the Chrome Web Store, you can easily install it locally:

Create a new folder on your computer (e.g., RTL-Fixer) and save the extension files (manifest.json, background.js, content.js) inside it.

Open Google Chrome and type chrome://extensions/ in the address bar.

Toggle Developer mode on in the top right corner.

Click the Load unpacked button that appears in the top toolbar.

Navigate to the folder you created in Step 1 and select it.

(Optional) Click the puzzle icon 🧩 next to the address bar and Pin the extension for quick access.

🛠️ Usage
Just browse normally! Whenever you use Chrome's built-in translator to translate a page to Hebrew, the extension will work in the background within a fraction of a second to fix the layout.
If you encounter a site that doesn't respond automatically, simply click the extension icon in the toolbar to force the RTL layout.

// ==UserScript==
// @name         Prime Gaming - Claim Game
// @version      1.0
// @description  Automatically click the "Get game" button on Prime Gaming
// @author       Eiko Wagenknecht
// @namespace    https://eikowagenknecht.de
// @match        https://gaming.amazon.com/*
// @icon         https://logowik.com/content/uploads/images/prime-gaming8790.logowik.com.webp
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const BUTTON_SELECTOR = 'button[data-a-target="buy-box_call-to-action"]';

  // Function to click the "Get game" button if it exists
  function clickGetGameButton() {
    const button = document.querySelector(BUTTON_SELECTOR);
    if (button) {
      button.click();
    }
  }

  // Create a MutationObserver to monitor DOM changes
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" || mutation.type === "attributes") {
        clickGetGameButton();
      }
    }
  });

  // Start observing DOM changes
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  // Initial check for the button
  clickGetGameButton();
})();

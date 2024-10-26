// ==UserScript==
// @name         Epic Games - Claim Game
// @version      1.0
// @description  Automatically claim free games from the Epic Games Store
// @author       Eiko Wagenknecht
// @namespace    https://eikowagenknecht.de/
// @match        https://store.epicgames.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=epicgames.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let isPlacingOrder = false;

  // Check if the game is free
  function isGameFree() {
    return (
      document.querySelector(
        'div:-webkit-any(:has(span:is([data-component="PricePercentOff"])))'
      ) !== null &&
      document.querySelector(
        'span:-webkit-any(:has(span[data-component="Message"]))'
      ) !== null
    );
  }

  // Click button with specific text content
  function clickButton(text) {
    const button = Array.from(document.getElementsByTagName("button")).find(
      (btn) => btn.textContent.includes(text)
    );
    if (button) {
      button.click();
      return true;
    }
    return false;
  }

  // Main function to process the page
  function processPage() {
    if (clickButton("Continue") || clickButton("I Agree")) {
      isPlacingOrder = false;
      return;
    }

    if (
      (clickButton("Place Order") || clickButton("Bestellung abschicken")) &&
      !isPlacingOrder
    ) {
      const priceElement = document.querySelector(
        ".payment-price__value--YOUPAY span"
      );
      if (
        priceElement &&
        ["€0.00", "0,00 €"].includes(priceElement.textContent)
      ) {
        isPlacingOrder = true;
        return;
      }
    }

    const getButton = document.querySelector(
      'button[data-testid="purchase-cta-button"]'
    );
    if (getButton && getButton.textContent === "Get" && isGameFree()) {
      isPlacingOrder = false;
      getButton.click();
    }
  }

  // Set up MutationObserver to watch for DOM changes
  const observer = new MutationObserver(processPage);
  observer.observe(document, { childList: true, subtree: true });
})();

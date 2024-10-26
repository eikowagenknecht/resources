// ==UserScript==
// @name         GOG - Claim Game
// @version      1.0
// @description  Automatically claim free games on GOG.com
// @author       Eiko Wagenknecht
// @namespace    https://eikowagenknecht.de/
// @match        https://www.gog.com/
// @match        https://www.gog.com/#giveaway
// @icon         https://w7.pngwing.com/pngs/403/46/png-transparent-gog-galaxy-alt-macos-bigsur-icon-thumbnail.png
// ==/UserScript==

(function () {
  "use strict";

  const CLAIM_DELAY = 10000; // 10 seconds
  const CHECK_INTERVAL = 1000; // 1 second

  // Function to click claim buttons
  function claimGames(buttons) {
    if (buttons.length === 0) {
      return;
    }

    clearInterval(checkInterval);
    const button = buttons.pop();
    button.click();

    // Schedule the next claim
    setTimeout(() => claimGames(buttons), CLAIM_DELAY);
  }

  // Function to find and initiate claiming of games
  function findAndClaimGames() {
    const buttons = Array.from(
      document.querySelectorAll("span.giveaway-banner__button-text")
    );
    claimGames(buttons);
  }

  // Start checking for giveaway buttons
  const checkInterval = setInterval(findAndClaimGames, CHECK_INTERVAL);
})();

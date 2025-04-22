// ==UserScript==
// @name         Notification Monitor
// @version      1.0
// @description  Monitors web pages for new notifications and tab title changes. Sends detailed alerts via Telegram. See the user menu for settings.
// @author       Eiko Wagenknecht
// @namespace    https://eikowagenknecht.de/
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  // Custom Logging
  function debugLog(message) {
    console.log(
      `%c[Notification Monitor] ${message}`,
      "background: #f0f0f0; color: #333; padding: 2px 5px; border-radius: 3px;",
    );
  }

  // Get the current domain
  const currentDomain = window.location.hostname;

  // Default pattern that matches everything
  const DEFAULT_PATTERN = ".*";

  // Configuration
  const config = {
    get telegramBotToken() {
      return GM_getValue("telegramBotToken", "");
    },
    set telegramBotToken(value) {
      GM_setValue("telegramBotToken", value);
    },
    get telegramChatId() {
      return GM_getValue("telegramChatId", "");
    },
    set telegramChatId(value) {
      GM_setValue("telegramChatId", value);
    },
    get titleChangeTrackingEnabled() {
      return GM_getValue(`titleChangeTrackingEnabled_${currentDomain}`, false);
    },
    set titleChangeTrackingEnabled(value) {
      GM_setValue(`titleChangeTrackingEnabled_${currentDomain}`, value);
      updateTitleChangeTracking();
    },
    get titlePattern() {
      return GM_getValue(`titlePattern_${currentDomain}`, "");
    },
    set titlePattern(value) {
      GM_setValue(`titlePattern_${currentDomain}`, value);
    },
    get notificationInterceptionEnabled() {
      return GM_getValue(
        `notificationInterceptionEnabled_${currentDomain}`,
        false,
      );
    },
    set notificationInterceptionEnabled(value) {
      GM_setValue(`notificationInterceptionEnabled_${currentDomain}`, value);
      updateNotificationInterception();
    },
  };

  // Menu command IDs
  const menuCommandIds = {
    configure: null,
    toggleTitleTracking: null,
    configureTitlePattern: null,
    toggleNotificationInterception: null,
  };

  // Register menu commands
  function updateMenuCommands() {
    // Unregister existing commands
    for (const id of Object.values(menuCommandIds)) {
      if (id !== null) GM_unregisterMenuCommand(id);
    }

    // Register new commands
    menuCommandIds.configure = GM_registerMenuCommand(
      "Configure Telegram Settings",
      configureTelegramSettings,
    );
    menuCommandIds.toggleTitleTracking = GM_registerMenuCommand(
      `${
        config.titleChangeTrackingEnabled ? "Disable" : "Enable"
      } Title Change Tracking for ${currentDomain}`,
      toggleTitleChangeTracking,
    );
    menuCommandIds.configureTitlePattern = GM_registerMenuCommand(
      "Configure Title Pattern",
      configureTitlePattern,
    );
    menuCommandIds.toggleNotificationInterception = GM_registerMenuCommand(
      `${
        config.notificationInterceptionEnabled ? "Disable" : "Enable"
      } Notification Interception for ${currentDomain}`,
      toggleNotificationInterception,
    );

    debugLog("Menu commands updated");
  }

  function configureTitlePattern() {
    debugLog("Configuring title pattern");
    const currentPattern =
      config.titlePattern === DEFAULT_PATTERN ? "" : config.titlePattern;
    const pattern = prompt(
      "Enter the title pattern to match (regex).\n" +
        "Leave empty or enter invalid pattern to track all title changes.\n" +
        "Example for Teams: ^\\((\\d+)\\)",
      currentPattern,
    );

    if (pattern !== null) {
      // Only proceed if user didn't click Cancel
      let finalPattern = pattern.trim();
      let message = "";

      if (!finalPattern) {
        finalPattern = DEFAULT_PATTERN;
        message = "Empty pattern provided. Tracking ALL title changes.";
        debugLog(message);
      } else {
        try {
          // Test if the pattern is valid regex
          new RegExp(finalPattern);
          message = `Title pattern updated to: ${finalPattern}`;
          debugLog(message);
        } catch (e) {
          finalPattern = DEFAULT_PATTERN;
          message = `Invalid regular expression! Falling back to tracking ALL title changes.\nError: ${e.message}`;
          debugLog(`Invalid pattern provided: ${e.message}`);
        }
      }

      config.titlePattern = finalPattern;
      alert(message);
    }
  }

  function configureTelegramSettings() {
    debugLog("Configuring Telegram settings");
    const token = prompt(
      "Enter your Telegram Bot Token (leave empty to clear):",
      config.telegramBotToken,
    );
    if (token !== null) {
      config.telegramBotToken = token.trim();
      const chatId = prompt(
        "Enter your Telegram Chat ID (leave empty to clear):",
        config.telegramChatId,
      );
      if (chatId !== null) {
        config.telegramChatId = chatId.trim();
        alert(
          `Telegram settings ${
            config.telegramBotToken && config.telegramChatId
              ? "updated."
              : "cleared."
          }`,
        );
        updateMenuCommands();
        checkConfiguration(false);
        if (config.telegramBotToken && config.telegramChatId) {
          sendTestMessage("Telegram settings updated. This is a test message.");
        }
      }
    }
  }

  function toggleTitleChangeTracking() {
    config.titleChangeTrackingEnabled = !config.titleChangeTrackingEnabled;
    updateMenuCommands();
  }

  function toggleNotificationInterception() {
    config.notificationInterceptionEnabled =
      !config.notificationInterceptionEnabled;
    updateMenuCommands();
  }

  function updateTitleChangeTracking() {
    if (config.titleChangeTrackingEnabled) {
      observeTitleChanges();
      debugLog(`Title change tracking enabled for ${currentDomain}`);
    } else {
      stopObservingTitleChanges();
      debugLog(`Title change tracking disabled for ${currentDomain}`);
    }
  }

  function updateNotificationInterception() {
    if (
      config.notificationInterceptionEnabled &&
      unsafeWindow.Notification.permission === "granted"
    ) {
      interceptNotifications();
      debugLog(`Notification interception enabled for ${currentDomain}`);
    } else {
      restoreOriginalNotifications();
      debugLog(`Notification interception disabled for ${currentDomain}`);
    }
  }

  function checkConfiguration(isInitialCheck = false) {
    const isConfigured = config.telegramBotToken && config.telegramChatId;
    if (!isConfigured) {
      const missingItems = [];
      if (!config.telegramBotToken) missingItems.push("Telegram Bot Token");
      if (!config.telegramChatId) missingItems.push("Telegram Chat ID");

      const message = `Notification Monitor: Configuration incomplete. Please set the following:\n${missingItems.join(
        "\n",
      )}\n\nUse the userscript manager's menu to configure.`;

      if (isInitialCheck) {
        alert(message);
      }

      debugLog(`Configuration incomplete: ${missingItems.join(", ")}`);
      return false;
    }
    debugLog("Configuration is complete");
    return true;
  }

  function sendTestMessage(message) {
    if (!checkConfiguration()) {
      return;
    }
    sendTelegramMessage(message)
      .then(() => {
        debugLog("Test message sent successfully");
        alert(
          "Test message sent successfully. Check your Telegram for the message.",
        );
      })
      .catch((error) => {
        debugLog(`Failed to send test message: ${error}`);
        alert(
          "Failed to send test message. Please check your Telegram configuration.",
        );
      });
  }

  function sendTelegramMessage(message) {
    if (!checkConfiguration()) {
      return Promise.reject("Incomplete configuration");
    }

    const TELEGRAM_API = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: TELEGRAM_API,
        data: JSON.stringify({
          chat_id: config.telegramChatId,
          text: message,
          parse_mode: "HTML",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        onload: (response) => {
          if (response.status === 200) {
            resolve(response);
          } else {
            reject(`HTTP ${response.status}: ${response.statusText}`);
          }
        },
        onerror: (error) => {
          console.error("Error sending Telegram message:", error);
          reject(error);
        },
      });
    });
  }

  function sendInitializationMessage() {
    const message = `Notification monitor initialized for ${currentDomain}`;
    sendTelegramMessage(message)
      .then(() => {
        debugLog("Initialization message sent successfully");
      })
      .catch((error) => {
        debugLog(`Failed to send initialization message: ${error}`);
        alert(
          "Notification Monitor: Failed to send initialization message to Telegram. Please check your configuration and network connection.",
        );
      });
  }

  // Helper function to create a human-readable string representation of an object
  function objectToString(obj, indent = "") {
    if (typeof obj !== "object" || obj === null) {
      return String(obj);
    }

    const lines = Object.entries(obj).map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        return `${indent}${key}:\n${objectToString(value, `${indent}  `)}`;
      }
      return `${indent}${key}: ${value}`;
    });

    return lines.join("\n");
  }

  // Notification interception
  let OriginalNotification;

  function interceptNotifications() {
    if (OriginalNotification) return; // Already intercepted

    OriginalNotification = unsafeWindow.Notification;

    function CustomNotification(title, options) {
      debugLog(
        `Intercepted desktop notification: ${title}, ${JSON.stringify(options)}`,
      );

      let message = `<b>${currentDomain}</b>\n<b>${title}</b>\n${
        options.body || "New notification"
      }`;

      // Add data attribute information if it exists
      if (options.data) {
        message += `\n\nAdditional Data:\n${objectToString(options.data)}`;
      }

      sendTelegramMessage(message);

      return new OriginalNotification(title, options);
    }

    CustomNotification.permission = OriginalNotification.permission;
    CustomNotification.requestPermission =
      OriginalNotification.requestPermission.bind(OriginalNotification);

    unsafeWindow.Notification = CustomNotification;
  }

  function restoreOriginalNotifications() {
    if (OriginalNotification) {
      unsafeWindow.Notification = OriginalNotification;
      OriginalNotification = null;
      debugLog("Restored original notifications");
    }
  }

  // Tab title change monitoring
  let lastTabTitle = document.title;
  let titleObserver;

  function observeTitleChanges() {
    if (titleObserver) return; // Already observing

    const target = document.querySelector("title");
    titleObserver = new MutationObserver(() => {
      const currentTitle = document.title;
      if (currentTitle !== lastTabTitle) {
        debugLog(
          `(Tab title) Title changed from "${lastTabTitle}" to "${currentTitle}"`,
        );

        try {
          const pattern = new RegExp(config.titlePattern);
          if (pattern.test(currentTitle)) {
            sendTelegramMessage(
              `<b>${currentDomain}</b>\nTab title changed to: ${currentTitle}`,
            );
          } else {
            debugLog(
              `Title change ignored - doesn't match pattern: ${config.titlePattern}`,
            );
          }
        } catch (e) {
          debugLog(
            `Error with pattern matching: ${e.message}. Falling back to tracking all changes.`,
          );
          config.titlePattern = DEFAULT_PATTERN;
          sendTelegramMessage(
            `<b>${currentDomain}</b>\nTab title changed to: ${currentTitle}`,
          );
        }

        lastTabTitle = currentTitle;
      }
    });

    titleObserver.observe(target, {
      subtree: true,
      characterData: true,
      childList: true,
    });
  }

  function stopObservingTitleChanges() {
    if (titleObserver) {
      titleObserver.disconnect();
      titleObserver = null;
      debugLog("Stopped observing title changes");
    }
  }

  // Initialize the script
  function init() {
    debugLog(`Notification monitor setup starting for ${currentDomain}.`);
    updateMenuCommands();
    if (checkConfiguration(true)) {
      updateTitleChangeTracking();
      updateNotificationInterception();
      sendInitializationMessage();
    } else {
      debugLog("Telegram configuration incomplete. Skipping initialization.");
    }
    debugLog(`Notification monitor setup complete for ${currentDomain}.`);
  }

  // Run the initialization
  init();
})();
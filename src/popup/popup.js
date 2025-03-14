/**
 * UI Control for Password Generator Extension
 */
document.addEventListener("DOMContentLoaded", async function () {
  const passwordGenerator = new PasswordGenerator();
  const passwordStorage = new PasswordStorage();

  const passwordOutput = document.getElementById("passwordOutput");
  const copyButton = document.getElementById("copyButton");
  const generateButton = document.getElementById("generateButton");
  const passwordLengthInput = document.getElementById("passwordLength");
  const lengthValue = document.getElementById("lengthValue");
  const lowercaseCheckbox = document.getElementById("lowercase");
  const uppercaseCheckbox = document.getElementById("uppercase");
  const numbersCheckbox = document.getElementById("numbers");
  const specialCheckbox = document.getElementById("special");
  const excludeSimilarCheckbox = document.getElementById("excludeSimilar");
  const excludeAmbiguousCheckbox = document.getElementById("excludeAmbiguous");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  const clearHistoryButton = document.getElementById("clearHistoryButton");
  const historyList = document.getElementById("historyList");
  const strengthIndicator = document.getElementById("strengthIndicator");
  const strengthText = document.getElementById("strengthText");

  async function loadSettings() {
    const settings = await passwordStorage.getSettings();

    passwordLengthInput.value = settings.length;
    lengthValue.textContent = settings.length;
    lowercaseCheckbox.checked = settings.lowercase;
    uppercaseCheckbox.checked = settings.uppercase;
    numbersCheckbox.checked = settings.numbers;
    specialCheckbox.checked = settings.special;
    excludeSimilarCheckbox.checked = settings.excludeSimilar;
    excludeAmbiguousCheckbox.checked = settings.excludeAmbiguous;
  }

  async function saveSettings() {
    const settings = {
      length: parseInt(passwordLengthInput.value),
      lowercase: lowercaseCheckbox.checked,
      uppercase: uppercaseCheckbox.checked,
      numbers: numbersCheckbox.checked,
      special: specialCheckbox.checked,
      excludeSimilar: excludeSimilarCheckbox.checked,
      excludeAmbiguous: excludeAmbiguousCheckbox.checked,
    };

    await passwordStorage.saveSettings(settings);
  }

  /**
   * Get current settings from UI
   */
  function getCurrentSettings() {
    return {
      length: parseInt(passwordLengthInput.value),
      lowercase: lowercaseCheckbox.checked,
      uppercase: uppercaseCheckbox.checked,
      numbers: numbersCheckbox.checked,
      special: specialCheckbox.checked,
      excludeSimilar: excludeSimilarCheckbox.checked,
      excludeAmbiguous: excludeAmbiguousCheckbox.checked,
    };
  }

  function generatePassword() {
    try {
      if (
        !lowercaseCheckbox.checked &&
        !uppercaseCheckbox.checked &&
        !numbersCheckbox.checked &&
        !specialCheckbox.checked
      ) {
        showToast("Please select at least one character type");
        return;
      }

      const settings = getCurrentSettings();
      const newPassword = passwordGenerator.generatePassword(settings);

      passwordOutput.value = newPassword;
      updateStrengthMeter(newPassword);

      passwordStorage.savePassword(newPassword);

      const historyTab = document.getElementById("history");
      if (historyTab.classList.contains("active")) {
        loadPasswordHistory();
      }
    } catch (error) {
      showToast(error.message);
    }
  }

  /**
   * Update the strength meter for the current password
   */
  function updateStrengthMeter(password) {
    if (!password) {
      strengthIndicator.style.width = "0%";
      strengthIndicator.style.backgroundColor = "#ddd";
      strengthText.textContent = "None";
      return;
    }

    const strength = passwordGenerator.calculateStrength(password);

    strengthIndicator.style.width = `${strength.score}%`;

    if (strength.score < 20) {
      strengthIndicator.style.backgroundColor = "#ff4040";
    } else if (strength.score < 40) {
      strengthIndicator.style.backgroundColor = "#ff8040";
    } else if (strength.score < 60) {
      strengthIndicator.style.backgroundColor = "#ffbf40";
    } else if (strength.score < 80) {
      strengthIndicator.style.backgroundColor = "#80c040";
    } else {
      strengthIndicator.style.backgroundColor = "#40a040";
    }

    strengthText.textContent = strength.label;
  }

  /**
   * Load password history and display in UI
   */
  async function loadPasswordHistory() {
    const history = await passwordStorage.getHistory();

    historyList.innerHTML = "";

    if (history.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No password history yet";
      historyList.appendChild(emptyState);
      return;
    }

    history.forEach((item) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";

      const passwordText = document.createElement("div");
      passwordText.className = "history-password";
      passwordText.textContent = item.password;

      const actions = document.createElement("div");
      actions.className = "history-actions";

      const copyBtn = document.createElement("button");
      copyBtn.className = "history-copy";
      copyBtn.title = "Copy";
      copyBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "history-delete";
      deleteBtn.title = "Delete";
      deleteBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

      copyBtn.addEventListener("click", () => {
        copyToClipboard(item.password);
      });

      deleteBtn.addEventListener("click", async () => {
        await passwordStorage.deletePassword(item.id);
        loadPasswordHistory();
      });

      actions.appendChild(copyBtn);
      actions.appendChild(deleteBtn);

      historyItem.appendChild(passwordText);
      historyItem.appendChild(actions);

      historyList.appendChild(historyItem);
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("Password copied to clipboard");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        showToast("Failed to copy password");
      });
  }

  function showToast(message) {
    const existingToast = document.querySelector(".success-message");
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "success-message";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");

      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
  }

  function switchTab(targetTab) {
    tabButtons.forEach((button) => {
      if (button.dataset.tab === targetTab) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });

    tabContents.forEach((content) => {
      if (content.id === targetTab) {
        content.classList.add("active");

        if (targetTab === "history") {
          loadPasswordHistory();
        }
      } else {
        content.classList.remove("active");
      }
    });
  }

  generateButton.addEventListener("click", generatePassword);

  copyButton.addEventListener("click", () => {
    if (passwordOutput.value) {
      copyToClipboard(passwordOutput.value);
    }
  });

  passwordLengthInput.addEventListener("input", () => {
    lengthValue.textContent = passwordLengthInput.value;
    saveSettings();
  });

  const checkboxes = [
    lowercaseCheckbox,
    uppercaseCheckbox,
    numbersCheckbox,
    specialCheckbox,
    excludeSimilarCheckbox,
    excludeAmbiguousCheckbox,
  ];

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", saveSettings);
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });

  clearHistoryButton.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all password history?")) {
      await passwordStorage.clearHistory();
      loadPasswordHistory();
    }
  });

  await loadSettings();
  generatePassword();
});

// ExpenseTracker Pro - Main Application Logic

// ============================================
// Configuration & Constants
// ============================================

const CATEGORIES = {
  food: { icon: "🍔", name: "Food", color: "#f97316" },
  transport: { icon: "🚗", name: "Transport", color: "#3b82f6" },
  shopping: { icon: "🛍️", name: "Shopping", color: "#ec4899" },
  bills: { icon: "📄", name: "Bills", color: "#8b5cf6" },
  entertainment: { icon: "🎬", name: "Entertainment", color: "#06b6d4" },
  health: { icon: "💊", name: "Health", color: "#10b981" },
  education: { icon: "📚", name: "Education", color: "#f59e0b" },
  other: { icon: "📦", name: "Other", color: "#6b7280" },
};

const DB_KEYS = {
  USER: "expense_tracker_user",
  EXPENSES: "expense_tracker_expenses",
  SETTINGS: "expense_tracker_settings",
  NOTIFICATIONS: "expense_tracker_notifications",
};

// ============================================
// State Management
// ============================================

let state = {
  user: null,
  expenses: [],
  settings: {
    darkMode: false,
    notifications: true,
    largeExpenseAlert: true,
  },
  notifications: [],
  currentView: "dashboard",
  editingExpense: null,
  deleteExpenseId: null,
  searchTerm: "",
  categoryFilter: "",
  dateFilter: "",
};

// ============================================
// DOM Elements
// ============================================

const elements = {
  // Auth
  authContainer: document.getElementById("auth-container"),
  appContainer: document.getElementById("app-container"),
  loginForm: document.getElementById("login-form"),
  signupForm: document.getElementById("signup-form"),
  authTabs: document.querySelectorAll(".auth-tab"),

  // Navigation
  menuToggle: document.getElementById("menu-toggle"),
  bottomNav: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),

  // Dashboard
  addExpenseBtn: document.getElementById("add-expense-btn"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
  dateFilter: document.getElementById("date-filter"),
  expenseList: document.getElementById("expense-list"),

  // Summary Cards
  totalExpenses: document.getElementById("total-expenses"),
  dailyAverage: document.getElementById("daily-average"),
  totalTransactions: document.getElementById("total-transactions"),

  // Modals
  expenseModal: document.getElementById("expense-modal"),
  expenseForm: document.getElementById("expense-form"),
  modalTitle: document.getElementById("modal-title"),
  modalClose: document.getElementById("modal-close"),
  modalCancel: document.getElementById("modal-cancel"),
  deleteModal: document.getElementById("delete-modal"),
  deleteModalClose: document.getElementById("delete-modal-close"),
  deleteCancel: document.getElementById("delete-cancel"),
  deleteConfirm: document.getElementById("delete-confirm"),

  // Form Fields
  expenseId: document.getElementById("expense-id"),
  expenseTitle: document.getElementById("expense-title"),
  expenseAmount: document.getElementById("expense-amount"),
  expenseCategory: document.getElementById("expense-category"),
  expenseDate: document.getElementById("expense-date"),
  expenseNotes: document.getElementById("expense-notes"),

  // Notifications
  notificationBtn: document.getElementById("notification-btn"),
  notificationPanel: document.getElementById("notification-panel"),
  notificationBadge: document.getElementById("notification-badge"),
  notificationList: document.getElementById("notification-list"),
  clearNotifications: document.getElementById("clear-notifications"),

  // Settings
  darkModeToggle: document.getElementById("dark-mode-toggle"),
  notificationsToggle: document.getElementById("notifications-toggle"),
  largeExpenseAlert: document.getElementById("large-expense-alert"),
  exportData: document.getElementById("export-data"),
  importData: document.getElementById("import-data"),
  importFile: document.getElementById("import-file"),
  logoutBtn: document.getElementById("logout-btn"),
  deleteAccountBtn: document.getElementById("delete-account-btn"),

  // Analytics
  categoryChart: document.getElementById("category-chart"),
  monthlyChart: document.getElementById("monthly-chart"),
  highestCategory: document.getElementById("highest-category"),
  lowestCategory: document.getElementById("lowest-category"),
  avgTransaction: document.getElementById("avg-transaction"),
  monthComparison: document.getElementById("month-comparison"),

  // User
  userAvatar: document.getElementById("user-avatar"),

  // Install Prompt
  installPrompt: document.getElementById("install-prompt"),
  dismissInstall: document.getElementById("dismiss-install"),
  confirmInstall: document.getElementById("confirm-install"),
};

let charts = {
  category: null,
  monthly: null,
};

let deferredPrompt;

// ============================================
// Initialization
// ============================================

function init() {
  loadState();
  setupEventListeners();
  setupServiceWorker();
  setupPWA();

  if (state.user) {
    showApp();
  } else {
    showAuth();
  }

  applyTheme();
  updateUI();
}

function loadState() {
  try {
    const userData = localStorage.getItem(DB_KEYS.USER);
    const expensesData = localStorage.getItem(DB_KEYS.EXPENSES);
    const settingsData = localStorage.getItem(DB_KEYS.SETTINGS);
    const notificationsData = localStorage.getItem(DB_KEYS.NOTIFICATIONS);

    if (userData) state.user = JSON.parse(userData);
    if (expensesData) state.expenses = JSON.parse(expensesData);
    if (settingsData)
      state.settings = { ...state.settings, ...JSON.parse(settingsData) };
    if (notificationsData) state.notifications = JSON.parse(notificationsData);
  } catch (e) {
    console.error("Error loading state:", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(DB_KEYS.USER, JSON.stringify(state.user));
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(state.expenses));
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(
      DB_KEYS.NOTIFICATIONS,
      JSON.stringify(state.notifications),
    );
  } catch (e) {
    console.error("Error saving state:", e);
  }
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Auth Tabs
  elements.authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.tab));
  });

  // Auth Forms
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.signupForm.addEventListener("submit", handleSignup);

  // Navigation
  elements.bottomNav.forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Add Expense
  elements.addExpenseBtn.addEventListener("click", openAddExpenseModal);

  // Search & Filter
  elements.searchInput.addEventListener("input", handleSearch);
  elements.categoryFilter.addEventListener("change", handleFilter);
  elements.dateFilter.addEventListener("change", handleFilter);

  // Modal
  elements.modalClose.addEventListener("click", closeExpenseModal);
  elements.modalCancel.addEventListener("click", closeExpenseModal);
  elements.expenseModal.addEventListener("click", (e) => {
    if (e.target === elements.expenseModal) closeExpenseModal();
  });
  elements.expenseForm.addEventListener("submit", handleExpenseSubmit);

  // Delete Modal
  elements.deleteModalClose.addEventListener("click", closeDeleteModal);
  elements.deleteCancel.addEventListener("click", closeDeleteModal);
  elements.deleteConfirm.addEventListener("click", confirmDelete);
  elements.deleteModal.addEventListener("click", (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  // Notifications
  elements.notificationBtn.addEventListener("click", toggleNotificationPanel);
  elements.clearNotifications.addEventListener("click", clearAllNotifications);
  document.addEventListener("click", (e) => {
    if (
      !elements.notificationPanel.contains(e.target) &&
      e.target !== elements.notificationBtn
    ) {
      elements.notificationPanel.classList.add("hidden");
    }
  });

  // Settings
  elements.darkModeToggle.addEventListener("change", toggleDarkMode);
  elements.notificationsToggle.addEventListener("change", toggleNotifications);
  elements.largeExpenseAlert.addEventListener(
    "change",
    toggleLargeExpenseAlert,
  );
  elements.exportData.addEventListener("click", exportData);
  elements.importData.addEventListener("click", () =>
    elements.importFile.click(),
  );
  elements.importFile.addEventListener("change", importData);
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.deleteAccountBtn.addEventListener("click", handleDeleteAccount);

  // Password Toggle
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  });

  // Install Prompt
  elements.dismissInstall.addEventListener("click", () => {
    elements.installPrompt.classList.add("hidden");
  });
  elements.confirmInstall.addEventListener("click", installPWA);
}

// ============================================
// Authentication
// ============================================

function switchAuthTab(tab) {
  elements.authTabs.forEach((t) => t.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");

  elements.loginForm.classList.toggle("active", tab === "login");
  elements.signupForm.classList.toggle("active", tab === "signup");
}

function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const users = JSON.parse(
    localStorage.getItem("expense_tracker_users") || "[]",
  );
  const user = users.find(
    (u) => u.email === email && u.password === btoa(password),
  );

  if (user) {
    state.user = { name: user.name, email: user.email };
    saveState();
    showApp();
    showToast("Welcome back, " + user.name + "!", "success");
  } else {
    showToast("Invalid email or password", "error");
  }
}

function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  const users = JSON.parse(
    localStorage.getItem("expense_tracker_users") || "[]",
  );

  if (users.find((u) => u.email === email)) {
    showToast("Email already registered", "error");
    return;
  }

  users.push({ name, email, password: btoa(password) });
  localStorage.setItem("expense_tracker_users", JSON.stringify(users));

  state.user = { name, email };
  state.expenses = [];
  state.notifications = [];
  saveState();

  showApp();
  showToast("Account created successfully!", "success");
  addNotification(
    "Welcome to ExpenseTracker!",
    "Start tracking your expenses to get insights into your spending habits.",
    "success",
  );
}

function handleLogout() {
  state.user = null;
  state.expenses = [];
  state.notifications = [];
  saveState();
  showAuth();
  showToast("Logged out successfully", "info");
}

function handleDeleteAccount() {
  if (
    confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    )
  ) {
    const users = JSON.parse(
      localStorage.getItem("expense_tracker_users") || "[]",
    );
    const filteredUsers = users.filter((u) => u.email !== state.user.email);
    localStorage.setItem(
      "expense_tracker_users",
      JSON.stringify(filteredUsers),
    );

    localStorage.removeItem(DB_KEYS.USER);
    localStorage.removeItem(DB_KEYS.EXPENSES);
    localStorage.removeItem(DB_KEYS.SETTINGS);
    localStorage.removeItem(DB_KEYS.NOTIFICATIONS);

    state.user = null;
    state.expenses = [];
    state.notifications = [];
    saveState();

    showAuth();
    showToast("Account deleted", "info");
  }
}

// ============================================
// View Management
// ============================================

function showAuth() {
  elements.authContainer.classList.remove("hidden");
  elements.appContainer.classList.add("hidden");
}

function showApp() {
  elements.authContainer.classList.add("hidden");
  elements.appContainer.classList.remove("hidden");
  updateUI();
}

function switchView(view) {
  state.currentView = view;

  elements.bottomNav.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  elements.views.forEach((v) => {
    v.classList.toggle("active", v.id === `${view}-view`);
  });

  if (view === "analytics") {
    renderAnalytics();
  }
}

// ============================================
// Expense Management
// ============================================

function openAddExpenseModal() {
  state.editingExpense = null;
  elements.modalTitle.textContent = "Add Expense";
  elements.expenseForm.reset();
  elements.expenseDate.value = new Date().toISOString().split("T")[0];
  elements.expenseModal.classList.remove("hidden");
}

function openEditExpenseModal(expense) {
  state.editingExpense = expense;
  elements.modalTitle.textContent = "Edit Expense";

  elements.expenseId.value = expense.id;
  elements.expenseTitle.value = expense.title;
  elements.expenseAmount.value = expense.amount;
  elements.expenseCategory.value = expense.category;
  elements.expenseDate.value = expense.date;
  elements.expenseNotes.value = expense.notes || "";

  elements.expenseModal.classList.remove("hidden");
}

function closeExpenseModal() {
  elements.expenseModal.classList.add("hidden");
  state.editingExpense = null;
}

function handleExpenseSubmit(e) {
  e.preventDefault();

  const expenseData = {
    id: elements.expenseId.value || Date.now().toString(),
    title: elements.expenseTitle.value.trim(),
    amount: parseFloat(elements.expenseAmount.value),
    category: elements.expenseCategory.value,
    date: elements.expenseDate.value,
    notes: elements.expenseNotes.value.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (state.editingExpense) {
    const index = state.expenses.findIndex((e) => e.id === expenseData.id);
    if (index !== -1) {
      expenseData.createdAt = state.expenses[index].createdAt;
      state.expenses[index] = expenseData;
      showToast("Expense updated", "success");
    }
  } else {
    expenseData.createdAt = new Date().toISOString();
    state.expenses.unshift(expenseData);
    showToast("Expense added", "success");

    // Check for large expense
    if (state.settings.largeExpenseAlert && expenseData.amount > 100) {
      addNotification(
        "Large Expense Detected",
        `You spent $${expenseData.amount.toFixed(2)} on ${CATEGORIES[expenseData.category]?.name || "expense"}`,
        "warning",
      );
    }
  }

  saveState();
  closeExpenseModal();
  updateUI();
}

function openDeleteModal(expenseId) {
  state.deleteExpenseId = expenseId;
  elements.deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  state.deleteExpenseId = null;
  elements.deleteModal.classList.add("hidden");
}

function confirmDelete() {
  if (state.deleteExpenseId) {
    state.expenses = state.expenses.filter(
      (e) => e.id !== state.deleteExpenseId,
    );
    saveState();
    updateUI();
    showToast("Expense deleted", "success");
  }
  closeDeleteModal();
}

// ============================================
// Search & Filter
// ============================================

function handleSearch(e) {
  state.searchTerm = e.target.value.toLowerCase();
  renderExpenses();
}

function handleFilter() {
  state.categoryFilter = elements.categoryFilter.value;
  state.dateFilter = elements.dateFilter.value;
  renderExpenses();
}

function getFilteredExpenses() {
  let filtered = [...state.expenses];

  if (state.searchTerm) {
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(state.searchTerm) ||
        (e.notes && e.notes.toLowerCase().includes(state.searchTerm)),
    );
  }

  if (state.categoryFilter) {
    filtered = filtered.filter((e) => e.category === state.categoryFilter);
  }

  if (state.dateFilter) {
    filtered = filtered.filter((e) => e.date === state.dateFilter);
  }

  return filtered;
}

// ============================================
// UI Updates
// ============================================

function updateUI() {
  renderSummaryCards();
  renderExpenses();
  renderNotifications();
  updateUserAvatar();
}

function renderSummaryCards() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = state.expenses.filter((e) => {
    const date = new Date(e.date);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  const total = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysPassed = now.getDate();
  const dailyAvg = daysPassed > 0 ? total / daysPassed : 0;

  elements.totalExpenses.textContent = formatCurrency(total);
  elements.dailyAverage.textContent = formatCurrency(dailyAvg);
  elements.totalTransactions.textContent = monthlyExpenses.length;
}

function renderExpenses() {
  const filtered = getFilteredExpenses();

  if (filtered.length === 0) {
    elements.expenseList.innerHTML = `
            <div class="expense-empty">
                <i class="fas fa-receipt"></i>
                <h3>No expenses found</h3>
                <p>${state.expenses.length === 0 ? "Add your first expense to get started" : "Try adjusting your search or filters"}</p>
            </div>
        `;
    return;
  }

  elements.expenseList.innerHTML = filtered
    .map((expense) => {
      const category = CATEGORIES[expense.category] || CATEGORIES.other;
      return `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-category-icon ${expense.category}">
                    ${category.icon}
                </div>
                <div class="expense-details">
                    <div class="expense-title">${escapeHtml(expense.title)}</div>
                    <div class="expense-meta">
                        <span>${category.name}</span>
                        <span>•</span>
                        <span>${formatDate(expense.date)}</span>
                    </div>
                </div>
                <div class="expense-amount">-${formatCurrency(expense.amount)}</div>
                <div class="expense-actions">
                    <button class="expense-action-btn edit" onclick="openEditExpenseModal(state.expenses.find(e => e.id === '${expense.id}'))" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="expense-action-btn delete" onclick="openDeleteModal('${expense.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    })
    .join("");
}

// ============================================
// Analytics
// ============================================

function renderAnalytics() {
  renderCategoryChart();
  renderMonthlyChart();
  renderStats();
}

function renderCategoryChart() {
  const ctx = elements.categoryChart.getContext("2d");

  const categoryTotals = {};
  state.expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categoryTotals).map(
    (c) => CATEGORIES[c]?.name || c,
  );
  const data = Object.values(categoryTotals);
  const colors = Object.keys(categoryTotals).map(
    (c) => CATEGORIES[c]?.color || "#6b7280",
  );

  if (charts.category) {
    charts.category.destroy();
  }

  charts.category = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: getComputedStyle(document.body).getPropertyValue(
              "--text-secondary",
            ),
            padding: 16,
            usePointStyle: true,
          },
        },
      },
    },
  });
}

function renderMonthlyChart() {
  const ctx = elements.monthlyChart.getContext("2d");

  const months = [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentYear, currentMonth - i, 1);
    const monthKey = month.toISOString().slice(0, 7);
    const monthName = month.toLocaleDateString("en-US", { month: "short" });

    const total = state.expenses
      .filter((e) => e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0);

    months.push({ name: monthName, total });
  }

  if (charts.monthly) {
    charts.monthly.destroy();
  }

  charts.monthly = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map((m) => m.name),
      datasets: [
        {
          label: "Expenses",
          data: months.map((m) => m.total),
          backgroundColor: getComputedStyle(document.body).getPropertyValue(
            "--primary-color",
          ),
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: getComputedStyle(document.body).getPropertyValue(
              "--border-color",
            ),
          },
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue(
              "--text-secondary",
            ),
            callback: (value) => "$" + value,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue(
              "--text-secondary",
            ),
          },
        },
      },
    },
  });
}

function renderStats() {
  const categoryTotals = {};
  state.expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (categories.length > 0) {
    elements.highestCategory.textContent = `${CATEGORIES[categories[0][0]]?.icon || "📦"} ${CATEGORIES[categories[0][0]]?.name || "Other"}`;
    elements.lowestCategory.textContent = `${CATEGORIES[categories[categories.length - 1][0]]?.icon || "📦"} ${CATEGORIES[categories[categories.length - 1][0]]?.name || "Other"}`;
  } else {
    elements.highestCategory.textContent = "-";
    elements.lowestCategory.textContent = "-";
  }

  const avg =
    state.expenses.length > 0
      ? state.expenses.reduce((sum, e) => sum + e.amount, 0) /
        state.expenses.length
      : 0;
  elements.avgTransaction.textContent = formatCurrency(avg);

  // Month comparison
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentTotal = state.expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const lastTotal = state.expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  if (lastTotal > 0) {
    const diff = ((currentTotal - lastTotal) / lastTotal) * 100;
    elements.monthComparison.textContent = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    elements.monthComparison.className =
      "stat-value " + (diff > 0 ? "negative" : "positive");
  } else {
    elements.monthComparison.textContent = "-";
    elements.monthComparison.className = "stat-value";
  }
}

// ============================================
// Notifications
// ============================================

function addNotification(title, message, type = "info") {
  const notification = {
    id: Date.now().toString(),
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
  };

  state.notifications.unshift(notification);
  saveState();
  renderNotifications();

  // Browser notification
  if (
    state.settings.notifications &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification("ExpenseTracker", { body: message });
  }
}

function renderNotifications() {
  const unreadCount = state.notifications.filter((n) => !n.read).length;
  elements.notificationBadge.textContent = unreadCount;
  elements.notificationBadge.classList.toggle("hidden", unreadCount === 0);

  if (state.notifications.length === 0) {
    elements.notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
            </div>
        `;
    return;
  }

  elements.notificationList.innerHTML = state.notifications
    .map(
      (n) => `
        <div class="notification-item ${n.read ? "" : "unread"}" data-id="${n.id}">
            <div class="notification-icon ${n.type}">
                <i class="fas fa-${n.type === "success" ? "check" : n.type === "warning" ? "exclamation" : "info"}-circle"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(n.title)}</div>
                <div class="notification-message">${escapeHtml(n.message)}</div>
                <div class="notification-time">${formatTimeAgo(n.timestamp)}</div>
            </div>
        </div>
    `,
    )
    .join("");

  // Add click handlers to mark as read
  elements.notificationList
    .querySelectorAll(".notification-item")
    .forEach((item) => {
      item.addEventListener("click", () => {
        const notification = state.notifications.find(
          (n) => n.id === item.dataset.id,
        );
        if (notification) {
          notification.read = true;
          saveState();
          renderNotifications();
        }
      });
    });
}

function toggleNotificationPanel() {
  elements.notificationPanel.classList.toggle("hidden");
}

function clearAllNotifications() {
  state.notifications = [];
  saveState();
  renderNotifications();
  showToast("All notifications cleared", "info");
}

// ============================================
// Settings
// ============================================

function toggleDarkMode() {
  state.settings.darkMode = elements.darkModeToggle.checked;
  saveState();
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute(
    "data-theme",
    state.settings.darkMode ? "dark" : "light",
  );
  elements.darkModeToggle.checked = state.settings.darkMode;
}

function toggleNotifications() {
  state.settings.notifications = elements.notificationsToggle.checked;
  saveState();

  if (
    state.settings.notifications &&
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    Notification.requestPermission();
  }
}

function toggleLargeExpenseAlert() {
  state.settings.largeExpenseAlert = elements.largeExpenseAlert.checked;
  saveState();
}

function updateSettingsUI() {
  elements.notificationsToggle.checked = state.settings.notifications;
  elements.largeExpenseAlert.checked = state.settings.largeExpenseAlert;
}

function updateUserAvatar() {
  if (state.user) {
    elements.userAvatar.textContent = state.user.name.charAt(0).toUpperCase();
  }
}

function exportData() {
  const data = {
    user: state.user,
    expenses: state.expenses,
    settings: state.settings,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast("Data exported successfully", "success");
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);

      if (data.expenses && Array.isArray(data.expenses)) {
        state.expenses = data.expenses;
      }

      if (data.settings) {
        state.settings = { ...state.settings, ...data.settings };
      }

      saveState();
      applyTheme();
      updateUI();
      showToast("Data imported successfully", "success");
    } catch (err) {
      showToast("Invalid file format", "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// ============================================
// PWA & Service Worker
// ============================================

function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => console.log("Service Worker registered"))
      .catch((err) => console.log("Service Worker registration failed:", err));
  }
}

function setupPWA() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install prompt after a delay
    setTimeout(() => {
      const dismissed = localStorage.getItem("install_prompt_dismissed");
      if (!dismissed) {
        elements.installPrompt.classList.remove("hidden");
      }
    }, 5000);
  });

  window.addEventListener("appinstalled", () => {
    elements.installPrompt.classList.add("hidden");
    deferredPrompt = null;
  });
}

function installPWA() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((result) => {
    if (result.outcome === "accepted") {
      showToast("App installed successfully", "success");
    }
    deferredPrompt = null;
    elements.installPrompt.classList.add("hidden");
  });
}

// ============================================
// Utilities
// ============================================

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago";
  if (seconds < 604800) return Math.floor(seconds / 86400) + " days ago";

  return formatDate(timestamp);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
        <span>${escapeHtml(message)}</span>
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastSlideUp 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// Initialize App
// ============================================

document.addEventListener("DOMContentLoaded", init);

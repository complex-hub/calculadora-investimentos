/**
 * Theme management for the application.
 * Handles light/dark mode toggling and persistence.
 */

const THEME_STORAGE_KEY = 'investment-calculator-theme';
const DATA_THEME_ATTR = 'data-theme';

export type Theme = 'light' | 'dark';

/**
 * Initializes the theme based on storage or system preference.
 */
export function initializeTheme(): void {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Check system preference
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(systemDark ? 'dark' : 'light');
  }

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only update if user hasn't manually set a preference
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * Toggles between light and dark themes.
 */
export function toggleTheme(): void {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  applyTheme(newTheme);
  saveTheme(newTheme);
}

/**
 * Applies the specified theme to the document.
 */
function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.setAttribute(DATA_THEME_ATTR, 'dark');
  } else {
    document.documentElement.removeAttribute(DATA_THEME_ATTR);
  }
  
  updateToggleButton(theme);
}

/**
 * Saves the theme preference to localStorage.
 */
function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Gets the currently applied theme.
 */
function getCurrentTheme(): Theme {
  return document.documentElement.getAttribute(DATA_THEME_ATTR) === 'dark' 
    ? 'dark' 
    : 'light';
}

/**
 * Updates the toggle button icon/text.
 */
function updateToggleButton(theme: Theme): void {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro';
  }
}

/**
 * Initializes the theme toggle button listener.
 */
export function initializeThemeToggle(): void {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
    // Set initial state
    updateToggleButton(getCurrentTheme());
  }
}

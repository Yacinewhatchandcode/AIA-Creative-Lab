type KeyboardShortcuts = {
  [key: string]: {
    keys: string[];
    description: string;
    action: () => void;
    global?: boolean; // If true, works regardless of focus
  };
};

class KeyboardService {
  private shortcuts: Map<string, KeyboardShortcuts[string]> = new Map();
  private isEnabled = true;

  constructor() {
    this.setupGlobalShortcuts();
    this.bindEvents();
  }

  private setupGlobalShortcuts() {
    // Global shortcuts that work anywhere
    this.addShortcut('history', {
      keys: ['ctrl', 'h'],
      description: 'Open History Gallery',
      action: () => {
        // This will need to be connected to the application state
        const event = new CustomEvent('openHistory');
        window.dispatchEvent(event);
      },
      global: true,
    });

    this.addShortcut('generate', {
      keys: ['ctrl', 'Enter'],
      description: 'Generate Content',
      action: () => {
        // Trigger generation focused form
        const focusedElement = document.activeElement;
        if (focusedElement?.tagName === 'TEXTAREA' || focusedElement?.tagName === 'INPUT') {
          const form = focusedElement.closest('form');
          if (form) {
            const submitButton = form.querySelector('button[type="submit"], button:not([type="button"])');
            if (submitButton) {
              (submitButton as HTMLButtonElement).click();
            }
          }
        }
      },
      global: true,
    });

    this.addShortcut('newChat', {
      keys: ['ctrl', 'shift', 'n'],
      description: 'New Chat',
      global: true,
      action: () => {
        const event = new CustomEvent('newChat');
        window.dispatchEvent(event);
      },
    });

    this.addShortcut('clearAll', {
      keys: ['ctrl', 'shift', 'Delete'],
      description: 'Clear Form',
      action: () => {
        const focusedElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
        if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA')) {
          focusedElement.value = '';
          focusedElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
    });

    this.addShortcut('toggleAdvanced', {
      keys: ['ctrl', ','],
      description: 'Toggle Advanced Settings',
      action: () => {
        const event = new CustomEvent('toggleAdvancedSettings');
        window.dispatchEvent(event);
      },
    });

    this.addShortcut('download', {
      keys: ['ctrl', 's'],
      description: 'Download Current Content',
      action: () => {
        // Look for download buttons or video/image elements
        const downloadButton = document.querySelector('a[download], button[download]') as HTMLAnchorElement;
        if (downloadButton) {
          downloadButton.click();
        }
      },
    });

    this.addShortcut('help', {
      keys: ['?'],
      description: 'Show Keyboard Shortcuts',
      action: () => {
        this.showShortcutsHelp();
      },
    });
  }

  private bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isEnabled) return;

    // Don't trigger shortcuts when typing in inputs
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && 
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         activeElement.contentEditable === 'true')) {
      // Allow global shortcuts in inputs, but not non-global ones
    }

    const keys = this.getPressedKeys(e);
    
    // Check each shortcut
    this.shortcuts.forEach((shortcut) => {
      if (this.keysMatch(shortcut.keys, keys)) {
        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
      }
    });
  };

  private getPressedKeys(e: KeyboardEvent): string[] {
    const keys: string[] = [];
    
    if (e.ctrlKey || e.metaKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    
    // Add the actual key
    const key = e.key.toLowerCase();
    if (!['control', 'meta', 'shift', 'alt'].includes(key)) {
      keys.push(key);
    }
    
    return keys;
  }

  private keysMatch(shortcutKeys: string[], pressedKeys: string[]): boolean {
    return shortcutKeys.length === pressedKeys.length && 
           shortcutKeys.every(key => pressedKeys.includes(key));
  }

  addShortcut(id: string, config: KeyboardShortcuts[string]) {
    this.shortcuts.set(id, config);
  }

  removeShortcut(id: string) {
    this.shortcuts.delete(id);
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  getAllShortcuts(): KeyboardShortcuts {
    const shortcuts: KeyboardShortcuts = {};
    this.shortcuts.forEach((value, key) => {
      shortcuts[key] = value;
    });
    return shortcuts;
  }

  private showShortcutsHelp() {
    const shortcuts = Array.from(this.shortcuts.entries()).map(([id, shortcut]) => ({
      id,
      description: shortcut.description,
      keys: shortcut.keys.join(' + ')
    }));

    const event = new CustomEvent('showKeyboardHelp', { detail: shortcuts });
    window.dispatchEvent(event);
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

export const keyboardService = new KeyboardService();


const { app, BrowserWindow, clipboard, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const axios = require('axios');
const path = require('path');
const ioHook = require('iohook');
const { exec } = require('child_process');

// Initialize API key variable
let GEMINI_API_KEY = '';

// Auto-start functionality
function enableAutoStart() {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: ['--hidden'] // Start minimized/hidden
  });
  console.log('✅ Auto-start enabled - app will start with Windows');
}

function disableAutoStart() {
  app.setLoginItemSettings({
    openAtLogin: false
  });
  console.log('❌ Auto-start disabled');
}

function isAutoStartEnabled() {
  return app.getLoginItemSettings().openAtLogin;
}

// Listen for auto-start toggle from renderer
ipcMain.on('toggle-auto-start', (event) => {
  const currentState = isAutoStartEnabled();
  if (currentState) {
    disableAutoStart();
  } else {
    enableAutoStart();
  }
  // Send updated state back to renderer
  event.reply('auto-start-status', !currentState);
});

// Get auto-start status
ipcMain.on('get-auto-start-status', (event) => {
  event.reply('auto-start-status', isAutoStartEnabled());
});

// Listen for API key from renderer
ipcMain.on('set-gemini-api-key', (event, key) => {
  if (typeof key === 'string' && key.trim()) {
    GEMINI_API_KEY = key.trim();
    console.log('Gemini API key set from settings UI.');
  }
});

let overlayWin = null;
let tray = null;

// Create system tray
function createTray() {
  // Create a simple icon using text (fallback if no icon file)
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVFiFtZc9aBRBFMd/u5vNJQQSCxsLwcJCG1sLG0uxsLGwsLBQsLCwsLGwsLGwsLBQsLCwsLGwsLCwsLGwsLBQsLCwsLGwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQsLCwsLGwsLCwsLCwsLBQ');
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'AI Desktop Assistant',
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Show Overlay (Ctrl+Shift+X)',
      click: () => {
        if (overlayWin) {
          const mousePos = screen.getCursorScreenPoint();
          overlayWin.setBounds({
            x: mousePos.x - 250,
            y: mousePos.y - 70,
            width: 500,
            height: 60
          });
          overlayWin.show();
          overlayWin.focus();
        }
      }
    },
    {
      label: 'Settings',
      click: () => {
        if (overlayWin) {
          overlayWin.show();
          overlayWin.webContents.executeJavaScript(`
            document.getElementById('settingsBtn').click();
          `);
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Auto-start: ' + (isAutoStartEnabled() ? 'ON' : 'OFF'),
      click: (menuItem) => {
        const currentState = isAutoStartEnabled();
        if (currentState) {
          disableAutoStart();
          menuItem.label = 'Auto-start: OFF';
        } else {
          enableAutoStart();
          menuItem.label = 'Auto-start: ON';
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('AI Desktop Assistant - Press Ctrl+Shift+X');
  tray.setContextMenu(contextMenu);
  
  // Show overlay on tray click
  tray.on('click', () => {
    if (overlayWin) {
      const mousePos = screen.getCursorScreenPoint();
      overlayWin.setBounds({
        x: mousePos.x - 250,
        y: mousePos.y - 70,
        width: 500,
        height: 60
      });
      overlayWin.show();
      overlayWin.focus();
    }
  });
}

// Pre-create hidden overlay window for faster response
function createOverlay() {
  // Prevent creating multiple instances
  if (overlayWin && !overlayWin.isDestroyed()) {
    console.log('Overlay window already exists');
    return;
  }

  overlayWin = new BrowserWindow({
    width: 500,
    height: 60,
    alwaysOnTop: true,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a1a',
    resizable: true,
    movable: true,
    show: false,
    closable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true, // Don't show in taskbar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  overlayWin.loadFile('copilot-overlay.html').catch(err => {
    console.error('Failed to load overlay:', err);
  });
  
  overlayWin.on('closed', () => {
    overlayWin = null;
  });

  // Handle Escape key to close overlay
  overlayWin.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') {
      overlayWin.hide();
    }
  });

  // Handle click outside to close (blur event) - with better debouncing
  let blurTimeout = null;
  overlayWin.on('blur', () => {
    // Clear any existing timeout
    if (blurTimeout) {
      clearTimeout(blurTimeout);
    }
    
    // Set new timeout
    blurTimeout = setTimeout(() => {
      if (overlayWin && overlayWin.isVisible() && !overlayWin.isFocused()) {
        overlayWin.hide();
      }
      blurTimeout = null;
    }, 150);
  });
  
  // Cancel blur timeout if window regains focus
  overlayWin.on('focus', () => {
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
  });
}

// Register Ctrl+Shift+X global hotkey - now requires manual Ctrl+C first
let lastClipboardText = '';
let isProcessingHotkey = false; // Debounce flag

ioHook.registerShortcut([29, 42, 45], async (keys) => {
  // Debounce to prevent multiple rapid triggers
  if (isProcessingHotkey) {
    console.log('Hotkey already being processed, ignoring...');
    return;
  }
  
  isProcessingHotkey = true;
  console.log('🔥 Ctrl+Shift+X pressed!');
  
  try {
    // Simply read current clipboard content (user should Ctrl+C first)
    lastClipboardText = clipboard.readText() || 'No text in clipboard. Please copy some text first (Ctrl+C).';
    console.log('Clipboard text to process:', lastClipboardText.substring(0, 100) + '...');
    
    // Ensure overlay exists
    if (!overlayWin) {
      createOverlay();
      // Wait for window to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Only proceed if window is ready and not already visible
    if (overlayWin && !overlayWin.isVisible()) {
      // Smart positioning based on mouse cursor
      const mousePos = screen.getCursorScreenPoint();
      const displays = screen.getAllDisplays();
      const currentDisplay = screen.getDisplayNearestPoint(mousePos);
      
      // Calculate overlay position (above cursor, within screen bounds)
      let overlayX = mousePos.x - 250; // Center horizontally around cursor
      let overlayY = mousePos.y - 70;  // Show above cursor
      
      // Ensure overlay stays within screen bounds
      overlayX = Math.max(currentDisplay.bounds.x + 10, 
                 Math.min(overlayX, currentDisplay.bounds.x + currentDisplay.bounds.width - 510));
      overlayY = Math.max(currentDisplay.bounds.y + 10, overlayY);
      
      // Show compact overlay (initial minimal size)
      overlayWin.setBounds({
        x: overlayX,
        y: overlayY,
        width: 500,
        height: 60 // Minimal prompt bar height
      });
      
      overlayWin.show();
      overlayWin.focus();
      overlayWin.webContents.send('set-clipboard-text', lastClipboardText);
      overlayWin.webContents.send('set-mode', 'compact'); // Signal compact mode
    }
  } catch (error) {
    console.error('Error processing hotkey:', error);
  } finally {
    // Reset debounce flag after a short delay
    setTimeout(() => {
      isProcessingHotkey = false;
    }, 500);
  }
});

// Optimized Gemini API setup - using faster flash-8b model
const GEMINI_MODEL = 'gemini-2.5-flash'; // Faster, cheaper model
function getGeminiApiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
}

// Optimized prompt templates to reduce token usage
const PROMPT_TEMPLATES = {
  explain: "Explain briefly:",
  summarize: "Summarize in 2-3 sentences:",
  translate: "Translate to Hindi:",
  debug: "Debug this code:",
  improve: "Improve this text:"
};

ipcMain.on('user-prompt', async (event, data) => {
  // Handle both old format (string) and new format (object with thinking preference)
  const prompt = typeof data === 'string' ? data : data.prompt;
  const thinkingEnabled = typeof data === 'object' ? data.thinking : false;
  
  console.log('User prompt:', prompt);
  console.log('Thinking enabled:', thinkingEnabled);
  console.log('Clipboard text (for AI):', lastClipboardText);
  
  // Show loading state and expand window for response
  if (overlayWin) {
    overlayWin.webContents.send('show-loading');
    
    // Expand window to show response (set height to 300px)
    const currentBounds = overlayWin.getBounds();
    overlayWin.setBounds({
      x: currentBounds.x,
      y: currentBounds.y,
      width: 500,
      height: 300 // Expanded for response
    });
  }
  
  try {
    // Optimize prompt to reduce tokens
    const optimizedPrompt = `${prompt}\n\nText: ${lastClipboardText.substring(0, 2000)}`; // Limit text to 2000 chars
    
    // Dynamic generation config based on thinking preference
    const generationConfig = {
      maxOutputTokens: thinkingEnabled ? 1000 : 600, // More tokens if thinking enabled
      temperature: 0.7
    };
    
    // Add thinking config only if needed
    if (!thinkingEnabled) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    
    const requestBody = {
      contents: [
        { parts: [{ text: optimizedPrompt }] }
      ],
      generationConfig: generationConfig
    };
    
    if (!GEMINI_API_KEY) {
      throw new Error('🔑 API Key Required\n\nPlease click the settings button (⚙️) in the overlay and enter your Gemini API key.\n\nGet your free API key from:\nhttps://aistudio.google.com/app/apikey');
    }
    const apiUrl = getGeminiApiUrl();
    console.log('Sending request to Gemini API...');
    const response = await axios.post(apiUrl, requestBody);
    console.log('Full API Response:', JSON.stringify(response.data, null, 2));
    
    let aiText = 'No response';
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        aiText = candidate.content.parts[0].text || 'Empty response';
      } else if (candidate.finishReason === 'MAX_TOKENS') {
        aiText = 'Response was cut short due to token limit. Please try with a shorter text or simpler prompt.';
      } else {
        aiText = `No text response (finish reason: ${candidate.finishReason || 'unknown'})`;
      }
    }
    
    console.log('Gemini AI response:', aiText);
    
    // Send response to overlay window with clean response mode
    if (overlayWin) {
      // Send the response
      overlayWin.webContents.send('ai-response', aiText);
      overlayWin.webContents.send('set-mode', 'response'); // Signal clean response mode
    }
  } catch (err) {
    console.error('Gemini API error:', err?.response?.data || err.message);
    if (overlayWin) {
      overlayWin.webContents.send('ai-response', `❌ Error: ${err?.response?.data?.error?.message || err.message || 'Network or API error occurred'}`);
      overlayWin.webContents.send('set-mode', 'response');
    }
  }
});

ioHook.start();

// Initialize overlay on app ready
app.whenReady().then(() => {
  console.log('App ready, initializing...');
  createOverlay();
  createTray();
  
  // If started with --hidden argument (auto-start), don't show overlay immediately
  const isHidden = process.argv.includes('--hidden');
  if (!isHidden) {
    console.log('App started normally');
  } else {
    console.log('App started in hidden mode (auto-start)');
  }
  
  console.log('Initialization complete. Ctrl+Shift+X hotkey is active.');
});

app.on('window-all-closed', () => {
  // Don't quit on window close - keep running in system tray
  console.log('All windows closed, but keeping app running in tray');
});

app.on('before-quit', () => {
  console.log('App quitting, cleaning up...');
  // Clean up tray when quitting
  if (tray) {
    tray.destroy();
  }
  // Clean up hotkey
  try {
    ioHook.stop();
  } catch (error) {
    console.log('Error stopping ioHook:', error);
  }
});
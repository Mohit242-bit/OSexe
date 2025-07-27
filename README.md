# AI Desktop Assistant

A modern Windows desktop assistant powered by Google Gemini Pro. Select any text, press a hotkey, and get instant AI-powered help—explain, summarize, translate, debug, and more!

---


## 🚀 Features

- **Global Hotkey**: Press `Ctrl+C` first, then `Ctrl+Shift+X` anywhere to activate the overlay
- **Clipboard Integration**: Instantly grabs selected text
- **Voice Input**: Use your microphone for hands-free prompts
- **Gemini API Integration**: Secure, user-supplied API key
- **Auto-start Option**: Start with Windows, runs in system tray
- **Quick Actions**: One-click explain, summarize, translate, debug
- **Minimalist UI**: Compact, dark-themed overlay
- **System Tray**: Easy access and background operation

---

## 🛠️ Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/Mohit242-bit/OSexe.git
   cd OSexe
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Build the Windows installer:**

   ```sh
   npm run build-win
   ```

4. **Run the app in development:**

   ```sh
   npm start
   ```

---

## 🔑 Setup Gemini API Key

- Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Click the ⚙️ settings button in the overlay and enter your API key
- Your key is securely stored locally

---


## ✨ Usage

- Select any text in any app
- Press `Ctrl+C` to copy the text
- Then press `Ctrl+Shift+X` to open the overlay
- Type or speak your prompt
- Use quick action buttons for common tasks
- View and copy the AI response

---

## 📦 Packaging & Distribution

- Installer and portable `.exe` are generated in the `dist/` folder
- Share the installer with others—no API key is exposed

---

## 🖼️ Screenshots

![Overlay UI](assets/screenshot-overlay.png)
![Settings Modal](assets/screenshot-settings.png)

---

## 💡 Technologies Used

- Electron v12
- iohook (global hotkeys)
- Google Gemini Pro API
- Web Speech Recognition API
- Axios

---

## 📝 License

MIT

---

## 👤 Author

**Mohit**

- [LinkedIn](https://www.linkedin.com/in/mohit242-bit)
- [GitHub](https://github.com/Mohit242-bit)

---

## 🌐 Social & Sharing

### LinkedIn Post Template

```
🚀 Just launched my AI Desktop Assistant for Windows!

Select any text, press Ctrl+Shift+X, and get instant help from Google Gemini Pro—explain, summarize, translate, debug, and more. Built with Electron, secure API key, and voice input!

Check it out on GitHub: https://github.com/Mohit242-bit/OSexe

#AI #DesktopAssistant #Electron #GeminiPro #Windows #Productivity
```

### GitHub Release Template

```
🎉 AI Desktop Assistant v1.0.0 Released!

- Global hotkey overlay
- Gemini Pro integration
- Voice input
- Auto-start & system tray
- Secure API key

Download the installer from the Releases page!
```

---

## 📢 How to Upload to GitHub

1. Create a new repository on GitHub (e.g., `OSexe`)
2. Initialize git in your project folder:

   ```sh
   git init
   git remote add origin https://github.com/Mohit242-bit/OSexe.git
   git add .
   git commit -m "Initial release"
   git push -u origin main
   ```

3. Add screenshots to `assets/` and update README links
4. Create a release and upload your installer from `dist/`

---

## 📢 How to Share on LinkedIn

- Use the LinkedIn post template above
- Add screenshots and a link to your GitHub repo
- Tag relevant hashtags: #AI #Electron #Windows #GeminiPro #Productivity

---

**Ready to launch! 🚀**
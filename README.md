# 🎁 Surprise Project — My Chemical Romance: The Black Parade 2026

An interactive **surprise gift website** inspired by *My Chemical Romance* 🎸  
featuring a **Snake mini-game**, synchronized music (*Welcome to the Black Parade*),  
fade-in animations, and fake downloadable tickets styled like Ticketmaster.

---

## 🧩 Technologies

- ⚡ [Vite](https://vitejs.dev/) — Modern build tool with blazing-fast HMR.
- 🎨 HTML + CSS — Custom transitions and gothic-inspired theme.
- 🕹️ TypeScript — Game logic, state management, and interactions.
- 🔊 YouTube IFrame API — For playing synchronized music.
- 📄 ReportLab (Python) — Used for generating mock Ticketmaster-style PDFs.
- 🖼️ Static assets — Images, textures, fonts, and PDFs stored in `/public/`.

---

## 📁 Project structure

```
my-chemical-romance-surprise/
├── public/
│   ├── pdfs/
│   │   ├── mcr_wide_1.pdf
│   │   ├── mcr_wide_2.pdf
│   ├── images/
│   │   └── mcr-poster.png
│   ├── textures/
│   │   └── paper.jpg
│   ├── tickets.json
│   └── _redirects
│
├── src/
│   ├── game.ts        # Snake mini-game logic
│   ├── gift.ts        # Reveal screen logic, animations, and YouTube music
│   ├── main.css       # Global styling, fonts, and effects
│   ├── index.html     # Main page structure
│   └── vite-env.d.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🧠 Flow overview

1. The user plays the **snake mini-game**.
2. When they win, the **gift page** replaces the game.
3. Upon clicking **“Reveal Tickets”**:
   - The song *Welcome to the Black Parade* starts playing.
   - After **63s**, the tickets appear with a fade-in animation.
   - **48s later**, the download buttons fade in.
   - The PDFs are **mock/fake** — for gift display only.
4. The layout automatically adapts to different screen sizes.

---

## 🚀 Local development

### Requirements
- Node.js ≥ 20.0  
- npm ≥ 9.0

### 1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/my-chemical-romance-surprise.git
cd my-chemical-romance-surprise
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Run the local dev server
```bash
npm run dev
```
Visit: [http://localhost:5173](http://localhost:5173)

### 4️⃣ Build for production
```bash
npm run build
```
This creates a ready-to-deploy `/dist` folder.

---

## 🌍 Free deployment on Netlify

### Option 1 — via web interface (recommended)
1. Push your code to GitHub.
2. Go to [Netlify](https://app.netlify.com) → “**New site from Git**”.
3. Connect your GitHub repo.
4. In **Build Settings**, set:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy Site**.

Your site will be live at something like  
👉 `https://my-chemical-romance-surprise.netlify.app`

---

### Option 2 — via Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build your site:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy --prod --dir=dist
```

---

## ⚙️ Additional setup

### `_redirects`
To ensure all routes work correctly (for SPAs):
```
/*    /index.html   200
```

### `vite.config.ts`
Make sure your base path is correct:
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // or './' for relative paths if needed
});
```

---

## 🧾 License & disclaimer

This project is **non-commercial** and made for **personal gift purposes** only.  
The tickets and PDFs are **fakes** and do not represent any real transactions.  
My Chemical Romance and Ticketmaster are registered trademarks of their respective owners.

---

## ❤️ Credits

- Song: *Welcome to the Black Parade* — My Chemical Romance  
- Image: *The Black Parade 2026 Tour (Madrid)* poster  
- Hosting: [Netlify](https://www.netlify.com)  
- Design inspiration: Ticketmaster layout + gothic aesthetic

---

### ✨ Author
Created with ❤️ and TypeScript for a very special surprise.

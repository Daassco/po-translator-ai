# PO Translator AI (Open-Source Edition)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg)](https://tailwindcss.com/)
[![Universal AI](https://img.shields.io/badge/AI-Universal_Multi--Model-10B981.svg)](https://github.com)

An open-source, client-side web application for localizing GNU Gettext (`.po` and `.pot`) files using universal AI models. Supports Google Gemini, Ollama (100% offline and free), OpenRouter (Claude 3.5 Sonnet, GPT-4o, DeepSeek, Qwen 2.5), DeepSeek Official, Groq, OpenAI, and any custom OpenAI-compatible endpoint. Built with variable and placeholder integrity guards, client-side cryptographic storage, a collaborative community glossary, and a Bring Your Own Key (BYOK) architecture.

---

## Key Features

- **Universal Multi-Model AI Engine:** Connect any AI model of your choice. Native support for Google Gemini, local offline models via Ollama (`llama3.2`, `qwen2.5-coder`, `deepseek-r1`), multi-model cloud access via OpenRouter (`claude-3.5-sonnet`, `gpt-4o`, `qwen-2.5-72b`), DeepSeek Official (`deepseek-chat`, `deepseek-reasoner`), Groq ultra-fast LPU inference, and custom OpenAI-compatible endpoints.
- **Bring Your Own Key (BYOK) Architecture:** Use your own API keys or run completely free and offline with Ollama. Sensitive keys can be encrypted locally in the browser with a user-defined Master PIN (Web Crypto AES-GCM), ensuring zero server-side exposure.
- **Dual-Layer Placeholder and Syntax Guard:** Preserves printf format specifiers (`%s`, `%d`, `%1$s`, `%.2f`), bracket variables (`{name}`, `{{count}}`), and immutable HTML/XML tags. Employs prompt rules and client-side validation to prevent modifications to tag contents and attributes (such as `<img id="Guide_1_KR"/>`).
- **Real-Time Model and Token Metrics:** Live dashboard tracking active AI models, processed files, translated strings, and dynamic token usage estimations.
- **Interactive Two-Column PO Editor:** Side-by-side interface for reviewing and modifying `msgid` and `msgstr` entries, complete with status filtering (All, Untranslated, Completed, Warnings) and instant inline editing.
- **Community Terminology Glossary:** Maintain technical consistency across localization projects with support for Do Not Translate (DNT) brand and code rules.
- **Live Contributor Hall of Fame:** Real-time leaderboard tracking in-app community terminology contributions alongside direct GitHub repository committers without artificial placeholder data.
- **Lossless GNU Gettext Parser and Compiler:** Full compliance with GNU Gettext syntax, including multiline strings, context disambiguation (`msgctxt`), header metadata, comments, and flags.
- **Authentication and Cloud Synchronization:** Optional integration with Supabase (GitHub OAuth and email) to persist project history and synchronize shared glossary contributions.

---

## Tech Stack

- **Framework:** React 18 with TypeScript (Strict Mode)
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand with selective local persistence
- **AI Integrations:** Google GenAI SDK (`@google/genai`) and Universal OpenAI-compatible REST Client
- **Cryptography:** Web Crypto API (AES-GCM 256-bit with PBKDF2 key derivation)
- **Backend / Authentication:** Supabase (PostgreSQL, Row Level Security, GitHub OAuth)
- **Icons:** Lucide React

---

## Getting Started

### Prerequisites

- Node.js v18.0.0 or higher
- npm, pnpm, or yarn
- An AI API key (Google Gemini, OpenRouter, DeepSeek, Groq, OpenAI) OR a local Ollama instance (no API key required)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/po-translator-ai.git
   cd po-translator-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional for local standalone use):
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your configuration parameters if connecting to Supabase or a custom GitHub repository.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and visit `http://localhost:5173`.

---

## Production Build

To build the application for production deployment:

```bash
npm run build
```

Compiled assets will be output to the `dist` directory, suitable for deployment on static hosting platforms such as Vercel, Netlify, Cloudflare Pages, or AWS S3.

To preview the production build locally:

```bash
npm run preview
```

---

## Supabase Configuration (Optional)

To enable cloud history synchronization and GitHub OAuth authentication:

1. Create a project in the [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** in Supabase, then copy and execute the migration script located at:
   ```
   supabase/migrations/20261111082700_init_po_translator.sql
   ```
3. In your Supabase dashboard under **Authentication > Providers**, enable **GitHub** and enter your GitHub OAuth Client ID and Client Secret.
4. Configure redirect settings under **Authentication > URL Configuration**:
   - Site URL: `http://localhost:5173` (or your production domain)
   - Redirect URLs: `http://localhost:5173/**`
5. Configure your `.env.local` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   VITE_GITHUB_REPO=your-org/your-repo
   ```

---

## Contributing

Contributions from the open-source community are welcome.

1. Fork the repository on GitHub.
2. Create a feature branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes with concise and descriptive commit messages.
4. Push your branch (`git push origin feature/your-feature-name`).
5. Submit a Pull Request detailing the changes and verification steps.

Non-code contributions can also be made directly within the application by adding terminology entries to the Community Glossary.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete details.

# Lexicache Dictionary

Lexicache Dictionary is a fast, offline-ready app (PWA) where you can look up words and get full definitions, examples, phonetic spellings, and related words (synonyms, antonyms). Built with SolidJS, it offers a smooth experience finding word meanings, even when you're offline.

## Features

*   **Works Offline:** It uses smart caching to make sure you can still access definitions and any words you've looked up, even if your internet connection is gone or spotty.
*   **Pulls from Multiple Sources:** It gathers word data from several reliable dictionary APIs (Datamuse, Free Dictionary API, Google Dictionary API) to give you a broad set of results.
*   **Rich Word Details:** You get detailed definitions, example sentences, how to pronounce words (using IPA), and lists of synonyms and antonyms.
*   **Looks Great on Any Device:** Built with Tailwind CSS and DaisyUI, it has a clean, modern design that works well on phones, tablets, and desktops.
*   **Installable App:** You can install it directly to your device's home screen, just like a regular app, for quick access anytime.

## Technologies Used

*   **[SolidJS](https://www.solidjs.com/)**: A fast and responsive JavaScript library for building user interfaces.
*   **[SolidStart](https://start.solidjs.com/)**: A framework for SolidJS that handles things like routing and server-side rendering.
*   **[Vite](https://vitejs.dev/)**: A modern tool for super-fast development and building.
*   **[Vite PWA Plugin](https://vite-plugin-pwa.netlify.app/)**: Integrates Workbox to help turn the app into a production-ready PWA easily.
*   **[Valibot](https://valibot.dev/)**: A small, efficient, and type-safe library for making sure data fits a specific structure.
*   **[idb-keyval](https://github.com/jakearchibald/idb-keyval)**: A simple, promise-based way to store data in the browser (using IndexedDB).
*   **[Tailwind CSS](https://tailwindcss.com/)**: A CSS framework that lets you build designs quickly, right in your HTML.
*   **[DaisyUI](https://daisyui.com/)**: A Tailwind CSS plugin with ready-made UI components.
*   **[Vinxi](https://vinxi.dev/)**: The development and build system that SolidStart uses.
*   **Datamuse API**: Provides word suggestions and related terms.
*   **Free Dictionary API**: One of the main sources for detailed word definitions.
*   **Google Dictionary API**: Another strong source contributing to the dictionary's data.
*   **Cloudflare Pages**: Where this app is deployed online.

## Installation and Local Setup

Want to run Lexicache Dictionary on your own machine? Here's how to get started:

### Prerequisites

You'll need:

*   **Node.js**: Version 22+ (check `package.json` for exact spec).
*   **Bun**: (Optional, but makes things faster)

### Installation

1.  Clone the repository to your local machine:

    ```bash
    git clone https://github.com/Conrad/offline-dictionary-pwa.git
    cd offline-dictionary-pwa
    ```

2.  Install the necessary project stuff using Bun (recommended) or npm/yarn:

    ```bash
    bun install
    # or npm install
    # or yarn install
    ```

3.  Then, start it up:

    ```bash
    bun run bun-dev
    # or npm run dev
    ```

    You should be able to see the app in your browser at `http://localhost:3001` (or whatever `npm run dev` defaults to).

## Building for Production

To get a ready-for-prime-time version of the app, run:

```bash
bun run bun-build
# or npm run build
```

This will compile and optimize everything, putting the files ready for deployment in the `dist` folder.

## Deployment

Lexicache Dictionary is set up to deploy easily to [Cloudflare Pages](https://pages.cloudflare.com/). The `app.config.ts` file has all the necessary bits for that.

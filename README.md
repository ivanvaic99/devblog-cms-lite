# DevBlog CMS Lite

DevBlog CMS Lite is a lightweight blogging tool that lets you create and manage markdown posts right in your browser. There’s no server – posts are saved to **IndexedDB** and can be exported as JSON or a ZIP archive containing individual markdown files.

## Live Demo

The published version of this site lives here:

```
https://ivanvaic99.github.io/devblog-cms-lite/
```

![DevBlog CMS Lite desktop](./screenshots/devblog-cms-lite/devblog-cms-lite_home_desktop_1440x900.png)

## Features

* **Markdown editor & preview** – Write posts with Markdown syntax and see a live preview.
* **Tags & statuses** – Organise posts with tags and mark them as draft or published.
* **Offline storage** – Everything is stored locally with Dexie.
* **Export/Import** – Export all posts as JSON or a ZIP containing a `posts.json` and one markdown file per post. Import posts from a JSON file.
* **Responsive UI** – Works well on both desktop and mobile screens.

## Tech Stack

| Category       | Libraries / Tools              |
|--------------:|---------------------------------|
| Framework      | React 18                        |
| Styling        | TailwindCSS                     |
| Markdown       | react‑markdown                  |
| Persistence    | Dexie (IndexedDB)              |
| Zip generation | jszip                           |
| Build          | Vite                            |
| Deployment     | GitHub Pages + Actions        |

## Getting Started

Install dependencies and run the development server:

```sh
npm install
npm run dev
```

Build for production:

```sh
npm run build
```

## Import Format

To import posts, choose a JSON file containing an array of objects with the following fields: `title`, `tags` (array), `status` (`draft` or `published`), `content` (markdown string), and optionally `createdAt`. The `id` field will be ignored and new IDs will be generated.

## License

Released under the MIT License.
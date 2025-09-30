import React, { useEffect, useState, useRef } from 'react';
import { db } from './db.js';
import ReactMarkdown from 'react-markdown';
import JSZip from 'jszip';

// Convert comma separated tag string to array and vice versa.
const tagsToString = (tags) => (Array.isArray(tags) ? tags.join(', ') : tags || '');
const stringToTags = (str) => str.split(',').map((t) => t.trim()).filter(Boolean);

export default function App() {
  const [posts, setPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingPost, setEditingPost] = useState({ title: '', tags: '', status: 'draft', content: '' });
  const fileInputRef = useRef();

  // Load posts on mount.
  useEffect(() => {
    const load = async () => {
      const all = await db.posts.toArray();
      setPosts(all);
    };
    load();
  }, []);

  // Whenever selection changes, load that post into editing state.
  useEffect(() => {
    if (selectedId == null) {
      setEditingPost({ title: '', tags: '', status: 'draft', content: '' });
    } else {
      const p = posts.find((p) => p.id === selectedId);
      if (p) {
        setEditingPost({
          title: p.title,
          tags: tagsToString(p.tags),
          status: p.status,
          content: p.content,
        });
      }
    }
  }, [selectedId, posts]);

  // Save post – new or existing.
  const savePost = async () => {
    const { title, tags, status, content } = editingPost;
    if (!title.trim()) return;
    if (selectedId == null) {
      const newId = await db.posts.add({
        title: title.trim(),
        tags: stringToTags(tags),
        status,
        content,
        createdAt: new Date().toISOString(),
      });
      setPosts((prev) => [...prev, { id: newId, title: title.trim(), tags: stringToTags(tags), status, content, createdAt: new Date().toISOString() }]);
      setSelectedId(newId);
    } else {
      await db.posts.update(selectedId, {
        title: title.trim(),
        tags: stringToTags(tags),
        status,
        content,
      });
      setPosts((prev) => prev.map((p) => (p.id === selectedId ? { ...p, title: title.trim(), tags: stringToTags(tags), status, content } : p)));
    }
  };

  const deletePost = async () => {
    if (selectedId == null) return;
    await db.posts.delete(selectedId);
    setPosts((prev) => prev.filter((p) => p.id !== selectedId));
    setSelectedId(null);
  };

  // Export posts as JSON
  const exportJson = async () => {
    const all = await db.posts.toArray();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devblog_posts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export posts as ZIP. The archive contains posts.json and individual markdown files.
  const exportZip = async () => {
    const all = await db.posts.toArray();
    const zip = new JSZip();
    zip.file('posts.json', JSON.stringify(all, null, 2));
    all.forEach((p) => {
      const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      zip.file(`${slug || 'post'}-${p.id}.md`, p.content || '');
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devblog_export.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle import from JSON – user selects a file containing an array of posts.
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          const newPosts = [];
          for (const p of imported) {
            const { title, tags, status, content, createdAt } = p;
            const id = await db.posts.add({ title, tags, status, content, createdAt: createdAt || new Date().toISOString() });
            newPosts.push({ id, title, tags, status, content, createdAt });
          }
          setPosts((prev) => [...prev, ...newPosts]);
        }
        fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow">
        <h1 className="text-2xl font-bold">DevBlog CMS Lite</h1>
      </header>
      <main className="flex-1 flex flex-col md:flex-row overflow-auto">
        {/* Sidebar: Posts list */}
        <aside className="md:w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Posts</h2>
            <button
              className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              onClick={() => setSelectedId(null)}
            >
              New
            </button>
          </div>
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.id}>
                <button
                  className={`w-full text-left p-2 rounded ${selectedId === p.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">{p.title}</span>
                    <span className="text-xs uppercase ml-2 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {p.status}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={exportJson}
              className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            >
              Export JSON
            </button>
            <button
              onClick={exportZip}
              className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
            >
              Export ZIP
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
            >
              Import JSON
            </button>
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </aside>
        {/* Main editor area */}
        <section className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Editor */}
            <div className="flex flex-col h-full">
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border rounded p-2 mb-2"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={editingPost.tags}
                  onChange={(e) => setEditingPost((prev) => ({ ...prev, tags: e.target.value }))}
                  className="w-full border rounded p-2 mb-2"
                />
                <select
                  value={editingPost.status}
                  onChange={(e) => setEditingPost((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full border rounded p-2 mb-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <textarea
                value={editingPost.content}
                onChange={(e) => setEditingPost((prev) => ({ ...prev, content: e.target.value }))}
                className="flex-1 border rounded p-2 font-mono"
                placeholder="Write your markdown here..."
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={savePost}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                {selectedId != null && (
                  <button
                    onClick={deletePost}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {/* Preview */}
            <div className="h-full overflow-auto">
              <h3 className="text-lg font-medium mb-2">Preview</h3>
              <div className="markdown prose dark:prose-invert max-w-none">
                <ReactMarkdown>{editingPost.content || 'Nothing to preview yet...'}</ReactMarkdown>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Built with React, Tailwind, Dexie and React‑Markdown. Posts are stored locally in your browser.
      </footer>
    </div>
  );
}
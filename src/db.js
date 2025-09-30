import Dexie from 'dexie';

// Blog database storing posts with metadata. Each post contains a
// markdown body along with title, comma‑separated tags and status.
export const db = new Dexie('devblog-cms-lite');
db.version(1).stores({
  posts: '++id, title, status, createdAt',
});
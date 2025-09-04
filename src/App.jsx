import React, { useState, useTransition, useDeferredValue } from "react";
import "./App.css";

// ----------------- Custom Hooks -----------------

// 1. useLocalStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// 2. useFetch (untuk sinkronisasi API)
function useFetch(url, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (body) => {
    setLoading(true);
    try {
      const res = await fetch(url, { ...options, body: JSON.stringify(body) });
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
}

// ----------------- Komponen -----------------
export default function CatatanApp() {
  const [notes, setNotes] = useLocalStorage("notes", []);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const deferredText = useDeferredValue(text);

  const { fetchData, loading } = useFetch(
    "https://jsonplaceholder.typicode.com/posts",
    { method: "POST", headers: { "Content-Type": "application/json" } }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    startTransition(() => {
      if (editingId) {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === editingId ? { ...note, text } : note
          )
        );
        setEditingId(null);
      } else {
        const newNote = { id: Date.now(), text };
        setNotes((prev) => [...prev, newNote]);
        fetchData(newNote); // sinkronisasi ke API
      }
      setText("");
    });
  };

  const handleEdit = (id) => {
    const note = notes.find((n) => n.id === id);
    setText(note.text);
    setEditingId(id);
  };

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="notes-page">
      <div className="notes-card">
        <h2>📝 Aplikasi Catatan</h2>

        <form onSubmit={handleSubmit} className="form">
          <textarea
            rows="3"
            value={deferredText}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis catatan..."
          />
          <button type="submit" disabled={isPending || loading}>
            {editingId ? "Update" : "Tambah"}
          </button>
        </form>

        {isPending && <p>⏳ Menyimpan...</p>}
        {loading && <p>🌐 Sinkronisasi ke server...</p>}

        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note.id}>
              <span>{note.text}</span>
              <div>
                <button onClick={() => handleEdit(note.id)}>✏️ Edit</button>
                <button onClick={() => handleDelete(note.id)}>🗑 Hapus</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import {
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineArchiveBox,
  HiOutlineDocumentText,
  HiOutlineArrowRightOnRectangle,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout, logoutAll } = useAuth();
  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [tab, setTab] = useState('notes'); // 'notes' | 'trash'
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', tags: '' });
  const [saving, setSaving] = useState(false);

  // Confirm delete modal
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const res = await api.get('/notes', { params });
      setNotes(res.data);
    } catch {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notes/trash');
      setTrash(res.data);
    } catch {
      toast.error('Failed to fetch trash');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'notes') {
      fetchNotes();
    } else {
      fetchTrash();
    }
  }, [tab, fetchNotes, fetchTrash]);

  // Initial fetch for the inactive tab to get correct counts on load
  useEffect(() => {
    if (tab === 'notes') fetchTrash();
    if (tab === 'trash') fetchNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search state
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const openCreateModal = () => {
    setEditingNote(null);
    setForm({ title: '', body: '', tags: '' });
    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      body: note.body,
      tags: note.tags?.join(', ') || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setForm({ title: '', body: '', tags: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      body: form.body,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (editingNote) {
        await api.put(`/notes/${editingNote._id}`, payload);
        toast.success('Note updated');
      } else {
        await api.post('/notes', payload);
        toast.success('Note created');
      }
      closeModal();
      fetchNotes();
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Note moved to trash');
      fetchNotes();
      fetchTrash();
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.put(`/notes/trash/${id}`);
      toast.success('Note restored');
      fetchTrash();
      fetchNotes();
    } catch {
      toast.error('Failed to restore note');
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await api.delete(`/notes/trash/${id}`);
      toast.success('Note permanently deleted');
      setConfirmDelete(null);
      fetchTrash();
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-logo-icon">
            <HiOutlineShieldCheck />
          </div>
          <span className="header-logo-text">NoteVault</span>
        </div>
        <div className="header-right">
          <span className="header-user">Hi, {user?.username}</span>
          <button className="btn-ghost" onClick={logoutAll} title="Logout from all devices">
            <HiOutlineExclamationTriangle />
            Logout From All Devices
          </button>
          <button className="btn-ghost danger" onClick={logout} title="Logout">
            <HiOutlineArrowRightOnRectangle />
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${tab === 'notes' ? 'active' : ''}`}
          onClick={() => setTab('notes')}
        >
          <HiOutlineDocumentText />
          Notes
          <span className="tab-count">{notes.length}</span>
        </button>
        <button
          className={`tab-btn ${tab === 'trash' ? 'active' : ''}`}
          onClick={() => setTab('trash')}
        >
          <HiOutlineArchiveBox />
          Trash
          <span className="tab-count">{trash.length}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="dashboard-toolbar">
        {tab === 'notes' && (
          <>
            <div className="search-box">
              <HiOutlineMagnifyingGlass size={18} />
              <input
                type="text"
                placeholder="Search by title or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-notes"
              />
            </div>
            <button className="btn-add" onClick={openCreateModal} id="create-note-btn">
              <HiOutlinePlus />
              New Note
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-notes">
          <div className="loading-spinner"></div>
        </div>
      ) : tab === 'notes' ? (
        notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <HiOutlineDocumentText />
            </div>
            <h3>{search ? 'No matching notes' : 'No notes yet'}</h3>
            <p>
              {search
                ? 'Try a different search query.'
                : 'Click "New Note" to create your first secure note.'}
            </p>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note, i) => (
              <div
                key={note._id}
                className={`note-card stagger-${(i % 5) + 1}`}
                onClick={() => openEditModal(note)}
              >
                <div className="note-card-header">
                  <h3>{note.title}</h3>
                  <div className="note-card-actions">
                    <button
                      className="note-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(note);
                      }}
                      title="Edit"
                    >
                      <HiOutlinePencilSquare />
                    </button>
                    <button
                      className="note-action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSoftDelete(note._id);
                      }}
                      title="Move to Trash"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
                <p className="note-body-preview">{note.body}</p>
                {note.tags?.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map((tag, j) => (
                      <span key={j} className="note-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="note-meta">{formatDate(note.updatedAt)}</span>
              </div>
            ))}
          </div>
        )
      ) : trash.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <HiOutlineArchiveBox />
          </div>
          <h3>Trash is empty</h3>
          <p>Deleted notes will appear here for recovery.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {trash.map((note, i) => (
            <div key={note._id} className={`note-card stagger-${(i % 5) + 1}`}>
              <div className="note-card-header">
                <h3>{note.title}</h3>
                <div className="note-card-actions" style={{ opacity: 1 }}>
                  <button
                    className="note-action-btn success"
                    onClick={() => handleRestore(note._id)}
                    title="Restore"
                  >
                    <HiOutlineArrowPath />
                  </button>
                  <button
                    className="note-action-btn danger"
                    onClick={() => setConfirmDelete(note._id)}
                    title="Delete Permanently"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
              <p className="note-body-preview">{note.body}</p>
              {note.tags?.length > 0 && (
                <div className="note-tags">
                  {note.tags.map((tag, j) => (
                    <span key={j} className="note-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="note-meta">Deleted: {formatDate(note.deletedAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNote ? 'Edit Note' : 'Create Note'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="note-title">Title</label>
                  <input
                    id="note-title"
                    className="form-input-lg"
                    type="text"
                    placeholder="Note title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="note-body">Body</label>
                  <textarea
                    id="note-body"
                    className="form-input-lg form-textarea"
                    placeholder="Write your note..."
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="note-tags">Tags</label>
                  <input
                    id="note-tags"
                    className="form-input-lg"
                    type="text"
                    placeholder="work, personal, ideas"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                  <span className="form-tags-hint">Separate tags with commas</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Permanent Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Permanently Delete?</h2>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>
                <HiOutlineXMark />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                This action cannot be undone. The note will be permanently removed from your vault.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn-save"
                style={{ background: 'var(--accent-danger)' }}
                onClick={() => handlePermanentDelete(confirmDelete)}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

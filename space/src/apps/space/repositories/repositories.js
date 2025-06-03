import React, { useEffect, useState } from "react";
import "./repositories.css";
import { useNavigate } from "react-router-dom";
import useApi from "../../../utils/useApi";

export default function SpaceRepositories() {
  const { callApi } = useApi();
  const [repos, setRepos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    is_public: false,
    tags: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const resp = await callApi("space/repositories/");
        setRepos(resp.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCreate = async () => {
    try {
      const resp = await callApi("space/repositories/", "POST", form);
      setRepos((r) => [resp.data, ...r]);
      navigate(`/space/repositories/r/${resp.data.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="repo-page">
      <header className="repo-header">
        <h1>My Repositories</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Repository
        </button>
      </header>

      <section className="repo-grid">
        {repos.map((r) => (
          <article
            key={r.id}
            className="repo-card"
            onClick={() => navigate(`/space/repositories/r/${r.id}`)}
          >
            <div className="repo-card-top">
              <h2>{r.title}</h2>
              {r.is_public && <span className="badge">Public</span>}
            </div>
            <p className="repo-desc">
              {r.description || "No description provided."}
            </p>
            {r.tags && (
              <div className="repo-tags">
                {r.tags.split(",").map((t) => (
                  <span key={t.trim()} className="tag">
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>New Repository</h3>
            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
              />
            </label>
            <label>
              Slug
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                name="is_public"
                checked={form.is_public}
                onChange={handleChange}
              />
              Make Public
            </label>
            <label>
              Tags
              <input
                name="tags"
                placeholder="tag1, tag2"
                value={form.tags}
                onChange={handleChange}
              />
            </label>
            <footer className="modal-actions">
              <button className="btn-primary" onClick={handleCreate}>
                Create
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

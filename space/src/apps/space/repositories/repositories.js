import React, { useEffect, useState } from "react";
import "./repositories.css";
import { useNavigate } from "react-router-dom";  // ⬅️ Add this
import useApi from "../../../utils/useApi";

const SpaceRepositories = () => {
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

    const navigate = useNavigate(); // ⬅️ Add this

    useEffect(() => {
        async function load() {
            try {
                const response = await callApi("space/repositories/");
                setRepos(response.data || []);
            } catch (err) {
                console.error("Error fetching repositories", err);
            }
        }
        load();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleCreate = async () => {
        try {
            const response = await callApi("space/repositories/", "POST", form);
            setRepos((prev) => [...prev, response.data]);
            setShowModal(false);
            setForm({ title: "", slug: "", description: "", is_public: false, tags: "" });

            // Redirect to new repository
            navigate(`/space/repositories/r/${response.data.id}`);
        } catch (err) {
            console.error("Failed to create repo", err);
        }
    };

    return (
        <div className="space-repositories-page">
            <div className="space-repositories-header">
                <h2>Repositories</h2>
                <button className="repo-create-btn" onClick={() => setShowModal(true)}>
                    + New Repository
                </button>
            </div>

            <div className="space-repositories-grid">
                {repos.map((repo) => (
                    <div
                        key={repo.id}
                        className="repo-card"
                        onClick={() => navigate(`/space/repositories/r/${repo.id}`)}
                    >
                        <div className="repo-card-inner">
                            <h3 className="repo-title">{repo.title}</h3>
                            <p className="repo-description">{repo.description}</p>
                            <div className="repo-meta">
                                <span>Public: {repo.is_public ? "Yes" : "No"}</span>
                                <span>Tags: {repo.tags}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="repo-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="repo-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create Repository</h2>
                        <div className="modal-field">
                            <label>Title</label>
                            <input type="text" name="title" value={form.title} onChange={handleChange} />
                        </div>
                        <div className="modal-field">
                            <label>Slug</label>
                            <input type="text" name="slug" value={form.slug} onChange={handleChange} />
                        </div>
                        <div className="modal-field">
                            <label>Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange} />
                        </div>
                        <div className="modal-field">
                            <label>Tags (comma-separated)</label>
                            <input type="text" name="tags" value={form.tags} onChange={handleChange} />
                        </div>
                        <div className="modal-field checkbox">
                            <label>
                                <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange} />
                                Make Public
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleCreate}>Create</button>
                            <button className="secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpaceRepositories;

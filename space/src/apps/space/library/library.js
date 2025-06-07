// components/SpaceLibrary.js
import React, { useState, useEffect } from "react";
import useApi from "../../../utils/useApi";
import {
  FiUpload,
  FiFolderPlus,
  FiGrid,
  FiList,
  FiSearch,
  FiHome,
  FiChevronRight,
  FiX,
  FiFolder,
  FiFile,
  FiUser,
  FiDownload,
} from "react-icons/fi";
import "./library.css";

const SpaceLibrary = () => {
  const { callApi } = useApi();
  const [items, setItems]       = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [folder, setFolder]     = useState({ id: null, name: "Home" });
  const [crumbs, setCrumbs]     = useState([{ id: null, name: "Home" }]);
  const [search, setSearch]     = useState("");
  const [preview, setPreview]   = useState(null);

  useEffect(() => {
    (async () => {
      const suffix = folder.id ? `?parent=${folder.id}` : "";
      const res = await callApi(`space/library${suffix}`);
      setItems(res.data || []);
    })();
  }, [folder.id]);

  const goToCrumb = (c, i) => {
    setFolder({ id: c.id, name: c.name });
    setCrumbs(crumbs.slice(0, i + 1));
  };
  const enterFolder = it => {
    if (it.type !== "folder") return;
    setFolder({ id: it.id, name: it.title });
    setCrumbs([...crumbs, { id: it.id, name: it.title }]);
  };
  const handleUpload = async e => {
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    if (folder.id) fd.append("parent", folder.id);
    await callApi("space/library/upload/", "POST", fd, "multipart/form-data");
    const suffix = folder.id ? `?parent=${folder.id}` : "";
    const res = await callApi(`space/library${suffix}`);
    setItems(res.data || []);
  };
  const createFolder = async () => {
    const name = prompt("New folder name");
    if (!name) return;
    const payload = { title: name };
    if (folder.id) payload.parent = folder.id;
    await callApi("space/library/folder/", "POST", payload);
    const suffix = folder.id ? `?parent=${folder.id}` : "";
    const res = await callApi(`space/library${suffix}`);
    setItems(res.data || []);
  };

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase())
  );
  const folders = filtered.filter(i => i.type === "folder");
  const files   = filtered.filter(i => i.type === "file");

  const folderSummary = items.reduce((acc, it) => {
    const pid = it.parent;
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = { folders: 0, files: 0 };
    if (it.type === "folder") acc[pid].folders++;
    else acc[pid].files++;
    return acc;
  }, {});

  const fmt = dt => new Date(dt).toLocaleDateString();

  return (
    <div className="sl-root">
      <header className="sl-header">
        <div className="sl-logo-breadcrumbs">
          <div className="sl-logo">
            <FiFolderPlus /> Library
          </div>
          <nav className="sl-breadcrumbs">
            {crumbs.map((c, i) => (
              <React.Fragment key={c.id || "root"}>
                <span className="sl-crumb" onClick={() => goToCrumb(c, i)}>
                  {i === 0 ? <><FiHome /> Home</> : c.name}
                </span>
                {i < crumbs.length - 1 && (
                  <FiChevronRight className="sl-crumb-sep" />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
        <div className="sl-search-bar">
          <FiSearch className="sl-search-icon" />
          <input
            className="sl-search-input"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sl-actions">
          <label className="sl-btn sl-upload-btn">
            <FiUpload />
            <span>Upload</span>
            <input type="file" hidden onChange={handleUpload} />
          </label>
          <button className="sl-btn sl-new-folder-btn" onClick={createFolder}>
            <FiFolderPlus />
            <span>New Folder</span>
          </button>
          <div className="sl-view-toggle">
            <button
              className={`sl-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid />
            </button>
            <button
              className={`sl-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FiList />
            </button>
          </div>
        </div>
      </header>

      <main className={`sl-content ${filtered.length === 0 ? 'empty' : ''}`}>
        {folders.length > 0 && (
          <div className="sl-section">
            <h4 className="sl-section-header">Folders</h4>

            {viewMode === "list" && (
              <div className="sl-list-header-row">
                <div className="sl-col-title">Name</div>
                <div className="sl-col-counts">Type</div>
                <div className="sl-col-updated">Last Updated</div>
              </div>
            )}

            <div className={`sl-section-content sl-${viewMode}`}>
              {folders.map(f => {
                const sum = folderSummary[f.id] || { folders: 0, files: 0 };
                return (
                  <div
                    key={f.id}
                    className={`sl-item sl-item-folder ${viewMode === "list" ? "sl-list-row" : ""}`}
                    onClick={() => enterFolder(f)}
                  >
                    {viewMode === "list" ? (
                      <>
                        <div className="sl-col-title">
                          <FiFolder className="sl-item-icon" />
                          <span>{f.title}</span>
                        </div>
                        <div className="sl-col-counts">{f.type}</div>
                        <div className="sl-col-updated">{fmt(f.updated_at)}</div>
                      </>
                    ) : (
                      <>
                        <div className="sl-item-header">{f.title}</div>
                        <div className="sl-item-preview">
                          <FiFolder className="sl-item-icon" />
                        </div>
                        <div className="sl-item-meta">
                          <span>
                            {sum.folders} folder{sum.folders !== 1 ? "s" : ""},{" "}
                            {sum.files} file{sum.files !== 1 ? "s" : ""}
                          </span>
                          <span>Updated {fmt(f.updated_at)}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="sl-section">
            <h4 className="sl-section-header">Files</h4>

            {viewMode === "list" && (
              <div className="sl-list-header-row">
                <div className="sl-col-title">Name</div>
                <div className="sl-col-counts">Type</div>
                <div className="sl-col-updated">Last Updated</div>
              </div>
            )}

            <div className={`sl-section-content sl-${viewMode}`}>
              {files.map(f => (
                <div
                  key={f.id}
                  className={`sl-item sl-item-file ${viewMode === "list" ? "sl-list-row" : ""}`}
                  onDoubleClick={() => setPreview(f)}
                >
                  {viewMode === "list" ? (
                    <>
                      <div className="sl-col-title">
                        {f.mimeType?.startsWith("image/") ? (
                          <img src={f.url} alt={f.title} className="sl-item-icon" />
                        ) : (
                          <FiFile className="sl-item-icon" />
                        )}
                        <span>{f.title}</span>
                      </div>
                      <div className="sl-col-counts">{f.type}</div>
                      <div className="sl-col-updated">{fmt(f.updated_at)}</div>
                    </>
                  ) : (
                    <>
                      <div className="sl-item-header">{f.title}</div>
                      <div className="sl-item-preview">
                        {f.mimeType?.startsWith("image/") ? (
                          <img src={f.url} alt={f.title} />
                        ) : (
                          <FiFile className="sl-item-icon" />
                        )}
                      </div>
                      <div className="sl-item-meta">
                        <span>
                          <FiUser /> You
                        </span>
                        <span>Updated {fmt(f.updated_at)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && <div className="sl-empty">Nothing here…</div>}
      </main>

      {preview && <SlPreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
};

const SlPreviewModal = ({ file, onClose }) => {
  const { url, mimeType, title } = file;
  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";
  const isAudio = mimeType.startsWith("audio/");
  const isVideo = mimeType.startsWith("video/");
  return (
    <div className="sl-modal-backdrop" onClick={onClose}>
      <div className="sl-modal-content" onClick={e => e.stopPropagation()}>
        <button className="sl-modal-close" onClick={onClose}>
          <FiX />
        </button>
        <h3 className="sl-modal-title">{title}</h3>
        {isImage && <img className="sl-modal-img" src={url} alt={title} />}
        {isPdf   && <iframe className="sl-modal-pdf" src={url} title={title} />}
        {isAudio && <audio controls src={url} style={{ width: "100%" }} />}
        {isVideo && <video controls src={url} style={{ width: "100%", maxHeight: "70vh" }} />}
        {!isImage && !isPdf && !isAudio && !isVideo && (
          <div className="sl-modal-no-preview">No preview available</div>
        )}
        <a className="sl-modal-download" href={url} download={title}>
          <FiDownload /> Download
        </a>
      </div>
    </div>
  );
};

export default SpaceLibrary;

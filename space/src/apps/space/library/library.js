import React, { useEffect, useState } from "react";
import { FiUpload, FiFolder, FiFile } from "react-icons/fi";
import useApi from "../../../utils/useApi";
import "./projects.css"; // Reuse existing styles

const Library = () => {
  const { callApi } = useApi();
  const [items, setItems] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await callApi(`space/library/?parent=${currentFolderId || ""}`);
        setItems(res.data || []);
      } catch (err) {
        console.error("Failed to load library items:", err);
      }
    }
    fetchItems();
  }, [currentFolderId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("parent", currentFolderId);

    try {
      await callApi("space/library/upload/", {
        method: "POST",
        body: formData,
        headers: {},
      });
      setItems((prev) => [...prev, { title: file.name, type: "file" }]);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="space-projects-page">
      <div className="space-projects-header">
        <h2>Library</h2>
        <label className="projects-view-toggle">
          <FiUpload />
          <input
            type="file"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div className="space-projects-content">
        <div className="project-row">
          {items.map((item) => (
            <div
              key={item.id || item.title}
              className="project-card"
              onClick={() => {
                if (item.type === "folder") setCurrentFolderId(item.id);
              }}
              style={{ cursor: item.type === "folder" ? "pointer" : "default" }}
            >
              <div className="project-card-blur" />
              <div className="project-card-inner">
                <div className="project-card-icon top">
                  {item.type === "folder" ? <FiFolder /> : <FiFile />}
                </div>
                <h3>{item.title}</h3>
                <div className="project-meta">
                  <p className="project-type">{item.type}</p>
                  <p className="project-dates">
                    Last Updated: {item.updated_at?.split("T")[0] || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Library;

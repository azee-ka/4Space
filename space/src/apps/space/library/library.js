import React, { useEffect, useState } from "react";
import "./library.scss";
import useApi from "../../../utils/useApi";
import {
    FiUpload,
    FiFolderPlus,
    FiFilePlus,
    FiFolder,
    FiFile
} from "react-icons/fi";

const SpaceLibrary = () => {
    const { callApi } = useApi();
    const [items, setItems] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);

    useEffect(() => {
        fetchItems();
    }, [currentFolderId]);

    const fetchItems = async () => {
        try {
            const res = await callApi(`space/library/${currentFolderId ? "parent=" + currentFolderId : ""}`);
            setItems(res.data || []);
            console.log("Library items loaded:", res.data);
        } catch (err) {
            console.error("Failed to load library items:", err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const form = new FormData();
        form.append("file", file);
        if (currentFolderId) {
            form.append("parent", currentFolderId);
        }


        try {
            const response = await callApi("space/library/upload/", "POST", form, 'multipart/form-data');
            console.log("File uploaded successfully", response.data);
            fetchItems();
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };

    const handleNewFolder = async () => {
        const folderName = prompt("Enter folder name:");
        if (!folderName) return;

        try {
            const payload = { title: folderName };
            if (currentFolderId) payload.parent = currentFolderId;

            const response = await callApi("space/library/folder/", "POST", payload);
            console.log("Folder created successfully:", response.data);
            fetchItems();
        } catch (err) {
            console.error("Failed to create folder:", err);
        }
    };

    return (
        <div className="library-page">
            <div className="library-header">
                <h2>Library</h2>
                <div className="library-actions">
                    <label className="upload-btn">
                        <FiUpload />
                        <input type="file" onChange={handleFileUpload} hidden />
                    </label>
                    <button className="toolbar-btn" onClick={handleNewFolder}>
                        <FiFolderPlus /> New Folder
                    </button>
                    <button className="toolbar-btn" disabled>
                        <FiFilePlus /> New File
                    </button>
                </div>
            </div>

            <div className="library-grid">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="library-item"
                        onClick={() => item.type === "folder" && setCurrentFolderId(item.id)}
                    >
                        <div className="icon">
                            {item.type === "folder" ? <FiFolder /> : <FiFile />}
                        </div>
                        <div className="title">{item.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpaceLibrary;

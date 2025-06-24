import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { useCreateCommunityContext } from "../../../context/CreateCommunityContext";
import { useMutation } from "@tanstack/react-query";
import { createCommunity } from "../../../services/communities";
import { CREATE_COMMUNITY } from "../../../services/queryKeys";
import "./createCommunity.css";

const CreateCommunity = () => {
  const navigate = useNavigate();
  const { closeCreateCommunityOverlay: onClose } = useCreateCommunityContext();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    type: "general",
    visibility: "public",
    allow_custom_tabs: true,
    restricted_to_org_members: false,
    banner: null,
    logo: null,
  });

  useEffect(() => {
    window.history.pushState(null, "", "/communities/create");
  }, []);

  const mutation = useMutation({
    mutationKey: CREATE_COMMUNITY,
    mutationFn: createCommunity,
    onSuccess: (data) => {
      navigate(`/communities/c/${data.slug}/`);
      onClose();
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        payload.append(key, formData[key]);
      }
    });
    mutation.mutate(payload);
  };

  return (
    <div className="create-community-wrapper" onClick={onClose}>
      <div
        className="create-community-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="create-community-close-btn"
          onClick={onClose}
        >
          <FaTimes className="icon-style" />
        </button>

        <h2 className="create-community-title">Create Community</h2>
        <form
          className="create-community-form"
          onSubmit={handleSubmit}
        >
          <section className="create-community-section">
            <div className="create-community-group">
              <label>Community Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={mutation.isLoading}
              />
            </div>
            <div className="create-community-group">
              <label>Slug (optional)</label>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                disabled={mutation.isLoading}
              />
            </div>
          </section>

          <section className="create-community-section">
            <div className="create-community-group">
              <label>Category</label>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={mutation.isLoading}
              />
            </div>
            <div className="create-community-group">
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={mutation.isLoading}
              >
                <option value="general">General</option>
                <option value="tech">Tech</option>
                <option value="education">Education</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div className="create-community-group">
              <label>Visibility</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                disabled={mutation.isLoading}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="invite">Invite Only</option>
              </select>
            </div>
          </section>

          <section className="create-community-section toggles">
            <div className="create-community-toggle">
              <input
                type="checkbox"
                id="customTabs"
                name="allow_custom_tabs"
                checked={formData.allow_custom_tabs}
                onChange={handleChange}
              />
              <label htmlFor="customTabs">Allow Custom Tabs</label>
            </div>
            <div className="create-community-toggle">
              <input
                type="checkbox"
                id="orgOnly"
                name="restricted_to_org_members"
                checked={formData.restricted_to_org_members}
                onChange={handleChange}
              />
              <label htmlFor="orgOnly">
                Restrict to Organization Members
              </label>
            </div>
          </section>

          <section className="create-community-section uploads">
            <div className="create-community-group">
              <label>Upload Logo</label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleChange}
              />
            </div>
            <div className="create-community-group">
              <label>Upload Banner</label>
              <input
                type="file"
                name="banner"
                accept="image/*"
                onChange={handleChange}
              />
            </div>
          </section>

          <div className="create-community-group full">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              disabled={mutation.isLoading}
            />
          </div>

          {mutation.isError && (
            <div className="create-community-form-error">
              {mutation.error?.response?.data?.detail ||
                mutation.error?.message ||
                "An error occurred."}
            </div>
          )}
          {mutation.isSuccess && (
            <div className="create-community-form-success">
              Community created successfully!
            </div>
          )}

          <button
            type="submit"
            className="create-community-submit-button"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Creating..." : "Create Community"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunity;

import React, { useState } from "react";
import Modal from "../../../../../../components/modal/Modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import CustomEditor from "../../../../../../utils/editor/editor";
import "./myBlogsTab.css";
import RenderContent from "../../../../../../utils/editor/RenderContent.jsx";

const MyBlogsTab = () => {
  const [blogs, setBlogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // derive plain text from HTML for accurate word count
  const plainText = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = plainText === "" ? 0 : plainText.split(" ").length;
  const [expandedId, setExpandedId] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (wordCount > 600) {
      alert(`Your blog is ${wordCount} words. Maximum allowed is 600.`);
      return;
    }
    const newBlog = {
      id: Date.now(),
      title,
      content,
      date: new Date().toISOString(),
    };
    setBlogs([newBlog, ...blogs]);
    setTitle("");
    setContent("");
    closeModal();
  };

  return (
    <div className="my-blogs-tab container">
      <div className="collections-header">
        <h2>My Blogs</h2>
        <button className="create-btn" onClick={openModal}>
          + Write Blog
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Write a New Blog"
        size="md"
        maxWidth="1000px"
      >
        <form onSubmit={handleSubmit} className="blog-form">
          <div className="mycol-form-group">
            <label htmlFor="blog-title" className="mycol-form-label">
              Title
            </label>
            <input
              id="blog-title"
              type="text"
              className="mycol-form-input"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mycol-form-group">
            <label htmlFor="blog-content" className="mycol-form-label">
              Content
            </label>
            <CustomEditor
              content={content}
              onContentChange={setContent}
              placeholder="Write your article..."
              supportMedia={true}
            />
          </div>
          <div className="mycol-form-actions">
            <button
              type="button"
              className="mycol-back-btn"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button type="submit" className="mycol-submit-btn">
              Post Blog
            </button>
          </div>
        </form>
      </Modal>

      <div className="collections-list">
        {blogs.length === 0 ? (
          <div className="collections-no-data">No blogs yet. Create one!</div>
        ) : (
          blogs.map((blog) => (
            <div key={blog.id} className="collections-card">
              <h3 className="collections-title">{blog.title}</h3>
              <div className="collections-meta">
                {new Date(blog.date).toLocaleDateString()}
              </div>
              <div className={`markdown-content ${expandedId === blog.id ? 'expanded' : 'collapsed'}`}>
                <RenderContent
                  source={blog.content}
                  truncateWords={expandedId !== blog.id ? 50 : undefined}
                />
              </div>
              {expandedId !== blog.id ? (
                <button
                  className="read-more-btn"
                  onClick={() => setExpandedId(blog.id)}
                >
                  Read more
                </button>
              ) : (
                <button
                  className="read-more-btn"
                  onClick={() => setExpandedId(null)}
                >
                  Show less
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBlogsTab;

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./professionalProfile.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProfessionalProfile,
  saveProfessionalProfile,
} from "../../../../services/profile";
import { PROFILE_PROFESSIONAL } from "../../../../services/queryKeys";
import ProfessionalProfileModal from "./ProfessionalProfileModal";
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import { FaEdit } from "react-icons/fa";
import { formatDateTime } from "../../../../utils/formatDateTime";

/**
 * ExpandableText
 * - preserves newlines (pre-wrap)
 * - clamps to 6 lines
 * - toggles full text
 */
function ExpandableText({ text, maxLines = 6 }) {
  const [expanded, setExpanded] = useState(false);
  // Heuristic: if more than maxLines newline breaks, or very long
  const needsTruncation =
    text.split("\n").length > maxLines || text.length > maxLines * 100;

  return (
    <div className="pro-entry-text-wrapper">
      <p
        className={
          "pro-entry-description" + (expanded ? " expanded" : "")
        }
      >
        {text}
      </p>
      {needsTruncation && (
        <button
          className="show-more-btn"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

const tabConfig = [
  { key: "home", label: "Home" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "certifications", label: "Certifications" },
  { key: "projects", label: "Projects" },
  { key: "languages", label: "Languages" },
  { key: "publications", label: "Publications" },
  { key: "references", label: "References" },
];

export default function ProfessionalProfile({ profileInfo }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const username = profileInfo?.basicInfo?.username || "me";

  const { data: profileData, isLoading } = useQuery({
    queryKey: PROFILE_PROFESSIONAL(username),
    queryFn: () => fetchProfessionalProfile(username),
    enabled: !!username,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => saveProfessionalProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(PROFILE_PROFESSIONAL(username));
      setSaveError(null);
      setIsModalOpen(false);
    },
    onError: () => setSaveError("Something went wrong. Please try again."),
  });

  const hasCategoryData = (key) => {
    const arr = profileData[key];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (key === "skills")
      return arr.some((s) => typeof s === "string" && s.trim());
    return arr.some((obj) =>
      Object.values(obj).some(
        (val) => val != null && (typeof val !== "string" || val.trim())
      )
    );
  };

  const tabFromSearch = () => {
    const p = new URLSearchParams(location.search).get("proTab");
    return tabConfig.some((t) => t.key === p) ? p : "home";
  };
  const [activeTab, setActiveTab] = useState(tabFromSearch());
  useEffect(() => {
    const t = tabFromSearch();
    if (t !== activeTab) setActiveTab(t);
  }, [location.search]);

  const switchToTab = (tabKey) => {
    const params = new URLSearchParams(location.search);
    params.set("proTab", tabKey);
    params.delete("view");
    const newSearch = new URLSearchParams({ view: "professional" });
    for (let [k, v] of params.entries()) newSearch.append(k, v);
    navigate({ search: newSearch.toString() }, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="pro-profile pro-loading">
        <div className="pro-status-message">Loading...</div>
      </div>
    );
  }

  const isEmpty =
    !profileData ||
    Object.values(profileData).every((v) => Array.isArray(v) && v.length === 0);

  const renderContentSection = (key, label, content) => (
    <section key={key} className="pro-home-section" id={key}>
      <h3 className="pro-home-title">{label}</h3>
      {content}
    </section>
  );

  const renderTabContent = () => {
    const d = profileData;
    const sections = {
      experience: d.experience?.map((item, i) => {
        const start = formatDateTime(item.startDate);
        const end =
          item.endDate !== null ? formatDateTime(item.endDate) : "Present";
        const dateRange = `${start} – ${end}`;
        const durationDot = item.duration ? ` • ${item.duration}` : "";
        return (
          <div key={i} className="pro-entry">
            <h4>
              {item.title} — {item.company}
            </h4>
            <p>
              <i>
                {dateRange}
                {durationDot}
              </i>
            </p>
            <ExpandableText text={item.description || ""} />
          </div>
        );
      }),
      education: d.education?.map((edu, i) => {
        const start = formatDateTime(edu.startDate);
        const end =
          edu.endDate !== null ? formatDateTime(edu.endDate) : "Present";
        const dateRange = `${start} – ${end}`;
        const durationDot = edu.duration ? ` • ${edu.duration}` : "";
        return (
          <div key={i} className="pro-entry">
            <h4>{edu.degree}</h4>
            <p>{edu.school}</p>
            <p>
              <i>
                {dateRange}
                {durationDot}
              </i>
            </p>
            <ExpandableText text={edu.notes || ""} />
          </div>
        );
      }),
      skills: (
        <ul className="skills-list">
          {d.skills?.map((skill, i) => (
            <li key={i}>{skill}</li>
          ))}
        </ul>
      ),
      certifications: d.certifications?.map((cert, i) => (
        <div key={i} className="pro-entry">
          <h4>{cert.title}</h4>
          <p>
            {cert.issuer} — <i>{cert.year}</i>
          </p>
        </div>
      )),
      projects: d.projects?.map((proj, i) => (
        <div key={i} className="pro-entry">
          <h4>{proj.name}</h4>
          <ExpandableText text={proj.description || ""} />
          {proj.link && (
            <a href={proj.link} target="_blank" rel="noreferrer">
              {proj.link}
            </a>
          )}
        </div>
      )),
      languages: d.languages?.map((lang, i) => (
        <div key={i} className="pro-entry">
          <h4>{lang.name}</h4>
          <p>{lang.proficiency}</p>
        </div>
      )),
      publications: d.publications?.map((pub, i) => (
        <div key={i} className="pro-entry">
          <h4>{pub.title}</h4>
          <p>
            {pub.publisher}, <i>{pub.year}</i>
          </p>
          {pub.link && (
            <a href={pub.link} target="_blank" rel="noreferrer">
              {pub.link}
            </a>
          )}
        </div>
      )),
      references: d.references?.map((ref, i) => (
        <div key={i} className="pro-entry">
          <h4>{ref.name}</h4>
          <p>{ref.relationship}</p>
          <p>{ref.contact}</p>
        </div>
      )),
    };

    if (activeTab === "home") {
      return (
        <div className="pro-home-view">
          {tabConfig
            .filter((t) => t.key !== "home" && hasCategoryData(t.key))
            .map((t) => renderContentSection(t.key, t.label, sections[t.key]))}
        </div>
      );
    }

    return <div className="pro-section">{sections[activeTab]}</div>;
  };

  return (
    <div className="pro-profile">
      <div className="pro-content-area">
        <div className="pro-tabs-horizontal">
          <div className="pro-edit-btn-wrapper">
            <button
              className="pro-edit-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <FaEdit />
            </button>
          </div>
          {tabConfig
            .filter((t) => t.key === "home" || hasCategoryData(t.key))
            .map((t) => (
              <button
                key={t.key}
                className={`pro-tab-btn ${
                  activeTab === t.key ? "active" : ""
                }`}
                onClick={() => switchToTab(t.key)}
              >
                {t.label}
              </button>
            ))}
        </div>

        <div className="pro-scroll-wrapper">
          <div className="pro-scroll">
            {isEmpty ? (
              <div className="pro-status-message">
                You haven't added any professional details yet.
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="pro-sidebar">
        <div className="pro-sidebar-section">
          <div className="pro-sidebar-profile-image-wrapper">
            <ProfilePicture
              src={profileInfo?.basicInfo?.profile_image}
            />
          </div>
          <h4>
            {profileInfo?.basicInfo?.first_name +
              " " +
              profileInfo?.basicInfo?.last_name ||
              "User"}
          </h4>
          <p className="pro-role">
            {profileInfo?.basicInfo?.headline || "Professional"}
          </p>
        </div>
        <div className="pro-sidebar-section">
          <p>
            <strong>Email:</strong>
            <br />
            {profileInfo?.basicInfo?.email}
          </p>
          <p>
            <strong>Location:</strong>
            <br />
            {profileInfo?.basicInfo?.location || "—"}
          </p>
        </div>
        <div className="pro-sidebar-section">
          <a className="download-cv-btn" href="#">
            Download CV
          </a>
        </div>
        <div className="pro-sidebar-section pro-sidebar-links">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
      </aside>

      {isModalOpen && (
        <ProfessionalProfileModal
          existingData={profileData}
          onClose={() => {
            setIsModalOpen(false);
            setSaveError(null);
          }}
          onSave={(updatedData) => saveMutation.mutate(updatedData)}
          isSaving={saveMutation.isLoading}
          error={saveError}
        />
      )}
    </div>
  );
}

// ProfessionalProfileModal.jsx
import React, { useState, useRef } from "react";
import "./ProfessionalProfileModal.css";
import {
  FaChevronDown,
  FaChevronRight,
  FaTimes,
  FaGripLines,
} from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { useDrag, useDrop } from "react-dnd";

const ItemType = { CATEGORY: "category" };

const categoryFields = {
  experience: ["title", "company", "startDate", "endDate", "description"],
  education:  ["degree", "school", "startDate", "endDate", "description"],
  skills:     ["skill"],
  certifications: ["title", "issuer", "year", "description"],
  projects:   ["name", "description", "link"],
  languages:  ["name", "proficiency"],
  publications:["title", "publisher", "year", "link", "description"],
  references: ["name", "relationship", "contact", "description"],
};

const proficiencyLevels = [
  "Beginner", "Intermediate", "Advanced", "Fluent", "Native",
];
const degreeOptions = [
  "High School Diploma","Associate Degree","Bachelor’s Degree",
  "Master’s Degree","MBA","PhD","MD","JD","Certificate","Diploma","Other",
];

const defaultFormData = Object.fromEntries(
  Object.keys(categoryFields).map((cat) => [cat, []])
);

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const hasContent = (entry, fields) =>
  fields.some((key) => {
    const v = entry[key];
    return typeof v === "string" ? v.trim() !== "" : v != null;
  });

const DraggableCategory = React.memo(function ({
  cat,
  index,
  expanded,
  toggleCategory,
  entries,
  updateField,
  addEntry,
  removeEntry,
  moveCategory,
}) {
  const containerRef = useRef(null);
  const handleRef = useRef(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType.CATEGORY,
    item: { index },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });
  const [, drop] = useDrop({
    accept: ItemType.CATEGORY,
    hover(item, monitor) {
      if (!containerRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const { top, bottom } =
        containerRef.current.getBoundingClientRect();
      const hoverMiddleY = (bottom - top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - top;
      if (
        (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) ||
        (dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
      ) {
        return;
      }
      moveCategory(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(handleRef);
  drop(containerRef);
  preview(containerRef);

  return (
    <div
      ref={containerRef}
      className="pro-form-section"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="section-header-draggable">
        <div ref={handleRef} className="drag-icon">
          <FaGripLines />
        </div>
        <div
          className={`section-header ${expanded ? "expanded" : "collapsed"}`}
          onClick={() => toggleCategory(cat)}
        >
          <span>{capitalize(cat)}</span>
          <span>{expanded ? <FaChevronDown /> : <FaChevronRight />}</span>
        </div>
      </div>

      <div
        className={`section-body ${
          expanded ? "expanded-section" : "collapsed-section"
        }`}
      >
        {entries.map((entry, i) => (
          <div key={entry._id} className="pro-form-entry">
            {categoryFields[cat].map((key) => {
              const value = entry[key] ?? "";
              const label = capitalize(
                key.replace(/([A-Z])/g, " $1").trim()
              );

              // 1) Present checkbox for endDate
              if (key === "endDate") {
                const isCurrent = entry.isCurrent;
                return (
                  <div key="current" className="input-group">
                    <label className="control-settings-item">
                        Present
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={isCurrent}
                        onChange={() => {
                          // toggle ongoing vs chooseable
                          updateField(cat, i, "isCurrent", !isCurrent);
                          updateField(
                            cat,
                            i,
                            "endDate",
                            !isCurrent ? null : ""
                          );
                        }}
                      />{" "}
                      <span className="custom-checkmark"></span>
                    </label>
                    {/* <label key={option.value} className="control-settings-item">
                {option.label}
                <input
                    type="radio"
                    id={option.value + '-' + groupName}
                    name={groupName}
                    value={option.value}
                    checked={selectedValue === option.value}
                    onChange={() => onChange(option.value)}
                    className="custom-checkbox"
                />
                <span className="custom-checkmark"></span>
            </label> */}
                    {!isCurrent && (
                      <>
                        <label>End Date</label>
                        <input
                          type="date"
                          value={entry.endDate ?? ""}
                          onChange={(e) =>
                            updateField(cat, i, "endDate", e.target.value)
                          }
                        />
                      </>
                    )}
                  </div>
                );
              }

              // 2) Other date fields (startDate)
              if (key.toLowerCase().includes("date")) {
                return (
                  <div key={key} className="input-group">
                    <label>{label}</label>
                    <input
                      type="date"
                      value={value}
                      onChange={(e) =>
                        updateField(cat, i, key, e.target.value)
                      }
                    />
                  </div>
                );
              }

              // 3) Proficiency dropdown
              if (key === "proficiency") {
                return (
                  <div key={key} className="input-group">
                    <label>{label}</label>
                    <select
                      value={value}
                      onChange={(e) =>
                        updateField(cat, i, key, e.target.value)
                      }
                    >
                      <option value="">Select proficiency</option>
                      {proficiencyLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              // 4) Degree dropdown
              if (key === "degree") {
                return (
                  <div key={key} className="input-group">
                    <label>{label}</label>
                    <select
                      value={value}
                      onChange={(e) =>
                        updateField(cat, i, key, e.target.value)
                      }
                    >
                      <option value="">Select degree</option>
                      {degreeOptions.map((deg) => (
                        <option key={deg} value={deg}>
                          {deg}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              // 5) Description textarea
              if (key === "description") {
                return (
                  <div key={key} className="input-group double-span">
                    <label>{label}</label>
                    <textarea
                      rows={3}
                      placeholder={label}
                      value={value}
                      onChange={(e) =>
                        updateField(cat, i, key, e.target.value)
                      }
                    />
                  </div>
                );
              }

              // 6) Default text input
              return (
                <div key={key} className="input-group">
                  <label>{label}</label>
                  <input
                    type="text"
                    placeholder={label}
                    value={value}
                    onChange={(e) =>
                      updateField(cat, i, key, e.target.value)
                    }
                  />
                </div>
              );
            })}

            <div className="entry-controls">
              <button
                className="pill-btn remove-btn"
                onClick={() => removeEntry(cat, i)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <button className="pill-btn add-btn" onClick={() => addEntry(cat)}>
          Add {capitalize(cat)}
        </button>
      </div>
    </div>
  );
});

export default function ProfessionalProfileModal({
  onClose,
  onSave,
  existingData = {},
  isSaving = false,
  error = null,
}) {
  // 1) Inject _id & isCurrent from endDate===null
  const addIds = (data) => {
    const copy = { ...data };
    for (let cat of Object.keys(categoryFields)) {
      copy[cat] = (copy[cat] || []).map((e) => ({
        ...e,
        _id:      e._id || uuidv4(),
        isCurrent: e.endDate === null,
      }));
    }
    return copy;
  };

  const [formData, setFormData] = useState(
    addIds(existingData || defaultFormData)
  );
  const [expanded, setExpanded] = useState({});

  // 2) Initial category order
  const initialOrder = Object.keys(categoryFields).filter((cat) =>
    formData[cat].some((e) => hasContent(e, categoryFields[cat]))
  );
  const [order, setOrder] = useState(initialOrder);

  const toggleCategory = (cat) =>
    setExpanded((p) => ({ ...p, [cat]: !p[cat] }));
  const addCategory = (cat) => {
    if (!order.includes(cat)) setOrder((o) => [...o, cat]);
    setExpanded((p) => ({ ...p, [cat]: true }));
  };

  const updateField = (cat, i, key, value) =>
    setFormData((p) => {
      const arr = [...p[cat]];
      arr[i] = { ...arr[i], [key]: value };
      return { ...p, [cat]: arr };
    });

  const addEntry = (cat) => {
    const newEntry = Object.fromEntries(
      categoryFields[cat].map((k) => [k, ""])
    );
    newEntry._id = uuidv4();
    newEntry.isCurrent = false;
    setFormData((p) => ({
      ...p,
      [cat]: [...p[cat], newEntry],
    }));
  };

  const removeEntry = (cat, i) =>
    setFormData((p) => ({
      ...p,
      [cat]: p[cat].filter((_, idx) => idx !== i),
    }));

  const moveCategory = (from, to) =>
    setOrder((p) => {
      const a = [...p];
      a.splice(to, 0, a.splice(from, 1)[0]);
      return a;
    });

  // 3) Build payload, converting isCurrent → endDate:null
  const submit = () => {
    const payload = {};
    Object.keys(categoryFields).forEach((cat) => {
      const cleaned = formData[cat]
        .filter((e) => hasContent(e, categoryFields[cat]))
        .map((e) => {
          const { isCurrent, ...rest } = e;
          if (isCurrent) rest.endDate = null;
          return rest;
        });
      payload[cat] = cleaned;
    });
    payload.professional_tab_order = Object.keys(categoryFields).filter(
      (cat) => payload[cat].length > 0
    );
    onSave(payload);
  };

  const visibleOrder = order;

  return (
    <div className="pro-modal-overlay" onClick={onClose}>
      <div className="pro-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pro-modal-header">
          <h3>Edit Professional Profile</h3>
          <button className="close-pro-modal-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {error && <div className="pro-error-message">{error}</div>}

        <div className="category-buttons">
          {Object.keys(categoryFields).map((cat) => (
            <button
              key={cat}
              className={`category-btn ${
                order.includes(cat) ? "disabled" : ""
              }`}
              disabled={order.includes(cat)}
              onClick={() => addCategory(cat)}
            >
              {capitalize(cat)}
            </button>
          ))}
        </div>

        {visibleOrder.length === 0 ? (
          <div className="no-tabs-message">
            Click a category above to start adding your details.
          </div>
        ) : (
          visibleOrder.map((cat, idx) => (
            <DraggableCategory
              key={cat}
              cat={cat}
              index={idx}
              expanded={!!expanded[cat]}
              toggleCategory={toggleCategory}
              entries={formData[cat]}
              updateField={updateField}
              addEntry={addEntry}
              removeEntry={removeEntry}
              moveCategory={moveCategory}
            />
          ))
        )}

        <button
          className="pro-submit-btn"
          onClick={submit}
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

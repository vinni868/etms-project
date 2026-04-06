import { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";
import "./AdminScheduleClass.css";

const PAGE_SIZE = 5;

function AdminScheduleClass() {

  const [batches,     setBatches]     = useState([]);
  const [schedule,    setSchedule]    = useState([]);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [editingId,   setEditingId]   = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    batchId:     "",
    startDate:   "",
    endDate:     "",
    startTime:   "09:00",
    startPeriod: "AM",
    endTime:     "10:00",
    endPeriod:   "AM",
    status:      "ACTIVE"
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [loading,    setLoading]    = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchBatches();
    fetchSchedule();
  }, []);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchBatches = async () => {
    try {
      const res = await axios.get("/admin/batches");
      const activeBatches = res.data.filter(
        b => b.status === "ONGOING" || b.status === "ACTIVE"
      );
      setBatches(activeBatches);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await axios.get("/admin/schedule-classes");
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const convertTo24Hour = (time, period) => {
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  };

  const formatTo12Hour = (time) => {
    if (!time) return "";
    const parts = time.split(":");
    let hour = parseInt(parts[0], 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${parts[1]} ${ampm}`;
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      batchId: "", startDate: "", endDate: "",
      startTime: "09:00", startPeriod: "AM",
      endTime: "10:00", endPeriod: "AM",
      status: "ACTIVE"
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setFormData({
      batchId:     s.batch.id,
      startDate:   s.startDate,
      endDate:     s.endDate || s.startDate,
      startTime:   s.startTime.substring(0, 5),
      startPeriod: parseInt(s.startTime.split(":")[0]) >= 12 ? "PM" : "AM",
      endTime:     s.endTime.substring(0, 5),
      endPeriod:   parseInt(s.endTime.split(":")[0]) >= 12 ? "PM" : "AM",
      status:      s.status || "ACTIVE"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    if (!formData.startDate) { setErrorMsg("Start date is required."); return; }
    if (formData.startDate < today) { setErrorMsg("Start date cannot be before today."); return; }
    if (!formData.endDate) { setErrorMsg("End date is required."); return; }
    if (formData.endDate < formData.startDate) { setErrorMsg("End date cannot be before start date."); return; }

    try {
      setLoading(true);
      
      if (!formData.batchId) {
        setErrorMsg("Please select a batch first.");
        setLoading(false);
        return;
      }

      const selectedBatch = batches.find(b => b.id === Number(formData.batchId));
      if (!selectedBatch?.trainer?.id) {
        setErrorMsg("The selected batch has no assigned trainer. Please assign a trainer before scheduling classes.");
        setLoading(false);
        return;
      }

      const startFull = convertTo24Hour(formData.startTime, formData.startPeriod);
      const endFull = convertTo24Hour(formData.endTime, formData.endPeriod);

      // Simple time comparison within the same day
      if (formData.startDate === formData.endDate && endFull <= startFull) {
        setErrorMsg("End time must be after start time for the same date.");
        setLoading(false);
        return;
      }

      const payload = {
        batchId:   formData.batchId,
        trainerId: selectedBatch.trainer.id,
        startDate: formData.startDate,
        endDate:   formData.endDate,
        startTime: startFull,
        endTime:   endFull,
        status:    formData.status
      };

      if (editingId) {
        await axios.put(`/admin/schedule-classes/${editingId}`, payload);
        setSuccessMsg("Schedule updated successfully!");
      } else {
        await axios.post("/admin/schedule-classes", payload);
        setSuccessMsg("Class scheduled successfully!");
      }

      resetForm();
      fetchSchedule();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data || "Failed to save schedule.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedule = [...schedule].reverse().filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.batch?.batch_name || "").toLowerCase().includes(term) ||
      (s.trainer?.trainer_name || "").toLowerCase().includes(term)
    );
  });

  const totalPages   = Math.max(1, Math.ceil(filteredSchedule.length / PAGE_SIZE));
  const pagedSchedule = filteredSchedule.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getStatusMeta = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":    return { label: "● Active",    cls: "asc-badge--active"    };
      case "inactive":  return { label: "○ Inactive",  cls: "asc-badge--inactive"  };
      case "completed": return { label: "✓ Completed", cls: "asc-badge--completed" };
      default:          return { label: status,        cls: "asc-badge--active"    };
    }
  };

  // Stats
  const activeCount    = schedule.filter(s => (s.status || "").toLowerCase() === "active").length;
  const completedCount = schedule.filter(s => (s.status || "").toLowerCase() === "completed").length;

  return (
    <div className="asc-page">

      {/* ══════════════ PAGE HEADER ══════════════ */}
      <div className="asc-page-header">
        <div className="asc-page-header__left">
          <div className="asc-page-header__icon">📅</div>
          <div>
            <h1 className="asc-page-header__title">Schedule Management</h1>
            <p className="asc-page-header__sub">Create and manage class schedules for all batches</p>
          </div>
        </div>
        <div className="asc-page-header__stats">
          <div className="asc-stat-pill asc-stat-pill--blue">
            <span className="asc-stat-pill__num">{schedule.length}</span>
            <span className="asc-stat-pill__label">Total</span>
          </div>
          <div className="asc-stat-pill asc-stat-pill--green">
            <span className="asc-stat-pill__num">{activeCount}</span>
            <span className="asc-stat-pill__label">Active</span>
          </div>
          <div className="asc-stat-pill asc-stat-pill--purple">
            <span className="asc-stat-pill__num">{completedCount}</span>
            <span className="asc-stat-pill__label">Completed</span>
          </div>
        </div>
      </div>

      {/* ══════════════ LAYOUT ══════════════ */}
      <div className="asc-layout">

        {/* ════ LEFT — FORM PANEL ════ */}
        <div className="asc-form-panel">

          <div className="asc-form-panel__head">
            <div className="asc-form-panel__head-icon">
              {editingId ? "✏️" : "➕"}
            </div>
            <div>
              <h2 className="asc-form-panel__title">
                {editingId ? "Edit Schedule" : "New Schedule"}
              </h2>
              <p className="asc-form-panel__sub">
                {editingId ? "Update the class schedule details" : "Fill in details to schedule a class"}
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="asc-alert asc-alert--success">
              <span>✅</span><span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="asc-alert asc-alert--error">
              <span>⚠️</span><span>{errorMsg}</span>
            </div>
          )}

          <div className="asc-form">

            {/* Batch */}
            <div className="asc-field">
              <label className="asc-label">
                <span className="asc-label__icon">🏫</span>
                Select Batch
              </label>
              <div className="asc-select-wrap">
                <select
                  className="asc-select"
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleChange}
                >
                  <option value="">— Select Active Batch —</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batchName}</option>
                  ))}
                </select>
                <span className="asc-select-arrow">▾</span>
              </div>
            </div>

            {/* Dates row */}
            <div className="asc-field-row">
              <div className="asc-field">
                <label className="asc-label">
                  <span className="asc-label__icon">📆</span>
                  Start Date
                </label>
                <input
                  className="asc-input"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={today}
                />
              </div>
              <div className="asc-field">
                <label className="asc-label">
                  <span className="asc-label__icon">📆</span>
                  End Date
                </label>
                <input
                  className="asc-input"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || today}
                />
              </div>
            </div>

            {/* Times row */}
            <div className="asc-field-row">
              <div className="asc-field">
                <label className="asc-label">
                  <span className="asc-label__icon">⏰</span>
                  Start Time
                </label>
                <div className="asc-time-wrap">
                  <input
                    className="asc-input asc-input--time"
                    type="text"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    placeholder="09:00"
                  />
                  <div className="asc-select-wrap asc-select-wrap--period">
                    <select
                      className="asc-select asc-select--period"
                      name="startPeriod"
                      value={formData.startPeriod}
                      onChange={handleChange}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <span className="asc-select-arrow">▾</span>
                  </div>
                </div>
              </div>

              <div className="asc-field">
                <label className="asc-label">
                  <span className="asc-label__icon">⏰</span>
                  End Time
                </label>
                <div className="asc-time-wrap">
                  <input
                    className="asc-input asc-input--time"
                    type="text"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    placeholder="10:00"
                  />
                  <div className="asc-select-wrap asc-select-wrap--period">
                    <select
                      className="asc-select asc-select--period"
                      name="endPeriod"
                      value={formData.endPeriod}
                      onChange={handleChange}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <span className="asc-select-arrow">▾</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status — only shown when editing */}
            {editingId && (
              <div className="asc-field">
                <label className="asc-label">
                  <span className="asc-label__icon">🔘</span>
                  Status
                </label>
                <div className="asc-select-wrap">
                  <select
                    className="asc-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <span className="asc-select-arrow">▾</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="asc-form-actions">
              <button
                className={`asc-btn-primary ${loading ? "asc-btn-primary--loading" : ""}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><span className="asc-spinner" /> Processing…</>
                ) : editingId ? (
                  <><span>💾</span> Update Schedule</>
                ) : (
                  <><span>🚀</span> Schedule Class</>
                )}
              </button>
              {editingId && (
                <button className="asc-btn-cancel" onClick={resetForm}>
                  ✕ Cancel
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ════ RIGHT — LIST PANEL ════ */}
        <div className="asc-list-panel">

          {/* List header */}
          <div className="asc-list-header">
            <div className="asc-list-header__left">
              <h3 className="asc-list-title">Scheduled Classes</h3>
              <span className="asc-list-count">
                {filteredSchedule.length} class{filteredSchedule.length !== 1 ? "es" : ""}
              </span>
            </div>

            {/* Search */}
            <div className="asc-search">
              <span className="asc-search__icon">🔍</span>
              <input
                className="asc-search__input"
                type="text"
                placeholder="Search batch or trainer…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="asc-search__clear" onClick={() => setSearchTerm("")}>✕</button>
              )}
            </div>
          </div>

          {/* ══ PAGINATION — above the cards ══ */}
          {totalPages > 1 && (
            <div className="asc-pagination">
              <button
                className="asc-page-btn asc-page-btn--nav"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >‹ Prev</button>

              <div className="asc-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                  if (
                    p === 1 || p === totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        className={`asc-page-btn ${currentPage === p ? "asc-page-btn--active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >{p}</button>
                    );
                  }
                  if (p === 2 && currentPage > 3)
                    return <span key="e1" className="asc-page-ellipsis">…</span>;
                  if (p === totalPages - 1 && currentPage < totalPages - 2)
                    return <span key="e2" className="asc-page-ellipsis">…</span>;
                  return null;
                })}
              </div>

              <button
                className="asc-page-btn asc-page-btn--nav"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >Next ›</button>

              <span className="asc-page-info">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredSchedule.length)}
                <span className="asc-page-info__sep">·</span>
                {filteredSchedule.length} total
              </span>
            </div>
          )}

          {/* Schedule cards */}
          <div className="asc-scroll-area">
            {pagedSchedule.length === 0 ? (
              <div className="asc-empty">
                <div className="asc-empty__icon">📭</div>
                <p className="asc-empty__text">
                  {searchTerm
                    ? `No classes match "${searchTerm}"`
                    : "No classes scheduled yet."}
                </p>
              </div>
            ) : (
              pagedSchedule.map((s, idx) => {
                const { label, cls } = getStatusMeta(s.status);
                return (
                  <div
                    key={s.id}
                    className={`asc-card ${editingId === s.id ? "asc-card--editing" : ""}`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* Left accent stripe */}
                    <div className={`asc-card__stripe asc-card__stripe--${(s.status || "active").toLowerCase()}`} />

                    <div className="asc-card__body">
                      {/* Top row */}
                      <div className="asc-card__top">
                        <div className="asc-card__icon-wrap">
                          <span>🏫</span>
                        </div>
                        <div className="asc-card__identity">
                          <h4 className="asc-card__batch">{s.batch?.batch_name}</h4>
                          <span className="asc-card__trainer">
                            👨‍🏫 {s.trainer?.trainer_name || "No trainer assigned"}
                          </span>
                        </div>
                        <span className={`asc-badge ${cls}`}>{label}</span>
                      </div>

                      {/* Details grid */}
                      <div className="asc-card__details">
                        <div className="asc-detail-chip">
                          <span className="asc-detail-chip__icon">📅</span>
                          <div>
                            <span className="asc-detail-chip__label">Date Range</span>
                            <span className="asc-detail-chip__val">{s.startDate} → {s.endDate}</span>
                          </div>
                        </div>
                        <div className="asc-detail-chip">
                          <span className="asc-detail-chip__icon">⏰</span>
                          <div>
                            <span className="asc-detail-chip__label">Time Slot</span>
                            <span className="asc-detail-chip__val">
                              {formatTo12Hour(s.startTime)} – {formatTo12Hour(s.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit button */}
                      <div className="asc-card__footer">
                        <button
                          className="asc-edit-btn"
                          onClick={() => handleEdit(s)}
                        >
                          ✏️ Edit Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminScheduleClass;

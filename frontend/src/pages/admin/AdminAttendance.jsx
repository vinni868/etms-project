import { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import "./AdminAttendance.css";

/* ── PDF export (browser print, no external lib) ── */
const generatePDF = (records, batchName = "Batch") => {
  const win = window.open("", "_blank");
  const present = records.filter(r => r.status === "PRESENT").length;
  const absent  = records.filter(r => r.status === "ABSENT").length;
  const late    = records.filter(r => r.status === "LATE").length;
  const leave   = records.filter(r => r.status === "LEAVE").length;
  const pct     = records.length ? Math.round((present / records.length) * 100) : 0;
  const rows    = records.map((r, i) => `
    <tr class="${i % 2 === 0 ? "even" : ""}">
      <td>${i + 1}</td>
      <td>${r.studentName || ""}</td>
      <td>${r.formattedId || r.studentEmail || ""}</td>
      <td>${r.date || ""}</td>
      <td>${r.topic || "—"}</td>
      <td><span class="badge ${(r.status || "").toLowerCase()}">${r.status || ""}</span></td>
    </tr>`).join("");

  win.document.write(`<!DOCTYPE html><html><head>
    <title>Attendance Report — ${batchName}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',sans-serif;color:#1e293b;padding:32px;background:#fff}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:3px solid #1e3a8a;padding-bottom:16px}
      .hdr h1{font-size:22px;font-weight:800;color:#1e3a8a}
      .hdr p{font-size:12px;color:#64748b;margin-top:4px}
      .stats{display:flex;gap:10px;margin-bottom:22px}
      .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;text-align:center;flex:1}
      .stat .val{font-size:20px;font-weight:800;color:#1e3a8a;display:block}
      .stat .lbl{font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.5px}
      table{width:100%;border-collapse:collapse;font-size:12.5px}
      thead tr{background:#1e3a8a;color:#fff}
      th{padding:10px 12px;text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;font-weight:700}
      td{padding:9px 12px;border-bottom:1px solid #f1f5f9}
      tr.even td{background:#f8fafc}
      .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;text-transform:uppercase}
      .badge.present{background:#dcfce7;color:#15803d}
      .badge.absent{background:#fee2e2;color:#b91c1c}
      .badge.leave{background:#dbeafe;color:#1d4ed8}
      .badge.late{background:#fef3c7;color:#92400e}
      .footer{margin-top:24px;font-size:11px;color:#94a3b8;text-align:right}
    </style>
  </head><body>
    <div class="hdr">
      <div><h1>Attendance Report</h1>
        <p>Batch: <strong>${batchName}</strong> &nbsp;·&nbsp; Generated: ${new Date().toLocaleString()}</p></div>
      <div style="text-align:right"><strong style="font-size:14px;color:#1e3a8a">EtMS Smart Learning</strong></div>
    </div>
    <div class="stats">
      <div class="stat"><span class="val">${records.length}</span><span class="lbl">Total</span></div>
      <div class="stat"><span class="val">${present}</span><span class="lbl">Present</span></div>
      <div class="stat"><span class="val">${absent}</span><span class="lbl">Absent</span></div>
      <div class="stat"><span class="val">${late}</span><span class="lbl">Late</span></div>
      <div class="stat"><span class="val">${leave}</span><span class="lbl">Leave</span></div>
      <div class="stat"><span class="val">${pct}%</span><span class="lbl">Rate</span></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Date</th><th>Topic</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">EtMS Attendance System · Confidential</div>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
};

/* ── CSV export ── */
const exportCSV = (records) => {
  const header = ["#", "Name", "Student ID / Email", "Date", "Topic", "Status"];
  const rows   = records.map((r, i) => [i+1, r.studentName, r.formattedId || r.studentEmail, r.date, r.topic||"", r.status]);
  const csv    = [header, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob   = new Blob([csv], { type: "text/csv" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href = url; a.download = "attendance.csv"; a.click();
  URL.revokeObjectURL(url);
};

/* ── Status definitions ── */
const STATUS_CFG = {
  PRESENT: { label: "Present", short: "P",  color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  ABSENT:  { label: "Absent",  short: "A",  color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  LATE:    { label: "Late",    short: "L",  color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  LEAVE:   { label: "Leave",   short: "Lv", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
};

const AVATAR_COLORS = [
  { bg:"#eff6ff",color:"#2563eb"},{bg:"#f5f3ff",color:"#7c3aed"},
  { bg:"#ecfdf5",color:"#059669"},{bg:"#fff7ed",color:"#ea580c"},
  { bg:"#fdf2f8",color:"#db2777"},{bg:"#ecfeff",color:"#0891b2"},
];

const formatTime12h = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  } catch (e) { return "—"; }
};

const PAGE_SIZE = 10;

function AdminAttendance() {
  const [batches,   setBatches]   = useState([]);
  const [records,   setRecords]   = useState([]);
  const [batchId,   setBatchId]   = useState("");
  const [batchName, setBatchName] = useState("");
  const [date,      setDate]      = useState("");
  const [fromDate,  setFromDate]  = useState("");
  const [toDate,    setToDate]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { loadBatches(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const loadBatches = async () => {
    try {
      const res = await api.get("/admin/batches", { headers });
      setBatches(res.data);
    } catch (err) { console.error(err); }
  };

  const handleBatchChange = (e) => {
    setBatchId(e.target.value);
    const found = batches.find(b => String(b.id) === e.target.value);
    setBatchName(found?.batchName || "");
  };

  const fetchAttendance = async () => {
    if (!batchId) return alert("Please select a batch first.");
    setLoading(true); setSearch(""); setCurrentPage(1);
    try {
      let url = `/admin/attendance/batch/${batchId}`;
      if (fromDate && toDate) url += `?fromDate=${fromDate}&toDate=${toDate}`;
      else if (date)          url += `?date=${date}`;
      const res = await api.get(url, { headers });
      setRecords(res.data.map(r => ({
        ...r, status: r.status || "ABSENT", topic: r.topic || "", isModified: false
      })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = (id, status) =>
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status, isModified: true } : r));

  const saveUpdates = async () => {
    const modified = records.filter(r => r.isModified);
    if (!modified.length) return alert("No changes to save.");
    try {
      await api.put("/admin/attendance/update", modified.map(r => ({
        id: r.id||null, studentId: r.studentId, batchId: r.batchId,
        date: r.date, topic: r.topic||"", status: r.status||"ABSENT"
      })), { headers });
      alert("Attendance updated successfully ✅");
      fetchAttendance();
    } catch { alert("Save failed. Please try again."); }
  };

  /* ── Derived ── */
  const total   = records.length;
  const present = records.filter(r => r.status === "PRESENT").length;
  const absent  = records.filter(r => r.status === "ABSENT").length;
  const late    = records.filter(r => r.status === "LATE").length;
  const leave   = records.filter(r => r.status === "LEAVE").length;
  const pct     = total ? Math.round((present / total) * 100) : 0;
  const modified = records.filter(r => r.isModified).length;

  const filtered = records.filter(r =>
    `${r.studentName} ${r.studentEmail} ${r.date} ${r.topic} ${r.status}`
      .toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  const getPageNums = () => {
    const nums = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p===1||p===totalPages||(p>=currentPage-1&&p<=currentPage+1)) nums.push(p);
      else if (p===2&&currentPage>3) nums.push("...");
      else if (p===totalPages-1&&currentPage<totalPages-2) nums.push("...");
    }
    return [...new Set(nums)];
  };

  return (
    <div className="aa-page">

      {/* ══ HEADER ══ */}
      <div className="aa-header">
        <div className="aa-header__left">
          <div className="aa-header__icon">📊</div>
          <div>
            <h1 className="aa-header__title">Attendance Management</h1>
            <p className="aa-header__sub">View, edit and export student attendance records</p>
          </div>
        </div>
        <div className="aa-export-row">
          <button 
            className="aa-export-btn aa-export-btn--csv" 
            style={{ background: "#4f46e5", color: "white", borderColor: "#4338ca", marginRight: "1rem" }}
            onClick={() => window.open('/admin/qr-station', '_blank')}
          >
            📱 Open QR Station
          </button>
          
          {records.length > 0 && (
            <>
              <button className="aa-export-btn aa-export-btn--csv" onClick={() => exportCSV(records)}>
                ⬇ CSV
              </button>
              <button className="aa-export-btn aa-export-btn--pdf" onClick={() => generatePDF(records, batchName)}>
                🖨 PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══ FILTER BAR ══ */}
      <div className="aa-filters">
        <div className="aa-filters__inner">
          <div className="aa-fgroup">
            <label className="aa-flabel">Batch</label>
            <div className="aa-select-wrap">
              <select className="aa-select" value={batchId} onChange={handleBatchChange}>
                <option value="">— Select Batch —</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batchName}</option>)}
              </select>
              <span className="aa-select-arrow">▾</span>
            </div>
          </div>

          <div className="aa-fgroup">
            <label className="aa-flabel">Date</label>
            <input className="aa-finput" type="date" value={date}
              onChange={e => { setDate(e.target.value); setFromDate(""); setToDate(""); }} />
          </div>

          <div className="aa-or">OR</div>

          <div className="aa-fgroup">
            <label className="aa-flabel">From</label>
            <input className="aa-finput" type="date" value={fromDate}
              onChange={e => { setFromDate(e.target.value); setDate(""); }} />
          </div>

          <div className="aa-fgroup">
            <label className="aa-flabel">To</label>
            <input className="aa-finput" type="date" value={toDate}
              onChange={e => { setToDate(e.target.value); setDate(""); }} />
          </div>

          <button className="aa-fetch-btn" onClick={fetchAttendance} disabled={loading}>
            {loading ? <><span className="aa-spin-sm"/>Fetching…</> : "Fetch Attendance"}
          </button>
        </div>
      </div>

      {/* ══ STATS ══ */}
      {records.length > 0 && (
        <div className="aa-stats">
          <div className="aa-stat aa-stat--blue">
            <span className="aa-stat__val">{total}</span>
            <span className="aa-stat__lbl">Total</span>
          </div>
          <div className="aa-stat aa-stat--green">
            <span className="aa-stat__val">{present}</span>
            <span className="aa-stat__lbl">Present</span>
          </div>
          <div className="aa-stat aa-stat--red">
            <span className="aa-stat__val">{absent}</span>
            <span className="aa-stat__lbl">Absent</span>
          </div>
          <div className="aa-stat aa-stat--amber">
            <span className="aa-stat__val">{late}</span>
            <span className="aa-stat__lbl">Late</span>
          </div>
          <div className="aa-stat aa-stat--indigo">
            <span className="aa-stat__val">{leave}</span>
            <span className="aa-stat__lbl">Leave</span>
          </div>
          <div className="aa-stat aa-stat--pct">
            <div className="aa-pct-row">
              <span className="aa-stat__lbl">Attendance Rate</span>
              <span className="aa-pct-num" style={{
                color: pct>=75?"#16a34a":pct>=50?"#d97706":"#dc2626"
              }}>{pct}%</span>
            </div>
            <div className="aa-pct-bar">
              <div className="aa-pct-bar__fill" style={{
                width:`${pct}%`,
                background:pct>=75?"#16a34a":pct>=50?"#d97706":"#dc2626"
              }}/>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CARD ══ */}
      <div className="aa-card">
        {loading ? (
          <div className="aa-state">
            <div className="aa-spinner"/>
            <p>Loading attendance data…</p>
          </div>
        ) : records.length === 0 ? (
          <div className="aa-state">
            <div className="aa-empty-icon">📋</div>
            <h3>No Records Yet</h3>
            <p>Select a batch and date, then click Fetch Attendance</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="aa-toolbar">
              <div className="aa-toolbar__left">
                <span className="aa-toolbar__title">Attendance Records</span>
                <span className="aa-count-chip">{filtered.length} records</span>
                {modified > 0 && <span className="aa-modified-chip">⚠ {modified} unsaved</span>}
              </div>
              <div className="aa-search">
                <span className="aa-search__ico">🔍</span>
                <input className="aa-search__inp" type="text"
                  placeholder="Search name, email, topic…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="aa-search__clr" onClick={() => setSearch("")}>✕</button>}
              </div>
            </div>

            {/* Pagination above table */}
            {totalPages > 1 && (
              <div className="aa-pagination">
                <span className="aa-pag-info">
                  {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="aa-pag-btns">
                  <button className="aa-pag-btn aa-pag-nav" disabled={currentPage===1}
                    onClick={() => setCurrentPage(p=>p-1)}>‹ Prev</button>
                  {getPageNums().map((p,i) =>
                    p==="..."
                      ? <span key={`e${i}`} className="aa-pag-dots">…</span>
                      : <button key={p} onClick={() => setCurrentPage(p)}
                          className={`aa-pag-btn ${currentPage===p?"aa-pag-btn--on":""}`}>{p}</button>
                  )}
                  <button className="aa-pag-btn aa-pag-nav" disabled={currentPage===totalPages}
                    onClick={() => setCurrentPage(p=>p+1)}>Next ›</button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="aa-table-wrap">
              <table className="aa-table responsive-card-table">
                <colgroup>
                  <col style={{width:"46px"}}/>
                  <col style={{width:"170px"}}/>
                  <col style={{width:"150px"}}/>
                  <col style={{width:"100px"}}/>
                  <col style={{width:"150px"}}/>
                  <col style={{width:"90px"}}/>
                  <col style={{width:"100px"}}/>
                  <col style={{width:"80px"}}/>
                  <col style={{width:"160px"}}/>
                </colgroup>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Late Mins</th>
                    <th className="aa-th-c">Marked At</th>
                    <th className="aa-th-c">Status</th>
                    <th className="aa-th-c">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r, i) => {
                    const idx    = (currentPage-1)*PAGE_SIZE + i;
                    const scheme = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    const cfg    = STATUS_CFG[r.status] || STATUS_CFG.ABSENT;
                    return (
                      <tr key={r.id} className={r.isModified ? "aa-row--modified" : ""}>

                        <td className="aa-td aa-td--num" data-label="#">
                          <span className="aa-rnum">{idx+1}</span>
                        </td>

                        <td className="aa-td" data-label="Student">
                          <div className="aa-student">
                            <div className="aa-avatar"
                              style={{background:scheme.bg, color:scheme.color}}>
                              {(r.studentName||"?").charAt(0).toUpperCase()}
                            </div>
                             <div className="aa-name-wrap">
                               <span className="aa-name">
                                 {r.studentName}
                                 <span className={`hb-mode-badge hb-mode-badge--${(r.courseMode || "OFFLINE").toLowerCase()}`} 
                                   style={{ marginLeft: '6px', fontSize: '9px', verticalAlign: 'middle' }}>
                                   {r.courseMode || "OFFLINE"}
                                 </span>
                                 {r.approvedOnline && <span className="aa-online-status" title="Approved for Online Permission" style={{ 
                                   marginLeft: '6px', fontSize: '9px', background: '#dbeafe', color: '#1d4ed8', 
                                   padding: '1px 5px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase'
                                 }}>Online</span>}
                               </span>
                               <span className="aa-id-sub" style={{fontSize: '10px', color: '#64748b', display: 'block'}}>{r.formattedId}</span>
                             </div>
                           </div>
                         </td>

                        <td className="aa-td" data-label="Email">
                          <a href={`mailto:${r.studentEmail}`} className="aa-email">
                            {r.studentEmail}
                          </a>
                        </td>

                        <td className="aa-td aa-td--date" data-label="Date">{r.date}</td>

                        <td className="aa-td" data-label="Topic">
                          <span className="aa-topic" title={r.topic}>{r.topic||"—"}</span>
                        </td>

                        <td className="aa-td" data-label="Late Mins">
                          {r.status === 'LATE' ? (
                            <span style={{ fontWeight: '600', color: '#b45309' }}>{r.lateMinutes || 0}m</span>
                          ) : "—"}
                        </td>

                        <td className="aa-td aa-td--c" data-label="Marked At">
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{formatTime12h(r.createdAt)}</span>
                        </td>

                        <td className="aa-td aa-td--c" data-label="Status">
                          <span className="aa-badge" style={{
                            background:cfg.bg, color:cfg.color, borderColor:cfg.border
                          }}>{cfg.label}</span>
                        </td>

                        <td className="aa-td aa-td--c" data-label="Update">
                          <div className="aa-toggle">
                            {Object.entries(STATUS_CFG).map(([key, c]) => (
                              <button key={key}
                                className={`aa-tgl ${r.status===key?"aa-tgl--on":""}`}
                                style={r.status===key
                                  ? {background:c.color,color:"#fff",borderColor:c.color}
                                  : {}}
                                onClick={() => updateStatus(r.id, key)}
                                title={`Mark ${c.label}`}
                              >{c.short}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="aa-footer">
              <span className="aa-footer__msg">
                {modified > 0 ? `⚠ ${modified} unsaved change${modified>1?"s":""}` : ""}
              </span>
              <button className="aa-save-btn" onClick={saveUpdates} disabled={modified===0}>
                💾 Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAttendance;

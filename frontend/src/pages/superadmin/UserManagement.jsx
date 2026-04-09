import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axiosConfig";
import "./UserManagement.css";
import "./SuperAdminCommon.css";
import { FaUserPlus, FaSearch, FaFilter, FaTrafficLight, FaUserShield, FaUserTie, FaUserGraduate, FaUserTag, FaUsers, FaUserMd, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PAGE_SIZE = 10;

function UserManagement() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "", studentId: "" });
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/superadmin/users/all");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    if (user.role.roleName === 'SUPERADMIN') {
      alert("⚠️ Access Denied: Super Admin accounts cannot be suspended or deactivated.");
      return;
    }
    try {
      await api.patch(`/superadmin/users/toggle-status/${user.id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveClick = async (u) => {
    let overrideId = window.prompt(`Approving ${u.name}.\nTo auto-generate ID, leave blank.\nTo manually assign an ID, enter it below:`);
    if (overrideId === null) return;
    try {
      const res = await api.put(`/superadmin/users/approve/${u.id}`, { generatedId: overrideId });
      alert(res.data.message || "User approved!");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve user.");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role.roleName,
      studentId: user.portalId || user.studentId || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/superadmin/users/update/${editingUser.id}`, editForm);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (user) => {
    if (user.role.roleName === 'SUPERADMIN') {
      alert("☢️ System Safety Triggered: Super Admin accounts cannot be deleted.");
      return;
    }
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await api.post(`/superadmin/users/delete-permanently/${deletingUser.id}`);
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        (u.studentId && u.studentId.toLowerCase().includes(search.toLowerCase())) ||
                        (u.portalId && u.portalId.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "ALL" || u.role.roleName === roleFilter;
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case "SUPERADMIN": return <FaUserShield style={{color: '#f59e0b'}} />;
      case "ADMIN":      return <FaUserShield style={{color: '#2347c5'}} />;
      case "TRAINER":    return <FaUserTie style={{color: '#16a34a'}} />;
      case "STUDENT":    return <FaUserGraduate style={{color: '#2f59e0'}} />;
      case "MARKETER":   return <FaUserTag style={{color: '#f97316'}} />;
      case "COUNSELOR":  return <FaUserMd style={{color: '#db2777'}} />;
      default:           return <FaUserTag />;
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-wrapper um-wrapper-extra um-wrapper-single">
        <div className="um-main-panel">

          {/* ── Stats Banner ── */}
          <div className="um-stats-rectangle">
            <div className="um-stat-card">
              <div className="um-stat-icon"><FaUsers /></div>
              <div className="um-stat-info">
                <span className="um-stat-val">{users.length}</span>
                <span className="um-stat-lbl">Registered Members</span>
              </div>
            </div>
            <div className="um-stat-divider" />
            <div className="um-stat-card">
              <div className="um-stat-icon" style={{color:'var(--sa-green)'}}>🟢</div>
              <div className="um-stat-info">
                <span className="um-stat-val">Active</span>
                <span className="um-stat-lbl">Real-time Syncing</span>
              </div>
            </div>
            <div className="um-stat-divider" />
            <div className="um-stat-card">
              <div className="um-stat-info">
                <span className="um-stat-val" style={{fontSize:'1rem'}}>Global Overview</span>
                <span className="um-stat-lbl">Lifecycle Management</span>
              </div>
            </div>
          </div>

          {/* ── Header ── */}
          <div className="um-header">
            <div className="um-header__left">
              <h1>Universal Directory</h1>
              <p>Managing {filteredUsers.length} members matching current filters</p>
            </div>
            <button className="um-btn--primary" onClick={() => window.location.href = "/#/superadmin/create-user"}>
              <FaUserPlus /> Provision User
            </button>
          </div>

          {/* ── Search & Filters ── */}
          <div className="um-controls">
            <div className="um-search">
              <FaSearch className="um-search-icon" />
              <input
                type="text"
                placeholder="Search name, email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="um-filters">
              <div className="um-filter-group">
                <FaFilter />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="ALL">All Roles</option>
                  <option value="SUPERADMIN">Super Admins</option>
                  <option value="ADMIN">Admins</option>
                  <option value="TRAINER">Trainers</option>
                  <option value="STUDENT">Students</option>
                  <option value="MARKETER">Marketers</option>
                  <option value="COUNSELOR">Counselors</option>
                </select>
              </div>
              <div className="um-filter-group">
                <FaTrafficLight />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending Approval</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="um-table-container">
            {loading ? (
              <div className="um-loader">
                <div className="um-spinner"></div>
                <p>Scanning global registry...</p>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="um-empty">
                <p>No members found matching your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <table className="um-table um-table--desktop">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Member</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="um-role-badge">
                            {getRoleIcon(u.role.roleName)}
                            <span>{u.role.roleName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="um-member-cell">
                            <div className="um-avatar">{u.name.charAt(0)}</div>
                            <div className="um-member-info">
                              <span className="um-name">{u.name}</span>
                              <span className="um-email-main">{u.email}</span>
                              {(u.portalId || u.studentId) && (
                                <span className="um-id-badge">{u.portalId || u.studentId}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`um-status-pill um-status--${u.status.toLowerCase()}`}>
                            ● {u.status}
                          </span>
                        </td>
                        <td>
                          <div className="um-action-group">
                            {u.status === 'PENDING' ? (
                              <button className="um-action-pill approve" onClick={() => handleApproveClick(u)}>
                                ✅ Approve
                              </button>
                            ) : (
                              <>
                                <button className="um-action-pill edit" onClick={() => handleEditClick(u)}>Edit</button>
                                <button className={`um-action-pill ${u.status === 'ACTIVE' ? 'suspend' : 'reinstate'}`} onClick={() => toggleStatus(u)}>
                                  {u.status === 'ACTIVE' ? 'Suspend' : 'Reinstate'}
                                </button>
                                <button className="um-action-pill delete" onClick={() => handleDeleteClick(u)}>🗑 Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="um-card-list">
                  {paginatedUsers.map(u => (
                    <div key={u.id} className="um-card">
                      <div className="um-card-top">
                        <div className="um-card-left">
                          <div className="um-avatar um-avatar--lg">{u.name.charAt(0)}</div>
                          <div className="um-member-info">
                            <span className="um-name">{u.name}</span>
                            <span className="um-email-main">{u.email}</span>
                            {(u.portalId || u.studentId) && (
                              <span className="um-id-badge">{u.portalId || u.studentId}</span>
                            )}
                          </div>
                        </div>
                        <span className={`um-status-pill um-status--${u.status.toLowerCase()}`}>
                          ● {u.status}
                        </span>
                      </div>
                      <div className="um-card-meta">
                        <div className="um-role-badge">
                          {getRoleIcon(u.role.roleName)}
                          <span>{u.role.roleName}</span>
                        </div>
                      </div>
                      <div className="um-card-actions">
                        {u.status === 'PENDING' ? (
                          <button className="um-action-pill approve" onClick={() => handleApproveClick(u)}>✅ Approve</button>
                        ) : (
                          <>
                            <button className="um-action-pill edit" onClick={() => handleEditClick(u)}>Edit</button>
                            <button className={`um-action-pill ${u.status === 'ACTIVE' ? 'suspend' : 'reinstate'}`} onClick={() => toggleStatus(u)}>
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Reinstate'}
                            </button>
                            <button className="um-action-pill delete" onClick={() => handleDeleteClick(u)}>🗑 Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="um-pagination">
              <button
                className="um-page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>

              <div className="um-page-numbers">
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`um-page-num ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="um-page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>

              <span className="um-page-info">
                Page {currentPage} of {totalPages} · {filteredUsers.length} members
              </span>
            </div>
          )}

        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {showEditModal && (
        <div className="um-modal-overlay">
          <div className="um-modal">
            <div className="um-modal-header">
              <h2>Edit Member Details</h2>
              <button className="um-modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="um-modal-form">
              <div className="um-form-row">
                <div className="um-form-group">
                  <label>Full Name</label>
                  <input type="text" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="um-form-group">
                  <label>Email Address</label>
                  <input type="email" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                </div>
              </div>
              <div className="um-form-row">
                <div className="um-form-group">
                  <label>Phone Number</label>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="um-form-group">
                  <label>Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}>
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TRAINER">Trainer</option>
                    <option value="STUDENT">Student</option>
                    <option value="MARKETER">Marketer</option>
                    <option value="COUNSELOR">Counselor</option>
                  </select>
                </div>
              </div>
              <div className="um-form-group">
                <label>System / Portal ID</label>
                <input type="text" value={editForm.studentId} onChange={(e) => setEditForm({...editForm, studentId: e.target.value})} placeholder="e.g. STU-2026-0001" />
              </div>
              <div className="um-modal-footer">
                <button type="button" className="um-modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="um-modal-save" disabled={updating}>
                  {updating ? "Saving Changes..." : "Update Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {showDeleteModal && deletingUser && (
        <div className="um-modal-overlay">
          <div className="um-modal" style={{maxWidth:'420px'}}>
            <div className="um-modal-header" style={{background:'linear-gradient(135deg,#dc2626,#b91c1c)'}}>
              <h2 style={{color:'white'}}>⚠️ Permanent Delete</h2>
              <button className="um-modal-close" style={{color:'white'}} onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>
            <div style={{padding:'28px 28px 8px', textAlign:'center'}}>
              <div style={{fontSize:'3rem', marginBottom:'12px'}}>🗑️</div>
              <p style={{fontSize:'1rem', color:'#1e293b', marginBottom:'8px'}}>
                You are about to <strong style={{color:'#dc2626'}}>permanently delete</strong> this user:
              </p>
              <div style={{background:'#fff1f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', margin:'16px 0'}}>
                <strong style={{fontSize:'1rem', color:'#dc2626'}}>{deletingUser.name}</strong><br />
                <span style={{fontSize:'0.85rem', color:'#64748b'}}>{deletingUser.email}</span>
                {(deletingUser.portalId || deletingUser.studentId) && (
                  <><br /><code style={{fontSize:'0.8rem', color:'#dc2626'}}>{deletingUser.portalId || deletingUser.studentId}</code></>
                )}
              </div>
              <p style={{fontSize:'0.85rem', color:'#ef4444', fontWeight:'600'}}>⚠️ This action cannot be undone!</p>
            </div>
            <div className="um-modal-footer" style={{padding:'16px 28px 24px'}}>
              <button className="um-modal-cancel" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button className="um-modal-save" style={{background:'#dc2626', border:'none'}} onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? '🗑 Deleting...' : '🗑 Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;

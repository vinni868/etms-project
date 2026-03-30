import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import "./CreateAdmin.css";
import "./SuperAdminCommon.css";
import { 
  FaUserShield, FaPlus, FaEdit, FaTrash, 
  FaTimesCircle, FaLock, FaEnvelope, FaUser, FaShieldAlt
} from "react-icons/fa";

function CreateAdmin() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    permissions: [],
    status: "ACTIVE"
  });

  const availablePermissions = [
    "MANAGE_COURSES",
    "MANAGE_STUDENTS",
    "MANAGE_TRAINERS",
    "VIEW_REPORTS",
    "MANAGE_BATCHES"
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get("/superadmin/admins");
      setAdmins(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission]
      };
    });
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "ADMIN",
      permissions: [],
      status: "ACTIVE"
    });
    setShowModal(true);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      role: admin.role?.roleName || "ADMIN",
      permissions: admin.permissions
        ? admin.permissions.map((p) => p.permissionName)
        : [],
      status: admin.status
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    if (!window.confirm("Are you sure you want to toggle this admin's access?")) return;

    try {
      await api.patch(`/superadmin/admins/${id}/status`);
      fetchAdmins();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAdmin) {
        await api.patch(`/superadmin/admins/${editingAdmin.id}`, formData);
      } else {
        await api.post("/superadmin/admins", formData);
      }
      fetchAdmins();
      setShowModal(false);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save admin credentials.");
    }
  };

  return (
    <div className="sa-page">
      <div className="sa-wrapper ca-wrapper-extra">
        
        {/* ── SIDE PANEL ── */}
        <div className="sa-side-panel">
          <div className="sa-side-brand">
            <span className="cu-side-et">Et</span><span className="cu-side-ms">MS</span>
          </div>
          <h2 className="sa-side-title">Admin Council</h2>
          <p className="sa-side-desc">
            Authorize and manage high-level administrative users. Delegate permissions to maintain platform integrity.
          </p>

          <div className="ca-side-stats">
            <div className="ca-ss-item">
              <span className="ca-ss-val">{admins.length}</span>
              <span className="ca-ss-lbl">Authorized Admins</span>
            </div>
          </div>

          <div className="ca-side-illustration">
             <FaShieldAlt size={120} style={{opacity: 0.15}} />
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="ca-main-panel">
          <div className="ca-header">
            <div className="ca-header-left">
              <h1>Administrative Control</h1>
              <p>Managing {admins.length} active administrative personnel</p>
            </div>
            <button className="ca-btn-primary" onClick={openCreateModal}>
              <FaPlus /> Authorize New Admin
            </button>
          </div>

          <div className="ca-table-card">
            {loading ? (
              <div className="ca-loader">
                <div className="ca-spinner"></div>
                <p>Syncing encrypted registry...</p>
              </div>
            ) : (
              <table className="ca-table responsive-card-table">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Role Alias</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td data-label="Administrator">
                        <div className="ca-user-cell">
                          <div className="ca-avatar">{admin.name.charAt(0)}</div>
                          <div className="ca-user-info">
                            <span className="ca-name">{admin.name}</span>
                            <span className="ca-email">{admin.email}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Role Alias">
                        <div className="ca-role-pill">
                          <FaUserShield /> {admin.role?.roleName}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`ca-status-dot ${admin.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="ca-actions" data-label="Actions">
                        <button className="ca-action-btn edit" onClick={() => handleEdit(admin)}>
                          <FaEdit />
                        </button>
                        <button className="ca-action-btn delete" onClick={() => handleToggleStatus(admin.id)} title="Toggle Status">
                          <FaLock />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="ca-modal-overlay">
          <div className="ca-modal">
            <div className="ca-modal-header">
              <h3>{editingAdmin ? "Modify Authorization" : "New Admin Protocol"}</h3>
              <button className="ca-close" onClick={() => setShowModal(false)}><FaTimesCircle /></button>
            </div>

            <form onSubmit={handleSubmit} className="ca-form">
              <div className="ca-form-grid">
                <div className="ca-input-group">
                  <label><FaUser /> Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="ca-input-group">
                  <label><FaEnvelope /> Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {!editingAdmin && (
                  <div className="ca-input-group">
                    <label><FaLock /> Access Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                <div className="ca-input-group">
                  <label>Role Clearance</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUB_ADMIN">SUB_ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="ca-perm-section">
                <label className="ca-perm-title">Permission Matrix</label>
                <div className="ca-perm-grid">
                  {availablePermissions.map((perm) => (
                    <label key={perm} className="ca-perm-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={() => handlePermissionChange(perm)}
                      />
                      <span>{perm.replace("MANAGE_", "")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="ca-modal-footer">
                <button type="button" className="ca-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ca-btn-primary">
                  {editingAdmin ? "Confirm Changes" : "Activate Protocol"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateAdmin;
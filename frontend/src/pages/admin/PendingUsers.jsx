import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";

function PendingUsers() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await api.get("/admin/users/pending");
    setUsers(res.data);
  };

  const approveUser = async (id) => {
    let overrideId = window.prompt("To auto-generate ID, leave blank. To manually assign an ID, enter it below:");
    if (overrideId === null) return;
    await api.patch(`/admin/users/approve/${id}`, { generatedId: overrideId });
    fetchUsers();
  };

  const rejectUser = async (id) => {
    await api.patch(`/admin/users/reject/${id}`);
    fetchUsers();
  };

  return (
    <div>
      <h2>Pending Approvals</h2>

      <table className="responsive-card-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map(user => {
            const isStudent = user.role?.roleName === "STUDENT";
            return (
              <tr key={user.id}>
                <td data-label="Name" style={{fontWeight: '600'}}>{user.name}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Role">
                   <span style={{
                     padding: '4px 10px', 
                     background: isStudent ? '#eff6ff' : '#f5f3ff', 
                     color: isStudent ? '#2563eb' : '#7c3aed',
                     borderRadius: '6px',
                     fontSize: '11px',
                     fontWeight: '700'
                   }}>
                     {user.role?.roleName}
                   </span>
                </td>
                <td data-label="Action">
                  {isStudent ? (
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button 
                        onClick={() => approveUser(user.id)}
                        style={{background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px'}}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => rejectUser(user.id)}
                        style={{background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px'}}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{color: '#64748b', fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px'}}>
                      🔒 Super Admin Review Required
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}

export default PendingUsers;

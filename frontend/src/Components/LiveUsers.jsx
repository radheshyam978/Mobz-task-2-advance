import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './Axios';
import { socket } from './Socket';
import UserModal from './UserModal';

export default function LiveUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const authUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('authUser') || 'null');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    function onConnect() {
      if (authUser?.email) {
        socket.emit('join_live_users', {
          email: authUser.email,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          loginId: authUser.loginId,
        });
      } else {
        socket.emit('viewer_join');
      }
    }

    socket.connect();
    socket.on('connect', onConnect);
    socket.on('live_users_update', (list) => setUsers(Array.isArray(list) ? list : []));

    return () => {
      socket.off('connect', onConnect);
      socket.off('live_users_update');
      socket.disconnect();
    };
  }, [authUser]);

  const logout = () => {
    try {
      socket.emit('leave_live_users');
    } catch {}
    sessionStorage.removeItem('authUser');
    navigate('/login');
  };

  const openUser = async (email) => {
    try {
      const { data } = await api.get('/users', { params: { email } });
      const u = Array.isArray(data?.user) ? data.user[0] : data?.user;
      setSelectedUser(u || null);
      setShowModal(true);
    } catch (e) {
      alert('Error fetching user');
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-4">
        <div className="d-flex align-items-center justify-content-between">
          <h3 className="mb-3">Live Users</h3>
          <div>
            {authUser ? (
              <>
                <span id="me" className="me-3 text-muted">
                  You: {authUser.firstName || ''} {authUser.lastName || ''} &lt;{authUser.email || ''}&gt;
                </span>
                <button
                  id="logoutBtn"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <span className="me-3 text-muted">You are viewing as a guest</span>
                <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
                <Link to="/" className="btn btn-link btn-sm">Register</Link>
              </>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr>
                <th>Email</th>
                <th>Login ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan="3" className="text-center">
                    No users connected.
                  </td>
                </tr>
              )}
              {users && users.map((u) => (
                <tr
                  key={u.email}
                  style={{ cursor: "pointer" }}
                  onClick={() => openUser(u.email)}
                >
                  <td>{u.email}</td>
                  <td>{u.loginId || "N/A"}</td>
                  <td>
                    {u.isOnline ? (
                      <span className="badge bg-success">Online</span>
                    ) : (
                      <span className="badge bg-danger">Offline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Modal */}
        <UserModal
          user={selectedUser}
          show={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
    </div>
  );
}

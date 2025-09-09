import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './Axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value.trimStart() });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const { data } = await api.post('/login', form);
      if (data?.success && data?.user) {
        const auth = {
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
        };
        sessionStorage.setItem('authUser', JSON.stringify(auth));
        navigate('/live-users');
      } else {
        setAlert({ type: 'danger', msg: data?.message || 'Login failed' });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Error logging in';
      setAlert({ type: 'danger', msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark text-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <h3 className="mb-3 text-center">Login</h3>
        <div id="alert" className="mb-3">
          {alert && (
            <div className={`alert alert-${alert.type}`} role="alert">
              {alert.msg}
            </div>
          )}
        </div>

        <form
          className="card p-4 shadow-lg bg-secondary text-light mx-auto"
          style={{ maxWidth: '500px' }}
          onSubmit={handleSubmit}
        >
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className="form-control form-control-sm"
              required
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className="form-control form-control-sm"
              required
              onChange={handleChange}
            />
          </div>

          <div className="mt-3 d-flex justify-content-between align-items-center">
            <button
              id="loginBtn"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
            <Link to="/" className="btn btn-link text-light">
              Don’t have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

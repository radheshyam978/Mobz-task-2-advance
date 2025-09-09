import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './Axios';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', mobile: '', email: '',
    street: '', city: '', state: '', country: '',
    loginId: '', password: ''
  });
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value.trimStart() });

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setAlert(null);
    setSaving(true);
    try {
      const { data } = await api.post('/send-otp', form);
      if (data.success) {
        setOtpStep(true);
        setAlert({
          type: 'success',
          msg: data.message + ` (Mobile OTP: ${data.mobileOtp})`
        });
        console.log("Mobile OTP (from backend):", data.mobileOtp);
        setTimer(120);
      } else {
        setAlert({ type: 'danger', msg: data.message });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      setAlert({ type: 'danger', msg });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAlert(null);
    setSaving(true);
    try {
      const { data } = await api.post('/verify-otp', {
        email: form.email,
        emailOtp,
        mobileOtp
      });
      if (data.success) {
        const auth = {
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName
        };
        sessionStorage.setItem('authUser', JSON.stringify(auth));
        navigate('/live-users');
      } else {
        setAlert({ type: 'danger', msg: data.message });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      setAlert({ type: 'danger', msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-dark text-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <h3 className="mb-3 text-center">Register User</h3>
        <div id="alert" className="mb-3">
          {alert && (
            <div className={`alert alert-${alert.type}`} role="alert">
              {alert.msg}
            </div>
          )}
        </div>

        {!otpStep ? (
          <form
            className="card p-4 shadow-lg bg-secondary text-light mx-auto"
            style={{ maxWidth: '700px' }}
            onSubmit={handleSendOtp}
          >
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name</label>
                <input
                  name="firstName"
                  type="text"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Mobile</label>
                <input
                  name="mobile"
                  type="text"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Email</label>
                <input
                  name="email"
                  type="email"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Street</label>
              <input
                name="street"
                type="text"
                className="form-control form-control-sm"
                required
                onChange={handleChange}
              />
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <input
                  name="city"
                  type="text"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">State</label>
                <input
                  name="state"
                  type="text"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Country</label>
                <input
                  name="country"
                  type="text"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Login ID</label>
                <input
                  name="loginId"
                  type="text"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-control form-control-sm"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-3 d-flex justify-content-between align-items-center">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? 'Sending OTP…' : 'Register & Send OTPs'}
              </button>
              <Link to="/login" className="btn btn-link text-light">
                Already have an account? Login
              </Link>
            </div>
          </form>
        ) : (
          <form
            className="card p-4 shadow-lg bg-secondary text-light mx-auto"
            style={{ maxWidth: '500px' }}
            onSubmit={handleVerifyOtp}
          >
            <div className="mb-3">
              <label className="form-label">
                Enter Email OTP (sent to {form.email})
              </label>
              <input
                className="form-control form-control-sm"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Enter Mobile OTP (sent to {form.mobile})
              </label>
              <input
                className="form-control form-control-sm"
                value={mobileOtp}
                onChange={(e) => setMobileOtp(e.target.value)}
                required
              />
            </div>

            <div className="d-flex align-items-center">
              <button
                className="btn btn-success me-2"
                disabled={saving || timer === 0}
              >
                {saving ? 'Verifying…' : 'Verify OTPs'}
              </button>

              {timer > 0 ? (
                <span className="text-muted"> OTP expires in {timer}s</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleSendOtp}
                >
                  Resend OTPs
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

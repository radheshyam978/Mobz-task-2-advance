import { useEffect, useRef } from 'react';

export default function UserModal({ user, show, onClose }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    function onEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    if (show) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content bg-dark text-light">
            <div className="modal-header border-secondary">
              <h5 className="modal-title">User Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              />
            </div>
            <div className="modal-body">
              {user ? (
                <div id="modalBody">
                  <p><strong>Name:</strong> {user.firstName || ''} {user.lastName || ''}</p>
                  <p><strong>Email:</strong> {user.email || ''}</p>
                  <p><strong>Mobile:</strong> {user.mobile || ''}</p>
                  <p><strong>Address:</strong> {user.street || ''}</p>
                  <p>
                    <strong>City:</strong> {user.city || ''},
                    <strong> State:</strong> {user.state || ''},
                    <strong> Country:</strong> {user.country || ''}
                  </p>
                  <p><strong>Login ID:</strong> {user.loginId || ''}</p>
                  <p><strong>Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : ''}</p>
                  <p><strong>Last Updated:</strong> {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : ''}</p>
                </div>
              ) : (
                <div>Loading…</div>
              )}
            </div>
            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={backdropRef}
        className="modal-backdrop fade show"
        onClick={onClose}
      />
    </>
  );
}

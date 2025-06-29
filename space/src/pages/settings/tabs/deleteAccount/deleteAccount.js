// src/apps/community/tabs/general/DeleteAccount.jsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// import { deleteUserAccount } from '../../../../services/settings';
import './deleteAccount.css';
import { FaTimes } from 'react-icons/fa';
import { CSSTransition } from 'react-transition-group';

const DeleteAccount = () => {
  const [showModal, setShowModal] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');

  const mutation = useMutation({
    // mutationFn: deleteUserAccount,
    // onSuccess: () => {
    //   window.location.assign('/goodbye');
    // },
  });

  const openModal = () => {
    setConfirmationInput('');
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleConfirmDelete = () => {
    setShowModal(false);
    // mutation.mutate();
    setScheduled(true);
  };

  const isConfirmed = confirmationInput.trim() === 'DELETE';

  return (
    <div className="settings-delete-account">
      {scheduled && (
        <div className="delete-scheduled-message">
          Your account is now scheduled for deletion.  
          You have 30 days to recover it—after that, all data will be permanently removed.
        </div>
      )}

      <section>
        <h3>Delete Account</h3>
        <p>
          Permanently delete your account and all associated data.  
          This action cannot be undone.
        </p>
        <button
          className="delete-btn"
          onClick={openModal}
          disabled={mutation.isLoading || scheduled}
        >
          {mutation.isLoading ? 'Deleting…' : 'Delete Account'}
        </button>
        {mutation.isError && (
          <span className="error-text">
            An error occurred. Please try again.
          </span>
        )}
      </section>

      {/* CSSTransition handles mount/unmount + class toggles */}
      <CSSTransition
        in={showModal}
        timeout={200}
        classNames="delete-modal"
        unmountOnExit
      >
        <div className="delete-account-modal-overlay" onClick={closeModal}>
          <div
            className="delete-account-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="delete-account-modal-close"
              onClick={closeModal}
            >
              <FaTimes />
            </button>
            <h4>Confirm Account Deletion</h4>
            <p>
              This will schedule your account for permanent deletion after 30 days.
              To confirm, type <strong>DELETE</strong> below  (<em>case-sensitive</em>):
            </p>
            <input
              type="text"
              className="confirmation-input"
              placeholder="Type DELETE to confirm"
              value={confirmationInput}
              onChange={e => setConfirmationInput(e.target.value)}
            />
            <div className="delete-account-modal-buttons">
              <button
                className="delete-account-modal-btn cancel"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="delete-account-modal-btn confirm"
                onClick={handleConfirmDelete}
                disabled={!isConfirmed || mutation.isLoading}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
        </CSSTransition>
    </div>
);
}

export default DeleteAccount;

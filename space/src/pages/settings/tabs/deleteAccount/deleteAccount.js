// src/apps/community/tabs/general/DeleteAccount.jsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from '../../../../components/modal/Modal';
import './deleteAccount.css'; // keeps your page-specific tweaks
import { FaTimes } from 'react-icons/fa';

const DeleteAccount = () => {
  const [show, setShow] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [input, setInput] = useState('');
  const mutation = useMutation({ /* … */ });

  const confirmEnabled = input === 'DELETE';

  return (
    <div className="settings-delete-account">
      {scheduled && (
        <div className="delete-scheduled-message">
          Your account is now scheduled for deletion. You have 30 days to recover it.
        </div>
      )}

      <section>
        <h3>Delete Account</h3>
        <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button
          className="delete-btn"
          onClick={() => setShow(true)}
          disabled={mutation.isLoading || scheduled}
        >
          {mutation.isLoading ? 'Deleting…' : 'Delete Account'}
        </button>
      </section>

      <Modal
        isOpen={show}
        onClose={() => setShow(false)}
        title="Confirm Account Deletion"
        maxWidth="550px"
        maxHeight="600px"
        size="md"
        footer={
          <>
            <button className="delete-account-modal-btn cancel" onClick={() => setShow(false)}>
              Cancel
            </button>
            <button
              className="delete-account-modal-btn confirm"
              onClick={() => {
                mutation.mutate();
                setScheduled(true);
                setShow(false);
              }}
              disabled={!confirmEnabled}
            >
              Confirm Delete
            </button>
          </>
        }
      >
        <p>
          This will schedule your account for deletion in 30 days. To confirm, type <strong>DELETE</strong> (<em>case-sensitive</em>):
        </p>
        <input
          type="text"
          className="confirmation-input"
          placeholder="Type DELETE to confirm"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default DeleteAccount;

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { switchHandleAction } from '../../../state/actions/authActions';
import './HandleSwitcher.css';
import { FaUser } from 'react-icons/fa';
import { emitGlobalEvent } from '../../../utils/GlobalEvent';
import { useHandles } from '../../../context/HandlesContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

export default function HandleSwitcher() {
  const dispatch = useDispatch();
  const authState = useSelector(s => s.auth);
  const currentId = authState.current.user.handle_id;
  const currentName = authState.current.user.username;

  const { handles, isLoading, saveHandles } = useHandles();

const onSelect = async h => {
  if (h.id === currentId) return;

  // Build payload: mark exactly one active
  const payload = {
    username_handles: handles.map(hh => ({
      id: hh.id,
      username: hh.username,
      label: hh.label,
      is_active: hh.id === h.id,
    })),
  };

  try {
    const active = await saveHandles(payload);
    dispatch(switchHandleAction({
      username:  active.username,
      handle_id: active.id,
    }));

    // --- Update sessionStorage (active account) ---
    const session = JSON.parse(sessionStorage.getItem('authCurrent')) || {};
    session.user = { ...session.user, username: active.username, handle_id: active.id };
    sessionStorage.setItem('authCurrent', JSON.stringify(session));

    // --- Update localStorage (authAccounts, for all signed-in) ---
    const storedAccounts = JSON.parse(localStorage.getItem('authAccounts')) || [];
    const updatedAccounts = storedAccounts.map(acc => {
      // Match by token (or however you store it)
      if (acc.token === session.token) {
        return { ...acc, user: { ...acc.user, username: active.username, handle_id: active.id } };
      }
      return acc;
    });
    localStorage.setItem('authAccounts', JSON.stringify(updatedAccounts));

    // Fire global event for listeners (react-query hooks, etc)
    emitGlobalEvent('user-handle-changed', {
      handle_id: active.id,
      username:  active.username,
    });
  } catch (err) {
    console.error('Failed to switch handle', err);
  }
};


  const content = isLoading
    ? <div className="hs-loading">Loading…</div>
    : (
      <div className="hs-list">
        <h3 className='hs-list-title'>Handles</h3>
        <Link
          to="/settings#account-&-identity-username-&-handle"
          className="hs-ext-link"
          title="Go to handle settings"
          onClick={e => e.stopPropagation()}
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
        </Link>
        {handles.map(h => (
          <div
            key={h.id}
            className={`hs-item ${h.id === currentId ? 'active' : ''}`}
            onClick={() => onSelect(h)}
          >
            <span className="hs-username">@{h.username}</span>
            <span className="hs-label">{h.label}</span>
            {h.id === currentId && <span className="hs-check">✔</span>}
          </div>
        ))}
      </div>
    );

  const toggleBtn = (
    <button className="hs-toggle">
      <FaUser />
      Active Handle: @{currentName}
    </button>
  );

  return (
    <DropdownButton toggleContent={toggleBtn} placement="bottom-end">
      {content}
    </DropdownButton>
  );
}

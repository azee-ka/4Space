import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { switchHandleAction } from '../../../state/actions/authActions';
import './HandleSwitcher.css';
import { FaUser } from 'react-icons/fa';
import { emitGlobalEvent } from '../../../utils/GlobalEvent';
import { useHandles } from '../../../context/HandlesContext';

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
      const sess = JSON.parse(sessionStorage.getItem('authCurrent') || '{}');
      sessionStorage.setItem('authCurrent', JSON.stringify({
        ...sess,
        user: {
          ...sess.user,
          username:  active.username,
          handle_id: active.id
        }
      }));
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

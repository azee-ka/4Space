import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactDOM from 'react-dom';
import useApi from '../../../utils/useApi';
import DropdownButton from '../../../utils/popperButton/DropdownButton';
import { switchHandleAction } from '../../../state/actions/authActions';
import './HandleSwitcher.css';
import { FaUser } from 'react-icons/fa';
import { emitGlobalEvent } from '../../../utils/GlobalEvent';

export default function HandleSwitcher() {
  const { callApi } = useApi();
  const dispatch   = useDispatch();
  const authState  = useSelector(s => s.auth);
  const currentId  = authState.current.user.handle_id;
  const currentName= authState.current.user.username;

  const [handles, setHandles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load handles once
  useEffect(() => {
    (async () => {
      try {
        const res = await callApi('settings/username-handles/');
        setHandles(res.data);
      } catch (err) {
        console.error('Failed to load handles', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // When user picks one
  const onSelect = async h => {
    if (h.id === currentId) return;
    // build payload marking exactly one active
    const payload = {
      username_handles: handles.map(hh => ({
        id:        hh.id,
        username:  hh.username,
        label:     hh.label,
        is_active: hh.id === h.id
      }))
    };

    try {
      const res = await callApi('settings/username-handles/', 'POST', payload);
      const active = res.data;
      // update redux + sessionStorage
      dispatch(switchHandleAction({
        username:  active.username,
        handle_id: active.id
      }));
      const sess = JSON.parse(sessionStorage.getItem('authCurrent')||'{}');
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
  username: active.username
});
    //   window.location.reload();
    } catch (err) {
      console.error('Failed to switch handle', err);
    }
  };

  // render the dropdown list
  const content = loading
    ? <div className="hs-loading">Loading…</div>
    : (
      <div className="hs-list">
        {handles.map(h => (
          <div
            key={h.id}
            className={`hs-item ${h.id===currentId?'active':''}`}
            onClick={() => onSelect(h)}
          >
            <span className="hs-username">@{h.username}</span>
            <span className="hs-label">{h.label}</span>
            {h.id===currentId && <span className="hs-check">✔</span>}
          </div>
        ))}
      </div>
    );

  // the toggle button
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

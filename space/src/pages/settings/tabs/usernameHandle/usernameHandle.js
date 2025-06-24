// src/apps/community/tabs/general/UsernameHandleTab.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../../../hooks/useAuth';
import { switchHandleAction } from '../../../../state/actions/authActions';
import './usernameHandle.css';
import { emitGlobalEvent } from '../../../../utils/GlobalEvent';
import { useHandles } from '../../../../context/HandlesContext';

const USERNAME_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,28}[A-Za-z0-9])$/;
//  └─start with alnum
//     └─1–28 of alnum or ._-
//         └─end with alnum
// total length 3–30

const UsernameHandleTab = () => {
  const dispatch = useDispatch();
  const { authState } = useAuth();
  const currentUsername = authState.current.user.username;

  const {
    handles: data,
    isLoading,
    refetchHandles,
    saveHandles,
    saveHandlesStatus,
  } = useHandles();

  const [mainHandle, setMainHandle] = useState({
    id: null, username: '', label: 'main', is_active: false
  });
  const [handles, setHandles] = useState([]);
  const [initialState, setInitialState] = useState(null);

  // track errors per-handle by index
  const [handleErrors, setHandleErrors] = useState({});

  useEffect(() => {
    if (data) {
      const main = data.find(h => h.label === 'main') || {};
      const customs = data.filter(h => h.label !== 'main');
      setMainHandle({
        id: main.id || null,
        username: main.username || '',
        label: 'main',
        is_active: main.is_active || false,
      });
      setHandles(customs);
      setInitialState({
        main: { ...main },
        custom: customs.map(h => ({ ...h }))
      });
    }
  }, [data]);

  const addHandle = () => {
    if (handles.length >= 3) return;
    setHandles(hs => [
      ...hs,
      { id: `new-${Date.now()}`, username: '', label: '', is_active: false }
    ]);
  };

  const removeHandle = idx => {
    setHandles(hs => hs.filter((_, i) => i !== idx));
    setHandleErrors(errs => {
      const copy = { ...errs };
      delete copy[idx];
      return copy;
    });
  };

  const onFieldChange = (idx, field, val) => {
    setHandles(hs => {
      const copy = [...hs];
      copy[idx][field] = val;
      return copy;
    });
    // clear main activation if editing a custom
    setMainHandle(m => ({ ...m, is_active: false }));

    // if username field changed, validate it
    if (field === 'username') {
      setHandleErrors(errs => {
        const copy = { ...errs };
        if (!USERNAME_REGEX.test(val.trim())) {
          copy[idx] = '3–30 chars: alphanumeric, ., _ or - in middle, no punctuation at ends';
        } else {
          delete copy[idx];
        }
        return copy;
      });
    }
  };

  const activateMain = () => {
    setMainHandle(m => ({ ...m, is_active: true }));
    setHandles(hs => hs.map(h => ({ ...h, is_active: false })));
  };
  const activateCustom = idx => {
    setHandles(hs => hs.map((h, i) => ({ ...h, is_active: i === idx })));
    setMainHandle(m => ({ ...m, is_active: false }));
  };

  const dirty = initialState && (
    initialState.main.is_active !== mainHandle.is_active ||
    JSON.stringify(initialState.custom) !== JSON.stringify(handles)
  );

  const handleSave = async () => {
    const validCustom = handles.filter(h => h.label.trim() && h.username.trim());
    const payload = {
      username_handles: [
        { ...mainHandle },
        ...validCustom
      ]
    };
    try {
      const active = await saveHandles(payload);
      // update Redux/session if handle changed
      if (active?.username && active.username !== currentUsername) {
        dispatch(switchHandleAction({
          username: active.username,
          handle_id: active.id
        }));
        const session = JSON.parse(sessionStorage.getItem('authCurrent')) || {};
        session.user = { ...session.user, username: active.username, handle_id: active.id };
        sessionStorage.setItem('authCurrent', JSON.stringify(session));
        const storedAccounts = JSON.parse(localStorage.getItem('authAccounts')) || [];
        const updatedAccounts = storedAccounts.map(acc =>
          acc.token === session.token
            ? { ...acc, user: { ...acc.user, username: active.username, handle_id: active.id } }
            : acc
        );
        localStorage.setItem('authAccounts', JSON.stringify(updatedAccounts));
      }
      emitGlobalEvent('user-handle-changed', {
        handle_id: active.id,
        username: active.username
      });
      refetchHandles();
    } catch {
      // error UI is shown below
    }
  };

  const handleReset = () => {
    if (!initialState) return;
    setMainHandle({ ...initialState.main });
    setHandles(initialState.custom.map(h => ({ ...h })));
    setHandleErrors({});
  };

  if (isLoading) return <div>Loading…</div>;

  // disable save if any errors exist
  const hasErrors = Object.keys(handleErrors).length > 0;

  return (
    <div className="username-handle-tab">
      <section>
        <div className="header-row">
          <h3>Username Handles (up to 4)</h3>
          <button
            type="button"
            className="add-btn"
            onClick={addHandle}
            disabled={handles.length >= 3}
          >
            + Add Handle
          </button>
        </div>
        <p className="description">
          Post and interact under different “handles.”
        </p>
      </section>

      <section>
        <div className="username-handle-setting-content">
          {/* Main handle */}
          <div className="handle-row main">
            <input value="main" disabled />
            <input value={mainHandle.username} disabled />
            <button
              className={`set-btn ${mainHandle.is_active ? 'active' : ''}`}
              onClick={activateMain}
            >
              {mainHandle.is_active ? 'Active' : 'Set Active'}
            </button>
          </div>

          {/* Custom handles */}
          {handles.length === 0 ? (
            <div className="no-handles">No custom handles yet.</div>
          ) : (
            <div className="handles-list">
              {handles.map((h, idx) => (
                <div className="handle-row" key={h.id}>
                  <input
                    placeholder="Label"
                    value={h.label}
                    onChange={e => onFieldChange(idx, 'label', e.target.value)}
                  />
                  <input
                    placeholder="Handle (3–30 chars)"
                    value={h.username}
                    onChange={e => onFieldChange(idx, 'username', e.target.value)}
                  />
                  <button
                    className={`set-btn ${h.is_active ? 'active' : ''}`}
                    onClick={() => activateCustom(idx)}
                  >
                    {h.is_active ? 'Active' : 'Set Active'}
                  </button>
                  <button className="remove-btn" onClick={() => removeHandle(idx)}>
                    &times;
                  </button>
                  {handleErrors[idx] && (
                    <p className="input-error">{handleErrors[idx]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {dirty && (
            <div className="username-handle-setting-content-btn">
              <button
                onClick={handleSave}
                disabled={saveHandlesStatus === 'pending' || hasErrors}
              >
                Save
              </button>
              <button
                onClick={handleReset}
                disabled={saveHandlesStatus === 'pending'}
              >
                Reset
              </button>
              {saveHandlesStatus === 'pending' && <span>Saving…</span>}
              {saveHandlesStatus === 'error' && (
                <span className="error-text">Save failed!</span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UsernameHandleTab;

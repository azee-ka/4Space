import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../../../hooks/useAuth';
import { switchHandleAction } from '../../../../state/actions/authActions';
import './usernameHandle.css';
import { emitGlobalEvent } from '../../../../utils/GlobalEvent';
import { useHandles } from '../../../../context/HandlesContext'; // <-- USE THE CONTEXT

const UsernameHandleTab = () => {
  const dispatch = useDispatch();
  const { authState } = useAuth();
  const currentUsername = authState.current.user.username;

  // Pull handles and loading status from context
  const {
    handles: data,
    isLoading,
    refetchHandles,
    saveHandles,
    saveHandlesStatus,
  } = useHandles();

  // UI state
  const [mainHandle, setMainHandle] = useState({ id: null, username: '', label: 'main', is_active: false });
  const [handles, setHandles] = useState([]);
  const [initialState, setInitialState] = useState(null);

  // Sync on data load
  useEffect(() => {
    if (data) {
      const main = data.find(h => h.label === 'main');
      const customs = data.filter(h => h.label !== 'main');
      setMainHandle({
        id: main?.id || null,
        username: main?.username || '',
        label: 'main',
        is_active: main?.is_active || false,
      });
      setHandles(customs || []);
      setInitialState({
        main: { ...main },
        custom: customs.map(h => ({ ...h }))
      });
    }
  }, [data]);

  // Local edits, exactly as before
  const addHandle = () => {
    if (handles.length >= 3) return;
    setHandles(hs => [...hs, { id: `new-${Date.now()}`, username: '', label: '', is_active: false }]);
  };
  const removeHandle = idx => setHandles(hs => hs.filter((_, i) => i !== idx));
  const onFieldChange = (idx, field, val) => {
    setHandles(hs => {
      const copy = [...hs];
      copy[idx][field] = val;
      return copy;
    });
    setMainHandle(m => ({ ...m, is_active: false }));
  };
  const activateMain = () => {
    setMainHandle(m => ({ ...m, is_active: true }));
    setHandles(hs => hs.map(h => ({ ...h, is_active: false })));
  };
  const activateCustom = idx => {
    setHandles(hs => hs.map((h, i) => ({ ...h, is_active: i === idx })));
    setMainHandle(m => ({ ...m, is_active: false }));
  };

  // Dirty logic
  const dirty = initialState && (
    initialState.main.is_active !== mainHandle.is_active ||
    JSON.stringify(initialState.custom) !== JSON.stringify(handles)
  );

  // Save action (now via context)
  const handleSave = async () => {
    const validCustom = handles.filter(h => h.label.trim() !== '' && h.username.trim() !== '');
    const payload = {
      username_handles: [
        { ...mainHandle },
        ...validCustom.map(h => ({ ...h }))
      ]
    };
    try {
      const active = await saveHandles(payload);
      // Redux/session/localStorage update if handle changed
      if (active?.username && active.username !== currentUsername) {
        dispatch(switchHandleAction({
          username:  active.username,
          handle_id: active.id
        }));
        // sessionStorage/localStorage logic as before
        const session = JSON.parse(sessionStorage.getItem('authCurrent')) || {};
        session.user = { ...session.user, username: active.username, handle_id: active.id };
        sessionStorage.setItem('authCurrent', JSON.stringify(session));
        const storedAccounts = JSON.parse(localStorage.getItem('authAccounts')) || [];
        const updatedAccounts = storedAccounts.map(acc => {
          if (acc.token === session.token) {
            return { ...acc, user: { ...acc.user, username:  active.username, handle_id: active.id } };
          }
          return acc;
        });
        localStorage.setItem('authAccounts', JSON.stringify(updatedAccounts));
      }
      emitGlobalEvent('user-handle-changed', {
        handle_id: active.id,
        username:  active.username
      });
      refetchHandles();
    } catch (e) {
      // Error UI handled below
    }
  };

  // Reset
  const handleReset = () => {
    if (!initialState) return;
    setMainHandle({ ...initialState.main });
    setHandles(initialState.custom.map(h => ({ ...h })));
  };

  // Render
  if (isLoading) return <div>Loading…</div>;

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
          {/* Main */}
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

          {/* Customs */}
          {handles.length === 0 ? (
            <div className="no-handles">
              No custom handles yet.
            </div>
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
                    placeholder="Handle"
                    value={h.username}
                    onChange={e => onFieldChange(idx, 'username', e.target.value)}
                  />
                  <button
                    className={`set-btn ${h.is_active ? 'active' : ''}`}
                    onClick={() => activateCustom(idx)}
                  >
                    {h.is_active ? 'Active' : 'Set Active'}
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeHandle(idx)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {dirty && (
            <div className="username-handle-setting-content-btn">
              <button onClick={handleSave} disabled={saveHandlesStatus === 'pending'}>Save</button>
              <button onClick={handleReset} disabled={saveHandlesStatus === 'pending'}>Reset</button>
              {saveHandlesStatus === 'pending' && <span>Saving…</span>}
              {saveHandlesStatus === 'error' && <span style={{ color: 'red' }}>Save failed!</span>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UsernameHandleTab;

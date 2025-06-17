// src/components/common/RedirectLink.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Wrap any link so that it carries your current location along
 * in react-router state.  After login you can read it back out.
 */
export default function RedirectLink({ to, children, ...props }) {
  const { pathname, search } = useLocation();
  // Build a location object you can read later via useLocation().state.from
  const from = { pathname, search };

  return (
    <Link
      to={to}
      state={{ from }}
      {...props}
    >
      {children}
    </Link>
  );
}

// community/tabs/school/grades/grades.js

import React, { useEffect, useState } from 'react';
import useApi from '../../../../../../utils/useApi';

const CommunityGrades = ({ communityId, tab }) => {
  const { callApi } = useApi();
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await callApi(`school/${communityId}/grades/`);
        setGrades(res.data);
      } catch (err) {
        console.error('Failed to load grades:', err);
      }
    };
    fetchGrades();
  }, [communityId]);

  return (
    <div className="community-tab-content">
      <h4>Grades</h4>
      {grades.length === 0 ? (
        <p>No grades available.</p>
      ) : (
        <ul>
          {grades.map((g, i) => (
            <li key={i}>
              <strong>{g.subject}</strong>: {g.grade}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommunityGrades;

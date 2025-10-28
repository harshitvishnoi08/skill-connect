import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard(){
  const { axios, user } = useContext(AuthContext);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // simple recommendation: search by first skill
        const skill = user?.skills?.[0];
        const q = skill ? `?skills=${encodeURIComponent(skill)}` : '';
        const res = await axios.get(`/users${q}`);
        setRecs(res.data.users || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome, {user?.name}</h2>
      <h3>Recommended matches</h3>
      <div>
        {recs.map(r => (
          <div key={r._id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
            <Link to={`/profile/${r._id}`}><strong>{r.name}</strong></Link>
            <div>{r.college} • {r.skills?.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

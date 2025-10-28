import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Search(){
  const { axios } = useContext(AuthContext);
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);

  const doSearch = async () => {
    const q = [];
    if (filters.skills) q.push(`skills=${encodeURIComponent(filters.skills)}`);
    if (filters.college) q.push(`college=${encodeURIComponent(filters.college)}`);
    if (filters.search) q.push(`search=${encodeURIComponent(filters.search)}`);
    try {
      const res = await axios.get(`/users?${q.join('&')}`);
      setResults(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Search</h2>
      <input placeholder="search name, skill" onChange={e=>setFilters(f=>({...f,search:e.target.value}))} />
      <input placeholder="skills (comma-separated)" onChange={e=>setFilters(f=>({...f,skills:e.target.value}))} />
      <input placeholder="college" onChange={e=>setFilters(f=>({...f,college:e.target.value}))} />
      <button onClick={doSearch}>Search</button>

      <div style={{ marginTop: 16 }}>
        {results.map(r => (
          <div key={r._id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
            <Link to={`/profile/${r._id}`}><strong>{r.name}</strong></Link>
            <div>{r.college} • {r.skills?.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

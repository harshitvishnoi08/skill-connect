import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Profile(){
  const { id } = useParams();
  const { axios, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/users/${id}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);

  const sendRequest = async () => {
    try {
      await axios.post('/connections/request', { toUserId: id });
      alert('Request sent');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {!profile ? <div>Loading...</div> : (
        <>
          <h2>{profile.name}</h2>
          <div>{profile.college} • {profile.year}</div>
          <div>Skills: {profile.skills?.join(', ')}</div>
          <div style={{ marginTop: 8 }}>{profile.bio}</div>
          {user && user._id !== profile._id && (
            <button onClick={sendRequest}>Send Connection Request</button>
          )}
        </>
      )}
    </div>
  );
}

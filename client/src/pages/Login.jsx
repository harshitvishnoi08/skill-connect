import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Login(){
  const [form, setForm] = useState({});
  const { axios, login } = useContext(AuthContext);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', form);
      login(res.data.token, res.data.user);
      nav('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" onChange={e=>setForm(f=>({...f,email:e.target.value}))} /><br/>
        <input placeholder="Password" type="password" onChange={e=>setForm(f=>({...f,password:e.target.value}))} /><br/>
        <button type="submit">Login</button>
      </form>
      <p>New? <Link to="/register">Register</Link></p>
    </div>
  );
}

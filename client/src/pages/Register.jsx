import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Register(){
  const [form, setForm] = useState({});
  const { axios, login } = useContext(AuthContext);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', form);
      login(res.data.token, res.data.user);
      nav('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input placeholder="Name" onChange={e=>setForm(f=>({...f,name:e.target.value}))} /><br/>
        <input placeholder="Email" onChange={e=>setForm(f=>({...f,email:e.target.value}))} /><br/>
        <input placeholder="Password" type="password" onChange={e=>setForm(f=>({...f,password:e.target.value}))} /><br/>
        <input placeholder="College" onChange={e=>setForm(f=>({...f,college:e.target.value}))} /><br/>
        <input placeholder="Skills (comma-separated)" onChange={e=>setForm(f=>({...f,skills:(e.target.value||'').split(',').map(s=>s.trim())}))} /><br/>
        <button type="submit">Register</button>
      </form>
      <p>Already have account? <Link to="/login">Login</Link></p>
    </div>
  );
}

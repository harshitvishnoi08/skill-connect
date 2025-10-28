import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Chats(){
  const { axios, socket, user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]); // simple approach: show last messaged users from server not implemented => use search results or connections
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('private_message', (msg) => {
      if (active && (msg.from === active._id || msg.to === active._id)) {
        setMessages(m => [...m, msg]);
      } else {
        // optionally notify
        console.log('new msg', msg);
      }
    });
    socket.on('message_sent', (msg) => setMessages(m => [...m, msg]));
    return () => {
      socket.off('private_message');
      socket.off('message_sent');
    };
  }, [socket, active]);

  useEffect(() => {
    // simple placeholder: load some users as contacts by searching with user's first skill
    (async () => {
      try {
        const skill = user?.skills?.[0];
        const q = skill ? `?skills=${skill}` : '';
        const res = await axios.get('/users' + q);
        setContacts(res.data.users || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  const openChat = async (contact) => {
    setActive(contact);
    setMessages([]);
    try {
      const res = await axios.get(`/messages/${contact._id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const send = () => {
    if (!text || !socket || !active) return;
    socket.emit('private_message', { toUserId: active._id, text });
    setText('');
  };

  return (
    <div style={{ display: 'flex', padding: 16 }}>
      <div style={{ width: 250, borderRight: '1px solid #ddd', paddingRight: 8 }}>
        <h3>Contacts</h3>
        {contacts.map(c => (
          <div key={c._id} style={{ padding: 8, borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={()=>openChat(c)}>
            <div><strong>{c.name}</strong></div>
            <div style={{ fontSize: 12 }}>{c.skills?.join(', ')}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, paddingLeft: 16 }}>
        {!active ? <div>Select a contact to chat</div> : (
          <>
            <h3>{active.name}</h3>
            <div style={{ height: 400, overflowY: 'auto', border: '1px solid #eee', padding: 8 }} ref={messagesRef}>
              {messages.map(m => (
                <div key={m._id} style={{ margin: '8px 0', textAlign: (m.from === user._id ? 'right' : 'left') }}>
                  <div style={{ display: 'inline-block', padding: 8, borderRadius: 6, background: '#f4f4f4' }}>
                    {m.text}
                    <div style={{ fontSize: 10, opacity: 0.6 }}>{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" style={{ width: '80%' }} />
              <button onClick={send}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

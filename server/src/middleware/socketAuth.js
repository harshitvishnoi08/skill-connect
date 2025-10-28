const jwt = require('jsonwebtoken');

const verifySocketToken = async (socket) => {
  // client should send token in auth: { token }
  const { token } = socket.handshake.auth || {};
  if (!token) throw new Error('No token');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    return;
  } catch (err) {
    throw new Error('Invalid token');
  }
};

module.exports = { verifySocketToken };

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const users = [
  { name: 'Anita', email: 'anita@example.com', password: 'pass1234', college: 'ABC College', year: '3rd', skills: ['React','HTML','CSS'], lookingForTeam: true },
  { name: 'Ravi', email: 'ravi@example.com', password: 'pass1234', college: 'XYZ Institute', year: '2nd', skills: ['Node','Express','MongoDB'], lookingForTeam: true },
  { name: 'Sneha', email: 'sneha@example.com', password: 'pass1234', college: 'ABC College', year: '2nd', skills: ['Python','Django'], lookingForTeam: false },
  { name: 'Karan', email: 'karan@example.com', password: 'pass1234', college: 'LMN University', year: '4th', skills: ['ML','Python'] },
  { name: 'Priya', email: 'priya@example.com', password: 'pass1234', college: 'XYZ Institute', year: '3rd', skills: ['UI/UX','Figma','React'] }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteMany({});
    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, passwordHash });
    }
    console.log('Seeded users.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

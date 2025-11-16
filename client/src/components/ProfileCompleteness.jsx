import React from 'react';
import './ProfileCompleteness.css';

export default function ProfileCompleteness({ user }) {
  const calculateCompleteness = () => {
    let score = 0;
    const checks = [];

    // Basic info (20%)
    if (user?.name) {
      score += 5;
      checks.push({ done: true, text: 'Name added' });
    } else {
      checks.push({ done: false, text: 'Add your name' });
    }

    if (user?.email) {
      score += 5;
      checks.push({ done: true, text: 'Email added' });
    } else {
      checks.push({ done: false, text: 'Add email' });
    }

    if (user?.college) {
      score += 5;
      checks.push({ done: true, text: 'College added' });
    } else {
      checks.push({ done: false, text: 'Add college' });
    }

    if (user?.year) {
      score += 5;
      checks.push({ done: true, text: 'Year added' });
    } else {
      checks.push({ done: false, text: 'Add year of study' });
    }

    // Skills (15%)
    if (user?.skills && user.skills.length > 0) {
      score += 10;
      checks.push({ done: true, text: `${user.skills.length} skills added` });
    } else {
      checks.push({ done: false, text: 'Add your skills' });
    }

    if (user?.skills && user.skills.length >= 5) {
      score += 5;
      checks.push({ done: true, text: '5+ skills added' });
    } else {
      checks.push({ done: false, text: 'Add at least 5 skills' });
    }

    // Bio (10%)
    if (user?.bio && user.bio.length > 20) {
      score += 10;
      checks.push({ done: true, text: 'Bio added' });
    } else {
      checks.push({ done: false, text: 'Add a bio (20+ characters)' });
    }

    // Projects (25%)
    if (user?.projects && user.projects.length > 0) {
      score += 15;
      checks.push({ done: true, text: `${user.projects.length} project(s) added` });
    } else {
      checks.push({ done: false, text: 'Add at least 1 project' });
    }

    if (user?.projects && user.projects.length >= 3) {
      score += 10;
      checks.push({ done: true, text: '3+ projects added' });
    } else {
      checks.push({ done: false, text: 'Add at least 3 projects' });
    }

    // Achievements (15%)
    if (user?.achievements && user.achievements.length > 0) {
      score += 15;
      checks.push({ done: true, text: `${user.achievements.length} achievement(s) added` });
    } else {
      checks.push({ done: false, text: 'Add at least 1 achievement' });
    }

    // Social Links (15%)
    if (user?.socialLinks?.github) {
      score += 5;
      checks.push({ done: true, text: 'GitHub linked' });
    } else {
      checks.push({ done: false, text: 'Link your GitHub' });
    }

    if (user?.socialLinks?.linkedin) {
      score += 5;
      checks.push({ done: true, text: 'LinkedIn linked' });
    } else {
      checks.push({ done: false, text: 'Link your LinkedIn' });
    }

    if (user?.socialLinks?.portfolio) {
      score += 5;
      checks.push({ done: true, text: 'Portfolio linked' });
    } else {
      checks.push({ done: false, text: 'Add portfolio website' });
    }

    return { score, checks };
  };

  const { score, checks } = calculateCompleteness();
  const percentage = Math.min(score, 100);

  const getColor = () => {
    if (percentage >= 80) return '#48bb78'; // Green
    if (percentage >= 50) return '#f59e0b'; // Orange
    return '#fc8181'; // Red
  };

  const getMessage = () => {
    if (percentage === 100) return '🎉 Perfect! Your profile is complete!';
    if (percentage >= 80) return '🌟 Almost there! Just a few more steps.';
    if (percentage >= 50) return '👍 Good progress! Keep going.';
    return '💪 Let\'s complete your profile to attract collaborators!';
  };

  if (percentage === 100) {
    return (
      <div className="profile-completeness complete">
        <div className="completeness-header">
          <span className="completeness-icon">🎉</span>
          <div>
            <h3>Profile Complete!</h3>
            <p>Your profile looks amazing!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-completeness">
      <div className="completeness-header">
        <span className="completeness-icon">📊</span>
        <div>
          <h3>Profile Completeness</h3>
          <p>{getMessage()}</p>
        </div>
        <span className="completeness-percentage" style={{ color: getColor() }}>
          {percentage}%
        </span>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getColor()
          }}
        />
      </div>

      <div className="completeness-checklist">
        {checks.filter(check => !check.done).slice(0, 5).map((check, idx) => (
          <div key={idx} className="checklist-item incomplete">
            <span className="check-icon">○</span>
            <span>{check.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
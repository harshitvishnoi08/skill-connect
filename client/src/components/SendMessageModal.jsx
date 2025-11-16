import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './SendMessageModal.css';

export default function SendMessageModal({ recipient, onClose }) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    subject: 'Project Discussion - SkillConnect',
    message: `Hi ${recipient.name.split(' ')[0]},\n\nI came across your profile on SkillConnect and I'm interested in discussing a potential collaboration.\n\n${recipient.college ? `I see you're from ${recipient.college}.` : ''} ${recipient.skills && recipient.skills.length > 0 ? `Your skills in ${recipient.skills.slice(0, 3).join(', ')} caught my attention.` : ''}\n\nLooking forward to hearing from you!\n\nBest regards,\n${user?.name || 'SkillConnect User'}`
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // old code -> opening new tabs
  const handleSendEmail = () => {
    // Create mailto link with encoded data
    const subject = encodeURIComponent(formData.subject);
    const body = encodeURIComponent(formData.message);
    const mailtoLink = `mailto:${recipient.email}?subject=${subject}&body=${body}`;

    // Try multiple methods to ensure it works
    try {
      // Method 1: Create a temporary link and click it
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error opening email client:', error);

      // Fallback: Try window.location
      try {
        window.location.href = mailtoLink;
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (fallbackError) {
        alert('Unable to open email client. Please copy the email address: ' + recipient.email);
      }
    }
  };

  //new code using node mailer
  // const handleSendEmail = async () => {
  //   try {
  //     const res = await fetch("http://localhost:5000/send-email", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         to: recipient.email,
  //         subject: formData.subject,
  //         message: formData.message,
  //         fromName: user?.name,
  //         fromEmail: user?.email
  //       })
  //     });

  //     const data = await res.json();

  //     if (data.success) {
  //       alert("Email sent successfully!");
  //       onClose();
  //     } else {
  //       alert("Failed to send email.");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     alert("An error occurred.");
  //   }
  // };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">✉️</div>
            <div>
              <h2>Send Email</h2>
              <p className="modal-subtitle">
                to <strong>{recipient.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Recipient Info */}
        <div className="recipient-card">
          <img
            src={recipient.profilePicture}
            alt={recipient.name}
            className="recipient-avatar"
          />
          <div className="recipient-info">
            <h3>{recipient.name}</h3>
            <p>{recipient.college} • {recipient.year}</p>
            <p className="recipient-email">📧 {recipient.email}</p>
            {recipient.skills && recipient.skills.length > 0 && (
              <div className="recipient-skills">
                {recipient.skills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
                {recipient.skills.length > 3 && (
                  <span className="skill-tag more">+{recipient.skills.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="message-form">
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Email subject"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Message <span className="required">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows="10"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Write your message here..."
              required
              maxLength={2000}
            />
            <span className="char-count">
              {formData.message.length}/2000 characters
            </span>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              className="btn-send"
              disabled={!formData.message.trim()}
            >
              <span className="btn-icon">📤</span>
              Open in Email Client
            </button>
          </div>
        </div>

        {/* Info Footer */}
        <div className="modal-footer">
          <p>
            💡 <strong>Note:</strong> This will open your default email client (Gmail, Outlook, etc.)
            with the message pre-filled. You can edit and send from there.
          </p>
        </div>
      </div>
    </div>
  );
}
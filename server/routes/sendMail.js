const express = require('express');
const router = express.Router();

router.post("/send-email", async (req, res) => {
  const { to, subject, message, fromName, fromEmail } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
      replyTo: fromEmail,   
    });

    res.json({ success: true, message: "Email sent!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

export default router;

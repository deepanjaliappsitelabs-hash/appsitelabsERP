const sendEmail = async ({ to, subject, html, text } = {}) => {
  if (!to) throw new Error("Missing 'to' for sendEmail");

  const {
    SMTP_HOST,
    SMTP_PORT = 587,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP env missing; email not sent", { to, subject });
    return { ok: false, skipped: true, reason: "SMTP env missing" };
  }

  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject: subject || "",
    text,
    html,
  });
};

module.exports = sendEmail;


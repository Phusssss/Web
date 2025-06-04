
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
sgMail.setApiKey(functions.config().sendgrid.api_key);

exports.sendVerificationEmail = functions.https.onCall(async (data, context) => {
  const email = data.email;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiration

  // Store code in Firestore
  await admin.firestore().collection('verificationCodes').doc(email).set({
    code,
    expiresAt
  });

  // Send email via SendGrid
  const msg = {
    to: email,
    from: 'your-verified-email@example.com', // Replace with your verified sender email
    subject: 'Mã xác minh để đổi mật khẩu',
    text: `Mã xác minh của bạn là: ${code}. Mã này có hiệu lực trong 10 phút.`,
    html: `<p>Mã xác minh của bạn là: <strong>${code}</strong>. Mã này có hiệu lực trong 10 phút.</p>`
  };

  try {
    await sgMail.send(msg);
    return { code }; // Return code for debugging (remove in production)
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Không thể gửi email xác minh.');
  }
});

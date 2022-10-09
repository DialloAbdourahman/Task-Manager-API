const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'dialliabdourahman78@gmail.com',
    subject: 'Welcome to the app!',
    text: `Welcome to the app ${name}. Let me know how you get along with the app.`,
    html: '<strong>Have a good time.</strong>',
  });
};

const sendGoodbyeMessage = (email, name) => {
  sgMail.send({
    to: email,
    from: 'dialliabdourahman78@gmail.com',
    subject: 'Goodbye!',
    text: `We are really sad to see you going ${name}. Please tell us why so that next time we can improve it.`,
    html: '<strong>Bye.</strong>',
  });
};

module.exports = {
  sendWelcomeEmail,
  sendGoodbyeMessage,
};

const path = require('path');

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const pug = require('pug');
const textToHtml = require('html-to-text');

class Email {
  constructor(user, url) {
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.to = user.email;
    this.from = `Rithik Agarwal <rithik@mailsac.com>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      return sgMail;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async welcomeEmail() {
    await this.send('welcome', 'Welcome to the natours family');
  }

  resetPassword() {
    this.send('resetPassword', 'Password Reset Email (Valid for 10 mins)');
  }

  async send(template, subject) {
    const html = pug.renderFile(
      path.join(__dirname, '..', 'views', 'emails', `${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
      },
    );

    const options = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: textToHtml.htmlToText(html),
    };

    if (process.env.NODE_ENV === 'production') {
      return await this.newTransport().send(options);
    }

    return await this.newTransport().sendMail(options);
  }
}

module.exports = Email;

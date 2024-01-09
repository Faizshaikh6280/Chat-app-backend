const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
dotenv.config({ path: "../config.env" });

var transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendEmail = async function (mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

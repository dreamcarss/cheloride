const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "sidhardhchandra141@gmail.com",
    pass: "uwekgkpjlbrcuhkb",
  },
});


async function mail(sub, html, toMail) {
  const info = await transporter.sendMail({
    from: "sidhardhchandra141@gmail.com",
    to: toMail,
    subject: sub,
    html: html,
  });

  console.log("Message sent: %s", info);
}


module.exports = mail


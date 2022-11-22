const mail = require("nodemailer")

const smtpTransport = mail.createTransport({
    service: "Naver",
    auth: {
        user: "jyj5222@naver.com",
        pass: "Adudwo0518!"
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = {
    smtpTransport
}
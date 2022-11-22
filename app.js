const express = require("express")
const http = require("http")
const bodyParser = require("body-parser")
const cors = require("cors")
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
var appDir = path.dirname(require.main.filename);
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'kowork.cr66vaubnkin.ap-northeast-2.rds.amazonaws.com',
    user: 'kowork',
    password: 'BUGQkajQk7pT5POeGY7b',
    database: 'kowork',
    dateStrings: "date"
});

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

const server = http.createServer(app)
const PORT = 3000;

function randomString() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var string_length = 6;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    //document.randform.randomfield.value = randomstring;
    return randomstring;
}

app.get("/certification", async (req, res) => {
    console.log("누군가 접속")
    const email = req.query.email

    const number = randomString()
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: "youngjae1009@gmail.com",
            pass: "nwhlyalpbuvubpdb",
        },
    });
    let emailTemplete;
    ejs.renderFile(appDir + '/template/authMail.ejs', { authCode: number }, function (err, data) {
        if (err) { console.log(err) }
        emailTemplete = data;
    });
    let mailOptions = await transporter.sendMail({
        from: `KOWORK`,
        to: email,
        subject: 'KOWORK 회원가입을 위한 인증번호입니다.',
        html: emailTemplete,
    });

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
        console.log("Finish sending email : " + info.response);

        connection.connect();

        connection.query(`INSERT INTO kowork_certification(email, certification, date) values ('${email}','${number}','${new Date().toISOString().slice(0, 19).replace('T', ' ')}')`, (error, rows, fields) => {
            if (error) throw error;
            console.log('User info is: ', rows);
        });

        connection.end();


        res.json(
            { "code": number, }
        )
        transporter.close()
    });
})

app.get("/certification_chack", async (req, res) => {
    let email = req.query.email
    let code = req.query.code
    
    connection.connect();

    connection.query(`SELECT * FROM kowork_certification WHERE email = '${email}'`, (error, rows, fields) => {
        if (error) throw error;
        if (rows[0]["certification"] == code) {
            res.json({
                "codes": "su"
            })
        }
    });

    connection.end();

})

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

const express = require("express")
const http = require("http")
const bodyParser = require("body-parser")
const cors = require("cors")
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
var appDir = path.dirname(require.main.filename);
const bcrypt = require('bcrypt');



const mysql = require('mysql');
const e = require("express");
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
const authenticateAccessToken = (req, res, next) => {
    let authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("wrong token format or token is not sended");
        return res.sendStatus(400);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if (error) {
            console.log(error);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15M",
    });
};
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "180 days",
    });
};
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

app.get("/certification", (req, res) => {
    const email = req.query.email
    const number = randomString()

    ejs.renderFile(appDir + '/template/authMail.ejs', { authCode: number }, function (err, data) {
        if (err) { console.log(err) }
        emailTemplete = data;
    });

    let mailOptions = {
        from: `KOWORK`,
        to: email,
        subject: 'KOWORK 회원가입을 위한 인증번호입니다.',
        html: emailTemplete,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        }
        connection.query(`INSERT INTO kowork_certification(email, certification, date) values ('${email}','${number}','${new Date().toISOString().slice(0, 19).replace('T', ' ')}')`, (error, rows, fields) => {
            if (error) throw error;
        });
        transporter.close()
        res.json(
            { "code": number, }
        )
    });
})

app.get("/certification_chack", async (req, res) => {
    let email = req.query.email
    let code = req.query.code
    connection.query(`SELECT * FROM kowork_certification WHERE email =  '${email}' order by id desc limit 1`, (error, rows, fields) => {
        if (error) throw error;
        if (rows[0]["certification"] == code) {
            res.json({
                "codes": "su"
            })
        }else{
            res.json({
                "codes": "no"
            })
        }
    });
})

app.get("/register", (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, password) => {
        const params = [
            req.query.email,
            req.query.password,
            req.query.contury,
            req.query.birthday,
            req.query.live_now,
            req.query.sex,
            req.query.name,
            req.query.terms1,
            req.query.terms2,
            req.query.terms3,
        ]
        connection.connect();

        connection.query(`
        INSERT INTO 
        kowork_user 
        (user_email, user_password, user_contury, user_birthday, user_live_now, user_sex, user_name, user_terms1, user_terms2, user_terms3) 
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, params , (e, r) => {
            if (e) throw e;
            const keys = [r["insertId"], params[3]]
            res.status(200).json({
                "code": "success",
                "AccessToken": generateAccessToken(keys),
                "RefreshToken": generateRefreshToken(keys)
            })

        })
        connection.end();
    })

});

app.get("/login", (req, res) => {
    let email = req.query.email;
    let password = req.query.password;

    connection.connect();

    connection.query(`SELECT * FROM kowork_user WHERE user_email = '${email}'`, (e, r, f) => {
        if (e) throw e;
        if (r.length === 0) {
            res.status(201).json({
                "code": "error",
                "result": "worng email"
            })
        } else {
            bcrypt.compare(password, r[0]["user_password"], (err, same) => {
                if (same) {
                    const keys = [r["user_index"]]
                    res.status(200).json({
                        "code": "success",
                        "AccessToken": generateAccessToken(keys),
                        "RefreshToken": generateRefreshToken(keys)
                    })
                } else {
                    res.status(201).json({
                        "code": "error",
                        "result": "wrong password"
                    })
                }
            })
        }

    });

    connection.end();
})
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

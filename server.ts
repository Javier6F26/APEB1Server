import express, {Request, Response} from "express";
import * as http from "http";
import * as bodyParser from "body-parser"
import {authKey, verificationPrivate} from "./configs";
import jwt, {VerifyErrors} from "jsonwebtoken"
import socketIO from 'socket.io';
import cors from 'cors';
import {UsersSocket} from "./sockets/UsersSocket";
import {Hooks} from "./database/hooks";
import {Collections} from "./database/Collections";
import {User, VerificationToken} from "./interfaces";

const options: cors.CorsOptions = {
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'X-Access-Token',
    ],
    credentials: true,
    methods: 'POST',
    //origin: 'http://localhost:4200/',
    preflightContinue: false,
};

export class Server {
    app: express.Application
    httpServer: http.Server
    private static _instance: Server;

    public static get instance() {
        return this._instance || (this._instance = new this)
    }

    private constructor() {
        this.app = express()
        this.app.set('authKey', authKey)
        this.app.use(bodyParser.urlencoded({extended: true}))
        this.app.use(bodyParser.json())
        this.app.use(cors(options))

        this.app.post('/login', (req, res) => {
            const userName = req.body.userName
            Collections.getUser(userName, (users: User[]) => {
                if (users.length == 0) {
                    res.send({verified: false})
                    return
                }
                let verificationCode: number = Math.floor(100000 + Math.random() * 900000)
                const verificationToken: VerificationToken = {user: users[0]}
                Collections.insertVerification({verificationCode}, (id: string) => {
                    verificationToken.id = id
                    jwt.sign(verificationToken, verificationPrivate, {expiresIn: 300}, (err, encoded) => {
                        if (encoded)
                            res.send({verified: true, verificationCode, token: encoded})
                    });
                })


            });
        });
        this.app.post('/verification', (req, res) => {
            const token = req.body.token;
            const verificationCode = req.body.verificationCode;
            jwt.verify(token, verificationPrivate, (verifiedError: VerifyErrors | null, decoded: VerificationToken | any) => {
                if (verifiedError) {
                    res.send({verified: false})
                    return;
                }
                Collections.getVerification(decoded.id, (callback: any[]) => {
                    if (callback.length == 0) {
                        res.send({verified: false})
                        return;
                    }
                    if (verificationCode == callback[0].verificationCode) {
                        Collections.updateLastSignIn(decoded.user, new Date().getTime())
                        Collections.deleteVerification(decoded.id)
                        jwt.sign({user: decoded.user}, authKey, {expiresIn: 300}, (err, encoded) => {
                            if (err) {
                                console.log(err)
                                res.send(err)
                                return
                            }
                            res.send({verified: true, token: encoded})
                        });
                    } else {
                        res.send({invalid: true})
                        return;
                    }
                })
            });
        })

        this.app.post('/resendVerificationCode', (req, res) => {
            const token = req.body.token;
            jwt.verify(token, verificationPrivate, (verifiedError: VerifyErrors | null, decoded: VerificationToken | any) => {
                if (verifiedError) {
                    res.send({verified: false})
                    return;
                }
                Collections.getVerification(decoded.id, (callback: any[]) => {
                    if (callback.length == 0) {
                        res.send({verified: false})
                        return;
                    }
                    res.send({verified: true, verificationCode: callback[0].verificationCode, token})
                })
            });
        })

        this.app.post('/authenticate', (req, res) => {

            const token = req.body.token;
            jwt.verify(token, authKey, (verifiedError: VerifyErrors | null, decoded: any) => {
                if (verifiedError) {
                    res.send({authenticated: false})
                    return
                }
                jwt.sign({user: decoded.user}, authKey, {expiresIn: 300}, (err, encoded) => {
                    res.send({authenticated: true, token: encoded})
                });
            });
        })
        this.httpServer = http.createServer(this.app)
        const socketServer = socketIO(this.httpServer)
        socketServer.use((socket, next) => {
            const token = socket.handshake.query.token
            jwt.verify(token, authKey, (verifiedError: VerifyErrors | null, decoded: { user: User } | any) => {
                if (verifiedError) return next(new Error(verifiedError.message))
                socket.handshake.query.userID = decoded.user._id
                next()
            })
        })

        socketServer.on("connection", clientIO => {
            console.log('cliente conectado')
            UsersSocket.listen(clientIO)
            Hooks.listen(socketServer)
            clientIO.on("disconnect", () => {
                console.log('cliente desconectado')
            });
        });

    }

    start(callback: any) {
        this.httpServer.listen(45001, callback)
        //   Collections.createIndexes()
    }

}

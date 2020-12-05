import * as fs from "fs";
import * as path from "path"

export const verificationPrivate = fs.readFileSync(path.join(__dirname, 'verifcationPrivateKey.pem'))
export const authKey = fs.readFileSync(path.join(__dirname, 'authenticationPrivateKey.pem'))

import {Collection, connect, ObjectId} from "mongodb";
import {Hooks} from "./hooks";
import {User} from "../interfaces";
import {Socket} from "socket.io";

const url = 'mongodb://127.0.0.1:27017';

export class Collections {


    private static getCollection(collection: string, callback: Function) {
        connect(url, {useUnifiedTopology: true}, ((error, result) => {
            if (error) {
                console.log(error.errmsg)
                throw error;
            }
            callback(result.db("main").collection(collection))
        }))
    }

    static getUsers(socket: Socket, callback: Function) {
        this.getCollection('users', (collection: Collection) => {
            collection.find({master: false}).toArray().then(value => {
                callback(value)
            }).catch((reason => Hooks.emitError(reason, socket)));
        })
    }

    static getUser(userName: string, callback: Function) {
        this.getCollection('users', (collection: Collection) => {
            collection.find({userName}).toArray().then(value => {
                callback(value)
            }).catch(reason => console.log(reason));
        })
    }

    static getUserPerms(_id: string, socket: Socket, callback: Function) {
        this.getCollection('users', (collection: Collection) => {
            collection.find({_id: new ObjectId(_id)}).toArray().then((value: User[]) => {
                if (value.length == 0) throw new Error()
                callback(value[0].permScope)
            }).catch(reason => Hooks.emitError(reason, socket));
        })
    }

    static addUser(user: User, socket: Socket) {
        user.master = false
        this.getCollection('users', (collection: Collection) => {
            collection.insertOne(user).then(() => {
                Hooks.userEvent()
            }).catch(reason => Hooks.emitError(reason, socket));
        })
    }

    static updateUser(user: User, socket: Socket) {
        this.getCollection('users', (collection: Collection) => {
            const update: User = {
                userName: user.userName,
                displayName: user.displayName,
                email: user.email,
                permScope: user.permScope,
                phoneNumber: user.phoneNumber,
                photoUrl: user.photoUrl,
                role: user.role,
                master: false
            }
            collection.updateOne({_id: new ObjectId(user._id)}, {$set: update}).then(() => Hooks.userEvent()
            ).catch(reason => Hooks.emitError(reason, socket));
        })
    }

    static updateLastSignIn(user: User, lastSignIn: number) {
        this.getCollection('users', (collection: Collection) => {
            collection.updateOne({_id: new ObjectId(user._id)}, {$set: {lastSignIn}}).then(() => Hooks.userEvent()
            ).catch(reason => console.log(reason));
        })
    }

    static dropUsers() {
        this.getCollection('users', (collection: Collection) => {
            collection.drop().then(() => Hooks.userEvent())
        })
    }

    static deleteUser(user: User, socket: Socket) {
        if (user._id)
            this.getCollection('users', (collection: Collection) => {
                collection.deleteOne({_id: new ObjectId(user._id)}).then(() => {
                    Hooks.userEvent()
                }).catch((reason => Hooks.emitError(reason, socket)));
            })
        else
            Hooks.emitError({message: 'Invalido'}, socket);
    }

    static createIndexes() {
        this.getCollection('users', (collection: Collection) => {
            collection.createIndex({userName: 1}, {unique: true}).then()
            collection.createIndex({email: 1}, {unique: true}).then()
        })
    }

    static insertVerification(token: any, callback: Function) {
        this.getCollection('verificationToken', (collection: Collection) => {
            collection.insertOne(token).then((inserted) => {
                callback(inserted.insertedId)
            }).catch(reason => console.log(reason));
        })
    }

    static getVerification(verificationId: string, callback: Function) {

        this.getCollection('verificationToken', (collection: Collection) => {
            collection.find({_id: new ObjectId(verificationId)}).toArray().then((verificationToken) => {
                callback(verificationToken)
            }).catch(reason => console.log(reason));
        })
    }

    static deleteVerification(verificationId: string) {
        this.getCollection('verificationToken', (collection: Collection) => {
            collection.deleteOne({_id: new ObjectId(verificationId)}).then()
                .catch(reason => console.log(reason));
        })
    }


}

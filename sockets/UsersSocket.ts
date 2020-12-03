import {Socket} from "socket.io";
import {Collections} from "../database/Collections";
import {PermMatrix, User} from "../interfaces";
import {Hooks} from "../database/hooks";

export class UsersSocket {
    static listen(clientIO: Socket) {


        clientIO.on('get_users', (payload, callback) => {

            Collections.getUserPerms(clientIO.handshake.query.userID, clientIO, (permScope: PermMatrix) => {
                if (!permScope.users.list) {
                    Hooks.emitError({message: 'No Autorizado'}, clientIO)
                    return
                }
                Collections.getUsers(clientIO, callback)
            });
        });
        clientIO.on('add_user', (payload: User) => {
            Collections.getUserPerms(clientIO.handshake.query.userID, clientIO, (permScope: PermMatrix) => {

                if (!permScope.users.create) {
                    Hooks.emitError({message: 'No Autorizado'}, clientIO)
                    return
                }
                Collections.addUser(payload, clientIO)

            });
        });
        clientIO.on('update_user', (payload: User) => {
            Collections.getUserPerms(clientIO.handshake.query.userID, clientIO, (permScope: PermMatrix) => {

                if (!permScope.users.modify) {
                    Hooks.emitError({message: 'No Autorizado'}, clientIO)
                    return
                }
                Collections.updateUser(payload, clientIO)

            });
        });
        clientIO.on('delete_user', (payload: User) => {
            Collections.getUserPerms(clientIO.handshake.query.userID, clientIO, (permScope: PermMatrix) => {

                if (!permScope.users.delete) {
                    Hooks.emitError({message: 'No Autorizado'}, clientIO)
                    return
                }
                Collections.deleteUser(payload, clientIO)

            });
        })


    }
}

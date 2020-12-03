import {Server, Socket} from "socket.io";

export class Hooks {
    static IO: Server

    static listen(IO: Server) {
        this.IO = IO
    }

    static userEvent() {
        this.IO.emit('userEventListener')
    }


    static emitError(error: { code?: number, keyValue?: any, message: string }, IO: Socket) {
        let message = error.message;
        if (error.code == 11000) {
            if (error.keyValue.userName)
                message = 'El Nombre de Usuario ya Existe'
            if (error.keyValue.email)
                message = 'El Correo Electrónico ya se ha Registrado'
        }
        IO.emit('errorEventListener', {message})
    }
}

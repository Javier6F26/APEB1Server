import {Server} from "./server";

Server.instance.start(() => {
    console.log("Escuchando puerto")
});


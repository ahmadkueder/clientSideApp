/**
 * To open port 3001 of client page window view
 * 
 */
var app = require("express")();

var http = require("http").Server(app);

var io = require("socket.io")(http);

exports.startListeningToOrders = (onStartListening, callbackOnConnection) => {
    /**
     * 1- create port of client app in case the app of client is opened
     * on port 3001
     */

    http.listen(3001, "0.0.0.0", onStartListening(io));
    io.on("connection", callbackOnConnection);

}

exports.disconnectIOsocket = () => {
    console.log("Closing IO ...");
    io.close();
}
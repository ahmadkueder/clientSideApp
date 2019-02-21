/*
- Start the Server.
- check if there any client
- if server started. 
- - open GUI app
- else 
- - show user error message
*/

//  inport all required libs
const electron = require("electron");
const json_RW = require("jsonfile");
const fs = require("fs");
const openClientViewPort = require("./openPortForClientViewPage");
const nodeBrightness = require("brightness");



check_if_static_file_exist("./staticData.json")
var file_data = json_RW.readFileSync("./staticData.json");




// declare the main window
const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    remote,
    BrowserView,
    MenuItem,
} = electron;

app.on("ready", on_app_ready);




let add_ip_page;
let server_control_window;


app.on("window-all-closed", function () {
    console.log("window Closed .....");
    add_ip_page = null;
    server_control_window = null;
    app.quit();
})


var url;

function on_app_ready() {

    /** remote setup  */


    add_ip_page = new BrowserWindow({
        height: 500,
        width: 800,
        webPreferences: {
            nodeIntegration: true,
            devTools: false

        },
        alwaysOnTop: true,
        resizable: true,
        show: false
    })


    server_control_window = new BrowserWindow({
        height: 500,
        width: 800,
        webPreferences: {
            nodeIntegration: false,
            devTools: false
        },
        alwaysOnTop: true,
        resizable: true,
        show: false
    })

    add_ip_url = "./serverSide.html";

    // check if static file contain any data
    if (file_data.length > 0) {
        var server_ip = file_data[0].server_ip;
        var server_port = file_data[0].port;
        var server_folder = file_data[0].folder;
        var is_https = file_data[0].https;

        if (is_https) {
            is_https = "https://"
        } else {
            is_https = "http://"
        }
        // create window with java script services to redirect to IP or existing ip
        // active JS in the page
        url = `${is_https + server_ip + ":" + server_port  + server_folder}`;
        server_control_window.loadURL(url);
        server_control_window.show();
    } else {
        add_ip_page.loadFile(add_ip_url);
        add_ip_page.show();
    }


    // on recive data from add server data, if the origin data was not exist.
    ipcMain.on("save_to_json_file_server_data", function (event, args) {
        // write the new server infos into json file
        json_RW.writeFileSync("./staticData.json", [args]);

        var server_ip = args.server_ip;
        var server_port = args.port;
        var server_folder = args.folder;
        var is_https = args.https;

        if (is_https) {
            is_https = "https://"
        } else {
            is_https = "http://"
        }

        url = `${is_https + server_ip + ":" + server_port + server_folder}`;
        add_ip_page.hide();
        server_control_window.loadURL(url);
        server_control_window.show();
    })

    // in case server side view connected to client side view
    openClientViewPort.startListeningToOrders(
        (ioObject) => {
            // in case starts to listening
            console.log("Starts Listening..... ");
        }, (ioObject) => {
            // in case the connection is started
            ioObject.on("changeClientMeinURL", (data) => {
                server_control_window.loadURL(url);
            })
            // on Server view is opend , start redirect url to the client page 
            ioObject.on("OPENCLIENTSIDE", (data) => {
                server_control_window.loadURL(url);
            })
            // To go back To offers Page 
            ioObject.on("BACKTOOFFERS", (data) => {
                server_control_window.loadURL(data);
            });
            // to change Brightness of Client Device 
            ioObject.on("changeBrightnessOfDevice", (data) => {
                nodeBrightness.set(data).then(() => {
                    console.log('Changed brightness to ' + data);
                });
            });
            // set current window full screen 
            ioObject.on("setWindowFullScreen", () => {
                server_control_window.setFullScreen(true);
            })
            // to minimize clinet window 
            ioObject.on("minimizeClientWindow", () => {
                server_control_window.minimize();
            })
            // on server side controler not connected
            ioObject.on("disconnect", function (params) {
                console.log("Disconnected ...");
            })
        });
        
    server_control_window.on("closed", on_window_close);
    add_ip_page.on("closed", on_window_close);

}

electron.app.on('browser-window-created', function (e, window) {});



let on_window_close = function (window) {
    openClientViewPort.disconnectIOsocket();
    window = null;
    app.quit();
}

/**
 * @param {String} file_name Check If the static file exist 
 */
function check_if_static_file_exist(file_name) {
    try {
        if (fs.existsSync(file_name)) {
            return true;
        } else {
            fs.writeFileSync(file_name, JSON.stringify([]), "utf8", function (err) {
                if (err) throw err;
            });
        }
    } catch (err) {
        console.error(err)
    }
}
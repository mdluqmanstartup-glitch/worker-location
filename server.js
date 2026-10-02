const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const publicPath = path.join(__dirname, "public");


// =====================================
// ANDROID APP LINKS
// .well-known/assetlinks.json
// =====================================

app.use(
    "/.well-known",
    express.static(
        path.join(publicPath, ".well-known"),
        {
            dotfiles: "allow"
        }
    )
);


// =====================================
// STATIC FILES
// =====================================

app.use(express.static(publicPath));


// =====================================
// WORKER PAGE
// =====================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(publicPath, "worker.html")
    );
});

app.get("/worker.html", (req, res) => {
    res.sendFile(
        path.join(publicPath, "worker.html")
    );
});


// =====================================
// ADMIN PAGE
// =====================================

app.get("/admin.html", (req, res) => {
    res.sendFile(
        path.join(publicPath, "admin.html")
    );
});


// =====================================
// WORKERS STORAGE
// =====================================

const workers = new Map();


// =====================================
// SOCKET.IO
// =====================================

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);


    // ---------------------------------
    // SEND EXISTING WORKERS
    // ---------------------------------

    for (const worker of workers.values()) {

        socket.emit(
            "worker-location",
            worker
        );

    }


    // ---------------------------------
    // RECEIVE WORKER LOCATION
    // ---------------------------------

    socket.on("worker-location", (data) => {

        const workerData = {

            id: socket.id,

            name: data.name,

            code: data.code,

            latitude: data.latitude,

            longitude: data.longitude,

            accuracy: data.accuracy,

            time: data.time

        };


        workers.set(
            socket.id,
            workerData
        );


        // Send location to everyone
        io.emit(
            "worker-location",
            workerData
        );

    });


    // ---------------------------------
    // WORKER STOPPED SHARING
    // ---------------------------------

    socket.on("worker-stop", () => {

        if (workers.has(socket.id)) {

            workers.delete(
                socket.id
            );


            io.emit(
                "worker-stop",
                {
                    id: socket.id
                }
            );

        }


        console.log(
            "Worker stopped:",
            socket.id
        );

    });


    // ---------------------------------
    // WORKER DISCONNECTED
    // ---------------------------------

    socket.on("disconnect", () => {

        if (workers.has(socket.id)) {

            workers.delete(
                socket.id
            );


            io.emit(
                "worker-stop",
                {
                    id: socket.id
                }
            );

        }


        console.log(
            "Disconnected:",
            socket.id
        );

    });

});


// =====================================
// SERVER
// =====================================

const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);
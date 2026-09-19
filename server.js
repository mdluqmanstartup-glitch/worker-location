const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Public folder
const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));

// Root page -> Worker page
app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "worker.html"));
});

// Worker page
app.get("/worker.html", (req, res) => {
    res.sendFile(path.join(publicPath, "worker.html"));
});

// Admin page
app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(publicPath, "admin.html"));
});


// Active workers
const workers = new Map();

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    // Send active workers to newly connected user
    for (const worker of workers.values()) {
        socket.emit("worker-location", worker);
    }


    // Receive worker location
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

        workers.set(socket.id, workerData);

        // Send location to everyone
        io.emit("worker-location", workerData);
    });


    // Worker stops sharing
    socket.on("worker-stop", () => {

        if (workers.has(socket.id)) {

            workers.delete(socket.id);

            io.emit("worker-stop", {
                id: socket.id
            });
        }

        console.log("Worker stopped:", socket.id);
    });


    // Worker disconnects
    socket.on("disconnect", () => {

        if (workers.has(socket.id)) {

            workers.delete(socket.id);

            io.emit("worker-stop", {
                id: socket.id
            });
        }

        console.log("Disconnected:", socket.id);
    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
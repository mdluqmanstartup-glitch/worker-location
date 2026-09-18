const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const workers = new Map();

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    // Send already active workers to new admin
    for (const worker of workers.values()) {
        socket.emit("worker-location", worker);
    }

    // Worker location
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

        io.emit("worker-location", workerData);
    });

    // Worker manually stops sharing
    socket.on("worker-stop", () => {

        if (workers.has(socket.id)) {
            workers.delete(socket.id);

            io.emit("worker-stop", {
                id: socket.id
            });
        }

        console.log("Worker stopped:", socket.id);
    });

    // Worker closes/disconnects
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
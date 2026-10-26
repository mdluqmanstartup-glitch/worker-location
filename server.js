
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

    // Send existing workers to newly connected clients
    for (const worker of workers.values()) {
        socket.emit("worker-location", worker);
    }

    // Receive worker location
    socket.on("worker-location", (data) => {
        if (
            !data ||
            typeof data.latitude !== "number" ||
            typeof data.longitude !== "number"
        ) {
            console.log("Invalid worker location received");
            return;
        }

        const workerData = {
            id: socket.id,
            name: data.name || "Worker",
            code: data.code || "WRK",
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            time: data.time
        };

        workers.set(socket.id, workerData);

        // Broadcast updated location to everyone
        io.emit("worker-location", workerData);
    });

    // Worker explicitly stopped sharing
    socket.on("worker-stop", () => {
        if (workers.has(socket.id)) {
            workers.delete(socket.id);

            io.emit("worker-stop", {
                id: socket.id
            });
        }

        console.log("Worker stopped:", socket.id);
    });

    // Keep the last known location on disconnect
    socket.on("disconnect", () => {
        console.log("Worker disconnected:", socket.id);
        // Do not delete the last known location here.
    });
});

// =====================================
// SERVER
// =====================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

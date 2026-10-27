
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const publicPath = path.join(__dirname, "public");

// Android App Links
app.use(
    "/.well-known",
    express.static(path.join(publicPath, ".well-known"), {
        dotfiles: "allow"
    })
);

// Static Files
app.use(express.static(publicPath));

// Worker Page
app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "worker.html"));
});

app.get("/worker.html", (req, res) => {
    res.sendFile(path.join(publicPath, "worker.html"));
});

// Admin Page
app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(publicPath, "admin.html"));
});

// Workers Storage
const workers = new Map();

// Socket.IO
io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    // Send existing workers to new clients
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
        io.emit("worker-location", workerData);
    });

    // Explicitly stop sharing
    socket.on("worker-stop", () => {
        removeWorker(socket.id);
        console.log("Worker stopped:", socket.id);
    });

    // Remove disconnected worker
    socket.on("disconnect", () => {
        removeWorker(socket.id);
        console.log("Worker disconnected:", socket.id);
    });
});

// Remove worker and notify dashboard
function removeWorker(id) {
    if (workers.has(id)) {
        workers.delete(id);
        io.emit("worker-stop", { id });
    }
}

// Start Server
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

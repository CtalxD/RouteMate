const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8081", // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userRoutes = require("./routes/userRouter");
const documentRoute = require("./routes/documentRouter");
const cookieParser = require("cookie-parser");
const { config } = require("./config");
const cors = require("cors");
const prisma = require("./prisma/prisma");
const path = require("path");
const fs = require("fs");

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:8081", // Replace with your frontend URL
    credentials: true,
  })
);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", userRoutes);
app.use("", documentRoute);

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for location updates from the client
  socket.on("updateLocation", (location) => {
    console.log("Received location update:", location);

    // Broadcast the location to all connected clients
    io.emit("newLocation", { ...location, id: socket.id }); // Include socket ID for unique identification
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

const port = config.port;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
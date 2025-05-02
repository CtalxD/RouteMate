//backend/app.js

const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")

const userRoutes = require("./routes/userRouter")
const adminRoutes = require("./routes/adminRouter")
const documentRouter = require("./routes/documentRouter")
const paymentRoutes = require("./routes/paymentRouter")
const busRoutes = require("./routes/busRouter");
const ticketRoutes = require('./routes/ticketRouter');
const cookieParser = require("cookie-parser")
const { config } = require("./config")
const cors = require("cors")
const prisma = require("./prisma/prisma")
const path = require("path")
const fs = require("fs")

// Middleware
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    origin: ["http://localhost:8081", "http://localhost:3000"],
    credentials: true,
  }),
)

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8081", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Track connected users and their locations
const connectedUsers = new Map()
const userLocations = new Map()

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Store the socket connection
  connectedUsers.set(socket.id, {
    socket,
    userId: null, // Will be set when user authenticates
    isOnline: false,
  })

  // Handle location updates
  socket.on("update-location", (data) => {
    console.log("Location update received:", data)

    // Store the user's location
    userLocations.set(socket.id, {
      socketId: socket.id,
      ...data,
      timestamp: Date.now(),
    })

    // Broadcast to all clients except sender
    socket.broadcast.emit("location-updated", {
      socketId: socket.id,
      ...data,
    })

    // Acknowledge receipt
    socket.emit("location-updated", {
      socketId: socket.id,
      ...data,
      status: "received",
    })
  })

  // Handle online status changes
  socket.on("toggle-online-status", (data) => {
    console.log("Status change received:", data)

    // Update user's online status
    if (connectedUsers.has(socket.id)) {
      const user = connectedUsers.get(socket.id)
      user.isOnline = data.status
      connectedUsers.set(socket.id, user)
    }

    // Broadcast to all clients
    io.emit("status-changed", {
      socketId: socket.id,
      status: data.status,
    })

    // Acknowledge receipt
    socket.emit("status-changed", {
      socketId: socket.id,
      status: data.status,
      received: true,
    })
  })

  // Send current online users to newly connected client
  const currentUsers = []
  userLocations.forEach((location, socketId) => {
    if (connectedUsers.has(socketId) && connectedUsers.get(socketId).isOnline) {
      currentUsers.push(location)
    }
  })

  if (currentUsers.length > 0) {
    socket.emit("current-users", currentUsers)
  }

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)
    connectedUsers.delete(socket.id)
    userLocations.delete(socket.id)

    // Notify other clients about the disconnection
    socket.broadcast.emit("user-disconnected", { socketId: socket.id })
  })
})

// Cleanup stale locations periodically (users who haven't updated in 1 minute)
setInterval(() => {
  const now = Date.now()
  userLocations.forEach((location, socketId) => {
    if (now - location.timestamp > 60000) {
      userLocations.delete(socketId)
    }
  })
}, 30000) // Run every 30 seconds

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Routes
app.use("/", userRoutes)
app.use('/document', documentRouter);
app.use("/payment", paymentRoutes)
app.use("/admin", adminRoutes)
app.use("/buses", busRoutes);
app.use('/tickets', ticketRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

// 404 handler
app.use((req, res) => {
  res.status(404).send("Not Found")
})

// Start server
const port = config.port
server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

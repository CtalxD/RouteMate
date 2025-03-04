const express = require("express");
const app = express();
const userRoutes = require("./routes/userRouter");
const documentRoute = require("./routes/documentRouter")
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
    origin: "http://localhost:8081", 
    credentials: true,
  })
);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", userRoutes);
app.use("",documentRoute)

const port = config.port;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// const app = express();
// const userRoutes = require("./routes/userRouter");
// const documentRoute = require("./routes/documentRouter");
// const cookieParser = require("cookie-parser");
// const { config } = require("./config");
// const cors = require("cors");
// const prisma = require("./prisma/prisma");
// const path = require("path");
// const fs = require("fs");

// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       const allowedOrigins = ['http://localhost:8081',];
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     credentials: true,
//   })
// );

// // Ensure uploads directory exists
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)){
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/", userRoutes);
// app.use("", documentRoute);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// const port = config.port;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
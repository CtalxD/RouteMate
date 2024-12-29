const express = require("express");
const app = express();
const userRoutes = require("./routes/userRouter");
const cookieParser = require("cookie-parser");
const { config } = require("./config");
const cors = require("cors");


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:8081", 
    credentials: true,
  })
);
app.use("/",userRoutes);
const port = config.port;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db");
const Room = require("./models/Room");
const roomRoutes = require("./routes/rooms");
const bookingRoutes = require("./routes/booking")
const Checkout = require('./routes/checkout')
const Auth = require('./routes/authRoutes.js')

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "https://hms-front-end.netlify.app", // deployed frontend
      "http://localhost:3000",             // local frontend for testing
    ],
    credentials: true, // if you use cookies or authentication headers
  })
);app.use(express.json());

app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/Checkout", Checkout);
app.use("/api/auth", Auth);



app.get("/", (req, res) => res.send("🏨 Hotel API is running"));

const PORT = process.env.PORT || 5000;


connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
});

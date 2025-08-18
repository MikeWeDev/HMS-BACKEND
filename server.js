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

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/Checkout", Checkout);
app.use("/api/auth", Auth);



app.get("/", (req, res) => res.send("🏨 Hotel API is running"));

const PORT = process.env.PORT || 5000;

async function seedRooms() {
  try {
    const count = await Room.countDocuments();
    if (count === 0) {
      const rooms = [];
      for (let i = 1; i <= 20; i++) {
        rooms.push({
          roomNumber: `${100 + i}`,                // unique room number as string
          type: `Room Type ${i}`,
          price: 50 + i * 10,
          capacity: 2 + (i % 3),                   // example capacities cycling 2,3,4
          amenities: ["WiFi", "TV", "Air Conditioning"], // sample amenities
          isAvailable: true,
        });
      }
      await Room.insertMany(rooms);
      console.log("✅ Seeded 20 available rooms");
    } else {
      console.log("Rooms already seeded, skipping...");
    }
  } catch (err) {
    console.error("❌ Error seeding rooms:", err);
  }
}


connectDB().then(() => {
  seedRooms();              // <-- Run seed after DB connection
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
});

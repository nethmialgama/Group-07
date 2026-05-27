const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join(process.cwd(), "public/images")));



app.use("/api", require("./routes/reviews"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/admin", require("./routes/admin"));
//app.use("/api/payments", require("./routes/payments"));
app.use("/api/reservations", require("./routes/reservations"));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
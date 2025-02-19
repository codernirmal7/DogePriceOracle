import app from "./app.js";
import "dotenv/config";
import cron from "node-cron";
import axios from "axios";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Hitting /update endpoint...");
    const response = await axios.get("http://localhost:4000/price/update");
    console.log("Response from /update:", response.data);
  } catch (error) {
    console.error("Error hitting /update endpoint:", error.message);
  }
});

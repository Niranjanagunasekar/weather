import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/api/weather", async (req, res) => {
    const city = req.query.city;
    if (!city) return res.json({ error: "City required" });

    const API_KEY = process.env.OPENWEATHER_API_KEY || "your_default_key_here";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const r = await fetch(url);
        const data = await r.json();
        res.json(data);
    } catch (err) {
        res.json({ error: "Error fetching weather" });
    }
});

app.listen(PORT, () => console.log("Server running on port " + PORT));

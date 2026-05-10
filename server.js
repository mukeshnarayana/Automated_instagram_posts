const express = require("express");
const app = express();
const { dbConnnection } = require("./src/config/dbconfig");
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


















app.get("/", (req, res) => {
    res.send("Hello World!");
});




dbConnnection()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port http://localhost:${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    });
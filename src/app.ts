import express from "express";

const app = express();

// hello world
app.get("/", (req, res) => {
	res.send("Hello World!");
});
	


export default app;

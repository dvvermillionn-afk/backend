const express = require("express")
const cors = require("cors")
const app = express()
const logger = require("morgan")

const sha = require("./routes/shabba.js")

app.use(express.json())
app.use(logger('dev'))
app.use(cors({origin:"*", optionsSuccessStatus: 200}))

app.use("/shabba", sha)

// Health check route
app.get("/", (req, res) => {
    res.json({ 
        message: "Server is working!",
        endpoints: {
            login: "POST /shabba",
            test: "GET /shabba/test"
        }
    })
})

app.listen(2000, () => {
    console.log("🚀 Server is running on port 2000")
    console.log("📧 Login endpoint: http://localhost:2000/shabba")
    console.log("🔧 Test endpoint: http://localhost:2000/shabba/test")
})
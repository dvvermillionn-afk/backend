const express = require("express")
const cors = require("cors")
const app = express()
const logger = require("morgan")

const sha = require("./routes/shabba.js")

app.use(express.json())
app.use(logger('dev'))
app.use(cors({origin: "*", optionsSuccessStatus: 200}))

app.use("/shabba", sha)

// Health check route
app.get("/", (req, res) => {
    res.json({ 
        message: "🚀 Server is working!",
        timestamp: new Date().toISOString(),
        endpoints: {
            login: "POST /shabba",
            test: "GET /shabba/test",
            debug: "GET /shabba/debug"
        }
    })
})

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`)
    console.log(`📧 Login endpoint: http://localhost:${PORT}/shabba`)
    console.log(`🔧 Test endpoint: http://localhost:${PORT}/shabba/test`)
})
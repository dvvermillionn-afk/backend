const express = require("express")
const cors = require("cors")
const app = express()
const logger = require("morgan")

const sha = require("./routes/shabba.js")

app.use(express.json())
app.use(logger('dev'))
app.use(cors({origin: "*", optionsSuccessStatus: 200}))





app.use("/shabba", sha)


app.listen(2000, ()=>{
  console.log("server is working")
})
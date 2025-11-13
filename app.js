// importation
const express = require ("express")
const cors = require ("cors")
const app = express ()
const logger = require("morgan")
const fs = require('fs').promises





const sha = require("./routes/shabba.js")








app.use(express.json())
app.use(logger('dev'))
app.use(cors({origin:"*", optionsSuccessStatus :200}))


app.use("/shabba", sha)





app.listen(2000, ()=>{
    console.log("server is working")
})

//const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => {
  //  console.log(Server is running on port ${PORT});
//});
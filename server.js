const express = require("express")
const app = express()

const morgan = require("morgan")
const bodyParser = require("body-parser")

app.use(morgan("dev"))

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

PORT = process.env.PORT || 4001

const envelopesRouter = require("./server/routes/envelopes")
app.use("/api/envelopes", envelopesRouter)

const transactionsRouter = require("./server/routes/transactions")
app.use("/api/transactions", transactionsRouter)

app.listen(PORT, () => {
  console.log("Listening on port", PORT)
})

module.exports = app

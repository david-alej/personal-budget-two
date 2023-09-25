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

const swaggerUi = require("swagger-ui-express")
const openApiDocumentation = require("./api-documentation/openapi.json")
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocumentation))

const envelopesRouter = require("./server/routes/envelopes")
app.use("/api/envelopes", envelopesRouter)

const transactionsRouter = require("./server/routes/transactions")
app.use("/api/transactions", transactionsRouter)

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} (http://localhost:${PORT})`)
  console.log(`Swagger-ui is available on http://localhost:${PORT}/api-docs`)
})

module.exports = app

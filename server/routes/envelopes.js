const express = require("express")
const envelopesRouter = express.Router()

const {
  handleEnvelopeId,
  getEnvelopes,
  getEnvelopeById,
  createEnvelope,
  envelopeTransfer,
  updateEnvelope,
  updateTotalAllotment,
  deleteEnvelopes,
  deleteEnvelopeById,
} = require("../helpers/route-helpers")

envelopesRouter.param("envelopeId", handleEnvelopeId)

envelopesRouter.get("/", getEnvelopes)

envelopesRouter.get("/:envelopeId", getEnvelopeById)

envelopesRouter.post("/", createEnvelope)

envelopesRouter.post("/transfer/:from/:to", envelopeTransfer)

envelopesRouter.put("/totalAllotment", updateTotalAllotment)

envelopesRouter.put("/:envelopeId", updateEnvelope)

envelopesRouter.delete("/", deleteEnvelopes)

envelopesRouter.delete("/:envelopeId", deleteEnvelopeById)

module.exports = envelopesRouter

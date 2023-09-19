const express = require("express")
const envelopesRouter = express.Router()

const {
  handleEnvelopeId,

  getTotalAllotment,
  getEnvelopes,
  getEnvelopeById,
  createEnvelope,
  envelopeTransfer,
  seedEnvelopes,
  updateEnvelope,
  updateTotalAllotment,
  deleteEnvelopes,
  deleteEnvelopeById,
} = require("../helpers/envelope-helpers")

envelopesRouter.param("envelopeId", handleEnvelopeId)

envelopesRouter.get("/total-allotment", getTotalAllotment)

envelopesRouter.get("/", getEnvelopes)

envelopesRouter.get("/:envelopeId", getEnvelopeById)

envelopesRouter.post("/", createEnvelope)

envelopesRouter.post("/transfer/:from/:to", envelopeTransfer)

envelopesRouter.get("/seed-envelopes", seedEnvelopes)

envelopesRouter.put("/total-allotment", updateTotalAllotment)

envelopesRouter.put("/:envelopeId", updateEnvelope)

envelopesRouter.delete("/", deleteEnvelopes)

envelopesRouter.delete("/:envelopeId", deleteEnvelopeById)

module.exports = envelopesRouter

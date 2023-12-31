const express = require("express")
const envelopesRouter = express.Router()

const {
  handleEnvelopeId,
  getReservedAllotment,
  getUnreservedAllotment,
  getUnusedAllotment,
  getTotalAllotment,
  getEnvelopes,
  getEnvelopeById,
  createEnvelope,
  envelopeTransfer,
  seedEnvelopes,
  updateEnvelope,
  updateUnusedAllotment,
  deleteEnvelopes,
  deleteEnvelopeById,
} = require("../helpers/envelope-helpers")

envelopesRouter.param("envelopeId", handleEnvelopeId)

envelopesRouter.get("/reserved-allotment", getReservedAllotment)

envelopesRouter.get("/unreserved-allotment", getUnreservedAllotment)

envelopesRouter.get("/unused-allotment", getUnusedAllotment)

envelopesRouter.get("/total-allotment", getTotalAllotment)

envelopesRouter.get("/", getEnvelopes)

envelopesRouter.get("/:envelopeId", getEnvelopeById)

envelopesRouter.post("/", createEnvelope)

envelopesRouter.post("/transfer/:from/:to", envelopeTransfer)

envelopesRouter.post("/seed-envelopes", seedEnvelopes)

envelopesRouter.put("/unused-allotment", updateUnusedAllotment)

envelopesRouter.put("/:envelopeId", updateEnvelope)

envelopesRouter.delete("/", deleteEnvelopes)

envelopesRouter.delete("/:envelopeId", deleteEnvelopeById)

module.exports = envelopesRouter

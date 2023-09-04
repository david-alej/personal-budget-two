const express = require("express")
const envelopesRouter = express.Router()

const {
  handleEnvelopeId,
  getEnvelopes,
  getEnvelopeById,
  createEnvelope,
  updateEnvelope,
  deleteEnvelopes,
  deleteEnvelopeById,
} = require("../helpers/route-helpers")

envelopesRouter.param("envelopeId", handleEnvelopeId)

envelopesRouter.get("/", getEnvelopes)

envelopesRouter.get("/:envelopeId", getEnvelopeById)

envelopesRouter.post("/", createEnvelope)

envelopesRouter.put("/:envelopeId", updateEnvelope)

envelopesRouter.delete("/", deleteEnvelopes)

envelopesRouter.delete("/:envelopeId", deleteEnvelopeById)

module.exports = envelopesRouter

const express = require("express")
const envelopesRouter = express.Router()

const {
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteEnvelopeFromDatabasebyId,
  deleteAllEnvelopesFromDatabase,
} = require("../db/db")

envelopesRouter.param("/:envelopeId", (req, res, next, id) => {
  const envelope = getEnvelopeFromDatabaseById(id)
  if (envelope) {
    req.envelope = envelope
    req.envelopeId = id
    next()
  }
  res.status(404).send("Envelope wast not found from Id.")
})

envelopesRouter.get("/", (req, res, next) => {
  res.send(getAllEnvelopesFromDatabase())
})

envelopesRouter.get("/:envelopeId", (req, res, next) => {
  const envelope = req.envelope
  if (envelope) {
    res.send(envelope)
    return
  }
  res.status(404).send()
})

envelopesRouter.post("/", (req, res, next) => {
  const envelope = addEnvelopeToDatabase(req.body)
  if (envelope) {
    res.status(201).send(envelope)
    return
  }
  res.status(400).send()
})

envelopesRouter.put("/:envelopeId", (req, res, next) => {
  const envelope = updateEnvelopeInDatabase(req.body)
  if (envelope) {
    res.send(envelope)
  }
  res.status(404).send()
})

envelopesRouter.delete("/", (req, res, next) => {
  deleteAllEnvelopesFromDatabase()
  res.status(204).send()
})

envelopesRouter.delete("/:envelopeId", (req, res, next) => {
  const isDeleted = deleteEnvelopeFromDatabasebyId(req.envelopeId)
  if (!isDeleted) {
    res.status(204).send()
    return
  }
  res.status(404).send()
})

module.exports = envelopesRouter

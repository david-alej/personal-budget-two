const {
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteEnvelopeFromDatabasebyId,
  deleteAllEnvelopesFromDatabase,
} = require("../helpers/db-helpers")

function handleEnvelopeId(req, res, next, id) {
  const envelope = getEnvelopeFromDatabaseById(id)
  if (envelope) {
    req.envelope = envelope
    req.envelopeId = id
    next()
    return
  }
  res.status(404).send("Envelope wast not found from Id.")
}

function getEnvelopes(req, res, next) {
  res.send(getAllEnvelopesFromDatabase())
}

function getEnvelopeById(req, res, next) {
  const envelope = req.envelope
  if (envelope) {
    res.send(envelope)
    return
  }
  res.status(404).send("Not found")
}

function createEnvelope(req, res, next) {
  const envelope = addEnvelopeToDatabase(req.body)
  if (envelope) {
    res.status(201).send(envelope)
    return
  }
  res.status(400).send()
}

function updateEnvelope(req, res, next) {
  req.body.id = req.envelopeId
  const envelope = updateEnvelopeInDatabase(req.body)
  if (envelope) {
    res.send(envelope)
    return
  }
  res.status(404).send()
}

function deleteEnvelopes(req, res, next) {
  deleteAllEnvelopesFromDatabase()
  res.status(204).send()
}

function deleteEnvelopeById(req, res, next) {
  const isDeleted = deleteEnvelopeFromDatabasebyId(req.envelopeId)
  if (isDeleted) {
    res.status(204).send()
    return
  }
  res.status(404).send()
}

module.exports = {
  handleEnvelopeId,
  getEnvelopes,
  getEnvelopeById,
  createEnvelope,
  updateEnvelope,
  deleteEnvelopes,
  deleteEnvelopeById,
}

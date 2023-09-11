const {
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteEnvelopeFromDatabasebyId,
  deleteAllEnvelopesFromDatabase,
} = require("../helpers/db-helpers")

async function handleEnvelopeId(req, res, next, id) {
  id = Number(id)
  const envelope = await getEnvelopeFromDatabaseById(id)
  if (envelope) {
    req.envelope = envelope
    req.envelopeId = id
    next()
    return
  }
  res.status(404).send("Envelope wast not found from Id.")
}

async function getEnvelopes(req, res, next) {
  res.send(JSON.stringify(await getAllEnvelopesFromDatabase()))
}

function getEnvelopeById(req, res, next) {
  const envelope = req.envelope
  if (envelope) {
    res.send(JSON.stringify(envelope))
    return
  }
  res.status(404).send("Not found")
}

async function createEnvelope(req, res, next) {
  const envelope = await addEnvelopeToDatabase(req.body)
  if (envelope) {
    res.status(201).send(JSON.stringify(envelope))
    return
  }
  res.status(400).send()
}

async function updateEnvelope(req, res, next) {
  req.body.id = req.envelopeId
  const envelope = await updateEnvelopeInDatabase(req.body)
  if (envelope) {
    res.send(envelope)
    return
  }
  res.status(404).send()
}

async function deleteEnvelopes(req, res, next) {
  await deleteAllEnvelopesFromDatabase()
  res.status(204).send()
}

async function deleteEnvelopeById(req, res, next) {
  const isDeleted = await deleteEnvelopeFromDatabasebyId(req.envelopeId)
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

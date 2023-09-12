const {
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteEnvelopeFromDatabasebyId,
  deleteAllEnvelopesFromDatabase,
} = require("../helpers/db-helpers")

async function handleEnvelopeId(req, res, next, id) {
  if (isNaN(parseFloat(id)) || !isFinite(id)) {
    res.status(400).send("Envelope's id must be a number.")
    return
  }
  id = Number(id)
  const envelope = await getEnvelopeFromDatabaseById(id)
  if (envelope) {
    req.envelope = envelope
    req.envelopeId = id
    next()
    return
  }
  res.status(404).send("There is no envelope with that id")
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
  const envelopeQuery = await addEnvelopeToDatabase(req.body)
  if (typeof envelopeQuery === "object") {
    res.status(201).send(JSON.stringify(envelopeQuery))
    return
  }
  res.status(400).send(envelopeQuery)
}

async function updateEnvelope(req, res, next) {
  req.body.id = req.envelopeId
  const envelopeQuery = await updateEnvelopeInDatabase(req.body)
  if (typeof envelopeQuery === "object") {
    res.send(JSON.stringify(envelopeQuery))
    return
  }
  res.status(400).send(envelopeQuery)
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

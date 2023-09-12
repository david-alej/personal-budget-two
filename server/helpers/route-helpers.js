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

function checkBody(req, res, next) {
  if (
    !Object.hasOwn(req.body, "allotment") ||
    !Object.hasOwn(req.body, "category")
  ) {
    res
      .status(400)
      .send(
        "Make sure to include both category and allotment on the request body"
      )
    return
  }
  if (
    !isNaN(parseFloat(req.body.category)) ||
    isFinite(req.body.category) ||
    isNaN(parseFloat(req.body.allotment)) ||
    !isFinite(req.body.allotment)
  ) {
    res
      .status(400)
      .send("Make sure that category is a string and allotment is a number")
    return
  }
  next()
}

async function createEnvelope(req, res, next) {
  const envelope = await addEnvelopeToDatabase(req.body)
  if (envelope) {
    res.status(201).send(JSON.stringify(envelope))
    return
  }

  if (envelope === 0) {
    res
      .status(400)
      .send("Make sure that category is not a duplicate of existing data")
    return
  }
  res.status(400).send("Make sure that the request body is valid")
  return
}

async function updateEnvelope(req, res, next) {
  req.body.id = req.envelopeId
  const envelope = await updateEnvelopeInDatabase(req.body)
  if (envelope) {
    res.send(JSON.stringify(envelope))
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
  checkBody,
  createEnvelope,
  updateEnvelope,
  deleteEnvelopes,
  deleteEnvelopeById,
}

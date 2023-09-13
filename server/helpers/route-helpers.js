const {
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  transferFunds,
  updateEnvelopeInDatabase,
  updateEnvelopesTotalAllotment,
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

async function envelopeTransfer(req, res, next) {
  const fromEnvelopeId = req.params.from
  const toEnvelopeId = req.params.to
  const funds = req.body.funds
  const inputs = [
    ["From envelope with id =", fromEnvelopeId],
    ["To envelope with id =", toEnvelopeId],
    ["Funds that are equal to", funds],
  ]
  for (let i = 0; i < inputs.length; i++) {
    if (isNaN(parseFloat(inputs[i][1])) || !isFinite(inputs[i][1])) {
      res
        .status(400)
        .send(`The ${inputs[i][0]} ${inputs[i][1]} must be a number.`)
      return
    }
  }
  const response = await transferFunds(fromEnvelopeId, toEnvelopeId, funds)
  if (typeof response[0] === "object" && typeof response[1] === "object") {
    res.send(JSON.stringify(response))
    return
  }

  if (response.substring(0, 10) === "Not found:") {
    console.log(response)
    res.status(404).send(response)
    return
  }
  res.status(400).send(response)
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

async function updateTotalAllotment(req, res, next) {
  let newTotalAllotment = req.body.totalAllotment
  if (isNaN(parseFloat(newTotalAllotment)) || !isFinite(newTotalAllotment)) {
    res
      .status(400)
      .send(
        `The new Total Allotment that is equal to ${newTotalAllotment} must be a number.`
      )
    return
  }
  newTotalAllotment = updateEnvelopesTotalAllotment(newTotalAllotment)
  res.send(JSON.stringify(newTotalAllotment))
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
  envelopeTransfer,
  updateEnvelope,
  updateTotalAllotment,
  deleteEnvelopes,
  deleteEnvelopeById,
}

const { Table } = require("./db-helpers")
const { isInvalidEnvelope } = require("../db/db")
const envelopes = new Table("envelopes")

async function handleEnvelopeId(req, res, next, id) {
  const idIsNotNumeric = envelopes.isNotNumeric(id, "envelopes's id")
  if (idIsNotNumeric) {
    res.status(400).send(idIsNotNumeric)
    return
  }
  id = Number(id)
  const getEnvelope = await envelopes.getRowById(id)
  if (getEnvelope.length > 0) {
    req.envelope = getEnvelope[0]
    req.envelopeId = id
    next()
    return
  }
  res.status(404).send("There is no envelope with that id")
}

function getTotalAllotment(req, res, next) {
  res.send(envelopes.totalAllotment.toString())
}

async function getEnvelopes(req, res, next) {
  res.send(JSON.stringify(await envelopes.getAllRows()))
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
  const envelope = req.body
  const envelopeIsInvalid = isInvalidEnvelope(
    envelope,
    envelopes.data,
    envelopes._totalAllotment
  )
  const categoryValueIsNotUnique = envelopes.columnNotUnique(
    "category",
    envelope
  )
  if (await envelopeIsInvalid) {
    res.status(400).send(await envelopeIsInvalid)
    return
  } else if (await categoryValueIsNotUnique) {
    res
      .status(400)
      .send("Make sure that category is not a duplicate of existing data")
    return
  }
  const createdEnvelope = await envelopes.insertRow(envelope)
  if (createdEnvelope.length > 0) {
    res.status(201).send(JSON.stringify(createdEnvelope[0]))
    return
  }
  res.status(400).send("Something went wrong with insert query")
}

async function envelopeTransfer(req, res, next) {
  const fromEnvelopeId = req.params.from
  const toEnvelopeId = req.params.to
  const funds = req.body.funds
  const inputs = [
    ["From envelope id that is equal to ", fromEnvelopeId],
    ["To envelope id that is equal to ", toEnvelopeId],
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
  let fromEnvelope = await envelopes.getRowById(fromEnvelopeId)
  let toEnvelope = await envelopes.getRowById(toEnvelopeId)
  if (fromEnvelope.length <= 0) {
    res
      .status(404)
      .send(
        `Not found: The From envelope with id = ${fromEnvelopeId} was not found`
      )
    return
  } else if (toEnvelope.length <= 0) {
    res
      .status(404)
      .send(
        `Not found: The To envelope with id = ${toEnvelopeId} was not found`
      )
    return
  }
  fromEnvelope = fromEnvelope[0]
  toEnvelope = toEnvelope[0]

  // note that when you subtract a numeric string and a number there is actual subtraction is done but when you add them it will result in concatenate of string
  fromEnvelope.allotment -= funds
  toEnvelope.allotment -= -funds
  if (fromEnvelope.allotment < 0) {
    res
      .status(400)
      .send(
        "Make sure that the funds transfered are equal or less than the allotment that the from envelope has"
      )
    return
  }
  fromEnvelope = await envelopes.updateRow(fromEnvelope)
  toEnvelope = await envelopes.updateRow(toEnvelope)
  if (fromEnvelope.length >= 0 && toEnvelope.length >= 0) {
    res.send(JSON.stringify([fromEnvelope[0], toEnvelope[0]]))
    return
  }
  res.status(400).send("While updating rows something when wrong")
}

async function updateEnvelope(req, res, next) {
  const envelope = req.envelope
  const newEnvelope = req.body
  newEnvelope.allotment -= envelope.allotment
  const newEnvelopeIsInvalid = await isInvalidEnvelope(
    newEnvelope,
    envelopes.data,
    envelopes._totalAllotment
  )
  if (newEnvelopeIsInvalid) {
    res.status(400).send(newEnvelopeIsInvalid)
  }
  newEnvelope.allotment -= -envelope.allotment
  const updatedEnvelope = await envelopes.updateRow(newEnvelope)
  if (updatedEnvelope.length > 0) {
    res.send(JSON.stringify(updatedEnvelope[0]))
    return
  }
  res.status(400).send("Something wen wrong with update envelope query")
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
  envelopes.totalAllotment = newTotalAllotment
  res.send(JSON.stringify(newTotalAllotment))
}

async function deleteEnvelopes(req, res, next) {
  const emptyTable = await envelopes.deleteAllRows()
  res.status(204).send(emptyTable)
}

async function deleteEnvelopeById(req, res, next) {
  const isDeleted = await envelopes.deleteRowById(req.envelopeId)
  if (isDeleted) {
    res.status(204).send()
    return
  }
  res.status(404).send()
}

module.exports = {
  envelopes,
  getTotalAllotment,
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

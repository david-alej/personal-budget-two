const db = require("../db/db")

function getAllEnvelopesFromDatabase() {
  return db.allEnvelopes.data
}

function getEnvelopeFromDatabaseById(id) {
  return db.allEnvelopes.data.find((element) => element.id === id)
}

function addEnvelopeToDatabase(instance) {
  const model = db.allEnvelopes
  if (model.isValid(instance)) {
    instance.id = `${model.nextId++}`
    model.allotmentRemaining -= instance.allotemnt
    model.data.push(instance)
    return model.data[model.data.length - 1]
  }
}

const updateEnvelopeInDatabase = (instance) => {
  const model = db.allEnvelopes
  const envelopeIndex = model.data.findIndex((element) => {
    return element.id === instance.id
  })
  if (envelopeIndex > -1) {
    model.allotmentRemaining += model.data[envelopeIndex]
    if (model.isValid(instance)) {
      model.data[envelopeIndex] = instance
      return model.data[envelopeIndex]
    }
  }
  return null
}

const deleteEnvelopeFromDatabasebyId = (id) => {
  const model = db.allEnvelopes
  let index = model.data.findIndex((element) => {
    return element.id === id
  })
  if (index !== -1) {
    model.allotmentRemaining += model.data[index].allotment
    model.data.splice(index, 1)
    return true
  }
  return false
}

const deleteAllEnvelopesFromDatabase = () => {
  const model = db.allEnvelopes
  model.data = []
  model.allotmentRemaining = model.totalAllotment
  return model.data
}

module.exports = {
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteEnvelopeFromDatabasebyId,
  deleteAllEnvelopesFromDatabase,
}

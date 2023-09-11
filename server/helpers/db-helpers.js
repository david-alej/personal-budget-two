const db = require("../db/db")

async function getAllEnvelopesFromDatabase() {
  const envelopesQuery = await db.allEnvelopes.data.query(
    "SELECT * FROM envelopes;"
  )
  return envelopesQuery.rows
}

async function getEnvelopeFromDatabaseById(id) {
  const envelopeQuery = await db.allEnvelopes.data.query(
    "SELECT * FROM envelopes WHERE id = $1",
    [id]
  )
  return envelopeQuery.rows
}

async function addEnvelopeToDatabase(instance) {
  const model = db.allEnvelopes
  if (model.isValid(instance)) {
    const insertEnvelopeQuery = await model.data.query(
      "INSERT INTO envelopes (category, allotment) VALUES ($1, $2) RETURNING *;",
      [instance.category, instance.allotment]
    )
    return insertEnvelopeQuery.rows
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

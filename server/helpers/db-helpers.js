const { db, seedData } = require("../db/db")

async function resetDatabase() {
  const pool = db.allEnvelopes.data
  await pool.query("DELETE FROM envelopes WHERE true;")
  await pool.query("ALTER SEQUENCE envelopes_id_seq RESTART WITH 1;")
  await seedData()
}

async function getAllEnvelopesFromDatabase() {
  const envelopes = await db.allEnvelopes.data.query("SELECT * FROM envelopes;")
  return envelopes.rows
}

async function getEnvelopeFromDatabaseById(id) {
  const envelopeQuery = await db.allEnvelopes.data.query(
    "SELECT * FROM envelopes WHERE id = $1::integer",
    [id]
  )
  return envelopeQuery.rows[0]
}

async function addEnvelopeToDatabase(instance) {
  const model = db.allEnvelopes
  const instanceIsInvalid = await model.isInvalid(instance)
  if (!instanceIsInvalid) {
    const allCategories = await model.data.query(
      "SELECT category FROM envelopes;"
    )
    const newCategoryInData = allCategories.rows.some((obj) => {
      if (obj.category === instance.category) return true
      return false
    })
    if (!newCategoryInData) {
      const insertEnvelopeQuery = await model.data.query(
        "INSERT INTO envelopes (category, allotment) VALUES ($1, $2) RETURNING *;",
        [instance.category, instance.allotment]
      )
      return insertEnvelopeQuery.rows[0]
    }
    return "Make sure that category is not a duplicate of existing data"
  }
  return instanceIsInvalid
}

const updateEnvelopeInDatabase = async (instance) => {
  const model = db.allEnvelopes
  const envelopeAllotmentBeforeUpdate = await model.data.query(
    "SELECT allotment FROM envelopes WHERE id = $1;",
    [instance.id]
  )
  if (envelopeAllotmentBeforeUpdate.rows.length) {
    const adjustedEnvelope = {
      id: instance.id,
      category: instance.category,
      allotment:
        instance.allotment - envelopeAllotmentBeforeUpdate.rows[0].allotment,
    }
    const adjustedEnvelopeIsInvalid = await model.isInvalid(adjustedEnvelope)
    if (!adjustedEnvelopeIsInvalid) {
      const update = await model.data.query(
        "UPDATE envelopes SET category = $2, allotment = $3 WHERE id = $1 RETURNING *;",
        [instance.id, instance.category, instance.allotment]
      )
      return update.rows[0]
    }
    return adjustedEnvelopeIsInvalid
  }
  return "Make sure that the request body is valid"
}

const deleteAllEnvelopesFromDatabase = async () => {
  const model = db.allEnvelopes
  const allDeleted = await model.data.query("DELETE FROM envelopes WHERE true;")
  const data = model.data.query("SELECT * FROM envelopes;")
  return await data.rows
}

const deleteEnvelopeFromDatabasebyId = async (id) => {
  const model = db.allEnvelopes
  const envelopeDeleted = await model.data.query(
    "DELETE FROM envelopes WHERE id = $1 RETURNING *;",
    [id]
  )
  if (envelopeDeleted.rows) {
    return true
  }
  return false
}

module.exports = {
  resetDatabase,
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteEnvelopeFromDatabasebyId,
  deleteAllEnvelopesFromDatabase,
}

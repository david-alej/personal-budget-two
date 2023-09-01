let envelopeIdCounter = 0

const envelopeFactory = (category, money) => {
  return {
    id: `${envelopeIdCounter++}`,
    category,
    allotment,
  }
}

let totalAllotment = 350

function isValidEnvelope(instance) {
  instance.id = instance.id || ""
  instance.category = instance.category || ""
  instance.allotment = instance.allotment || ""
  if (
    typeof instance.id !== "string" ||
    typeof instance.category !== "string" ||
    typeof instance.allotment !== "string"
  ) {
    throw new Error("Envelope's id, category, and allotment must be strings")
  }
  if (!isNaN(parseFloat(instance.allotment)) && isFinite(instance.allotment)) {
    instance.allotment = Number(instance.allotment)
  } else {
    throw new Error("Minion's salary must be a number.")
  }
  return true
}

const allEnvelopes = [
  envelopeFactory("groceries", 150),
  envelopeFactory("orderingOut", 50),
  envelopeFactory("savings", 125),
]

const db = {
  allEnvelopes: {
    data: allEnvelopes,
    nextId: envelopeIdCounter,
    isValid: isValidEnvelope,
    totalAllotment: totalAllotment,
  },
}

function getAllEnvelopesFromDatabase() {
  return db.allEnvelopes.data
}

function getEnvelopeFromDatabaseById(id) {
  return db.allEnvelopes.data.find((element) => element.id === id)
}

function addEnvelopeToDatabase(instance) {
  if (db.allEnvelopes.isValid(instance)) {
    instance.id = `${envelopeIdCounter++}`
    db.allEnvelopes.data.push(instance)
    return db.allEnvelopes.data[db.allEnvelopes.data.length - 1]
  }
}

const updateEnvelopeInDatabase = (instance) => {
  const model = db.allEnvelopes
  const instanceIndex = model.data.findIndex((element) => {
    return element.id === instance.id
  })
  if (instanceIndex > -1 && model.isValid(instance)) {
    model.data[instanceIndex] = instance
    return model.data[instanceIndex]
  } else {
    return null
  }
}

const deleteEnvelopeFromDatabasebyId = (id) => {
  const model = db.allEnvelopes
  let index = model.data.findIndex((element) => {
    return element.id === id
  })
  if (index !== -1) {
    model.data.splice(index, 1)
    return true
  }
  return false
}

const deleteAllEnvelopesFromDatabase = () => {
  const model = db.allEnvelopes
  model.data = []
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

let envelopeIdCounter = 0

const envelopeFactory = (category, money) => {
  db.allEnvelopes.allotmentRemaining -= money
  return {
    id: `${envelopeIdCounter++}`,
    category,
    allotment,
  }
}

let totalAllotment = 500

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
  if (db.allEnvelopes.allotmentRemaining - instance.allotment < 0) {
    throw new Error(
      `Envelope' allotment is too much by ${
        instance.allotemnt - db.allEnvelopes.allotmentRemaining
      }`
    )
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
    allotmentRemaining: totalAllotment,
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
  const model = db.allEnvelopes
  if (model.isValid(instance)) {
    instance.id = `${envelopeIdCounter++}`
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

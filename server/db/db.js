const Pool = require("pg").Pool
const pool = new Pool({
  user: "budgeteer",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432,
})

// -------------------------------------------------------------

let envelopeIdCounter = 0
let totalAllotment = 500

function isValidEnvelope(instance) {
  instance.id = instance.id || ""
  instance.category = instance.category || ""
  instance.allotment = instance.allotment || ""
  if (
    typeof instance.id !== "string" ||
    typeof instance.category !== "string" ||
    typeof instance.allotment !== "number"
  ) {
    throw new Error(
      "Envelope's id and category must be strings and allotment must be a number"
    )
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

const db = {
  allEnvelopes: {
    data: [],
    nextId: envelopeIdCounter,
    isValid: isValidEnvelope,
    allotmentRemaining: totalAllotment,
    totalAllotment: totalAllotment,
  },
}

// Seeding db data
const envelopeFactory = (category, allotment) => {
  db.allEnvelopes.allotmentRemaining -= allotment
  return {
    id: `${db.allEnvelopes.nextId++}`,
    category,
    allotment,
  }
}

function seedData() {
  const model = db.allEnvelopes
  model.data.push(envelopeFactory("groceries", 150))
  model.data.push(envelopeFactory("orderingOut", 50))
  model.data.push(envelopeFactory("savings", 125))
}

seedData()

module.exports = db

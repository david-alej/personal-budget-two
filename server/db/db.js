const Pool = require("pg").Pool
const pool = new Pool({
  user: "budgeteer",
  host: "localhost",
  database: "budget_api",
  password: "password",
  port: 5432,
})

let totalAllotment = 500

async function isValidEnvelope(instance) {
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

  const allotmentUsedQuery = await pool.query(
    "SELECT sum(allotment) FROM  envelopes;"
  )
  const allotmentUsed = allotmentUsedQuery.rows
  const allotmentRemaining = totalAllotment - allotmentUsed - instance.allotment
  if (allotmentRemaining < 0) {
    throw new Error(
      `Envelope' allotment is too much by ${-1 * allotmentRemaining} $`
    )
  }
  return true
}

const db = {
  allEnvelopes: {
    data: pool,
    isValid: isValidEnvelope,
  },
}

// Seeding data into envelopes table
const envelopeFactory = async (category, allotment) => {
  try {
    db.allEnvelopes.isValid({ category, allotment })
    const res = await pool.query(
      "INSERT INTO envelopes (category, allotment) VALUES ($1, $2)",
      [category, allotment]
    )
  } catch (err) {
    console.error(err)
  }
}

function seedData() {
  envelopeFactory("groceries", 150)
  envelopeFactory("orderingOut", 50)
  envelopeFactory("savings", 125)
}

seedData()

module.exports = db

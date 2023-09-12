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
  if (!isNaN(parseFloat(instance.allotment)) && isFinite(instance.allotment)) {
    instance.allotment = Number(instance.allotment)
  } else {
    throw new Error("Minion's salary must be a number.")
  }
  if (
    typeof instance.id !== "string" ||
    typeof instance.category !== "string" ||
    typeof instance.allotment !== "number"
  ) {
    throw new Error(
      "Envelope's id and category must be strings and allotment must be a number"
    )
  }

  const allotmentUsedQuery = await pool.query(
    "SELECT sum(allotment) FROM  envelopes;"
  )
  const allotmentUsed = allotmentUsedQuery.rows[0]
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
    totalAllotment,
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

async function seedData() {
  await envelopeFactory("groceries", 150)
  await envelopeFactory("orderingOut", 50)
  await envelopeFactory("savings", 125)
}

const dataExists = async () => {
  const query = await pool.query("SELECT * FROM envelopes;")
  return query.rows.length !== 0
}

if (!dataExists) {
  seedData()
}

module.exports = { db, seedData }

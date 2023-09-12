const Pool = require("pg").Pool
const pool = new Pool({
  user: "budgeteer",
  host: "localhost",
  database: "budget_api",
  password: "password",
  port: 5432,
})

let totalAllotment = 500

async function isInvalidEnvelope(instance) {
  if (
    !Object.hasOwn(instance, "allotment") ||
    !Object.hasOwn(instance, "category")
  ) {
    return "Make sure to include both category and allotment on the request body"
  }
  if (
    !isNaN(parseFloat(instance.category)) ||
    isFinite(instance.category) ||
    isNaN(parseFloat(instance.allotment)) ||
    !isFinite(instance.allotment)
  ) {
    return "Make sure that category is a string and allotment is a number"
  }
  instance.allotment = Number(instance.allotment)
  const allotmentUsedQuery = await pool.query(
    "SELECT sum(allotment) FROM  envelopes;"
  )
  const allotmentUsed = Number(allotmentUsedQuery.rows[0].sum)
  const allotmentRemaining = totalAllotment - allotmentUsed - instance.allotment
  if (allotmentRemaining < 0) {
    return "With new allotment, the total used allotment has exceeded the total allotment limit, make new allotement less"
  }
  return false
}

const db = {
  allEnvelopes: {
    data: pool,
    isInvalid: isInvalidEnvelope,
    totalAllotment,
  },
}

// Seeding data into envelopes table
const envelopeFactory = async (category, allotment) => {
  await db.allEnvelopes.isInvalid({ category, allotment })
  const res = await pool.query(
    "INSERT INTO envelopes (category, allotment) VALUES ($1, $2)",
    [category, allotment]
  )
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

const Pool = require("pg").Pool
const pool = new Pool({
  user: "budgeteer",
  host: "localhost",
  database: "budget_api",
  password: "password",
  port: 5432,
  typeCast: function (field, next) {
    if (field.type == "NEWDECIMAL") {
      var value = field.string()
      return value === null ? null : Number(value)
    }
    return next()
  },
})
const types = require("pg").types
types.setTypeParser(1700, function (val) {
  return parseFloat(val)
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

async function isInvalidTransaction(instance) {
  if (
    !Object.hasOwn(instance, "date") ||
    !Object.hasOwn(instance, "payment") ||
    !Object.hasOwn(instance, "reciept") ||
    !Object.hasOwn(instance, "envelope_id")
  ) {
    return "Make sure to include both category and allotment on the request body"
  }
  if (
    !isNaN(parseFloat(instance.date)) ||
    isFinite(instance.date) ||
    isNaN(parseFloat(instance.payment)) ||
    !isFinite(instance.payment) ||
    !isNaN(parseFloat(instance.reciept)) ||
    isFinite(instance.reciept) ||
    isNaN(parseFloat(instance.envelope_id)) ||
    !isFinite(instance.envelope_id)
  ) {
    return "Make sure that the date and receipt are strings, and payment and envelope_id are numbers"
  }
  instance.payment = Number(instance.payment)
  instance.envelope_id = Number(instance.envelope_id)
  const allotmentUsedQuery = await pool.query(
    "SELECT allotment FROM  envelopes WHERE id = $1;",
    [instance.envelope_id]
  )
  if (!allotmentUsedQuery) {
    return `There is no envelope by that envelope_id = ${instance.envelope_id}`
  }
  const allotmentUsed = Number(allotmentUsedQuery.rows[0].sum)
  const allotmentAfterTransaction = allotmentUsed - instance.payment
  if (allotmentAfterTransaction < 0) {
    return "With new allotment, the used allotment in the envelope has exceeded the allotment limit, make payment less"
  }
  return false
}

const db = {
  allEnvelopes: {
    data: pool,
    isInvalid: isInvalidEnvelope,
    totalAllotment,
  },

  allTransactions: {
    data: pool,
    isInvalid: isInvalidTransaction,
  },
}

// Seeding data into envelopes table
const envelopeFactory = async (category, allotment) => {
  await db.allEnvelopes.isInvalid({ category, allotment })
  const res = await pool.query(
    "INSERT INTO envelopes (category, allotment) VALUES ($1, $2);",
    [category, allotment]
  )
}

const transactionFactory = async (date, payment, shop, envelope_id) => {
  await db.allTransactions.isInvalid()
  const res = await pool.query(
    "INSERT INTO transactions (date, paymnet, shop, envelope_id) VALUES ($1, $2, $3, $4);",
    [date, payment, shop, envelope_id]
  )
  //need to add where the envelope allotment is adjusted to be subtracted by the payment
}

async function seedData() {
  await envelopeFactory("groceries", 150)
  await envelopeFactory("orderingOut", 50)
  await envelopeFactory("savings", 125)
}

const dataExists = async () => {
  const query = await pool.query("SELECT * FROM envelopes ORDER BY id ASC;")
  return query.rows.length !== 0
}

if (!dataExists) {
  seedData()
}

function findTablebyName(modelType) {
  switch (modelType) {
    case "envelopes":
      return db.allEnvelopes
    case "transactions":
      return db.allTransactions
    default:
      return null
  }
}

module.exports = { db, seedData, findTablebyName }

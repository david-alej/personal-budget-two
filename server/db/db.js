const Pool = require("pg").Pool
const _pool = new Pool({
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

let _unusedAllotment = 500

async function isInvalidEnvelope(
  instance,
  pool = _pool,
  unusedAllotment = _unusedAllotment
) {
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
  const allotmentRemaining =
    unusedAllotment - allotmentUsed - instance.allotment
  if (allotmentRemaining < 0) {
    return `With new allotment, the total available allotment of all the envelopes has exceeded the unsued allotment limit by ${
      -1 * allotmentRemaining
    }, make new allotement less`
  }
  return false
}

async function isInvalidTransaction(instance) {
  if (
    !Object.hasOwn(instance, "date") ||
    !Object.hasOwn(instance, "payment") ||
    !Object.hasOwn(instance, "shop") ||
    !Object.hasOwn(instance, "envelope_id")
  ) {
    return "Make sure to include date, payment, shop, and envelope_id on the request body"
  } // problem is if statement below
  if (
    typeof instance.date !== "string" ||
    isNaN(parseFloat(instance.payment)) ||
    !isFinite(instance.payment) ||
    !isNaN(parseFloat(instance.shop)) ||
    isFinite(instance.shop) ||
    isNaN(parseFloat(instance.envelope_id)) ||
    !isFinite(instance.envelope_id)
  ) {
    return "Make sure that the date is a string, shop is a strings, and payment and envelope_id are numbers"
  }
  instance.payment = Number(instance.payment)
  instance.envelope_id = Number(instance.envelope_id)
  const allotmentUsedQuery = await _pool.query(
    "SELECT allotment FROM  envelopes WHERE id = $1;",
    [instance.envelope_id]
  )
  if (allotmentUsedQuery.rows.length <= 0) {
    return `There is no envelope by that envelope_id = ${instance.envelope_id}`
  }
  const allotmentUsed = Number(allotmentUsedQuery.rows[0].allotment)
  const allotmentAfterTransaction = allotmentUsed - instance.payment
  if (allotmentAfterTransaction < 0) {
    return "The new payment exceeds the envelope's available allotment, make payment less"
  }
  return false
}

const db = {
  allEnvelopes: {
    data: _pool,
    isInvalid: isInvalidEnvelope,
    unusedAllotment: _unusedAllotment,
  },

  allTransactions: {
    data: _pool,
    isInvalid: isInvalidTransaction,
  },
}

// Seeding data into envelopes table
const envelopeFactory = async (category, allotment) => {
  await db.allEnvelopes.isInvalid({ category, allotment })
  const res = await _pool.query(
    "INSERT INTO envelopes (category, allotment) VALUES ($1, $2);",
    [category, allotment]
  )
}

const transactionFactory = async (date, payment, shop, envelope_id) => {
  const transaction = {
    date,
    payment,
    shop,
    envelope_id,
  }
  const transactionIsInvalid = await db.allTransactions.isInvalid(transaction)
  if (transactionIsInvalid) {
    throw new Error(transactionIsInvalid)
  }
  const updateEnvelopeAllotmentQuery = await _pool.query(
    "UPDATE envelopes SET allotment = allotment - $2 WHERE id = $1 RETURNING *;",
    [envelope_id, payment]
  )
  db.allEnvelopes.unusedAllotment -= payment
  const insertTransactionQuery = await _pool.query(
    "INSERT INTO transactions (date, payment, shop, envelope_id) VALUES ($1, $2, $3, $4);",
    Object.values(transaction)
  )
  return payment
}

async function seedData(transactions = false) {
  await envelopeFactory("groceries", 150)
  await envelopeFactory("orderingOut", 50)
  await envelopeFactory("savings", 125)
  if (transactions) {
    const allotmentSpentOne = await transactionFactory(
      new Date("Sep 12 2023").toString(),
      50,
      "Wingstop",
      2
    )
    const allotmentSpentTwo = await transactionFactory(
      new Date("Sep 18 2023").toString(),
      70,
      "Walmart",
      1
    )
    return allotmentSpentOne + allotmentSpentTwo
  }
}

async function resetDatabase(
  transactions = true,
  seed = true,
  seedTransactions = true
) {
  const _pool = db.allEnvelopes.data
  if (transactions) {
    await _pool.query("DELETE FROM transactions WHERE true;")
    await _pool.query("ALTER SEQUENCE transactions_id_seq RESTART WITH 1;")
  }
  await _pool.query("DELETE FROM envelopes WHERE true;")
  await _pool.query("ALTER SEQUENCE envelopes_id_seq RESTART WITH 1;")
  if (seed) return await seedData(seedTransactions)
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

module.exports = {
  db,
  seedData,
  resetDatabase,
  findTablebyName,
  isInvalidEnvelope,
  isInvalidTransaction,
}

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

async function getUnusedAllotment() {
  const unusedAllotmentQuery = await pool.query(
    "SELECT value FROM varaibles WHERE name = $1;",
    ["unusedAllotment"]
  )
  return unusedAllotmentQuery.rows
}

async function isInvalidEnvelope(instance) {
  if (
    !Object.hasOwn(instance, "allotment") ||
    !Object.hasOwn(instance, "category")
  ) {
    return "Make sure to include both category and allotment on the request body."
  }
  if (
    !isNaN(parseFloat(instance.category)) ||
    isFinite(instance.category) ||
    isNaN(parseFloat(instance.allotment)) ||
    !isFinite(instance.allotment)
  ) {
    return "Make sure that category is a string and allotment is a number."
  }
  instance.allotment = Number(instance.allotment)
  const allotmentUsedQuery = await pool.query(
    "SELECT sum(allotment) FROM  envelopes;"
  )
  const allotmentUsed = Number(allotmentUsedQuery.rows[0].sum)
  const unusedAllotmentQuery = await getUnusedAllotment()
  const allotmentRemaining =
    unusedAllotmentQuery - allotmentUsed - instance.allotment
  if (allotmentRemaining < 0) {
    return `With new allotment, the total available allotment of all the envelopes has exceeded the unsued allotment limit by ${
      -1 * allotmentRemaining
    } $, make new allotement less.`
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
    return "Make sure to include date, payment, shop, and envelope_id on the request body."
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
    return "Make sure that the date is a string, shop is a strings, and payment and envelope_id are numbers."
  }
  instance.payment = Number(instance.payment)
  instance.envelope_id = Number(instance.envelope_id)
  const allotmentUsedQuery = await pool.query(
    "SELECT allotment FROM  envelopes WHERE id = $1;",
    [instance.envelope_id]
  )
  if (allotmentUsedQuery.rows.length <= 0) {
    return `There is no envelope by that envelope_id = ${instance.envelope_id}.`
  }
  const allotmentUsed = Number(allotmentUsedQuery.rows[0].allotment)
  const allotmentAfterTransaction = allotmentUsed - instance.payment
  if (allotmentAfterTransaction < 0) {
    return "The new payment exceeds the envelope's available allotment, make payment less."
  }
  return false
}

module.exports = {
  pool,
  getUnusedAllotment,
  isInvalidEnvelope,
  isInvalidTransaction,
}

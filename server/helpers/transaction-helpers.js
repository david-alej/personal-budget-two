const { Table } = require("./db-helpers")
const { isInvalidTransaction } = require("../db/db")
const { envelopes } = require("./envelope-helpers")

const transactions = new Table("transactions")

async function handleTransactionId(req, res, next, id) {
  const idIsNotNumeric = transactions.isNotNumeric(id, "id")
  if (idIsNotNumeric) {
    res.status(400).send(idIsNotNumeric)
    return
  }
  id = Number(id)
  const getTransaction = await transactions.getRowById(id)
  if (getTransaction.length > 0) {
    req.transaction = getTransaction[0]
    req.transactionId = id
    next()
    return
  }
  res.status(404).send("There is no transaction with that id")
}

async function getTransactions(req, res, next) {
  res.send(JSON.stringify(await transactions.getAllRows()))
}

function getTransactionById(req, res, next) {
  const transaction = req.transaction
  if (transaction) {
    res.send(JSON.stringify(transaction))
    return
  }
  res.status(404).send("Not found")
}

async function createTransaction(req, res, next) {
  const transaction = req.body
  console.log(transaction.date)
  const transactionIsInvalid = await isInvalidTransaction(transaction)
  console.log(transactionIsInvalid)
  const dateValueIsNotUnique = await transactions.columnNotUnique(
    "date",
    envelope
  )
  if (transactionIsInvalid) {
    console.log("yo")
    res.status(400).send(transactionIsInvalid)
    return
  } else if (dateValueIsNotUnique) {
    res
      .status(400)
      .send("Make sure that date is not a duplicate of existing data")
    return
  }
  const updateEnvelopeAllotmentQuery = await transactions.data.query(
    "UPDATE envelopes SET allotment = allotment - $2 WHERE id = $1 RETURNING *;",
    [envelope_id, payment]
  )
  if (updateEnvelopeAllotmentQuery.length <= 0) {
    res.status(400).send("Update to envelopes was not possible")
    return
  }
  envelopes.totalAllotment -= payment
  console.log(envelopes.totalAllotment)
  const createdTransaction = await transactions.insertRow(transaction)
  if (createdTransaction.length > 0) {
    res.status(201).send(JSON.stringify(createdTransaction[0]))
    return
  }
  res.status(400).send("Something went wrong with insert query")
}

module.exports = {
  handleTransactionId,
  getTransactions,
  getTransactionById,
  createTransaction,
}

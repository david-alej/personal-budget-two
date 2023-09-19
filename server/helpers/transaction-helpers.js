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
  const transactionIsInvalid = await isInvalidTransaction(transaction)
  const dateValueIsNotUnique = await transactions.columnNotUnique(
    "date",
    transaction
  )
  if (transactionIsInvalid) {
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
    [transaction.envelope_id, transaction.payment]
  )
  if (updateEnvelopeAllotmentQuery.rows.length <= 0) {
    res.status(400).send("Update to envelopes was not possible")
    return
  }
  envelopes.totalAllotment -= transaction.payment
  const createdTransaction = await transactions.insertRow(transaction)
  if (createdTransaction.length > 0) {
    res.status(201).send(JSON.stringify(createdTransaction[0]))
    return
  }
  res.status(400).send("Something went wrong with insert query")
}

async function updateTransaction(req, res, next) {
  const transaction = req.transaction
  const newTransaction = req.body
  const paymentDifference = newTransaction.payment - transaction.payment
  newTransaction.payment = paymentDifference
  const newTransactionIsInvalid = await isInvalidTransaction(newTransaction)
  if (newTransactionIsInvalid) {
    res.status(400).send(newTransactionIsInvalid)
  }
  newTransaction.payment -= -transaction.payment
  const restoreEnvelopeAllotmentQuery = await transactions.data.query(
    "UPDATE envelopes SET allotment = allotment + $2 WHERE id = $1 RETURNING *;",
    [transaction.envelope_id, transaction.payment]
  )
  const updateEnvelopeAllotmentQuery = await transactions.data.query(
    "UPDATE envelopes SET allotment = allotment - $2 WHERE id = $1 RETURNING *;",
    [newTransaction.envelope_id, newTransaction.payment]
  )
  if (restoreEnvelopeAllotmentQuery.rows.length <= 0) {
    res
      .status(400)
      .send(
        `Restoring alltoment to envelope with previous envelope_id = ${transaction.payment} was not possible`
      )
    return
  } else if (updateEnvelopeAllotmentQuery.rows.length <= 0) {
    res
      .status(400)
      .send(
        `Updating alltoment to envelope with new envelope_id = ${newTransaction.payment} was not possible`
      )
    return
  }
  envelopes.totalAllotment -= paymentDifference
  const updatedTransaction = await transactions.updateRow(newTransaction)
  if (updatedTransaction.length > 0) {
    res.send(JSON.stringify(updatedTransaction[0]))
    return
  }
  res.status(400).send("Something when wrong with transaction query")
}

module.exports = {
  handleTransactionId,
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
}

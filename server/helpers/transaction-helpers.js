const { Table } = require("./db-helpers")
const { isInvalidTransaction } = require("../db/db")

const transactions = new Table("transactions")

// Function right below comment is a helper to delete trasaction-helpers
async function handleTransactionDeletion(transaction, preErrorMessage = "") {
  const restoreEnvelopeAllotmentQuery = await transactions.data.query(
    "UPDATE envelopes SET allotment = allotment + $2 WHERE ID = $1 RETURNING *;",
    [transaction.envelope_id, transaction.payment]
  )
  if (restoreEnvelopeAllotmentQuery.length === 0) {
    return preErrorMessage + "Restoring allotment query did not work."
  }
  const updatedUnusedAllotment = await transactions.updateUnusedAllotment(
    transaction.payment,
    "-"
  )
  if (updatedUnusedAllotment.length === 0) {
    return preErrorMessage + "Updating unused allotment query was unsuccesful"
  }
  const isDeleted = await transactions.deleteRowById(transaction.id)
  if (isDeleted.length === 0) {
    return preErrorMessage + "Delete query was not succesfull."
  }
}

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
  res.status(404).send("There is no transaction with that id.")
}

async function getUsedAllotment(req, res, next) {
  const usedAllotmentQuery = await transactions.data.query(
    "SELECT SUM(payment) FROM transactions;"
  )
  console.log(usedAllotmentQuery.rows)
  if (usedAllotmentQuery.rows.length === 0) {
    res.status(400).send("Getting unused allotment query did not work.")
  }
  res.status(400).send(JSON.stringify(usedAllotmentQuery.rows[0].sum))
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
  res.status(404).send("Not found.")
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
      .send("Make sure that date is not a duplicate of existing data.")
    return
  }
  const updateEnvelopeAllotmentQuery = await transactions.data.query(
    "UPDATE envelopes SET allotment = allotment - $2 WHERE id = $1 RETURNING *;",
    [transaction.envelope_id, transaction.payment]
  )
  if (updateEnvelopeAllotmentQuery.rows.length <= 0) {
    res.status(400).send("Update to envelopes was not possible.")
    return
  }
  const updatedUnusedAllotment = await transactions.updateUnusedAllotment(
    transaction.payment,
    "-"
  )
  if (updatedUnusedAllotment.length === 0) {
    res
      .status(400)
      .send(
        preErrorMessage +
          "Something went wrong with updating unused allotment query"
      )
  }
  const createdTransaction = await transactions.insertRow(transaction)
  if (createdTransaction.length > 0) {
    res.status(201).send(JSON.stringify(createdTransaction[0]))
    return
  }
  res.status(400).send("Something went wrong with insert query.")
}

async function seedTransactions(req, res, next) {
  const seededTransactions = [
    {
      id: 1,
      date: "Tue Sep 12 2023 00:00:00 GMT-0500 (Central Daylight Time)",
      envelope_id: 2,
      payment: 50,
      shop: "Wingstop",
    },
    {
      id: 2,
      date: "Mon Sep 18 2023 00:00:00 GMT-0500 (Central Daylight Time)",
      envelope_id: 1,
      payment: 70,
      shop: "Walmart",
    },
  ]
  const results = []
  for (let i = 0; i < seededTransactions.length; i++) {
    const preMessage = `Number ${i + 1}: `
    const transaction = seededTransactions[i]
    const transactionIsInvalid = await isInvalidTransaction(transaction)
    const dateValueIsNotUnique = await transactions.columnNotUnique(
      "date",
      transaction
    )
    if (transactionIsInvalid) {
      res.status(400).send(preMessage + transactionIsInvalid)
      return
    } else if (dateValueIsNotUnique) {
      res
        .status(400)
        .send(
          preMessage +
            "Make sure that date is not a duplicate of existing data."
        )
      return
    }
    const updateEnvelopeAllotmentQuery = await transactions.data.query(
      "UPDATE envelopes SET allotment = allotment - $2 WHERE id = $1 RETURNING *;",
      [transaction.envelope_id, transaction.payment]
    )
    if (updateEnvelopeAllotmentQuery.rows.length <= 0) {
      res.status(400).send(preMessage + "Update to envelopes was not possible.")
      return
    }
    const updatedUnusedAllotment = await transactions.updateUnusedAllotment(
      transaction.payment,
      "-"
    )
    if (updatedUnusedAllotment.length === 0) {
      res
        .status(400)
        .send(
          preErrorMessage +
            "Something went wrong with updating unused allotment query"
        )
    }
    const createdTransaction = await transactions.insertRow(transaction)
    if (createdTransaction.length === 0) {
      res
        .status(400)
        .send(preMessage + "Something went wrong with insert query.")
      return
    }
    results.push(createdTransaction[0])
  }
  res.status(201).send(JSON.stringify(results))
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
        `Restoring alltoment to envelope with previous envelope_id = ${transaction.payment} was not possible.`
      )
    return
  } else if (updateEnvelopeAllotmentQuery.rows.length <= 0) {
    res
      .status(400)
      .send(
        `Updating alltoment to envelope with new envelope_id = ${newTransaction.payment} was not possible.`
      )
    return
  }
  const updatedUnusedAllotment = await transactions.updateUnusedAllotment(
    paymentDifference,
    "-"
  )
  if (updatedUnusedAllotment.length === 0) {
    res
      .status(400)
      .send(
        preErrorMessage +
          "Something went wrong with updating unused allotment query"
      )
  }
  const updatedTransaction = await transactions.updateRow(newTransaction)
  if (updatedTransaction.length > 0) {
    res.send(JSON.stringify(updatedTransaction[0]))
    return
  }
  res.status(400).send("Something when wrong with transaction query.")
}

async function deleteTransactions(req, res, next) {
  const transactionsTable = await transactions.getAllRows()
  if (transactionsTable.length > 0) {
    for (let i = 0; i < transactionsTable.length; i++) {
      const transaction = transactionsTable[i]
      const preErrorMessage = `Transaction with id = ${i + 1}: `
      const isDeleted = await handleTransactionDeletion(
        transaction,
        preErrorMessage
      )
      if (typeof isDeleted === "string") {
        res.status(400).send(isDeleted)
        return
      }
    }
  }

  const emptyTable = await transactions.getAllRows()
  if (emptyTable.length !== 0) {
    res.status(400).send("Delete all transactions iteratively did not work.")
    return
  }
  await transactions.data.query(
    "ALTER SEQUENCE transactions_id_seq RESTART WITH 1;"
  )
  res.status(204).send()
}

async function deleteTransactionById(req, res, next) {
  const transaction = await transactions.getRowById(req.transactionId)
  const isDeleted = await handleTransactionDeletion(transaction[0])
  if (typeof isDeleted === "string") {
    res.status(400).send(isDeleted)
  }
  res.status(204).send()
}

module.exports = {
  transactions,
  handleTransactionId,
  getUsedAllotment,
  getTransactions,
  getTransactionById,
  createTransaction,
  seedTransactions,
  updateTransaction,
  deleteTransactions,
  deleteTransactionById,
}

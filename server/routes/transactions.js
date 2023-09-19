const express = require("express")
const transactionsRouter = express.Router()

const {
  handleTransactionId,
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransactions,
  deleteTransactionById,
} = require("../helpers/transaction-helpers")

transactionsRouter.param("transactionId", handleTransactionId)

transactionsRouter.get("/", getTransactions)

transactionsRouter.get("/:transactionId", getTransactionById)

transactionsRouter.post("/", createTransaction)

transactionsRouter.put("/:transactionId", updateTransaction)

transactionsRouter.delete("/", deleteTransactions)

transactionsRouter.delete("/:transactionId", deleteTransactionById)

module.exports = transactionsRouter

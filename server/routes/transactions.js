const express = require("express")
const transactionsRouter = express.Router()

const {
  handleTransactionId,
  getUsedAllotment,
  getTransactions,
  getTransactionById,
  createTransaction,
  seedTransactions,
  updateTransaction,
  deleteTransactions,
  deleteTransactionById,
} = require("../helpers/transaction-helpers")

transactionsRouter.param("transactionId", handleTransactionId)

transactionsRouter.get("/used-allotment", getUsedAllotment)

transactionsRouter.get("/", getTransactions)

transactionsRouter.get("/:transactionId", getTransactionById)

transactionsRouter.post("/", createTransaction)

transactionsRouter.post("/seed-transactions", seedTransactions)

transactionsRouter.put("/:transactionId", updateTransaction)

transactionsRouter.delete("/", deleteTransactions)

transactionsRouter.delete("/:transactionId", deleteTransactionById)

module.exports = transactionsRouter

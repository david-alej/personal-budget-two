const express = require("express")
const envelopesRouter = express.Router()

const {
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteEnvelopeFromDatabasebyId,
  deleteAllEnvelopesFromDatabase,
} = require("../db/db")

envelopesRouter.get("/", (req, res, next) => {
  res.send()
})

module.exports = envelopesRouter

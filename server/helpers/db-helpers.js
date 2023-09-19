const { db, seedData, findTablebyName } = require("../db/db")

async function resetDatabase(transactions = false) {
  const pool = db.allEnvelopes.data
  if (transactions) {
    await pool.query("DELETE FROM transactions WHERE true;")
    await pool.query("ALTER SEQUENCE transactions_id_seq RESTART WITH 1;")
  }
  await pool.query("DELETE FROM envelopes WHERE true;")
  await pool.query("ALTER SEQUENCE envelopes_id_seq RESTART WITH 1;")

  await seedData(transactions)
}

class Table {
  constructor(modelType) {
    this.modelType = modelType
    this.model = findTablebyName(modelType)
    this.data = this.model.data
    this._totalAllotment = this.model.totalAllotment
  }

  async getAllRows() {
    const tableQuery = await this.data.query(`SELECT * FROM ${this.modelType};`)
    return tableQuery.rows
  }

  async getRowById(id) {
    const idRowQuery = await this.data.query(
      `SELECT * FROM ${this.modelType} WHERE id = $1;`,
      [id]
    )
    return idRowQuery.rows
  }

  async deleteAllRows() {
    const allDeleted = await this.data.query(
      `DELETE FROM ${this.modelType} WHERE true;`
    )
    const emptyTableQuery = await this.data.query(
      `SELECT * FROM ${this.modelType};`
    )
    return emptyTableQuery.rows
  }

  async deleteRowById(id) {
    const envelopeDeleted = await this.data.query(
      `DELETE FROM ${this.modelType} WHERE id = $1 RETURNING *;`,
      [id]
    )
    return envelopeDeleted.rows
  }

  async insertRow(instance) {
    const properties = Object.getOwnPropertyNames(instance)
    let queryInputSelectors = ""
    for (let i = 1; i < properties.length + 1; i++) {
      queryInputSelectors += "$" + `${i}` + ", "
    }
    const queryInputRefrences = "(" + properties.join(", ") + ")"
    queryInputSelectors = "(" + queryInputSelectors.slice(0, -2) + ")"
    const insertQuery = await this.data.query(
      `INSERT INTO ${this.modelType} ${queryInputRefrences} VALUES ${queryInputSelectors} RETURNING *;`,
      Object.values(instance)
    )
    return insertQuery.rows
  }

  async updateRow(instance) {
    const properties = Object.getOwnPropertyNames(instance)
    let updateQuerySelectors = ""
    for (let i = 2; i - 1 < properties.length; i++) {
      updateQuerySelectors += properties[i - 1] + " = " + "$" + `${i}, `
    }
    updateQuerySelectors = updateQuerySelectors.slice(0, -2) + " WHERE id = $1"
    const updateQuery = await this.data.query(
      `UPDATE ${this.modelType} SET ${updateQuerySelectors} RETURNING *;`,
      Object.values(instance)
    )
    return updateQuery.rows
  }

  isNotNumeric(number, nameOfNumber) {
    if (isNaN(parseFloat(number)) || !isFinite(number)) {
      return "Change " + nameOfNumber + " to be a number."
    }
    return false
  }

  async columnNotUnique(columnName, instance) {
    const uniqueColumn = await this.data.query(
      `SELECT ${columnName} FROM ${this.modelType};`
    )
    const uniquenessViolation = uniqueColumn.rows.some((obj) => {
      if (obj[columnName] === instance[columnName]) return true
      return false
    })
    return uniquenessViolation
  }

  set totalAllotment(newTotalAllotment) {
    this._totalAllotment = newTotalAllotment
    return
  }

  get totalAllotment() {
    return this._totalAllotment
  }
}

module.exports = { resetDatabase, Table }

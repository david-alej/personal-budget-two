const { pool } = require("../db/db")

class Table {
  constructor(modelType) {
    this.modelType = modelType
    this.data = pool
  }

  async getAllRows() {
    const tableQuery = await this.data.query(
      `SELECT * FROM ${this.modelType} ORDER BY id ASC;`
    )
    return tableQuery.rows
  }

  async getRowById(id) {
    const idRowQuery = await this.data.query(
      `SELECT * FROM ${this.modelType} WHERE id = $1;`,
      [id]
    )
    return idRowQuery.rows
  }

  async insertRow(instance) {
    const properties = Object.getOwnPropertyNames(instance)
    const values = Object.values(instance)
    const indexOfId = properties.indexOf("id")
    if (indexOfId >= 0) {
      properties.splice(indexOfId, 1)
      values.splice(indexOfId, 1)
    }

    let queryInputSelectors = ""
    for (let i = 1; i < properties.length + 1; i++) {
      queryInputSelectors += "$" + `${i}` + ", "
    }
    const queryInputRefrences = "(" + properties.join(", ") + ")"
    queryInputSelectors = "(" + queryInputSelectors.slice(0, -2) + ")"
    const insertQuery = await this.data.query(
      `INSERT INTO ${this.modelType} ${queryInputRefrences} VALUES ${queryInputSelectors} RETURNING *;`,
      values
    )
    return insertQuery.rows
  }

  async updateRow(instance) {
    const properties = Object.getOwnPropertyNames(instance)
    const values = Object.values(instance)
    const indexOfId = properties.indexOf("id")
    if (indexOfId >= 0) {
      values.unshift(values.splice(indexOfId, 1)[0])
      properties.splice(indexOfId, 1)
    }
    let updateQuerySelectors = ""
    for (let i = 2; i - 2 < properties.length; i++) {
      updateQuerySelectors += properties[i - 2] + " = " + "$" + `${i}, `
    }
    updateQuerySelectors = updateQuerySelectors.slice(0, -2) + " WHERE id = $1"
    const updateQuery = await this.data.query(
      `UPDATE ${this.modelType} SET ${updateQuerySelectors} RETURNING *;`,
      values
    )
    return updateQuery.rows
  }

  async updateUnusedAllotment(updatedAllotment, operation = "") {
    let queryOperation = ""
    if (operation == "+" || operation === "-") {
      queryOperation += "value " + operation
    }
    const unusedAllotmentExists = (await pool.query("SELECT * FROM variables;"))
      .rows.length
    if (unusedAllotmentExists) {
      const updateUnusedAllotmentQuery = await pool.query(
        `UPDATE variables SET value = ${queryOperation} $2 WHERE name = $1 RETURNING *;`,
        ["unusedAllotment", updatedAllotment]
      )
      return updateUnusedAllotmentQuery.rows
    }
    const createUnusedAllotmentQuery = await pool.query(
      "INSERT INTO variables VALUES ('unusedAllotment', $1)",
      [updatedAllotment]
    )

    return createUnusedAllotmentQuery.rows
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

  isNotNumeric(number, nameOfNumber) {
    if (isNaN(parseFloat(number)) || !isFinite(number)) {
      return (
        "Change the " +
        nameOfNumber +
        `, that is equal to ${number}, to be a number.`
      )
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
}

module.exports = { Table }

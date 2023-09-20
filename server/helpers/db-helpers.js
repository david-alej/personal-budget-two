const { findTablebyName } = require("../db/db")

class Table {
  constructor(modelType) {
    this.modelType = modelType
    this.model = findTablebyName(modelType)
    this.data = this.model.data
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
    const values = Object.values(instance)
    const indexOfId = properties.indexOf("id")

    values.unshift(values.splice(indexOfId, 1)[0])
    const removeId = properties.splice(indexOfId, 1)
    console.log(properties, values)

    let updateQuerySelectors = ""
    for (let i = 2; i - 2 < properties.length; i++) {
      updateQuerySelectors += properties[i - 2] + " = " + "$" + `${i}, `
    }
    updateQuerySelectors = updateQuerySelectors.slice(0, -2) + " WHERE id = $1"
    const updateQuery = await this.data.query(
      `UPDATE ${this.modelType} SET ${updateQuerySelectors} RETURNING *;`,
      Object.values(instance)
    )
    return updateQuery.rows
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
      return "Change " + nameOfNumber + " to be a number"
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

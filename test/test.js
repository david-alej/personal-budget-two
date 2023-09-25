const { assert } = require("chai")
const request = require("supertest")
const { describe } = require("mocha")

const app = require("../server")
const { Table } = require("../server/helpers/db-helpers")
const { envelopes } = require("../server/helpers/envelope-helpers")

const _envelopes = new Table("envelopes")
const ok = 200
const created = 201
const noContent = 204
const badRequest = 400
const notFound = 404

async function resetDatabase(
  deleteTransactions = true,
  seedDatabase = true,
  seedTransactions = true
) {
  if (deleteTransactions) {
    await request(app).delete("/api/transactions").send()
  }
  await request(app).delete("/api/envelopes").send()
  await request(app)
    .put("/api/envelopes/unused-allotment")
    .type("form")
    .send({ unusedAllotment: 500 })
  if (seedDatabase) {
    await request(app).post("/api/envelopes/seed-envelopes")
    if (seedTransactions) {
      await request(app).post("/api/transactions/seed-transactions")
    }
  }
}

// Database helpers
describe("Database helpers", () => {
  beforeEach(async () => {
    await resetDatabase(true, true, false)
  })
  describe("Get helpers", () => {
    it("getting all envelopes", async () => {
      const expected = [
        { id: 1, category: "groceries", allotment: 150 },
        { id: 2, category: "orderingOut", allotment: 50 },
        { id: 3, category: "savings", allotment: 125 },
      ]
      const result = await _envelopes.getAllRows()
      assert.deepEqual(result, expected)
    })

    it("getting envelope with id = 2", async () => {
      const expected = { id: 2, category: "orderingOut", allotment: 50 }
      const id = "2"
      const result = await _envelopes.getRowById(id)
      assert.deepEqual(result[0], expected)
    })
  })

  describe("POST helpers", () => {
    it("add games envelope with 70 dollars", async () => {
      const expected = { id: 4, category: "games", allotment: 70 }
      const envelope = { category: "games", allotment: 70 }
      const result = await _envelopes.insertRow(envelope)
      assert.deepEqual(result[0], expected)
    })
  })

  describe("PUT helpers", () => {
    it("update envelope with id = 3", async () => {
      const expected = { id: 3, category: "savings", allotment: 100 }
      const envelope = expected
      const result = await _envelopes.updateRow(envelope)
      assert.deepEqual(result[0], expected)
    })
  })

  describe("DELETE helpers", () => {
    it("delete all envelopes", async () => {
      const expected = []
      const result = _envelopes.deleteAllRows()
      assert.deepEqual(await result, expected)
    })

    it("delete an envelope with id = 2", async () => {
      const expected = { id: 2, category: "orderingOut", allotment: 50 }
      const id = 2
      const result = await _envelopes.deleteRowById(id)
      assert.deepEqual(result[0], expected)
    })
  })
})

// HTTP requests
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// envelopes tests
describe("/api/envelopes", () => {
  beforeEach(async () => {
    await resetDatabase(false, true, false)
  })

  describe("GET requests", () => {
    it("get all envelopes", async () => {
      const expected = [
        { id: 1, category: "groceries", allotment: 150 },
        { id: 2, category: "orderingOut", allotment: 50 },
        { id: 3, category: "savings", allotment: 125 },
      ]
      const response = await request(app).get("/api/envelopes")
      console.log(response.text)
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.equal(response.status, 200)
    })

    it("get envelope with id = 2", async () => {
      const expected = { id: 2, category: "orderingOut", allotment: 50 }
      const id = "2"
      const response = await request(app)
        .get("/api/envelopes/" + id)
        .send()
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.equal(response.status, 200)
    })

    it("get envelope with invalid id = 87", async () => {
      const expected = "There is no envelope with that id."
      const id = "87"
      const response = await request(app)
        .get("/api/envelopes/" + id)
        .send()
      assert(response.text, expected)
      assert.equal(response.status, notFound)
    })

    it("get envelope with invalid id = hi", async () => {
      const expected =
        "Change the envelopes's id, that is equal to hi, to be a number."
      const id = "hi"
      const response = await request(app)
        .get("/api/envelopes/" + id)
        .send()
      assert.strictEqual(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })

    it("get reserved allotment", async () => {
      const expected = 325
      const response = await request(app)
        .get("/api/envelopes/reserved-allotment")
        .send()
      assert.equal(response.text, expected)
      assert.strictEqual(response.status, ok)
    })

    it("get unreserved allotment", async () => {
      const expected = 175
      const response = await request(app)
        .get("/api/envelopes/unreserved-allotment")
        .send()
      assert.equal(response.text, expected)
      assert.strictEqual(response.status, ok)
    })

    it("get unused allotment", async () => {
      const expected = 500
      const response = await request(app)
        .get("/api/envelopes/unused-allotment")
        .send()
      assert.equal(response.text, expected)
      assert.strictEqual(response.status, ok)
    })

    it("get unused allotment while having used allotment", async () => {
      const expected = 380
      await request(app).post("/api/transactions/seed-transactions").send()
      const response = await request(app)
        .get("/api/envelopes/unused-allotment")
        .send()
      assert.equal(response.text, expected)
      assert.strictEqual(response.status, ok)
      await request(app).delete("/api/transactions").send()
    })

    it("get unused allotment while having used allotment", async () => {
      const expected = 500
      await request(app).post("/api/transactions/seed-transactions").send()
      const response = await request(app)
        .get("/api/envelopes/total-allotment")
        .send()
      assert.equal(Number(response.text), expected)
      assert.equal(response.status, ok)
      await request(app).delete("/api/transactions").send()
    })
  })

  describe("POST requests", () => {
    it("create an games envelope with 70 dollars", async () => {
      const expected = { category: "games", allotment: 70 }
      const envelope = expected
      const response = await request(app)
        .post("/api/envelopes")
        .type("form")
        .send(envelope)
      assert.include(JSON.parse(response.text), expected)
      assert.equal(response.status, created)
    })

    it("Invalid create request that has body missing one or both of category and allotment", async () => {
      const expected =
        "Make sure to include both category and allotment on the request body."
      const requestBody = { allotment: 50 }
      const response = await request(app)
        .post("/api/envelopes")
        .type("form")
        .send(requestBody)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("invalid create request that has body having allotment as a string", async () => {
      const expected =
        "Make sure that category is a string and allotment is a number."
      const requestBody = { category: "revnovations", allotment: "no" }
      const response = await request(app)
        .post("/api/envelopes")
        .type("form")
        .send(requestBody)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("invalid create request that has body having category as a number", async () => {
      const expected =
        "Make sure that category is a string and allotment is a number."
      const requestBody = { category: 5, allotment: 5 }
      const response = await request(app)
        .post("/api/envelopes")
        .type("form")
        .send(requestBody)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("invalid create request that has body violating the unique constraint on the table", async () => {
      const expected =
        "Make sure that category is not a duplicate of existing data."
      const requestBody = { category: "savings", allotment: 5 }
      const response = await request(app)
        .post("/api/envelopes")
        .type("form")
        .send(requestBody)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("transfer funds, 10 dollars, from savings to groceries", async () => {
      const expected = [
        { id: 3, category: "savings", allotment: 115 },
        { id: 1, category: "groceries", allotment: 160 },
      ]
      const transferFunds = { funds: 10 }
      const response = await request(app)
        .post("/api/envelopes/transfer/3/1")
        .type("form")
        .send(transferFunds)
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.strictEqual(response.status, ok)
    })

    it("invalid transfer of funds that is more than the from envelope has", async () => {
      const expected =
        "Make sure that the funds transfered are equal or less than the allotment that the from envelope has."
      const transferFunds = { funds: 60 }
      const response = await request(app)
        .post("/api/envelopes/transfer/2/1")
        .type("form")
        .send(transferFunds)
      assert.deepEqual(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })

    it("invalid transfer funds where one of the ids are not in the database", async () => {
      const expected = "Not found: The"
      const transferFunds = { funds: 10 }
      const response = await request(app)
        .post("/api/envelopes/transfer/2/5")
        .type("form")
        .send(transferFunds)
      assert.include(response.text, expected)
      assert.strictEqual(response.status, notFound)
    })

    it("Invalid transfer of funds where one of the given ids is non-numeric", async () => {
      const expected = "The From"
      const transferFunds = { funds: 10 }
      const response = await request(app)
        .post("/api/envelopes/transfer/savings/1")
        .type("form")
        .send(transferFunds)
      assert.include(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })

    it("invalid transfer of funds where the funds are non-numeric", async () => {
      const expected = "The Funds"
      const transferFunds = { funds: "yo" }
      const response = await request(app)
        .post("/api/envelopes/transfer/3/1")
        .type("form")
        .send(transferFunds)
      assert.include(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })

    it("invalid transfer of funds where the funds property do not exist in the request body", async () => {
      const expected = "The Funds"
      const transferFunds = { yo: "yo" }
      const response = await request(app)
        .post("/api/envelopes/transfer/3/1")
        .type("form")
        .send(transferFunds)
      assert.include(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })

    it("Seed envelopes", async () => {
      await resetDatabase(false, false)
      const expected = [
        {
          category: "groceries",
          allotment: 150,
        },
        {
          category: "orderingOut",
          allotment: 50,
        },
        {
          category: "savings",
          allotment: 125,
        },
      ]
      let response = await request(app)
        .post("/api/envelopes/seed-envelopes")
        .type("form")
        .send()
      assert.equal(response.status, created)
      response = JSON.parse(response.text)
      assert.include(response[0], expected[0])
      assert.include(response[1], expected[1])
      assert.include(response[2], expected[2])
    })
  })

  describe("PUT requests", () => {
    it("update an envelope with id = 3 to be games with 80 dollars", async () => {
      const expected = { id: 3, category: "games", allotment: 80 }
      const envelope = expected
      const response = await request(app)
        .put("/api/envelopes/3")
        .type("form")
        .send(envelope)
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.equal(response.status, ok)
    })

    it("Invalid update where request body with allotment exceeding upper limit", async () => {
      const expected =
        "With new allotment, the total available allotment of all the envelopes has exceeded the unsued allotment limit by 1700 $, make new allotement less."
      const envelope = { category: "games", allotment: 2000 }
      const response = await request(app)
        .put("/api/envelopes/3")
        .type("form")
        .send(envelope)
      assert.include(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("Update unused allotment changing it from 500 to 600", async () => {
      const expected = 600
      const _unusedAllotment = { unusedAllotment: expected }
      const response = await request(app)
        .put("/api/envelopes/unused-allotment")
        .type("form")
        .send(_unusedAllotment)
      assert.equal(JSON.parse(response.text), expected)
      assert.strictEqual(response.status, ok)
    })

    it("Update unused allotment with non-numeric unused allotment = yo", async () => {
      const expected =
        "Change the new Unused Allotment, that is equal to yo, to be a number."
      const _unusedAllotment = { unusedAllotment: "yo" }
      const response = await request(app)
        .put("/api/envelopes/unused-allotment")
        .type("form")
        .send(_unusedAllotment)
      assert.equal(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })

    it("Update unused allotment with no unusedAllotment property in request body", async () => {
      const expected =
        "Change the new Unused Allotment, that is equal to undefined, to be a number."
      const _unusedAllotment = { yo: "yo" }
      const response = await request(app)
        .put("/api/envelopes/unused-allotment")
        .type("form")
        .send(_unusedAllotment)
      assert.equal(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })
  })

  describe("DELETE requests", () => {
    it("deletes all envelopes", async () => {
      const response = await request(app).delete("/api/envelopes").send()
      assert.equal(response.status, noContent)
    })

    it("delete envelope with id = 2", async () => {
      const response = await request(app).delete("/api/envelopes/2").send()
      assert.equal(response.status, noContent)
    })
  })
})

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// transactions tests
describe("/api/transactions", () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  after(async () => {
    await resetDatabase(true, false)
  })

  describe("GET transactions", () => {
    it("get all transactions", async () => {
      const expected = [
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
      const response = await request(app).get("/api/transactions")
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.equal(response.status, 200)
    })

    it("get transaction with id = 2", async () => {
      const expected = {
        id: 2,
        date: "Mon Sep 18 2023 00:00:00 GMT-0500 (Central Daylight Time)",
        envelope_id: 1,
        payment: 70,
        shop: "Walmart",
      }
      const id = "2"
      const response = await request(app)
        .get("/api/transactions/" + id)
        .send()
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.equal(response.status, 200)
    })

    it("get transaction with invalid id = 87", async () => {
      const expected = "There is no transaction with that id."
      const id = "87"
      const response = await request(app)
        .get("/api/transactions/" + id)
        .send()
      assert(response.text, expected)
      assert.equal(response.status, notFound)
    })

    it("get transaction with invalid id = hi", async () => {
      const expected = "Transaction's id must be a number."
      const id = "hi"
      const response = await request(app)
        .get("/api/transactions/" + id)
        .send()
      assert(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("get used allotment", async () => {
      const expected = 120
      const response = await request(app)
        .get("/api/transactions/used-allotment")
        .send()
      assert.equal(response.text, expected)
    })
  })

  describe("POST requests", () => {
    it("create a 75$ transaction for retirement into your 401k", async () => {
      const expected = {
        id: 3,
        date: new Date("Sep 19 2023").toString(),
        envelope_id: 3,
        payment: 75,
        shop: "Chase",
      }
      const transaction = expected
      const response = await request(app)
        .post("/api/transactions")
        .type("form")
        .send(transaction)
      assert.include(JSON.parse(response.text), expected)
      assert.equal(response.status, created)
    })

    it("Invalid create request that has body missing one or many of date, payment, shop, or envelope_id", async () => {
      const expected =
        "Make sure to include date, payment, shop, and envelope_id on the request body."
      const transaction = { envelope_id: 3, shop: "Amazon" }
      const response = await request(app)
        .post("/api/transactions")
        .type("form")
        .send(transaction)
      assert.include(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("invalid create request that has body having envelope_id as a string", async () => {
      const expected =
        "Make sure that the date is a string, shop is a strings, and payment and envelope_id are numbers."
      const transaction = {
        id: 3,
        date: new Date("Sep 19 2023").toString(),
        envelope_id: "hi",
        payment: 75,
        shop: "Chase",
      }
      const response = await request(app)
        .post("/api/transactions")
        .type("form")
        .send(transaction)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("invalid create request that has body having shop as a number", async () => {
      const expected =
        "Make sure that the date is a string, shop is a strings, and payment and envelope_id are numbers."
      const transaction = {
        id: 3,
        date: new Date("Sep 19 2023").toString(),
        envelope_id: 3,
        payment: 75,
        shop: 401,
      }
      const response = await request(app)
        .post("/api/transactions")
        .type("form")
        .send(transaction)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("invalid create request that has body violating the unique constraint on the transaction column, date", async () => {
      const expected =
        "Make sure that date is not a duplicate of existing data."
      const transaction = {
        id: 3,
        date: new Date("Sep 18 2023").toString(),
        envelope_id: 3,
        payment: 75,
        shop: "Chase",
      }
      const response = await request(app)
        .post("/api/transactions")
        .type("form")
        .send(transaction)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("seed transaction", async () => {
      await resetDatabase(true, true, false)
      const expected = [
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
      let response = await request(app)
        .post("/api/transactions/seed-transactions")
        .type("form")
        .send()
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.equal(response.status, created)
    })
  })

  describe("PUT requests", () => {
    it("update transaction with id = 2 to have 45 as payment instead of 50", async () => {
      const previousPayment = 50
      const newPayment = 45
      const paymentDifference = newPayment - previousPayment
      const expected = {
        id: 1,
        date: "Tue Sep 12 2023 00:00:00 GMT-0500 (Central Daylight Time)",
        envelope_id: 2,
        payment: 45,
        shop: "Wingstop",
      }
      const transaction = expected

      const envelopesBeforeUpdate = await request(app)
        .get("/api/envelopes")
        .send()
      const _unusedAllotmentBeforeUpdate = await request(app)
        .get("/api/envelopes/unused-allotment")
        .send()
      const response = await request(app)
        .put("/api/transactions/1")
        .type("form")
        .send(transaction)
      const envelopesAfterUpdate = await request(app)
        .get("/api/envelopes")
        .send()
      const _unusedAllotmentAfterUpdate = await request(app)
        .get("/api/envelopes/unused-allotment")
        .send()
      assert.deepEqual(JSON.parse(response.text), expected)
      assert.equal(response.status, ok)
      assert.strictEqual(
        _unusedAllotmentBeforeUpdate.text - paymentDifference,
        Number(_unusedAllotmentAfterUpdate.text)
      )
      assert.strictEqual(
        JSON.parse(envelopesBeforeUpdate.text)[1].allotment - paymentDifference,
        JSON.parse(envelopesAfterUpdate.text)[1].allotment
      )
    })

    it("Update envelope_id to be different therefore restoring the previous used allotment and using the allotment for the new envelope", async () => {
      const previousPayment = 50
      const newPayment = 55
      const paymentDifference = newPayment - previousPayment
      const transaction = (expected = {
        id: 1,
        date: "Tue Sep 12 2023 00:00:00 GMT-0500 (Central Daylight Time)",
        envelope_id: 3,
        payment: newPayment,
        shop: "Wingstop",
      })

      let envelopesBeforeUpdate = await request(app)
        .get("/api/envelopes")
        .send()
      const _unusedAllotmentBeforeUpdate = await request(app)
        .get("/api/envelopes/unused-allotment")
        .send()
      const response = await request(app)
        .put("/api/transactions/1")
        .type("form")
        .send(transaction)
      let envelopesAfterUpdate = await request(app).get("/api/envelopes").send()
      const _unusedAllotmentAfterUpdate = await request(app)
        .get("/api/envelopes/unused-allotment")
        .send()
      envelopesBeforeUpdate = JSON.parse(envelopesBeforeUpdate.text)
      envelopesAfterUpdate = JSON.parse(envelopesAfterUpdate.text)
      assert.include(JSON.parse(response.text), expected)
      assert.equal(response.status, ok)
      assert.strictEqual(
        _unusedAllotmentBeforeUpdate.text - paymentDifference,
        Number(_unusedAllotmentAfterUpdate.text)
      )
      assert.strictEqual(
        envelopesBeforeUpdate[1].allotment + previousPayment,
        envelopesAfterUpdate[1].allotment
      )
      assert.strictEqual(
        envelopesBeforeUpdate[2].allotment - newPayment,
        envelopesAfterUpdate[2].allotment
      )
    })

    it("Invalid update where transaction payment exceeds envelopes allotment", async () => {
      const expected =
        "The new payment exceeds the envelope's available allotment, make payment less."
      const transaction = {
        id: 1,
        date: "Tue Sep 12 2023 00:00:00 GMT-0500 (Central Daylight Time)",
        envelope_id: 2,
        payment: 55,
        shop: "Wingstop",
      }
      const response = await request(app)
        .put("/api/transactions/1")
        .type("form")
        .send(transaction)
      assert.include(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("Update invalid where the envelope_id does not exist on the envelopes table", async () => {
      const expected = "There is no envelope by that envelope_id = 5."
      const transaction = {
        id: 1,
        date: "Tue Sep 12 2023 00:00:00 GMT-0500 (Central Daylight Time)",
        envelope_id: 5,
        payment: 55,
        shop: "Wingstop",
      }
      const response = await request(app)
        .put("/api/transactions/1")
        .type("form")
        .send(transaction)
      assert.include(response.text, expected)
      assert.equal(response.status, badRequest)
    })
  })

  describe("DELETE requests", () => {
    it("deletes all transactions and seeing if envelopes got their allotment restored", async () => {
      const response = await request(app).delete("/api/transactions/").send()
      assert.equal(response.status, noContent)

      const expectedTwo = [
        { id: 1, category: "groceries", allotment: 150 },
        { id: 2, category: "orderingOut", allotment: 50 },
        { id: 3, category: "savings", allotment: 125 },
      ]
      const responseTwo = await request(app).get("/api/envelopes").send()
      assert.deepEqual(JSON.parse(responseTwo.text), expectedTwo)
    })

    it("delete transaction with id = 2 and check if corresponding envelope got their allotment restored", async () => {
      const response = await request(app).delete("/api/transactions/2").send()
      assert.equal(response.status, noContent)

      const expectedTwo = { id: 1, category: "groceries", allotment: 150 }
      const responseTwo = await request(app).get("/api/envelopes/1").send()
      assert.deepEqual(JSON.parse(responseTwo.text), expectedTwo)
    })
  })

  describe("data persistency tests", async () => {
    it("Update unused allotment from 500 to 600 then check to see if I can create a new envelope that uses all 600 allotment", async () => {
      const expected = 600
      const _unusedAllotment = { unusedAllotment: expected }
      const response = await request(app)
        .put("/api/envelopes/unused-allotment")
        .type("form")
        .send(_unusedAllotment)
      assert.equal(JSON.parse(response.text), expected)
      assert.strictEqual(response.status, ok)
      const expectedTwo = {
        id: 4,
        category: "electronics",
        allotment: 275,
      }
      const envelope = expectedTwo
      const responseTwo = await request(app)
        .post("/api/envelopes/")
        .type("form")
        .send(envelope)
      assert.deepEqual(JSON.parse(responseTwo.text), expectedTwo)
    })

    it("Checking to see if the transactions router can access up to date value of totalAlltoment from envelopes router", async () => {
      const expected = 600
      const _unusedAllotment = { unusedAllotment: expected }
      const response = await request(app)
        .put("/api/envelopes/unused-allotment")
        .type("form")
        .send(_unusedAllotment)
      assert.equal(JSON.parse(response.text), expected)
    })
  })
})

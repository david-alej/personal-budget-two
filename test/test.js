const { assert } = require("chai")
const request = require("supertest")

const app = require("../server")

const { db } = require("../server/db/db")
const { resetDatabase, Table } = require("../server/helpers/db-helpers")
const { describe } = require("mocha")

const envelopes = new Table("envelopes")
const ok = 200
const created = 201
const noContent = 204
const badRequest = 400
const notFound = 404

// Database helpers
describe("Database helpers", () => {
  before(async () => {
    const pool = db.allEnvelopes.data
    await pool.query("DELETE FROM transactions WHERE true;")
    await pool.query("ALTER SEQUENCE transactions_id_seq RESTART WITH 1;")
  })
  beforeEach(async () => {
    await resetDatabase()
  })
  describe("Get helpers", () => {
    it("getting all envelopes", async () => {
      const expected = [
        { id: 1, category: "groceries", allotment: 150 },
        { id: 2, category: "orderingOut", allotment: 50 },
        { id: 3, category: "savings", allotment: 125 },
      ]
      const result = await envelopes.getAllRows()
      assert.deepEqual(result, expected)
    })

    it("getting envelope with id = 2", async () => {
      const expected = { id: 2, category: "orderingOut", allotment: 50 }
      const id = "2"
      const result = await envelopes.getRowById(id)
      assert.deepEqual(result[0], expected)
    })
  })

  describe("POST helpers", () => {
    it("add games envelope with 70 dollars", async () => {
      const expected = { id: 4, category: "games", allotment: 70 }
      const envelope = { category: "games", allotment: 70 }
      const result = await envelopes.insertRow(envelope)
      assert.deepEqual(result[0], expected)
    })
  })

  describe("PUT helpers", () => {
    it("update envelope with id = 3", async () => {
      const expected = { id: 3, category: "savings", allotment: 100 }
      const envelope = expected
      const result = await envelopes.updateRow(envelope)
      assert.deepEqual(result[0], expected)
    })
  })

  describe("DELETE helpers", () => {
    it("delete all envelopes", async () => {
      const expected = []
      const result = envelopes.deleteAllRows()
      assert.deepEqual(await result, expected)
      await resetDatabase()
    })

    it("delete an envelope with id = 2", async () => {
      const expected = { id: 2, category: "orderingOut", allotment: 50 }
      const id = 2
      const result = await envelopes.deleteRowById(id)
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
    await resetDatabase()
  })

  describe("GET requests", () => {
    it("get all envelopes", async () => {
      const expected = [
        { id: 1, category: "groceries", allotment: 150 },
        { id: 2, category: "orderingOut", allotment: 50 },
        { id: 3, category: "savings", allotment: 125 },
      ]
      const response = await request(app).get("/api/envelopes")
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
      const expected = "There is no envelope with that id"
      const id = "87"
      const response = await request(app)
        .get("/api/envelopes/" + id)
        .send()
      assert(response.text, expected)
      assert.equal(response.status, notFound)
    })

    it("get envelope with invalid id = hi", async () => {
      const expected = "Envelope's id must be a number."
      const id = "hi"
      const response = await request(app)
        .get("/api/envelopes/" + id)
        .send()
      assert(response.text, expected)
      assert.equal(response.status, badRequest)
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
        "Make sure to include both category and allotment on the request body"
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
        "Make sure that category is a string and allotment is a number"
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
        "Make sure that category is a string and allotment is a number"
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
        "Make sure that category is not a duplicate of existing data"
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
        "Make sure that the funds transfered are equal or less than the allotment that the from envelope has"
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
        "With new allotment, the total used allotment has exceeded the total allotment limit, make new allotement less"
      const envelope = { category: "games", allotment: 2000 }
      const response = await request(app)
        .put("/api/envelopes/3")
        .type("form")
        .send(envelope)
      assert.include(response.text, expected)
      assert.equal(response.status, badRequest)
    })

    it("Update total allotment changing it from 500 to 600", async () => {
      const expected = 600
      const totalAllotment = { totalAllotment: 600 }
      const response = await request(app)
        .put("/api/envelopes/totalAllotment")
        .type("form")
        .send(totalAllotment)
      assert.equal(JSON.parse(response.text), expected)
      assert.strictEqual(response.status, ok)
    })

    it("Update total allotment with non-numeric total allotment = yo", async () => {
      const expected = "The new Total Allotment that is equal to"
      const totalAllotment = { totalAllotment: "yo" }
      const response = await request(app)
        .put("/api/envelopes/totalAllotment")
        .type("form")
        .send(totalAllotment)
      assert.include(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })

    it("Update total allotment with no totalAllotment property in request body", async () => {
      const expected = "The new Total Allotment that is equal to"
      const totalAllotment = { yo: "yo" }
      const response = await request(app)
        .put("/api/envelopes/totalAllotment")
        .type("form")
        .send(totalAllotment)
      assert.include(response.text, expected)
      assert.strictEqual(response.status, badRequest)
    })
  })

  describe("DELETE requests", () => {
    it("deletes all envelopes", async () => {
      const expected = 204
      const response = await request(app).delete("/api/envelopes").send()
      assert.strictEqual(response.status, expected)
      assert.equal(response.status, noContent)
    })

    it("delete envelope with id = 2", async () => {
      const expected = 204
      const response = await request(app).delete("/api/envelopes/2").send()
      assert.strictEqual(response.status, expected)
      assert.equal(response.status, noContent)
    })
  })
})

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// transactions tests
describe("/api/transactions", () => {
  beforeEach(async () => {
    await resetDatabase(true)
  })

  describe("GET transactions", () => {
    it("get all transactions", async () => {
      const expected = [
        {
          id: 1,
          date: "2023-09-12T00:00:00.000-05:00",
          envelope_id: 2,
          payment: 50,
          shop: "Wingstop",
        },
        {
          id: 2,
          date: "2023-09-18T00:00:00.000-05:00",
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
        date: "2023-09-18T00:00:00.000-05:00",
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
      const expected = "There is no transaction with that id"
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
  })

  describe("POST requests", () => {
    it("create a 75$ transaction for retirement into your 401k", async () => {
      const date = new Date("Sep 19 2023")
      const expected = {
        id: 3,
        date,
        envelope_id: 3,
        payment: 75,
        shop: "Chase",
      }
      const envelope = expected
      const response = await request(app)
        .post("/api/transactions")
        .type("form")
        .send(envelope)
      assert.include(JSON.parse(response.text), expected)
      assert.equal(response.status, created)
    })

    it("Invalid create request that has body missing one or both of category and allotment", async () => {
      const expected =
        "Make sure to include both category and allotment on the request body"
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
        "Make sure that category is a string and allotment is a number"
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
        "Make sure that category is a string and allotment is a number"
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
        "Make sure that category is not a duplicate of existing data"
      const requestBody = { category: "savings", allotment: 5 }
      const response = await request(app)
        .post("/api/envelopes")
        .type("form")
        .send(requestBody)
      assert.strictEqual(response.text, expected)
      assert.equal(response.status, badRequest)
    })
  })

  describe("scope tests", async () => {
    it("Update total allotment from 500 to 600 then check to see if I can create a new envelope that uses all 600 allotment", async () => {
      const expected = 600
      const totalAllotment = { totalAllotment: expected }
      const response = await request(app)
        .put("/api/envelopes/totalAllotment")
        .type("form")
        .send(totalAllotment)
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
      console.log(responseTwo.text)
      assert.deepEqual(JSON.parse(responseTwo.text), expectedTwo)
    })

    it("Checking to see if the transactions router can access up to date value of totalAlltoment from envelopes router", async () => {
      const expected = 600
      const totalAllotment = { totalAllotment: expected }
      const response = await request(app)
        .put("/api/envelopes/totalAllotment")
        .type("form")
        .send(totalAllotment)
      assert.equal(JSON.parse(response.text), expected)
    })
  })
})

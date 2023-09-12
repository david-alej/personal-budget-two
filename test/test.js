const { assert } = require("chai")
const request = require("supertest")

const app = require("../server")

const {
  resetDatabase,
  getAllEnvelopesFromDatabase,
  getEnvelopeFromDatabaseById,
  addEnvelopeToDatabase,
  updateEnvelopeInDatabase,
  deleteAllEnvelopesFromDatabase,
  deleteEnvelopeFromDatabasebyId,
} = require("../server/helpers/db-helpers")
const { describe } = require("mocha")

// Database helpers
describe("Database helpers", () => {
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
      const result = await getAllEnvelopesFromDatabase()
      assert.deepEqual(result, expected)
    })

    it("getting envelope with id = 2", async () => {
      const expected = { id: 2, category: "orderingOut", allotment: 50 }
      const id = "2"
      const result = await getEnvelopeFromDatabaseById(id)
      assert.deepEqual(result, expected)
    })
  })

  describe("POST helpers", () => {
    it("add games envelope with 70 dollars", async () => {
      const expected = { id: 4, category: "games", allotment: 70 }
      const envelope = { category: "games", allotment: 70 }
      const result = addEnvelopeToDatabase(envelope)
      assert.deepEqual(await result, expected)
    })
  })

  describe("PUT helpers", () => {
    it("update envelope with id = 3", async () => {
      const expected = { id: 3, category: "savings", allotment: 100 }
      const envelope = expected
      const result = await updateEnvelopeInDatabase(envelope)
      assert.deepEqual(result, expected)
    })
  })

  describe("DELETE helpers", () => {
    it("delete all envelopes", async () => {
      const expected = undefined
      const result = deleteAllEnvelopesFromDatabase()
      assert.deepEqual(await result, expected)
      await resetDatabase()
    })

    it("delete an envelope with id = 2", async () => {
      const expected = true
      const id = 2
      const result = await deleteEnvelopeFromDatabasebyId(id)
      assert.strictEqual(result, expected)
    })
  })
})

// --------------------------------------------------------------------------
// HTTP requests
describe("/envelopes", () => {
  beforeEach(async () => {
    await resetDatabase()
  })
  const ok = 200
  const created = 201
  const noContent = 204
  const badRequest = 400
  const notFound = 404

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
      const expected = { category: "games", allotment: 500 }
      const envelope = expected
      const response = await request(app)
        .post("/api/envelopes")
        .type("form")
        .send(envelope)
      assert.include(JSON.parse(response.text), expected)
      assert.equal(response.status, created)
    })

    it("invalid request body missing one or both of category and allotment", async () => {
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

    it("invalid request body having allotment as a string", async () => {
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

    it("invalid request body having category as a number", async () => {
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

    it("invalid request body violating the unique constraint on the table", async () => {
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

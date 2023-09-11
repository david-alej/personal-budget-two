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

describe("/envelopes", () => {
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
    })

    it("get envelope with id = 2", async () => {
      const expected = { id: 2, category: "orderingOut", allotment: 50 }
      const id = "2"
      const response = await request(app)
        .get("/api/envelopes/" + id)
        .send()
      assert.deepEqual(JSON.parse(response.text), expected)
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
    })
  })

  describe("DELETE requests", () => {
    it("deletes all envelopes", async () => {
      const expected = 204
      const response = await request(app).delete("/api/envelopes").send()
      assert.strictEqual(response.status, expected)
    })

    it("delete envelope with id = 2", async () => {
      const expected = 204
      const response = await request(app).delete("/api/envelopes/2").send()
      assert.strictEqual(response.status, expected)
    })
  })
})

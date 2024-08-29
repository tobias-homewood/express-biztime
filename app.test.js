const request = require("supertest");
const app = require("./app");
const db = require("./db");

process.env.NODE_ENV = "test";

afterAll(async () => {
    await db.end();
});

describe("404 Handler", () => {
    test("not found for invalid route", async () => {
        const res = await request(app).get("/invalid");
        expect(res.statusCode).toBe(404);
    });
});

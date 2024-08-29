const request = require("supertest");
const app = require("../app");
const db = require("../db");

process.env.NODE_ENV = "test";

beforeAll(async () => {
    // Drop table
    await db.query(`DROP TABLE IF EXISTS companies`);

    // Create table
    await db.query(`CREATE TABLE companies (
        code text PRIMARY KEY,
        name text NOT NULL UNIQUE,
        description text
    )`);

    // Insert some test data
    await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('ABC', 'Company ABC', 'Description ABC')`
    );
    await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('XYZ', 'Company XYZ', 'Description XYZ')`
    );
});

afterEach(async () => {
    // Clear the test data
    await db.query(`DELETE FROM companies`);

    // Insert some test data
    await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('ABC', 'Company ABC', 'Description ABC')`
    );
    await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('XYZ', 'Company XYZ', 'Description XYZ')`
    );
});

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("should return all companies", async () => {
        const response = await request(app).get("/companies");
        expect(response.status).toBe(200);
        expect(response.body.companies).toHaveLength(2);
    });

    test("should handle errors", async () => {
        await db.query(`DROP TABLE companies`);
        const response = await request(app).get("/companies");
        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
        await db.query(`CREATE TABLE companies (
            code text PRIMARY KEY,
            name text NOT NULL UNIQUE,
            description text
        )`);
    });
});

describe("GET /companies/:code", () => {
    test("should return a specific company", async () => {
        const response = await request(app).get("/companies/ABC");
        expect(response.status).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe("ABC");
    });

    test("should handle company not found", async () => {
        const response = await request(app).get("/companies/DEF");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'DEF' not found");
    });
});

describe("POST /companies", () => {
    test("should create a new company", async () => {
        const response = await request(app)
            .post("/companies")
            .send({
                code: "DEF",
                name: "Company DEF",
                description: "Description DEF",
            });
        expect(response.status).toBe(201);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe("DEF");
    });

    test("should handle validation errors", async () => {
        const response = await request(app)
            .post("/companies")
            .send({ code: "GHI" }); // Missing name
        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
    });
});

describe("PUT /companies/:code", () => {
    test("should update a company", async () => {
        const response = await request(app)
            .put("/companies/ABC")
            .send({
                name: "Updated Company ABC",
                description: "Updated Description ABC",
            });
        expect(response.status).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.name).toBe("Updated Company ABC");
        expect(response.body.company.description).toBe("Updated Description ABC");
    });

    test("should handle company not found", async () => {
        const response = await request(app)
            .put("/companies/DEF")
            .send({
                name: "Updated Company DEF",
                description: "Updated Description DEF",
            });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'DEF' not found");
    });
});

describe("DELETE /companies/:code", () => {
    test("should delete a company", async () => {
        const response = await request(app).delete("/companies/ABC");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("deleted");
    });

    test("should handle company not found", async () => {
        const response = await request(app).delete("/companies/DEF");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'DEF' not found");
    });
});


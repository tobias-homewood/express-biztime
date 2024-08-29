const request = require("supertest");
const app = require("../app");
const db = require("../db");
const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "test";

beforeEach(async () => {
    // Read and execute the SQL script
    const sqlScript = fs.readFileSync(
        path.join(__dirname, "test_data.sql"),
        "utf-8"
    );
    await db.query(sqlScript);
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
        await db.query(`DROP TABLE companies_industries`);
        await db.query(`DROP TABLE invoices`);
        await db.query(`DROP TABLE companies`);
        const response = await request(app).get("/companies");
        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
    });
});

describe("GET /companies/:code", () => {
    test("should return a specific company", async () => {
        const response = await request(app).get("/companies/abc");
        expect(response.status).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe("abc");
    });

    test("should handle company not found", async () => {
        const response = await request(app).get("/companies/def");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'def' not found");
    });
});

describe("POST /companies", () => {
    test("should create a new company", async () => {
        const response = await request(app).post("/companies").send({
            code: "DEF",
            name: "Company DEF",
            description: "Description DEF",
        });
        expect(response.status).toBe(201);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe("def");
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
        const response = await request(app).put("/companies/abc").send({
            name: "Updated Company ABC",
            description: "Updated Description ABC",
        });
        expect(response.status).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.name).toBe("Updated Company ABC");
        expect(response.body.company.description).toBe(
            "Updated Description ABC"
        );
    });

    test("should handle company not found", async () => {
        const response = await request(app).put("/companies/def").send({
            name: "Updated Company DEF",
            description: "Updated Description DEF",
        });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'def' not found");
    });
});

describe("DELETE /companies/:code", () => {
    test("should delete a company", async () => {
        const response = await request(app).delete("/companies/abc");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("deleted");
    });

    test("should handle company not found", async () => {
        const response = await request(app).delete("/companies/def");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'def' not found");
    });
});

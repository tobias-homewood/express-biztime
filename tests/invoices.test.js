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

describe("GET /invoices", () => {
    test("should return all invoices", async () => {
        const response = await request(app).get("/invoices");
        expect(response.status).toBe(200);
        expect(response.body.invoices).toHaveLength(2);
    });

    test("should handle errors", async () => {
        await db.query(`DROP TABLE invoices`);
        const response = await request(app).get("/invoices");
        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
    });
});

describe("GET /invoices/:id", () => {
    test("should return a specific invoice", async () => {
        const response = await request(app).get("/invoices/1");
        expect(response.status).toBe(200);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.id).toBe(1);
    });

    test("should handle invoice not found", async () => {
        const response = await request(app).get("/invoices/999");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Invoice with id '999' not found");
    });
});

describe("POST /invoices", () => {
    test("should create a new invoice", async () => {
        const response = await request(app).post("/invoices").send({
            comp_code: "abc",
            amt: 300.0,
        });
        expect(response.status).toBe(201);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.comp_code).toBe("abc");
        expect(response.body.invoice.amt).toBe(300.0);
        expect(response.body.invoice.paid).toBe(false);
        let add_date = new Date(response.body.invoice.add_date);
        expect(add_date.toDateString()).toBe(new Date().toDateString());
        expect(response.body.invoice.paid_date).toBe(null);
    });

    test("should handle validation errors", async () => {
        const response = await request(app)
            .post("/invoices")
            .send({ comp_code: "xyz" }); // Missing amt
        expect(response.status).toBe(500);
        expect(response.body.error).toBeDefined();
    });
});

describe("PUT /invoices/:id", () => {
    test("should update an invoice", async () => {
        const response = await request(app).put("/invoices/1").send({
            amt: 400.0,
        });
        expect(response.status).toBe(200);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.amt).toBe(400.0);
    });

    test("should pay an invoice", async () => {
        const response = await request(app).put("/invoices/1").send({
            paid: true,
        });
        expect(response.status).toBe(200);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.paid).toBe(true);
        let paid_date = new Date(response.body.invoice.paid_date);
        expect(paid_date.toDateString()).toBe(new Date().toDateString());
    });

    test("should handle invoice not found", async () => {
        const response = await request(app).put("/invoices/999").send({
            amt: 500.0,
        });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Invoice with id '999' not found");
    });
});

describe("DELETE /invoices/:id", () => {
    test("should delete an invoice", async () => {
        const response = await request(app).delete("/invoices/1");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("deleted");
    });

    test("should handle invoice not found", async () => {
        const response = await request(app).delete("/invoices/999");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Invoice with id '999' not found");
    });
});

describe("GET /invoices/companies/:code", () => {
    test("should return invoices for a specific company", async () => {
        const response = await request(app).get("/invoices/companies/abc");
        expect(response.status).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe("abc");
        expect(response.body.company.invoices).toHaveLength(2);
    });

    test("should handle company not found", async () => {
        const response = await request(app).get("/invoices/companies/def");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'def' not found");
    });
});

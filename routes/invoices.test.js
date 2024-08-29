const request = require("supertest");
const app = require("../app");
const db = require("../db");

process.env.NODE_ENV = "test";

beforeEach(async () => {
    // Drop table
    await db.query(`DROP TABLE IF EXISTS invoices`);
    await db.query(`DROP TABLE IF EXISTS companies`);

    // Create companies table
    await db.query(`CREATE TABLE companies (
        code text PRIMARY KEY,
        name text NOT NULL UNIQUE,
        description text
    )`);

    // Create invoices table
    await db.query(`CREATE TABLE invoices (
        id serial PRIMARY KEY,
        comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
        amt float NOT NULL,
        paid boolean DEFAULT false NOT NULL,
        add_date date DEFAULT CURRENT_DATE NOT NULL,
        paid_date date,
        CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
    )`);

    // Insert some test data into companies table
    await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('ABC', 'Company ABC', 'Description ABC')`
    );
    await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('XYZ', 'Company XYZ', 'Description XYZ')`
    );

    // Insert some test data into invoices table
    await db.query(
        `INSERT INTO invoices (comp_code, amt) VALUES ('ABC', 100.00)`
    );
    await db.query(
        `INSERT INTO invoices (comp_code, amt) VALUES ('ABC', 200.00)`
    );
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
            comp_code: "ABC",
            amt: 300.0,
        });
        expect(response.status).toBe(201);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.comp_code).toBe("ABC");
        expect(response.body.invoice.amt).toBe(300.0);
        expect(response.body.invoice.paid).toBe(false);
        let add_date = new Date(response.body.invoice.add_date);
        expect(add_date.toDateString()).toBe(new Date().toDateString());
        expect(response.body.invoice.paid_date).toBe(null);
    });

    test("should handle validation errors", async () => {
        const response = await request(app)
            .post("/invoices")
            .send({ comp_code: "XYZ" }); // Missing amt
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
        const response = await request(app).get("/invoices/companies/ABC");
        expect(response.status).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe("ABC");
        expect(response.body.company.invoices).toHaveLength(2);
    });

    test("should handle company not found", async () => {
        const response = await request(app).get("/invoices/companies/DEF");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'DEF' not found");
    });
});

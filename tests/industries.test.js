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

describe("GET /industries", () => {
    test("Get all industries", async () => {
        const response = await request(app).get("/industries");
        expect(response.status).toBe(200);
        expect(response.body.industries).toHaveLength(3);
    });
});

describe("GET /industries/:code", () => {
    test("Get industry by code", async () => {
        const response = await request(app).get("/industries/tech");
        expect(response.status).toBe(200);
        expect(response.body.industry).toBeDefined();
        expect(response.body.industry.code).toBe("tech");
    });

    test("Get non-existent industry by code", async () => {
        const response = await request(app).get("/industries/nonexistent");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Industry with code 'nonexistent' not found");
    });
});

describe("POST /industries", () => {
    test("Create a new industry", async () => {
        const response = await request(app)
            .post("/industries")
            .send({ code: "NEWIND", name: "New Industry" });
        expect(response.status).toBe(201);
        expect(response.body.industry).toBeDefined();
        expect(response.body.industry.code).toBe("newind");
        expect(response.body.industry.name).toBe("New Industry");
    });
});

describe("PUT /industries/:code", () => {
    test("Update an existing industry", async () => {
        const response = await request(app)
            .put("/industries/tech")
            .send({ name: "Technologies modified" });
        expect(response.status).toBe(200);
        expect(response.body.industry).toBeDefined();
        expect(response.body.industry.code).toBe("tech");
        expect(response.body.industry.name).toBe("Technologies modified");
    });

    test("Update a non-existent industry", async () => {
        const response = await request(app)
            .put("/industries/nonexistent")
            .send({ name: "Non-existent Industry" });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Industry with code 'nonexistent' not found");
    });
});

describe("DELETE /industries/:code", () => {
    test("Delete an existing industry", async () => {
        const response = await request(app).delete("/industries/tech");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("deleted");
    });

    test("Delete a non-existent industry", async () => {
        const response = await request(app).delete("/industries/nonexistent");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Industry with code 'nonexistent' not found");
    });
});

describe("POST /industries/:code/companies", () => {
    test("Add a company to an industry", async () => {
        const response = await request(app)
            .post("/industries/food/companies")
            .send({ comp_code: "abc" });
        expect(response.status).toBe(201);
        expect(response.body.industry.companies).toBeDefined();
        expect(response.body.industry.companies).toHaveLength(2);
        expect(response.body.industry.companies).toContainEqual("abc");
    });

    test("Add a non-existent company to an industry", async () => {
        const response = await request(app)
            .post("/industries/tech/companies")
            .send({ comp_code: "nonexistent" });
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'nonexistent' not found");
    });
});

describe("DELETE /industries/:code/companies/:comp_code", () => {
    test("Remove a company from an industry", async () => {
        const response = await request(app).delete("/industries/food/companies/xyz");
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("deleted");
    });

    test("Remove a non-existent company from an industry", async () => {
        const response = await request(app).delete("/industries/food/companies/nonexistent");
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Company with code 'nonexistent' not found");
    });
});
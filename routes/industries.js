const express = require("express");
const industriesRouter = new express.Router();
const db = require("../db");
const slugify = require("slugify");
const retrieveCompanies = require("../helpers/retrieveCompanies");

industriesRouter.get("/", async function (req, res, next) {
    try {
        const result = await db.query(`SELECT * FROM industries`);
        const industries = result.rows;
        for (let industry of industries) {
            industry.companies = await retrieveCompanies(industry, db);
        }
        return res.json({ industries: industries });
    } catch (err) {
        return next(err);
    }
});

industriesRouter.get("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const result = await db.query(
            `SELECT * FROM industries WHERE code = $1`,
            [code]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Industry with code '${code}' not found` });
        }
        const industry = result.rows[0];
        industry.companies = await retrieveCompanies(industry, db);
        return res.json({ industry: industry });
    } catch (err) {
        return next(err);
    }
});

industriesRouter.post("/", async function (req, res, next) {
    try {
        const { code, name } = req.body;
        const result = await db.query(
            `INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING *`,
            [slugify(code, { lower: true, strict: true }), name]
        );
        const industry = result.rows[0];
        industry.companies = await retrieveCompanies(industry, db);
        return res.status(201).json({ industry: industry });
    } catch (err) {
        return next(err);
    }
});

industriesRouter.put("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const { name } = req.body;
        const result = await db.query(
            `UPDATE industries SET name = $1 WHERE code = $2 RETURNING *`,
            [name, code]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Industry with code '${code}' not found` });
        }
        const industry = result.rows[0];
        industry.companies = await retrieveCompanies(industry, db);
        return res.json({ industry: industry });
    } catch (err) {
        return next(err);
    }
});

industriesRouter.delete("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const result = await db.query(
            `DELETE FROM industries WHERE code = $1 RETURNING *`,
            [code]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Industry with code '${code}' not found` });
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = industriesRouter;

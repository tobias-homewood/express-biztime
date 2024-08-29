const express = require("express");
const companiesRouter = new express.Router();
const db = require("../db");
const slugify = require("slugify");
const retrieveIndustries = require("../helpers/retrieveIndustries");

companiesRouter.get("/", async function (req, res, next) {
    try {
        const result = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: result.rows });
    } catch (err) {
        return next(err);
    }
});

companiesRouter.get("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const result = await db.query(
            `SELECT * FROM companies WHERE code = $1`,
            [code]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Company with code '${code}' not found` });
        }
        const company = result.rows[0];
        company.industries = await retrieveIndustries(company, db);
        return res.json({ company: company });
    } catch (err) {
        return next(err);
    }
});

companiesRouter.post("/", async function (req, res, next) {
    try {
        const { code, name, description } = req.body;
        const result = await db.query(
            `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
            [slugify(code, { lower: true, strict: true }), name, description]
        );
        const company = result.rows[0];
        company.industries = await retrieveIndustries(company, db);
        return res.status(201).json({ company: company });
    } catch (err) {
        return next(err);
    }
});

companiesRouter.put("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const { name, description } = req.body;
        const result = await db.query(
            `UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *`,
            [name, description, code]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Company with code '${code}' not found` });
        }
        const company = result.rows[0];
        company.industries = await retrieveIndustries(company, db);
        return res.json({ company: company });
    } catch (err) {
        return next(err);
    }
});

companiesRouter.delete("/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const result = await db.query(
            `DELETE FROM companies WHERE code = $1 RETURNING *`,
            [code]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Company with code '${code}' not found` });
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = companiesRouter;

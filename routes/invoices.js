const express = require("express");
const invoicesRouter = new express.Router();
const db = require("../db");
const retrieveIndustries = require("../helpers/retrieveIndustries");

// all invoices
invoicesRouter.get("/", async function (req, res, next) {
    try {
        const result = await db.query("SELECT * FROM invoices");
        return res.json({ invoices: result.rows });
    } catch (err) {
        return next(err);
    }
});

// invoice with id
invoicesRouter.get("/:id", async function (req, res, next) {
    try {
        const id = req.params.id;
        const result = await db.query("SELECT * FROM invoices WHERE id = $1", [
            id,
        ]);
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Invoice with id '${id}' not found` });
        }
        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// new invoice
invoicesRouter.post("/", async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query(
            "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",
            [comp_code, amt]
        );
        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// update invoice
invoicesRouter.put("/:id", async function (req, res, next) {
    try {
        const id = req.params.id;
        const amt = req.body.amt;
        const paid = req.body.paid;
        let paid_date = null;

        if (paid === true) {
            paid_date = new Date();
        }

        if (amt !== undefined && paid === undefined) {
            result = await db.query(
                "UPDATE invoices SET amt = $2 WHERE id = $1 RETURNING *",
                [id, amt]
            );
        } else if (amt === undefined && paid !== undefined) {
            result = await db.query(
                "UPDATE invoices SET paid = $2, paid_date = $3 WHERE id = $1 RETURNING *",
                [id, paid, paid_date]
            );
        } else {
            result = await db.query(
                "UPDATE invoices SET amt = $2, paid = $3, paid_date = $4 WHERE id = $1 RETURNING *",
                [id, amt, paid, paid_date]
            );
        }

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Invoice with id '${id}' not found` });
        }
        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// delete invoice
invoicesRouter.delete("/:id", async function (req, res, next) {
    try {
        const id = req.params.id;
        const result = await db.query(
            "DELETE FROM invoices WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Invoice with id '${id}' not found` });
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

// get company
invoicesRouter.get("/companies/:code", async function (req, res, next) {
    try {
        const code = req.params.code;
        const companiesQuery = await db.query(
            "SELECT * FROM companies WHERE code = $1",
            [code]
        );
        if (companiesQuery.rows.length === 0) {
            return res
                .status(404)
                .json({ message: `Company with code '${code}' not found` });
        }

        const company = companiesQuery.rows[0];

        const invoicesQuery = await db.query(
            "SELECT * FROM invoices WHERE comp_code = $1",
            [code]
        );

        company.invoices = invoicesQuery.rows;
        company.industries = await retrieveIndustries(company, db);
        return res.json({ company: company });
    } catch (err) {
        return next(err);
    }
});

module.exports = invoicesRouter;

async function retrieveCompanies(industry, db) {
    const companiesQuery = await db.query(
        `SELECT c.code FROM companies AS c
        JOIN companies_industries AS ci ON c.code = ci.comp_code 
        WHERE ci.ind_code = $1`,
        [industry.code]
    );
    return companiesQuery.rows.map((c) => c.code);
}

module.exports = retrieveCompanies;
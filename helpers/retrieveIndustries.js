async function retrieveIndustries(company, db) {
    const industriesQuery = await db.query(
        `SELECT i.name FROM industries AS i 
        JOIN companies_industries AS ci ON i.code = ci.ind_code 
        WHERE ci.comp_code = $1`,
        [company.code]
    );
    return industriesQuery.rows.map((i) => i.name);
}

module.exports = retrieveIndustries;
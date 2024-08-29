-- \c biztime_test

DROP TABLE IF EXISTS companies_industries;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE companies_industries (
    comp_code text REFERENCES companies ON DELETE CASCADE,
    ind_code text REFERENCES industries ON DELETE CASCADE,
    PRIMARY KEY (comp_code, ind_code)
);

INSERT INTO companies
  VALUES ('abc', 'Company ABC', 'Description ABC'),
         ('xyz', 'Company XYZ', 'Description XYZ');

INSERT INTO invoices (comp_code, amt)
  VALUES ('abc', 100.00),
         ('abc', 200.00);

INSERT INTO industries
  VALUES ('tech', 'Technology'),
         ('comp', 'Computers'),
         ('food', 'Food');

INSERT INTO companies_industries
  VALUES ('abc', 'tech'),
         ('abc', 'comp'),
         ('xyz', 'tech'),
         ('xyz', 'food');

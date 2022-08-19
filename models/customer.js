"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  get notes() {
    return this._notes;
  }

  set notes(val) {
    this._notes = val ? val : "";
  }

  // ask what @ is (it's for microsoft sql), and ask what CASE statements are (basically if statements)
  // error": {
  //   "message": "bind message supplies 1 parameters, but prepared statement \"\" requires 0",
  //   "status": 500
  // }
  // "message": "invalid input syntax for type integer: \"%0%\""

  /** find all customers. */

  static async all(name = "") {
    // term in parameter

    const  whereString = name ? "WHERE CONCAT(first_name, ' ', last_name) ILIKE $1": '';
    const  queryParams = name ? [`%${name}%`]: [];
    // we were getting an error because if you have a variable, it has to be used in statement! ($1)

    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ${whereString}
           ORDER BY last_name, first_name`,
      queryParams
    );
    return results.rows.map((c) => new Customer(c));
  }

  // WHERE (name AND CONCAT(first_name, ' ', last_name) ILIKE $1)
  // OR NOT name

  /** find customer by name search. */
  // static async search(name) {
  //   const results = await db.query(
  //     `SELECT id,
  //                 first_name AS "firstName",
  //                 last_name  AS "lastName",
  //                 phone,
  //                 notes
  //          FROM customers
  //          WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
  //          ORDER BY last_name, first_name`,
  //     [`%${name}%`] // this is the only way to do it
  //   );
  //   return results.rows.map((c) => new Customer(c));
  // }

  /** get the top ten customers with most reservations */
  static async topTen() {
    const results = await db.query(
      `SELECT c.id,
                  c.first_name AS "firstName",
                  c.last_name  AS "lastName",
                  c.phone,
                  c.notes
            FROM customers c
            JOIN reservations r
            ON c.id = r.customer_id
            GROUP BY c.id
            ORDER BY COUNT(*) DESC
            LIMIT 10`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /**Gets first name and last name for full name. */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;

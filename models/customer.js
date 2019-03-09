/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");


/** Customer of the restaurant. */

class Customer {
  constructor({id, firstName, middleName, lastName, phone, notes}) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    
    // this.fullName = fullName;
  }

  /** methods for getting/setting notes (keep as empty string, not NULL) */

  set notes(val) {
    this._notes = val || '';
  }

  get notes() {
    return this._notes;
  }

  /** methods for getting/setting phone #. */

  set phone(val) {
    this._phone = val || null;
  }

  get phone() {
    return this._phone;
  }

  /** methods for getting/setting middleName #. */

  set middleName(val) {
    this._middleName = val || null;
  }

  get middleName() {
    return this._middleName;
  }
  
  // creating an instance method, that acts like a property of the instance
  get fullName() {
    if (this.middleName) {
      return `${this.firstName} ${this.middleName} ${this.lastName}`
    } else {
      return `${this.firstName} ${this.lastName}`
    }
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id, 
            first_name AS "firstName",
            middle_name AS "middleName",  
            last_name AS "lastName", 
            phone, 
            notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id, 
            first_name AS "firstName",  
            middle_name AS "middleName",  
            last_name AS "lastName", 
            phone, 
            notes 
        FROM customers WHERE id = $1`,
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

  /** search customers by any alphabet/string in the name */
  static async searchName(name){
    const searchTerm = `%${name}%`
    
    const results = await db.query(
      `SELECT
        id, 
        first_name AS "firstName",
        middle_name AS "middleName",  
        last_name AS "lastName"
      FROM customers 
      WHERE 
        first_name ILIKE $1 
      OR 
        middle_name ILIKE $1 
      OR 
        last_name ILIKE $1`,
        [searchTerm]
    );
    const customers = results.rows;

    if (customers.length === 0) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }
  return results.rows.map(c => new Customer(c));
  }

  /** get top 10 customers by the number of reservations */
  static async getTopTen(){    
    const results = await db.query(
      `SELECT
        customers.id, 
        first_name AS "firstName",
        middle_name AS "middleName",  
        last_name AS "lastName",
        COUNT(*)
      FROM customers 
      JOIN reservations
      ON reservations.customer_id=customers.id
      GROUP BY customers.id
      ORDER BY count DESC
      LIMIT 10`
    
    );
    const topCustomers = results.rows;

    if (topCustomers.length === 0) {
      const err = new Error(`Sorry, we cannot show you this now. ALERT Admin!`);
      throw err;
    }
  return results.rows.map(c => new Customer(c));
  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, middle_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
          [this.firstName, this.middleName, this.lastName, this.phone, this.notes]);
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers 
            SET first_name=$1, middle_name=$2, last_name=$3, phone=$4, notes=$5
             WHERE id=$6`,
          [this.firstName, this.middleName, this.lastName, this.phone, this.notes, this.id]);
    }
  }
}


module.exports = Customer;

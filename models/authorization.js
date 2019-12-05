"use strict";

const crypto = require("crypto");
const moment = require("moment");
const mysql=require('mysql')
const AbstractModel = require('./abstract');
const CustomErrors = require("../utils/customErrors");
const CustomError = CustomErrors.CustomError;

var pool = require('./database');

class UserModel extends AbstractModel {

  constructor(params = {}) {
    super();
    this.user_id = params.user_id;
    this.email = params.email;
    this.password = params.password;
    this.authStatus = params.authStatus;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  /**
   * Convert to Json
   */
  toJSON() {
    const clone = {
      ...this
    };
    delete clone.passwordHash;
    return clone;
  }

  /*************************************************************
   *static method
   *************************************************************/

  /**
   *
   * @param {Integer} id
   */
  static async saveLoginedId(user_id, email, token) {
    const query_str = `INSERT INTO session_table(user_id, email, token) VALUES('${user_id}', '${email}', '${token}')`;
    pool.query(query_str);

  }
  /**
   *
   * @param {integer} logined_id
   * @returns {Object}
   */
  static async getLoginedId(logined_id) {
    const query_str = `SELECT * FROM session_table WHERE user_id = '${logined_id}'`;
    const result = await pool.query(query_str).catch(error => {
      throw error;
    });
    return result;
  }

  /**
   *
   * @param {integer} logined_id
   */
  static async deleteLoginedId(logined_id) {
    const query_str = `DELETE FROM session_table WHERE user_id = '${logined_id}'`;
    const result = await pool.query(query_str);

    return result;
  }

  /**
   * user create
   * @param {Object} params
   * @return {UserModel}
   */
  static async create(params) {
    // sConfirm no duplicate email address
     const existingUser = await this.getByEmail(params.email);
    if (existingUser.length>0) {
      throw new CustomError("This email address is already in use。", 409);
    }

    const email = params.email;
    const passwordHash = this.hashPassword(params.password);
    const status = this.authStatus.verified;
    const createdAt = moment().format();
    const updatedAt = moment().format();

    const itemParams = {
      email: email,
      password: passwordHash,
      status: this.authStatus.verified, //Temporarily turn off mail authentication.
      created_at: moment().format(),
      updated_at: moment().format()
    };
    const query_str = `INSERT INTO users(email, password, status, created_at, updated_at) VALUES('${email}', '${passwordHash}', '${status}', '2019-01-30', ' 2019-01-30')`;
   const res= await pool.query(query_str);

    // dbConnection.query(query_str, function (err, result) {
    //   if (err) throw err;
    //   console.log("SELECT THE DATA",result);
    // });
    return this.toModel(itemParams);
  }

  /**
   * Acquire one user by email address。
   * @param {string} email
   * @return {UserModel|null}
   */
  static async getByEmail(email) {
    const items = await this._getByEmail(email);

    const models = items.map(item => {
      return this.toModel(item);
    });
    return models;
  }
  /**
* Acquire one user by email address。
* @param {string} email
* @return {Object|null}
*/
  static async _getByEmail(email) {

    try {
      var result = await pool.query(`SELECT * FROM users WHERE email='${email}' AND status=1`)
      return result;

  } catch(err) {
      throw new Error(err)
  }
    // const query=`SELECT * FROM users WHERE email='${email}' AND status=1`;
    // const res = await dbConnection.query(query);


    // const res=await dbConnection.query(query,function myfunction(err,rows) {
    //   if(err){
    //     console.log("ErrorOccour",err);
    //   }
    // console.log("rowsResult-------=>",rows);

    // callback = rows;
    // }
    // );

    // return res;
  }

  // static async _getByEmail(email) {
  //   var c = [];
  //   await dbConnection.query(`SELECT * FROM users WHERE email='${email}' AND status=1`, function(err, rows){

  //     if (err) throw err;
  //     for (var i in rows) {
  //       c.id= rows[i].id;
  //       c.USR = email;
  //     }
  //     console.log("Email" + " " + rows);
  //     console.log("Rosssss" + " " + c.id);


  //   });

  // }


  /**
   *Acquire one user with login information。
   * @param {string} email
   * @param {password} password
   * @return {UserModel}
   */
  static async getByLogin(email, password) {
    const items = await this._getByLogin(email, password);
    const models = items.map(item => {
      return this.toModel(item);
    });
    // return this.toModel(items);
    return models;
  }

  /**
   * Acquire one user with login information。
   * @param {string} email
   * @param {password} password
   * @return {Object}
   */
  static async _getByLogin(email, password) {
    const passwordHash = this.hashPassword(password);
    var res = await pool.query(`SELECT * FROM users WHERE email='${email}' AND password='${passwordHash}'`);
    return res;
  }


  /**
       * HashedPassword
       * @param {number} password
       * @return {string} hashedPassword
       */
  static hashPassword(password) {
    let pass = process.env.SALT_KEY + password;
    for (var i = 0; i < 3; i++) {
      pass = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
    }
    console.log("saltkey-------=>",pass);
    return pass;
  }

  /**
   * Create instances from record of DynamoDB
   * @param {Object} item
   * @return {UserModel|null}
   */
  static toModel(item) {
    if (!item) return null;
    const params = {
      user_id: item.user_id !== undefined ? item.user_id : null,
      email: item.email !== undefined ? item.email : null,
      password: item.password !== undefined ? item.password : null,
      authStatus: item.status !== undefined ? item.status : null,
      createdAt: item.created_at  !== undefined ? item.created_at : null,
      updatedAt: item.updated_at !== undefined ? item.updated_at : null
    };
    return new UserModel(params);
  }
}

UserModel.authStatus = {
  pending: 0,
  verified: 1
};

module.exports = UserModel;

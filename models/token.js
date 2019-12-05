"use strict";

const moment = require("moment");
const Util = require("../utils/util");
var dbConnection = require('./database');

class TokenModel {
  constructor(params = {}) {
    this.token = params.token;
    this.userId = params.userId;
    this.tokenType = params.tokenType;
    this.ttl = params.ttl;
  }

  /**
   * Convert to Json
   */
  toJSON() {
    const clone = { ...this };
    delete clone.ttl;
    return clone;
  }

  /**
   * create param。
   * @param {Object} params
   * @return {string}
   */
  static async create(params) {
    /**
     * generate character string
     */
    const tokenString = Util.randomString(64);
    /**
     * insert record
     */
    const query_str = `INSERT INTO session_table(user_id, email) VALUES('${user_id}', '${email}')`;
    await dbConnection.query(query_str).catch(error => {
      throw error;
    });
    return this.toModel(itemParams);
  }

  /**
   * create access token。
   * @param {Object} params
   * @return {string}
   */
  static async createAccessToken(params) {
    params.tokenType = this.tokenTypes.access;
    params.ttl = moment()
      .add(6, "months")
      .unix();
    return this.create(params);
  }

  /**
   * Get a token string
   * @param {string} tokenString
   * @return {TokenModel|null}
   */
  static async getByTokenString(tokenString) {
    const items = await this._getByTokenString(tokenString);
    const models = items.map(item => {
      return this.toModel(item);
    });
    return models;
  }

  /**
   * Acquire a token with a token string。
   * @param {string} tokenString
   * @return {Object|null}
   */
  static async _getByTokenString(tokenString) {
    const query_str = `SELECT * FROM session_table WHERE token = '${tokenString}'`;
    const result = await dbConnection.query(query_str).catch(error => {
      throw error;
    });
    return result;
  }

  /**
   * Create instances from DynamoDB records。
   * @param {Object} item
   * @return {TokenModel|null}
   */
  static toModel(item) {
    if (!item) return null;
    const params = {
      token: item.PK !== undefined ? item.PK : null,
      userId: item.UserId !== undefined ? item.UserId : null,
      tokenType: item.TokenType !== undefined ? item.TokenType : null,
      ttl: item.TTL !== undefined ? item.TTL : null
    };
    return new TokenModel(params);
  }
}

TokenModel.dataType = "token";
TokenModel.tokenTypes = {
  access: "access",
  verify: "verify"
};

module.exports = TokenModel;

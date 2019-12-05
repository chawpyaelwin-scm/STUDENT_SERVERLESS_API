"use strict";

const AbstractService = require("./service/abstract");
const AuthorizationService = require('./service/authorization');
const TutorialService = require('./service/student');
const CustomErrors = require("./utils/customErrors");
const CustomError = CustomErrors.CustomError;

/**
 * Filter without authentication
 * @param {Object} params
 * @return {Object}
 */
const NoAuth = async params => {
  return params;
};

/**
 * Filter only for users
 * @param {Object} params
 * @return {Object}
 */
const UserOnly = async params => {
  const authedUser = await AuthorizationService.authenticate(params);
  params.currentUser = authedUser;
  return params;
};

const router = {
  '/user/signup': {
    POST: {
      auth: NoAuth,
      main: AuthorizationService.signup
    }
  },
  '/user/login': {
    POST: {
      auth: NoAuth,
      main: AuthorizationService.login
    }
  },
  '/user/logout': {
    POST: {
      auth: UserOnly,
      main: AuthorizationService.logout
    }
  },
  '/student': {
    GET: {
      auth: UserOnly,
      main: TutorialService.getAllStudent
    },
    POST: {
      auth: UserOnly,
      main: TutorialService.createStudent
    },
    DELETE: {
      auth: UserOnly,
      main: TutorialService.deleteAllStudent
    }
  },
  '/student/{stu_id}': {
    GET: {
      auth: UserOnly,
      main: TutorialService.getStudent
    },
    PUT: {
      auth: UserOnly,
      main: TutorialService.updateStudent
    },
    DELETE: {
      auth: UserOnly,
      main: TutorialService.deleteStudent
    }
  },
};

/************************************
 *Main Procressing
 ************************************/
module.exports.callHandler = async (event, context, callback) => {

  // Determine the handler to call from Url format and HTTP method.
  let handler = null;
  // try {
    handler = router[event.resource][event.httpMethod];
  // } catch (error) {
  //   return handleError(error, "This feature is not supported。", 404);
  // }
  const params = getEventParams(event);
  // Authentication processing
  let authedParams;
  try {
    authedParams = await handler.auth(params);
  } catch (error) {
    return handleError(error, "Authentication Failed");
  }

  // Main processing
  let serviceResponse;
  try {
    serviceResponse = await handler.main(authedParams);
  } catch (error) {
    return handleError(error, "Cannot carry post data");
  }
  return apiGatewayResponse(null, serviceResponse);
};

/**
 *Extract and return the parameters necessary for handler handling from event
 * @param {Object} event
 * @return {Object}
 */
const getEventParams = event => {
  let params = {
    headers: event.headers,
    path: event.pathParameters,
    query: event.queryStringParameters,
    body: event.body ? JSON.parse(event.body) : event.body
  };
  return params;
};

/**
 *Create a response object to be passed to API Gateway。
 * @param {number} statusCode
 * @param {Object} serviceResponse
 * @return {Object}
 */
const apiGatewayResponse = (statusCode, serviceResponse) => {
  let headers = {
    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
  };
  if (serviceResponse) {
    if (
      serviceResponse.headers &&
      typeof serviceResponse.headers === "object"
    ) {
      headers = {
        ...headers,
        ...serviceResponse.headers
      };
    }
  }

  const body =
    serviceResponse && serviceResponse.body ? serviceResponse.body : null;

  let response;
  let responseLog;
  if (
    headers["Content-Type"] === "application/octet-stream" ||
    headers["content-type"] === "application/octet-stream"
  ) {
    if (!statusCode) {
      statusCode = serviceResponse && serviceResponse.body ? 200 : 204;
    }
    response = {
      statusCode: statusCode,
      headers: headers,
      body: body,
      isBase64Encoded: true
    };
    responseLog = {
      ...response
    };
    responseLog.body = "[BASE_64_STRING]";
  } else {
    if (!statusCode) {
      statusCode =
        serviceResponse && serviceResponse.body ?
          serviceResponse.body.statusCode :
          204;
    }
    response = {
      statusCode: statusCode,
      headers: headers,
      body: JSON.stringify(body)
    };
    responseLog = {
      ...response
    };
  }
  return response;
};

/**
 * handleError
 * @param {Error|CustomError}
 * @param {string} message
 * @param {number} statusCode
 * @param {Array.<Object>} errors
 * @param {Object} headers
 * @return {Object}
 */
const handleError = (error, message, statusCode, errors, headers) => {
  const response = AbstractService.failed(
    error,
    message,
    statusCode,
    errors,
    headers
  );
  return apiGatewayResponse(null, response);
};

// backend/src/utils/db.js
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// Legacy query method using raw SQL - keep for backward compatibility
const query = async (text, params) => {
    try {
        return await sequelize.query(text, {
            replacements: params,
            type: QueryTypes.SELECT
        });
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Query that returns query result with rows property to match pg client
const legacyQuery = async (text, params) => {
    try {
        const results = await sequelize.query(text, {
            replacements: params,
            type: QueryTypes.SELECT
        });
        return { rows: results };
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Function to execute an insert query and return the specified returning columns
const insert = async (text, params, returning = '') => {
    try {
        const queryText = returning ? `${text} RETURNING ${returning}` : text;
        const results = await sequelize.query(queryText, {
            replacements: params,
            type: QueryTypes.INSERT
        });
        return { rows: results[0] };
    } catch (error) {
        console.error('Database insert error:', error);
        throw error;
    }
};

// Function to execute an update query and return the specified returning columns
const update = async (text, params, returning = '') => {
    try {
        const queryText = returning ? `${text} RETURNING ${returning}` : text;
        const results = await sequelize.query(queryText, {
            replacements: params,
            type: QueryTypes.UPDATE
        });
        return { rows: results[0] };
    } catch (error) {
        console.error('Database update error:', error);
        throw error;
    }
};

// Function to execute a delete query and return the specified returning columns
const remove = async (text, params, returning = '') => {
    try {
        const queryText = returning ? `${text} RETURNING ${returning}` : text;
        const results = await sequelize.query(queryText, {
            replacements: params,
            type: QueryTypes.DELETE
        });
        return { rows: results[0] };
    } catch (error) {
        console.error('Database delete error:', error);
        throw error;
    }
};

module.exports = {
    query: legacyQuery, // Use legacyQuery to match pg client interface
    rawQuery: query,    // Use for queries where raw results are needed
    insert,
    update,
    remove,
    sequelize           // Export sequelize instance for advanced operations
};
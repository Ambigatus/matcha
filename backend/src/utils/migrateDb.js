// backend/src/utils/migrateDb.js
require('dotenv').config();
const { sequelize } = require('../config/database');
const models = require('../models');
const { QueryTypes } = require('sequelize');

const migrateDatabase = async () => {
    try {
        console.log('Starting database migration...');

        // Force sync will drop tables and recreate them
        // ⚠️ WARNING: This will destroy existing data, use only in development
        const force = process.env.NODE_ENV !== 'production' &&
            (process.argv.includes('--force') || process.argv.includes('-f'));

        // Alter sync will attempt to modify tables to match models
        const alter = !force &&
            (process.argv.includes('--alter') || process.argv.includes('-a'));

        if (force) {
            console.log('⚠️ FORCE MODE ENABLED - This will destroy all existing data!');
            console.log('You have 5 seconds to cancel (CTRL+C)...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log(`Syncing database with${force ? ' force' : alter ? ' alter' : ''} option...`);

        // Special migration for profiles table if we're altering
        if (alter && !force) {
            try {
                // Check if profiles table exists
                const profilesExist = await sequelize.query(
                    `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
          )`,
                    { type: QueryTypes.SELECT }
                );

                if (profilesExist[0].exists) {
                    console.log('Fixing profiles table before migration...');

                    // Drop default value constraint for sexual_preference to prevent ENUM cast error
                    await sequelize.query(
                        `ALTER TABLE profiles 
             ALTER COLUMN sexual_preference DROP DEFAULT`,
                        { type: QueryTypes.RAW }
                    );

                    console.log('Successfully prepared profiles table for migration');
                }
            } catch (err) {
                console.log('Warning: Could not pre-process profiles table:', err.message);
                console.log('Continuing with regular migration...');
            }
        }

        // Sync models with database
        await sequelize.sync({ force, alter });

        // Post-migration data fixes if needed
        if (alter && !force) {
            try {
                console.log('Running post-migration fixes...');

                // Update any NULL sexual_preference to default value
                await sequelize.query(
                    `UPDATE profiles 
           SET sexual_preference = 'bisexual' 
           WHERE sexual_preference IS NULL`,
                    { type: QueryTypes.UPDATE }
                );

                console.log('Post-migration fixes completed');
            } catch (err) {
                console.log('Warning: Post-migration fixes had issues:', err.message);
            }
        }

        console.log('✅ Database migration completed successfully!');
        console.log('Models synchronized:');
        Object.keys(models).forEach(model => {
            console.log(`  - ${model}`);
        });

        // Exit the process
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration if this file is executed directly
if (require.main === module) {
    migrateDatabase();
}

module.exports = migrateDatabase;
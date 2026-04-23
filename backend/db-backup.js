#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
require("dotenv").config();

const outputDir = path.join(__dirname, "lib");
const dumpCommand = process.env.PG_DUMP_PATH || "pg_dump";

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432",
    database: process.env.DB_NAME || "campus_mart",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
};

function createTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}

function ensureOutputDir() {
    fs.mkdirSync(outputDir, { recursive: true });
}

function createDumpFilePath() {
    const safeDbName = dbConfig.database.replace(/[^a-z0-9_-]/gi, "_");
    return path.join(outputDir, `${safeDbName}_dump_${createTimestamp()}.sql`);
}

function backupDatabase() {
    ensureOutputDir();

    const outputFile = createDumpFilePath();

    const args = [
        "-h",
        dbConfig.host,
        "-p",
        String(dbConfig.port),
        "-U",
        dbConfig.user,
        "-F",
        "p",
        "-w",
        "-f",
        outputFile,
        dbConfig.database,
    ];

    const result = spawnSync(dumpCommand, args, {
        env: {
            ...process.env,
            PGPASSWORD: dbConfig.password,
        },
        stdio: "inherit",
        windowsHide: true,
    });

    if (result.error) {
        throw new Error(
            `Unable to run ${dumpCommand}. Make sure PostgreSQL tools are installed and ${dumpCommand} is available in PATH.`,
        );
    }

    if (result.status !== 0) {
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }

        throw new Error(`Database dump failed with exit code ${result.status}.`);
    }

    console.log(`Database dump created successfully: ${outputFile}`);
    return outputFile;
}

if (require.main === module) {
    try {
        backupDatabase();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = backupDatabase;

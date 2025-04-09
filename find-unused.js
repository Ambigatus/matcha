#!/usr/bin/env node
/**
 * This script helps identify potential unused variables and functions
 * in your JavaScript/React codebase.
 *
 * Save as 'find-unused.js' and run with: node find-unused.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DIRECTORIES_TO_SCAN = [
    './backend/src',
    './frontend/src'
];

const FILE_EXTENSIONS = ['.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', 'build', 'dist', '.git'];

// Track found issues
const issues = {
    unusedVariables: [],
    unusedFunctions: [],
    duplicateCode: [],
    commentedCode: []
};

// ANSI colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

/**
 * Get all JavaScript/React files in a directory
 */
function getJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);

        // Skip excluded directories
        if (EXCLUDE_DIRS.includes(file)) {
            return;
        }

        if (fs.statSync(filePath).isDirectory()) {
            getJsFiles(filePath, fileList);
        } else if (FILE_EXTENSIONS.includes(path.extname(file))) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Find unused variables using regex
 */
function findUnusedVariables(filePath, content) {
    // Look for declared variables that don't appear elsewhere in the file
    const declarationRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=/g;
    let match;
    const variables = [];

    while ((match = declarationRegex.exec(content)) !== null) {
        const varName = match[1];

        // Skip common excluded variables
        if (['props', 'state', 'dispatch', 'navigate'].includes(varName)) {
            continue;
        }

        // Check if variable is used elsewhere in the file (excluding its declaration)
        const varUsageRegex = new RegExp(`[^a-zA-Z0-9_]${varName}[^a-zA-Z0-9_]`, 'g');
        const declarationPos = match.index;

        // Count occurrences, excluding the declaration
        let usageCount = 0;
        let usageMatch;

        while ((usageMatch = varUsageRegex.exec(content)) !== null) {
            // Ensure we're not just matching the declaration
            if (Math.abs(usageMatch.index - declarationPos) > varName.length + 10) {
                usageCount++;
            }
        }

        if (usageCount === 0) {
            variables.push({
                name: varName,
                line: content.substring(0, match.index).split('\n').length
            });
        }
    }

    return variables;
}

/**
 * Find unused functions using regex
 */
function findUnusedFunctions(filePath, content) {
    // Match function declarations (both named functions and arrow functions assigned to constants)
    const functionRegex = /(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_,\s]+)\s*=>\s*{)/g;
    let match;
    const functions = [];

    while ((match = functionRegex.exec(content)) !== null) {
        const funcName = match[1] || match[2]; // Either direct function name or constant name

        if (!funcName) continue;

        // Skip common excluded function names
        if (['render', 'componentDidMount', 'componentDidUpdate', 'useEffect', 'useState'].includes(funcName)) {
            continue;
        }

        // Check if function is used elsewhere
        const funcUsageRegex = new RegExp(`[^a-zA-Z0-9_]${funcName}[^a-zA-Z0-9_]`, 'g');
        const declarationPos = match.index;

        // Count occurrences, excluding the declaration
        let usageCount = 0;
        let usageMatch;

        while ((usageMatch = funcUsageRegex.exec(content)) !== null) {
            // Ensure we're not just matching the declaration
            if (Math.abs(usageMatch.index - declarationPos) > funcName.length + 10) {
                usageCount++;
            }
        }

        // Also check if it's exported
        const isExported = content.includes(`export ${match[0]}`) ||
            content.includes(`exports.${funcName}`) ||
            content.includes(`export default ${funcName}`);

        if (usageCount === 0 && !isExported) {
            functions.push({
                name: funcName,
                line: content.substring(0, match.index).split('\n').length
            });
        }
    }

    return functions;
}

/**
 * Find commented out code blocks
 */
function findCommentedCode(filePath, content) {
    const commentedCodeRegex = /\/\/\s*(const|let|var|function|if|for|while|switch|return|import|export)/g;
    let match;
    const comments = [];

    while ((match = commentedCodeRegex.exec(content)) !== null) {
        comments.push({
            line: content.substring(0, match.index).split('\n').length,
            code: match[0]
        });
    }

    // Also find block comments with code
    const blockCommentRegex = /\/\*[\s\S]*?(const|let|var|function|if|for|while|switch|return|import|export)[\s\S]*?\*\//g;
    while ((match = blockCommentRegex.exec(content)) !== null) {
        comments.push({
            line: content.substring(0, match.index).split('\n').length,
            code: match[0].substring(0, 40) + '...' // Truncate for readability
        });
    }

    return comments;
}

/**
 * Scan a file for potential issues
 */
function scanFile(filePath) {
    console.log(`${colors.blue}Scanning${colors.reset}: ${filePath}`);

    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Find unused variables
        const unusedVars = findUnusedVariables(filePath, content);
        if (unusedVars.length) {
            issues.unusedVariables.push({
                file: filePath,
                variables: unusedVars
            });
        }

        // Find unused functions
        const unusedFuncs = findUnusedFunctions(filePath, content);
        if (unusedFuncs.length) {
            issues.unusedFunctions.push({
                file: filePath,
                functions: unusedFuncs
            });
        }

        // Find commented code
        const commentedCode = findCommentedCode(filePath, content);
        if (commentedCode.length) {
            issues.commentedCode.push({
                file: filePath,
                comments: commentedCode
            });
        }
    } catch (error) {
        console.error(`${colors.red}Error scanning${colors.reset} ${filePath}: ${error.message}`);
    }
}

/**
 * Run eslint to find unused variables if available
 */
function runEslint() {
    try {
        console.log(`${colors.green}Running ESLint no-unused-vars rule${colors.reset}`);
        const result = execSync('npx eslint --no-eslintrc --rule "no-unused-vars: error" "**/*.js"', { encoding: 'utf8' });
        console.log(result);
    } catch (error) {
        console.log(error.stdout);
        console.log(`${colors.yellow}Note${colors.reset}: ESLint errors above are expected and helpful for finding unused variables.`);
    }
}

/**
 * Print a summary of findings
 */
function printSummary() {
    console.log('\n==================================================');
    console.log(`${colors.green}CLEANUP REPORT${colors.reset}`);
    console.log('==================================================\n');

    // Print unused variables
    console.log(`${colors.yellow}POTENTIALLY UNUSED VARIABLES${colors.reset} (${issues.unusedVariables.reduce((sum, file) => sum + file.variables.length, 0)} total)`);
    console.log('--------------------------------------------------');
    issues.unusedVariables.forEach(file => {
        console.log(`${colors.cyan}${file.file}${colors.reset}:`);
        file.variables.forEach(v => {
            console.log(`  Line ${v.line}: ${colors.red}${v.name}${colors.reset}`);
        });
        console.log('');
    });

    // Print unused functions
    console.log(`${colors.yellow}POTENTIALLY UNUSED FUNCTIONS${colors.reset} (${issues.unusedFunctions.reduce((sum, file) => sum + file.functions.length, 0)} total)`);
    console.log('--------------------------------------------------');
    issues.unusedFunctions.forEach(file => {
        console.log(`${colors.cyan}${file.file}${colors.reset}:`);
        file.functions.forEach(f => {
            console.log(`  Line ${f.line}: ${colors.red}${f.name}${colors.reset}`);
        });
        console.log('');
    });

    // Print commented code
    console.log(`${colors.yellow}COMMENTED CODE${colors.reset} (${issues.commentedCode.reduce((sum, file) => sum + file.comments.length, 0)} instances)`);
    console.log('--------------------------------------------------');
    issues.commentedCode.forEach(file => {
        console.log(`${colors.cyan}${file.file}${colors.reset}:`);
        file.comments.forEach(c => {
            console.log(`  Line ${c.line}: ${colors.magenta}${c.code}${colors.reset}`);
        });
        console.log('');
    });

    console.log('==================================================');
    console.log(`${colors.green}CLEANUP SUMMARY${colors.reset}`);
    console.log('==================================================');
    console.log(`${colors.yellow}Potentially unused variables${colors.reset}: ${issues.unusedVariables.reduce((sum, file) => sum + file.variables.length, 0)}`);
    console.log(`${colors.yellow}Potentially unused functions${colors.reset}: ${issues.unusedFunctions.reduce((sum, file) => sum + file.functions.length, 0)}`);
    console.log(`${colors.yellow}Commented code instances${colors.reset}: ${issues.commentedCode.reduce((sum, file) => sum + file.comments.length, 0)}`);
    console.log('\n==================================================');
    console.log(`${colors.red}IMPORTANT${colors.reset}: This is an automated analysis and may include false positives.`);
    console.log('Carefully review each finding before making changes.');
    console.log('==================================================\n');
}

// Main execution
try {
    // Try to run ESLint first for better results
    try {
        runEslint();
    } catch (error) {
        console.log(`${colors.yellow}ESLint check skipped.${colors.reset} Install ESLint for better results.`);
    }

    // Scan all directories
    DIRECTORIES_TO_SCAN.forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = getJsFiles(dir);
            files.forEach(scanFile);
        } else {
            console.log(`${colors.yellow}Warning${colors.reset}: Directory '${dir}' does not exist.`);
        }
    });

    // Print findings
    printSummary();
} catch (error) {
    console.error(`${colors.red}Script error${colors.reset}: ${error.message}`);
}


/**
 * ESLint configuration for project-wide linting
 * Save this as .eslintrc.js
 */
/*
module.exports = {
  "env": {
    "browser": true,
    "node": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-hooks"
  ],
  "rules": {
    // Rules to detect unused variables and functions
    "no-unused-vars": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // Additional rules for code quality
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
};
*/
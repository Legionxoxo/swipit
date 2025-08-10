/**
 * @fileoverview Tests for CSV parser
 * @author Backend Team
 */

const { parseCsvContent, isValidInstagramUrl, normalizeInstagramUrl } = require('../functions/csv/csvParser');

// Test valid Instagram URLs
function testValidUrls() {
    const validUrls = [
        'https://www.instagram.com/p/ABC123/',
        'https://www.instagram.com/reel/DEF456/',
        'https://www.instagram.com/tv/GHI789/',
        'https://instagram.com/p/JKL012/',
        'https://www.instagram.com/p/MNO345'
    ];
    
    console.log('Testing valid Instagram URLs...');
    for (const url of validUrls) {
        if (!isValidInstagramUrl(url)) {
            console.error(`❌ Failed: ${url} should be valid`);
            return false;
        }
    }
    console.log('✅ All valid URLs passed');
    return true;
}

// Test invalid Instagram URLs
function testInvalidUrls() {
    const invalidUrls = [
        'https://twitter.com/p/ABC123/',
        'https://www.instagram.com/username/',
        'https://www.instagram.com/',
        'not-a-url',
        'https://google.com'
    ];
    
    console.log('Testing invalid Instagram URLs...');
    for (const url of invalidUrls) {
        if (isValidInstagramUrl(url)) {
            console.error(`❌ Failed: ${url} should be invalid`);
            return false;
        }
    }
    console.log('✅ All invalid URLs correctly rejected');
    return true;
}

// Test URL normalization
function testUrlNormalization() {
    console.log('Testing URL normalization...');
    
    const tests = [
        {
            input: 'https://www.instagram.com/p/ABC123/?utm_source=test',
            expected: 'https://www.instagram.com/p/ABC123'
        },
        {
            input: 'https://www.instagram.com/reel/DEF456/',
            expected: 'https://www.instagram.com/reel/DEF456'
        }
    ];
    
    for (const test of tests) {
        const normalized = normalizeInstagramUrl(test.input);
        if (normalized !== test.expected) {
            console.error(`❌ Failed: ${test.input} normalized to ${normalized}, expected ${test.expected}`);
            return false;
        }
    }
    console.log('✅ URL normalization passed');
    return true;
}

// Test CSV parsing
function testCsvParsing() {
    console.log('Testing CSV parsing...');
    
    const csvContent = `url,tag
https://www.instagram.com/p/ABC123/,fashion
https://www.instagram.com/reel/DEF456/,travel
invalid-url,test
https://www.instagram.com/p/ABC123/,duplicate
https://twitter.com/status/123,social`;
    
    const result = parseCsvContent(csvContent, {
        skipHeader: true,
        maxRows: 10,
        removeDuplicates: true
    });
    
    if (!result.success) {
        console.error('❌ Failed: CSV parsing should succeed');
        return false;
    }
    
    if (result.validRows !== 2) {
        console.error(`❌ Failed: Expected 2 valid rows, got ${result.validRows}`);
        return false;
    }
    
    if (result.rows[0].tag !== 'fashion') {
        console.error(`❌ Failed: First row tag should be 'fashion', got ${result.rows[0].tag}`);
        return false;
    }
    
    console.log('✅ CSV parsing passed');
    console.log(`  - Valid rows: ${result.validRows}`);
    console.log(`  - Total rows: ${result.totalRows}`);
    console.log(`  - Errors: ${result.errors.length}`);
    return true;
}

// Run all tests
function runTests() {
    console.log('Running CSV Parser Tests\n' + '='.repeat(40));
    
    const tests = [
        testValidUrls,
        testInvalidUrls,
        testUrlNormalization,
        testCsvParsing
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            if (test()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test error: ${error.message}`);
            failed++;
        }
        console.log('');
    }
    
    console.log('='.repeat(40));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();
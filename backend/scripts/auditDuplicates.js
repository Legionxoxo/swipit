#!/usr/bin/env node
/**
 * @fileoverview Script to audit database for duplicate analysis IDs
 * @author Backend Team
 */

const { auditDuplicateAnalysisIds } = require('../utils/databaseIdValidator');

async function runAudit() {
    try {
        console.log('🔍 Starting duplicate analysis ID audit...');
        
        const auditResults = await auditDuplicateAnalysisIds();
        
        console.log('\n📊 AUDIT RESULTS:');
        console.log('=================');
        console.log(`YouTube duplicates: ${auditResults.youtubeDuplicates}`);
        console.log(`Instagram duplicates: ${auditResults.instagramDuplicates}`);
        console.log(`Cross-platform duplicates: ${auditResults.crossPlatformDuplicates}`);
        
        if (auditResults.youtubeDuplicates > 0) {
            console.log('\n❌ YouTube duplicate details:');
            auditResults.details.youtube.forEach(dup => {
                console.log(`   ${dup.analysis_id}: ${dup.count} occurrences`);
            });
        }
        
        if (auditResults.instagramDuplicates > 0) {
            console.log('\n❌ Instagram duplicate details:');
            auditResults.details.instagram.forEach(dup => {
                console.log(`   ${dup.analysis_id}: ${dup.count} occurrences`);
            });
        }
        
        if (auditResults.crossPlatformDuplicates > 0) {
            console.log('\n❌ Cross-platform duplicate details:');
            auditResults.details.crossPlatform.forEach(dup => {
                console.log(`   ${dup.analysis_id}: exists in both platforms`);
            });
        }
        
        const totalDuplicates = auditResults.youtubeDuplicates + 
                              auditResults.instagramDuplicates + 
                              auditResults.crossPlatformDuplicates;
        
        if (totalDuplicates === 0) {
            console.log('\n✅ No duplicate analysis IDs found!');
        } else {
            console.log(`\n⚠️  Total duplicate issues: ${totalDuplicates}`);
            console.log('\n💡 Recommendations:');
            console.log('   1. Clean up existing duplicates before applying unique constraints');
            console.log('   2. Use the new centralized ID generators for all new entries');
            console.log('   3. Apply database unique constraints after cleanup');
        }
        
    } catch (error) {
        console.error('❌ Audit failed:', error.message);
        process.exit(1);
    }
}

// Run the audit if called directly
if (require.main === module) {
    runAudit();
}

module.exports = { runAudit };
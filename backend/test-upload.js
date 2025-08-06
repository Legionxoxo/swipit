/**
 * Test script for audio upload functionality
 */

require('dotenv').config();
const { downloadAndUploadAudio } = require('./utils/transcription/audioUploader');

async function testAudioUpload() {
    console.log('Testing audio download and upload...\n');
    
    const testUrl = 'https://www.youtube.com/watch?v=BpwPSBmyTs8'; // Short 9-second video
    const apiKey = process.env.ASSEMBLY_API_KEY;
    
    if (!apiKey) {
        console.log('❌ ASSEMBLY_API_KEY not found in environment');
        return;
    }
    
    console.log(`Testing with: ${testUrl}`);
    console.log(`API Key: ${apiKey.substring(0, 10)}...`);
    
    try {
        const result = await downloadAndUploadAudio(testUrl, apiKey);
        
        if (result.success) {
            console.log('\n✅ SUCCESS!');
            console.log('Upload URL:', result.uploadUrl);
            console.log('Message:', result.message);
        } else {
            console.log('\n❌ FAILED');
            console.log('Error:', result.error);
            console.log('Message:', result.message);
        }
    } catch (error) {
        console.log('\n🚨 EXCEPTION:', error.message);
    }
}

// Run the test
testAudioUpload().then(() => {
    console.log('\nTest completed.');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
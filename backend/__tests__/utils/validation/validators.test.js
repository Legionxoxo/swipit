/**
 * @fileoverview Tests for validation utilities
 * @author Backend Team
 */

const { validateApiKeyFormat } = require('../../../utils/validation/validators');

describe('Validation Utilities', () => {
    beforeEach(() => {
        try {
            // Clear all mocks
            jest.clearAllMocks();
            
        } catch (error) {
            console.error('Test setup error:', error);
            throw error;
        } finally {
            // Test setup completed
        }
    });

    afterEach(() => {
        try {
            // Clean up any test-specific data
            
        } catch (error) {
            console.error('Test cleanup error:', error);
        } finally {
            // Test cleanup completed
        }
    });

    describe('validateApiKeyFormat', () => {
        it('should validate correct YouTube API key format', () => {
            try {
                // Arrange
                const validApiKeys = [
                    'AIzaSyC1234567890abcdefghijklmnopqrstuv1',
                    'AIzaAbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
                    'AIza1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                    'AIza_-123456789abcdefghijklmnopqrstuvwx',
                    'AIzaQWERTYUIOPASDFGHJKLZXCVBNM1234567890'
                ];

                // Act & Assert
                for (const apiKey of validApiKeys) {
                    const result = validateApiKeyFormat(apiKey);
                    expect(result).toBe(true);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should reject invalid YouTube API key formats', () => {
            try {
                // Arrange
                const invalidApiKeys = [
                    // Wrong prefix
                    'AIzb1234567890abcdefghijklmnopqrstuv1',
                    'BIzaSyC1234567890abcdefghijklmnopqrstuv1',
                    'aizaSyC1234567890abcdefghijklmnopqrstuv1',
                    
                    // Wrong length (too short)
                    'AIzaSyC1234567890abcdefghijklmnopqrstu',
                    'AIza123456789012345678901234567890123',
                    
                    // Wrong length (too long)
                    'AIzaSyC1234567890abcdefghijklmnopqrstuv12',
                    'AIza12345678901234567890123456789012345678',
                    
                    // Invalid characters
                    'AIzaSyC1234567890abcdefghijklmnopqr@tuv1',
                    'AIzaSyC1234567890abcdefghijklmnopqr#tuv1',
                    'AIzaSyC1234567890abcdefghijklmnopqr$tuv1',
                    'AIzaSyC1234567890abcdefghijklmnopqr%tuv1',
                    'AIzaSyC1234567890abcdefghijklmnopqr+tuv1',
                    'AIzaSyC1234567890abcdefghijklmnopqr=tuv1',
                    'AIzaSyC1234567890abcdefghijklmnopqr tuv1', // space
                    
                    // Empty or null values
                    '',
                    ' ',
                    null,
                    undefined,
                    
                    // Non-string types
                    123,
                    {},
                    [],
                    true,
                    false
                ];

                // Act & Assert
                for (const apiKey of invalidApiKeys) {
                    const result = validateApiKeyFormat(apiKey);
                    expect(result).toBe(false);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle edge cases with special characters', () => {
            try {
                // Arrange
                const validWithSpecialChars = [
                    'AIza123456789012345678901234567890123_',
                    'AIza12345678901234567890123456789012-3',
                    'AIza_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_'
                ];

                const invalidWithSpecialChars = [
                    'AIza123456789012345678901234567890123.',
                    'AIza12345678901234567890123456789012/3',
                    'AIza12345678901234567890123456789012\\3',
                    'AIza123456789012345678901234567890123|'
                ];

                // Act & Assert
                for (const apiKey of validWithSpecialChars) {
                    expect(validateApiKeyFormat(apiKey)).toBe(true);
                }

                for (const apiKey of invalidWithSpecialChars) {
                    expect(validateApiKeyFormat(apiKey)).toBe(false);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle unicode characters correctly', () => {
            try {
                // Arrange
                const unicodeApiKeys = [
                    'AIzaSyC1234567890abcdefghijklmnopqrütüv1', // ü characters
                    'AIzaSyC1234567890abcdefghijklmnopqrñtuv1', // ñ character
                    'AIzaSyC1234567890abcdefghijklmnopqr東tuv1', // Japanese character
                    'AIzaSyC1234567890abcdefghijklmnopqr😀tuv1'  // Emoji
                ];

                // Act & Assert
                for (const apiKey of unicodeApiKeys) {
                    const result = validateApiKeyFormat(apiKey);
                    expect(result).toBe(false); // Should reject unicode characters
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle whitespace in various positions', () => {
            try {
                // Arrange
                const whitespaceApiKeys = [
                    ' AIzaSyC1234567890abcdefghijklmnopqrstuv1', // Leading space
                    'AIzaSyC1234567890abcdefghijklmnopqrstuv1 ', // Trailing space
                    ' AIzaSyC1234567890abcdefghijklmnopqrstuv1 ', // Both
                    'AIzaSyC1234567890abcde fghijklmnopqrstuv1', // Middle space
                    'AIzaSyC1234567890abcde\tfghijklmnopqrstuv1', // Tab character
                    'AIzaSyC1234567890abcde\nfghijklmnopqrstuv1'  // Newline character
                ];

                // Act & Assert
                for (const apiKey of whitespaceApiKeys) {
                    const result = validateApiKeyFormat(apiKey);
                    expect(result).toBe(false); // Should reject all whitespace variations
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle case sensitivity correctly', () => {
            try {
                // Arrange
                const caseVariations = [
                    'aizaSyC1234567890abcdefghijklmnopqrstuv1', // lowercase prefix
                    'AIZASYC1234567890ABCDEFGHIJKLMNOPQRSTUV1', // all uppercase
                    'AIZaSyC1234567890abcdefghijklmnopqrstuv1', // mixed case in prefix
                    'AIzAsyC1234567890abcdefghijklmnopqrstuv1'  // mixed case in prefix
                ];

                // Act & Assert
                expect(validateApiKeyFormat(caseVariations[0])).toBe(false); // lowercase prefix should fail
                expect(validateApiKeyFormat(caseVariations[1])).toBe(true);  // all uppercase should pass
                expect(validateApiKeyFormat(caseVariations[2])).toBe(false); // wrong case in prefix should fail
                expect(validateApiKeyFormat(caseVariations[3])).toBe(false); // wrong case in prefix should fail

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle boundary length cases', () => {
            try {
                // Arrange
                const boundaryLengthCases = [
                    'AIza', // 4 characters (minimum prefix)
                    'AIza1', // 5 characters
                    'AIza' + '1'.repeat(35), // Exactly 39 characters (valid)
                    'AIza' + '1'.repeat(34), // 38 characters (too short)
                    'AIza' + '1'.repeat(36), // 40 characters (too long)
                    'AIza' + '1'.repeat(100) // Very long
                ];

                // Act & Assert
                expect(validateApiKeyFormat(boundaryLengthCases[0])).toBe(false); // Too short
                expect(validateApiKeyFormat(boundaryLengthCases[1])).toBe(false); // Too short
                expect(validateApiKeyFormat(boundaryLengthCases[2])).toBe(true);  // Exactly right
                expect(validateApiKeyFormat(boundaryLengthCases[3])).toBe(false); // Too short
                expect(validateApiKeyFormat(boundaryLengthCases[4])).toBe(false); // Too long
                expect(validateApiKeyFormat(boundaryLengthCases[5])).toBe(false); // Very long

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle malformed input gracefully', () => {
            try {
                // Arrange
                const malformedInputs = [
                    new String('AIzaSyC1234567890abcdefghijklmnopqrstuv1'), // String object
                    { toString: () => 'AIzaSyC1234567890abcdefghijklmnopqrstuv1' }, // Object with toString
                    function() { return 'AIzaSyC1234567890abcdefghijklmnopqrstuv1'; }, // Function
                    Symbol('AIzaSyC1234567890abcdefghijklmnopqrstuv1'), // Symbol
                    BigInt(123456789012345678901234567890123456), // BigInt
                ];

                // Act & Assert
                for (const input of malformedInputs) {
                    const result = validateApiKeyFormat(input);
                    expect(result).toBe(false); // Should handle gracefully and return false
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should not throw errors for any input type', () => {
            try {
                // Arrange
                const extremeInputs = [
                    null,
                    undefined,
                    NaN,
                    Infinity,
                    -Infinity,
                    0,
                    -1,
                    '',
                    {},
                    [],
                    /regex/,
                    new Date(),
                    new Error('test'),
                    Promise.resolve('test')
                ];

                // Act & Assert - none should throw errors
                for (const input of extremeInputs) {
                    expect(() => validateApiKeyFormat(input)).not.toThrow();
                    expect(validateApiKeyFormat(input)).toBe(false);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle actual real YouTube API key patterns', () => {
            try {
                // Arrange - These are realistic patterns but not real keys
                const realisticApiKeys = [
                    'AIzaSyBnKmZ1234567890abcdefghijk1mn0pqr',
                    'AIzaSyC-_123456789abcdefghijklmnop_qrstuv',
                    'AIzaSyDh9876543210ZYXWVUTSRQPONMLKjihgf',
                    'AIzaSyE_123abc789DEF456ghi012JKL345mno678'
                ];

                // Act & Assert
                for (const apiKey of realisticApiKeys) {
                    const result = validateApiKeyFormat(apiKey);
                    expect(result).toBe(true);
                }

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle console.error failures gracefully', () => {
            try {
                // Arrange
                const originalConsoleError = console.error;
                console.error = jest.fn(() => {
                    throw new Error('Console error failed');
                });

                // Act & Assert - should not throw despite console.error failure
                expect(() => validateApiKeyFormat(null)).not.toThrow();
                expect(validateApiKeyFormat(null)).toBe(false);

                // Restore console.error
                console.error = originalConsoleError;

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle regex test failures gracefully', () => {
            try {
                // This test verifies the function is robust against regex failures
                // In practice, the regex should not fail, but we test defensive programming
                
                // Mock the regex test to throw an error
                const originalRegexTest = RegExp.prototype.test;
                RegExp.prototype.test = jest.fn(() => {
                    throw new Error('Regex test failed');
                });

                // Act & Assert - should handle gracefully
                const result = validateApiKeyFormat('AIzaSyC1234567890abcdefghijklmnopqrstuv1');
                expect(result).toBe(false);

                // Restore original regex test
                RegExp.prototype.test = originalRegexTest;

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should maintain performance with large inputs', () => {
            try {
                // Arrange
                const veryLargeString = 'AIza' + 'a'.repeat(100000); // Very large string

                // Act
                const startTime = Date.now();
                const result = validateApiKeyFormat(veryLargeString);
                const endTime = Date.now();

                // Assert
                expect(result).toBe(false); // Should be invalid due to length
                expect(endTime - startTime).toBeLessThan(100); // Should complete quickly

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });

        it('should handle concurrent validations correctly', async () => {
            try {
                // Arrange
                const apiKeys = [
                    'AIzaSyC1234567890abcdefghijklmnopqrstuv1',
                    'invalid_key',
                    'AIzaSyD1234567890abcdefghijklmnopqrstuv2',
                    null,
                    'AIzaSyE1234567890abcdefghijklmnopqrstuv3'
                ];

                // Act - run validations concurrently
                const promises = apiKeys.map(key => 
                    new Promise(resolve => {
                        const result = validateApiKeyFormat(key);
                        resolve({ key, result });
                    })
                );

                const results = await Promise.all(promises);

                // Assert
                expect(results[0].result).toBe(true);  // Valid
                expect(results[1].result).toBe(false); // Invalid
                expect(results[2].result).toBe(true);  // Valid
                expect(results[3].result).toBe(false); // Null
                expect(results[4].result).toBe(true);  // Valid

            } catch (error) {
                console.error('Test error:', error);
                throw error;
            } finally {
                // Test completed
            }
        });
    });
});
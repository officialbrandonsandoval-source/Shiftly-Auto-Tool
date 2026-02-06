/**
 * Claude API client for Anthropic's LLM
 * Handles listing generation with streaming support for real-time UI updates
 */
import https from 'https';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-dev-key-placeholder';
const ANTHROPIC_API_HOST = 'api.anthropic.com';
const ANTHROPIC_API_VERSION = '2024-01-15';
/**
 * Generate platform-optimized listing copy with Claude
 */
export async function generateListingVariations(options) {
    const prompt = buildListingPrompt(options);
    return new Promise((resolve, reject) => {
        try {
            const payload = JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const requestOptions = {
                hostname: ANTHROPIC_API_HOST,
                port: 443,
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': ANTHROPIC_API_VERSION,
                },
            };
            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        const content = response.content[0]?.text || '';
                        const variations = parseListingResponse(content, options);
                        resolve({
                            ...variations,
                            estimatedTokens: response.usage?.input_tokens || 0,
                        });
                    }
                    catch (err) {
                        reject(new Error(`Failed to parse Claude response: ${err}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
/**
 * Generate listing with streaming for real-time mobile updates
 */
export async function generateListingVariationsStream(options, onChunk) {
    const prompt = buildListingPrompt(options);
    return new Promise((resolve, reject) => {
        try {
            const payload = JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                stream: true,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const requestOptions = {
                hostname: ANTHROPIC_API_HOST,
                port: 443,
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': ANTHROPIC_API_VERSION,
                },
            };
            let fullContent = '';
            const req = https.request(requestOptions, (res) => {
                res.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            try {
                                const json = JSON.parse(line.slice(5));
                                const text = json.delta?.text || '';
                                if (text) {
                                    fullContent += text;
                                    onChunk(text);
                                }
                            }
                            catch (e) {
                                // Ignore parse errors in stream
                            }
                        }
                    }
                });
                res.on('end', () => {
                    try {
                        const variations = parseListingResponse(fullContent, options);
                        resolve({
                            ...variations,
                            estimatedTokens: fullContent.length / 4, // Rough estimate
                        });
                    }
                    catch (err) {
                        reject(new Error(`Failed to parse streamed response: ${err}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
/**
 * Build the prompt for listing generation
 */
function buildListingPrompt(options) {
    return `You are an expert automotive listing copywriter. Generate compelling, platform-optimized listings for this vehicle:

VEHICLE INFO:
- Year: ${options.year}
- Make: ${options.make}
- Model: ${options.model}
- Condition: ${options.condition}
- Mileage: ${options.mileage.toLocaleString()} miles
- Price: $${options.price.toLocaleString()}
- Transmission: ${options.transmission || 'Not specified'}
- Fuel Type: ${options.fuelType || 'Not specified'}
- VIN: ${options.vin || 'Not available'}
${options.features ? `- Key Features: ${options.features.join(', ')}` : ''}
${options.description ? `- Description: ${options.description}` : ''}

Please generate the following in JSON format (no markdown, just plain JSON):

{
  "facebook": {
    "title": "Short, catchy title for Facebook (max 50 chars)",
    "description": "Engaging Facebook description (150-200 chars, focus on deal and condition)"
  },
  "craigslist": {
    "title": "Descriptive Craigslist title (max 80 chars)",
    "description": "Detailed Craigslist description (400-600 words, include all specs, warranty info, etc.)"
  },
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "sellingPoints": ["point1", "point2", "point3"]
}

Generate ONLY valid JSON, no other text.`;
}
/**
 * Parse Claude's JSON response
 */
function parseListingResponse(content, options) {
    try {
        // Extract JSON from response (handle potential markdown code blocks)
        let json = content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            json = jsonMatch[0];
        }
        const parsed = JSON.parse(json);
        return {
            facebook: {
                title: parsed.facebook?.title || `${options.year} ${options.make} ${options.model}`,
                description: parsed.facebook?.description || `Beautiful ${options.year} ${options.make} ${options.model}. Only $${options.price.toLocaleString()}!`,
            },
            craigslist: {
                title: parsed.craigslist?.title || `${options.year} ${options.make} ${options.model} - $${options.price.toLocaleString()}`,
                description: parsed.craigslist?.description ||
                    `${options.year} ${options.make} ${options.model}\n\nMileage: ${options.mileage.toLocaleString()} miles\nCondition: ${options.condition}\nPrice: $${options.price.toLocaleString()}\n\nThis vehicle is in ${options.condition} condition and ready to drive. Contact us today!`,
            },
            keywords: parsed.keywords || ['vehicle', options.make.toLowerCase(), options.model.toLowerCase()],
            photoRanking: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // Default ranking (will be improved with vision in future)
        };
    }
    catch (err) {
        console.error('[Claude] Failed to parse response:', err);
        // Fallback to basic listing
        return {
            facebook: {
                title: `${options.year} ${options.make} ${options.model}`,
                description: `Beautiful vehicle. Only $${options.price.toLocaleString()}!`,
            },
            craigslist: {
                title: `${options.year} ${options.make} ${options.model} - $${options.price.toLocaleString()}`,
                description: `${options.year} ${options.make} ${options.model}\n\nMileage: ${options.mileage.toLocaleString()} miles\nCondition: ${options.condition}\nPrice: $${options.price.toLocaleString()}`,
            },
            keywords: [options.make.toLowerCase(), options.model.toLowerCase(), 'vehicle'],
            photoRanking: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        };
    }
}
/**
 * Rank photos by quality using Claude Vision
 * (Future enhancement - for now returns default ranking)
 */
export async function rankPhotosByQuality(imageUrls) {
    // Placeholder for future vision implementation
    // For now, return default ranking
    return imageUrls.map((_, i) => i);
}
//# sourceMappingURL=claudeClient.js.map
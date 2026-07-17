const axios = require('axios');

class OpenAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate blog outline from topic/keywords
   */
  async generateOutline(topic, keywords, tone, targetAudience, instructions = '') {
    const prompt = this.buildOutlinePrompt(topic, keywords, tone, targetAudience, instructions);
    return this.callGPT(prompt, 'outline_generation');
  }

  /**
   * Generate full blog content
   */
  async generateFullContent(topic, keywords, outline = null, tone, length, language, includeOutline = true) {
    const prompt = this.buildFullContentPrompt(topic, keywords, outline, tone, length, language, includeOutline);
    return this.callGPT(prompt, 'full_content_generation');
  }

  /**
   * Generate title options
   */
  async generateTitles(content, keywords, tone, count = 3) {
    const prompt = this.buildTitlePrompt(content, keywords, tone, count);
    return this.callGPT(prompt, 'title_generation');
  }

  /**
   * Generate SEO optimized excerpt
   */
  async generateExcerpt(content, keywords, maxLength = 160) {
    const prompt = this.buildExcerptPrompt(content, keywords, maxLength);
    return this.callGPT(prompt, 'excerpt_generation');
  }

  /**
   * Generate content variants (tone, length, etc.)
   */
  async generateVariants(content, variantTypes, tones = null, count = 3, preserveKeywords = true) {
    const prompt = this.buildVariantsPrompt(content, variantTypes, tones, count, preserveKeywords);
    return this.callGPT(prompt, 'variant_generation');
  }

  /**
   * Refine existing content
   */
  async refineContent(content, refinementType, targetLength = null, tone = null, instructions = '') {
    const prompt = this.buildRefinementPrompt(content, refinementType, targetLength, tone, instructions);
    return this.callGPT(prompt, 'refinement');
  }

  /**
   * Rewrite content with different tone/style
   */
  async rewriteContent(content, tone, audience, style, preserveKeywords = true) {
    const prompt = this.buildRewritePrompt(content, tone, audience, style, preserveKeywords);
    return this.callGPT(prompt, 'rewrite');
  }

  /**
   * Optimize content for SEO
   */
  async seoOptimizeContent(content, title, keywords, targetDensity = 1.5) {
    const prompt = this.buildSeoOptimizationPrompt(content, title, keywords, targetDensity);
    return this.callGPT(prompt, 'seo_optimization');
  }

  /**
   * Call OpenAI GPT API
   */
  async callGPT(prompt, taskType, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 2000) {
    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(taskType)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      return {
        success: true,
        content: response.data.choices[0].message.content,
        tokensUsed: response.data.usage.total_tokens,
        inputTokens: response.data.usage.prompt_tokens,
        outputTokens: response.data.usage.completion_tokens,
        model: response.data.model
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        tokensUsed: 0
      };
    }
  }

  /**
   * Build outline generation prompt
   */
  buildOutlinePrompt(topic, keywords, tone, targetAudience, instructions) {
    return `Generate a comprehensive blog outline for:
Topic: ${topic}
Keywords: ${keywords.join(', ')}
Target Audience: ${targetAudience || 'General readers'}
Tone: ${tone || 'Professional'}
${instructions ? `Additional Instructions: ${instructions}` : ''}

Create a detailed outline with:
- Main title suggestion
- 5-7 main sections with subsections
- Key points to cover in each section
- Suggested keyword placements

Format as a structured outline with clear hierarchy.`;
  }

  /**
   * Build full content generation prompt
   */
  buildFullContentPrompt(topic, keywords, outline, tone, length, language, includeOutline) {
    const lengthMap = { short: '800-1000 words', medium: '1500-2000 words', long: '3000-4000 words' };
    const wordCount = lengthMap[length] || '1500-2000 words';

    return `Write a comprehensive blog post with the following details:
Topic: ${topic}
Primary Keywords: ${keywords.join(', ')}
Target Length: ${wordCount}
Tone: ${tone || 'Professional'}
Language: ${language || 'English'}
${outline ? `Use this outline as structure: ${outline.join(' -> ')}` : ''}

Requirements:
1. Write engaging, original content
2. Include primary keyword in first 100 words
3. Use natural keyword density (1-2%)
4. Include H2 and H3 headings
5. Add 2-3 actionable tips or insights
6. Include a clear call-to-action
7. Ensure good readability (short paragraphs, bullet points where appropriate)
${includeOutline ? '8. Start with the outline structure' : ''}

Write the complete blog post with title, excerpt (160 chars max), and full content.`;
  }

  /**
   * Build title generation prompt
   */
  buildTitlePrompt(content, keywords, tone, count) {
    return `Generate ${count} compelling blog titles for the following content:

Content: ${content.substring(0, 500)}...
Keywords: ${keywords.join(', ')}
Tone: ${tone || 'Professional'}

Requirements for each title:
- 50-60 characters max
- Include at least one keyword naturally
- Be compelling and click-worthy
- Match the specified tone
- Be unique and original

Provide only the titles, one per line, without numbering.`;
  }

  /**
   * Build excerpt generation prompt
   */
  buildExcerptPrompt(content, keywords, maxLength) {
    return `Generate an SEO-optimized excerpt for the following content:

Content: ${content.substring(0, 1000)}...
Keywords: ${keywords.join(', ')}
Max Length: ${maxLength} characters

Requirements:
- Include at least one primary keyword
- Summarize main points
- Be compelling and informative
- Stay exactly within character limit
- Natural language flow

Provide only the excerpt, nothing else.`;
  }

  /**
   * Build variants generation prompt
   */
  buildVariantsPrompt(content, variantTypes, tones, count, preserveKeywords) {
    return `Generate ${count} content variants of the following content:

Original Content: ${content}
Variant Types: ${variantTypes.join(', ')}
${tones ? `Tones to use: ${tones.join(', ')}` : ''}
${preserveKeywords ? 'Preserve original keywords naturally' : 'Allow keyword variations'}

Create ${count} distinct versions, each with:
- Different tone/style/length as specified
- Clear distinction from original
- ${preserveKeywords ? 'Same keyword focus' : 'Natural keyword variations'}
- Maintained quality and accuracy

Label each variant with its type and characteristics.`;
  }

  /**
   * Build refinement prompt
   */
  buildRefinementPrompt(content, refinementType, targetLength, tone, instructions) {
    const refinementGuide = {
      improve: 'Make the content more engaging, clear, and impactful',
      expand: `Expand the content while maintaining focus ${targetLength ? `to approximately ${targetLength} words` : ''}`,
      condense: `Condense the content to the essential points ${targetLength ? `to approximately ${targetLength} words` : ''}`,
      simplify: 'Simplify language and make it more accessible',
      formalize: 'Make the content more formal and professional'
    };

    return `${refinementGuide[refinementType]} for the following content:

Original Content: ${content}
Refinement Type: ${refinementType}
${tone ? `Tone: ${tone}` : ''}
${instructions ? `Additional Instructions: ${instructions}` : ''}

Provide the refined content with clear improvements highlighted mentally.
Keep the same general structure but enhance it according to the refinement type.`;
  }

  /**
   * Build rewrite prompt
   */
  buildRewritePrompt(content, tone, audience, style, preserveKeywords) {
    return `Rewrite the following content for a different audience and tone:

Original Content: ${content}
New Tone: ${tone}
Target Audience: ${audience}
Style: ${style}
${preserveKeywords ? 'Keep original keywords where possible' : 'Adjust keywords naturally'}

Create a complete rewrite that:
- Matches the new tone and style
- Appeals to the target audience
- Maintains core message and facts
- Flows naturally in the new style
- ${preserveKeywords ? 'Preserves keyword focus' : 'Uses natural keyword variations'}

Provide the complete rewritten content.`;
  }

  /**
   * Build SEO optimization prompt
   */
  buildSeoOptimizationPrompt(content, title, keywords, targetDensity) {
    return `Optimize the following content for SEO:

Content: ${content}
Title: ${title}
Target Keywords: ${keywords.join(', ')}
Target Keyword Density: ${targetDensity}%

Optimization Requirements:
1. Include primary keyword "${keywords[0]}" in first 100 words
2. Maintain ${targetDensity}% keyword density
3. Use keywords naturally in headings
4. Keep content readable and engaging
5. Improve meta descriptions
6. Optimize for featured snippets where relevant
7. Maintain original message and quality

Provide the SEO-optimized version with keywords naturally integrated.`;
  }

  /**
   * Get system prompt based on task type
   */
  getSystemPrompt(taskType) {
    const prompts = {
      outline_generation: 'You are an expert content strategist and SEO specialist. Create detailed, organized outlines for blog posts that naturally incorporate keywords and provide comprehensive coverage of topics.',
      full_content_generation: 'You are a professional blog writer specializing in SEO-optimized, engaging content. Write comprehensive blogs that are well-structured, keyword-optimized, and valuable to readers.',
      title_generation: 'You are an expert copywriter specializing in creating compelling blog titles. Generate titles that are SEO-friendly, click-worthy, and accurately represent content.',
      excerpt_generation: 'You are an SEO expert. Write compelling meta descriptions and excerpts that are keyword-optimized and encourage click-throughs.',
      variant_generation: 'You are a versatile content creator. Create distinct content variants with different tones, styles, and lengths while maintaining quality and accuracy.',
      refinement: 'You are an expert editor and content improver. Refine content to enhance clarity, engagement, and impact while maintaining original intent.',
      rewrite: 'You are a versatile writer. Rewrite content for different audiences and tones while preserving core message and accuracy.',
      seo_optimization: 'You are an SEO specialist. Optimize content for search engines while maintaining readability and engagement.'
    };

    return prompts[taskType] || prompts.full_content_generation;
  }
}

module.exports = OpenAIService;

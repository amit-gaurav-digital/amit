const Blog = require('../models/Blog');
const BlogLanguage = require('../models/BlogLanguage');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class TranslationService {
  constructor() {
    this.supportedLanguages = BlogLanguage.getAvailableLanguages();
  }

  async translateBlog(blogId, targetLanguage, userId) {
    try {
      const blog = await Blog.findById(blogId);

      if (!blog) {
        throw new Error('Blog not found');
      }

      if (!this.isLanguageSupported(targetLanguage)) {
        throw new Error('Language not supported');
      }

      const existingTranslation = await BlogLanguage.findOne({
        originalBlogId: blogId,
        language: targetLanguage
      });

      if (existingTranslation) {
        throw new Error('Translation already exists for this language');
      }

      const translatedContent = await this.translateContent(
        blog.title,
        blog.excerpt,
        blog.content,
        blog.keywords,
        blog.metaDescription,
        targetLanguage
      );

      const blogLanguage = new BlogLanguage({
        originalBlogId: blogId,
        language: targetLanguage,
        title: translatedContent.title,
        slug: this.generateSlug(translatedContent.title, targetLanguage),
        excerpt: translatedContent.excerpt,
        content: translatedContent.content,
        metaDescription: translatedContent.metaDescription,
        keywords: translatedContent.keywords,
        translatedFrom: {
          language: 'en',
          blogId: blogId,
          accuracy: 85
        },
        translationMetadata: {
          translatorType: 'openai',
          translatedAt: new Date(),
          translatedBy: userId
        },
        seoOptimization: {
          readabilityScore: await this.calculateReadability(translatedContent.content),
          estimatedReadTime: Math.ceil(translatedContent.content.split(' ').length / 200)
        }
      });

      await blogLanguage.save();

      return blogLanguage.toObject();
    } catch (error) {
      throw new Error(`Blog translation failed: ${error.message}`);
    }
  }

  async translateContent(title, excerpt, content, keywords, metaDescription, targetLanguage) {
    try {
      const languageName = this.getLanguageName(targetLanguage);

      const prompt = `Translate the following blog post content to ${languageName}.
      Maintain the same tone, style, and formatting.
      Preserve any HTML tags or markdown formatting.
      Keep SEO keywords in mind while translating.

Title: ${title}

Excerpt: ${excerpt || 'N/A'}

Content: ${content.substring(0, 3000)}...

Keywords: ${keywords.join(', ')}

Meta Description: ${metaDescription || 'N/A'}

Provide the translation in JSON format with keys: title, excerpt, content, keywords, metaDescription`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert translator specializing in ${languageName}. Translate content while maintaining SEO optimization and readability. Always respond with valid JSON.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      let translatedData = JSON.parse(response.choices[0].message.content);

      return {
        title: translatedData.title,
        excerpt: translatedData.excerpt,
        content: translatedData.content,
        keywords: Array.isArray(translatedData.keywords)
          ? translatedData.keywords
          : translatedData.keywords.split(',').map(k => k.trim()),
        metaDescription: translatedData.metaDescription
      };
    } catch (error) {
      throw new Error(`Content translation failed: ${error.message}`);
    }
  }

  async getTranslations(blogId) {
    try {
      const translations = await BlogLanguage.find({ originalBlogId: blogId })
        .select('-content')
        .sort({ language: 1 });

      return translations.map(t => t.toObject());
    } catch (error) {
      throw new Error(`Failed to get translations: ${error.message}`);
    }
  }

  async getTranslationByLanguage(blogId, language) {
    try {
      const translation = await BlogLanguage.findOne({
        originalBlogId: blogId,
        language
      });

      if (!translation) {
        throw new Error('Translation not found');
      }

      return translation.toObject();
    } catch (error) {
      throw new Error(`Failed to get translation: ${error.message}`);
    }
  }

  async publishTranslation(translationId) {
    try {
      const translation = await BlogLanguage.findById(translationId);

      if (!translation) {
        throw new Error('Translation not found');
      }

      if (!translation.translationMetadata.isReviewed) {
        throw new Error('Translation must be reviewed before publishing');
      }

      translation.status = 'published';
      translation.publishedAt = new Date();

      await translation.save();

      return translation.toObject();
    } catch (error) {
      throw new Error(`Failed to publish translation: ${error.message}`);
    }
  }

  async deleteTranslation(translationId) {
    try {
      const translation = await BlogLanguage.findByIdAndDelete(translationId);

      if (!translation) {
        throw new Error('Translation not found');
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete translation: ${error.message}`);
    }
  }

  async getBlogLanguageStats(blogId) {
    try {
      const translations = await BlogLanguage.find({ originalBlogId: blogId });

      const stats = {
        totalTranslations: translations.length,
        languages: translations.map(t => ({
          language: t.language,
          languageName: this.getLanguageName(t.language),
          status: t.status,
          translatedAt: t.translationMetadata.translatedAt,
          isReviewed: t.translationMetadata.isReviewed,
          viewCount: t.viewCount
        })),
        publishedCount: translations.filter(t => t.status === 'published').length,
        reviewedCount: translations.filter(t => t.translationMetadata.isReviewed).length
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get language stats: ${error.message}`);
    }
  }

  async bulkTranslateBlog(blogId, languages, userId) {
    try {
      const results = [];
      const errors = [];

      for (const language of languages) {
        try {
          const translation = await this.translateBlog(blogId, language, userId);
          results.push({
            language,
            status: 'success',
            translation
          });
        } catch (error) {
          errors.push({
            language,
            status: 'error',
            message: error.message
          });
        }
      }

      return { results, errors };
    } catch (error) {
      throw new Error(`Bulk translation failed: ${error.message}`);
    }
  }

  isLanguageSupported(language) {
    return this.supportedLanguages.some(l => l.code === language);
  }

  getLanguageName(code) {
    const language = this.supportedLanguages.find(l => l.code === code);
    return language ? language.name : 'Unknown';
  }

  generateSlug(title, language) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + `-${language}`;
  }

  async calculateReadability(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/).length;
    const syllables = content.split(/[aeiou]/gi).length;

    const flesch = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    const score = Math.max(0, Math.min(100, flesch));

    return Math.round(score);
  }
}

module.exports = new TranslationService();

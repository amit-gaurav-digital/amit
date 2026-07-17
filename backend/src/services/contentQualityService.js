class ContentQualityService {
  /**
   * Calculate readability score using Flesch Reading Ease formula
   * Score 90-100: Very Easy, 60-70: Standard, 0-30: Very Difficult
   */
  static calculateReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = this.countSyllables(text);

    if (words === 0 || sentences === 0) return 0;

    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Estimate syllables in text
   */
  static countSyllables(text) {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let syllableCount = 0;

    words.forEach(word => {
      // Simple syllable counting algorithm
      let count = 0;
      const vowels = 'aeiouy';
      let previousWasVowel = false;

      for (let i = 0; i < word.length; i++) {
        const isVowel = vowels.includes(word[i]);
        if (isVowel && !previousWasVowel) count++;
        previousWasVowel = isVowel;
      }

      // Adjust for silent e
      if (word.endsWith('e')) count--;
      // Adjust for le at end
      if (word.endsWith('le') && word.length > 2) count++;

      // At least 1 syllable per word
      syllableCount += Math.max(1, count);
    });

    return syllableCount;
  }

  /**
   * Calculate Flesch-Kincaid Grade Level
   * Returns US school grade level needed to understand text
   */
  static calculateGradeLevel(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = this.countSyllables(text);

    if (words === 0 || sentences === 0) return 0;

    const grade = (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59;
    return Math.max(0, Math.round(grade * 10) / 10);
  }

  /**
   * Calculate Gunning Fog Index
   */
  static calculateGunningFog(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;

    // Count complex words (3+ syllables)
    const complexWords = text.toLowerCase().match(/[a-z]+/g)?.filter(word => {
      const syllables = this.countSyllables(word);
      return syllables >= 3;
    }).length || 0;

    if (words === 0 || sentences === 0) return 0;

    const index = 0.4 * ((words / sentences) + 100 * (complexWords / words));
    return Math.max(0, Math.round(index * 10) / 10);
  }

  /**
   * Calculate Automated Readability Index
   */
  static calculateARI(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const characters = text.replace(/\s/g, '').length;

    if (words === 0 || sentences === 0) return 0;

    const ari = (4.71 * (characters / words)) + (0.5 * (words / sentences)) - 21.43;
    return Math.max(0, Math.round(ari * 10) / 10);
  }

  /**
   * Calculate keyword density
   */
  static calculateKeywordDensity(text, keywords) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    if (wordCount === 0) return {};

    const densities = {};
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const matches = text.match(regex) || [];
      densities[keyword] = {
        count: matches.length,
        density: ((matches.length / wordCount) * 100).toFixed(2)
      };
    });

    return densities;
  }

  /**
   * Calculate SEO Score (0-100)
   */
  static calculateSEOScore(content, title, excerpt, keywords) {
    let score = 70; // Base score

    // Title optimization (max +10)
    if (title) {
      if (title.length >= 50 && title.length <= 60) score += 3;
      keywords.forEach(keyword => {
        if (title.toLowerCase().includes(keyword.toLowerCase())) score += 3.5;
      });
    }

    // Excerpt optimization (max +10)
    if (excerpt) {
      if (excerpt.length >= 140 && excerpt.length <= 160) score += 3;
      keywords.forEach(keyword => {
        if (excerpt.toLowerCase().includes(keyword.toLowerCase())) score += 3.5;
      });
    }

    // Content optimization (max +20)
    const densities = this.calculateKeywordDensity(content, keywords);
    let keywordScore = 0;
    Object.values(densities).forEach(kw => {
      const density = parseFloat(kw.density);
      // Optimal density: 1-2%
      if (density >= 1 && density <= 2) keywordScore += 10 / keywords.length;
      else if (density > 0) keywordScore += 5 / keywords.length;
    });
    score += Math.min(20, keywordScore);

    // Readability check (max +10)
    const readability = this.calculateReadabilityScore(content);
    if (readability >= 60) score += 10;
    else if (readability >= 40) score += 5;

    // Content length check (max +5)
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount >= 300) score += 5;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate plagiarism score (simplified - returns estimated originality)
   * In production, integrate with Copyscape or similar API
   */
  static calculatePlagiarismScore(text) {
    // Simplified heuristic - in production use external API
    // Returns originality percentage (opposite of plagiarism)

    // Check for unique patterns
    const uniquePatterns = new Set();
    const words = text.split(/\s+/);

    // Create trigrams
    for (let i = 0; i < words.length - 2; i++) {
      uniquePatterns.add(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }

    // Estimate based on unique n-grams
    const trigrams = words.length - 2;
    if (trigrams === 0) return 100;

    const uniqueness = (uniquePatterns.size / trigrams) * 100;

    // Return as originality score (100 = original, 0 = plagiarized)
    return Math.min(100, Math.round(uniqueness * 0.8 + 20)); // Weighted estimate
  }

  /**
   * Check for toxicity (simplified)
   * In production, integrate with Perspective API or similar
   */
  static checkToxicity(text) {
    const toxicWords = [
      'hate', 'violence', 'abuse', 'illegal', 'explicit'
    ];

    const lowerText = text.toLowerCase();
    const foundToxic = toxicWords.filter(word =>
      lowerText.includes(word)
    );

    return {
      hasToxicity: foundToxic.length > 0,
      toxicTerms: foundToxic,
      severity: foundToxic.length > 0 ? 'low' : 'none'
    };
  }

  /**
   * Generate comprehensive quality report
   */
  static generateQualityReport(content, title, excerpt, keywords) {
    const readabilityScore = this.calculateReadabilityScore(content);
    const gradeLevel = this.calculateGradeLevel(content);
    const gunningFog = this.calculateGunningFog(content);
    const ari = this.calculateARI(content);
    const seoScore = this.calculateSEOScore(content, title, excerpt, keywords);
    const plagiarismScore = this.calculatePlagiarismScore(content);
    const toxicity = this.checkToxicity(content);
    const keywordDensity = this.calculateKeywordDensity(content, keywords);

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

    return {
      readabilityMetrics: {
        flesch_reading_ease: readabilityScore,
        flesch_kincaid_grade: gradeLevel,
        gunning_fog_index: gunningFog,
        automated_readability_index: ari,
        readabilityInterpretation: this.interpretReadability(readabilityScore)
      },
      seoScore,
      plagiarismScore,
      wordCount,
      estimatedReadTime,
      keywordDensity,
      toxicity,
      overallQuality: Math.round((readabilityScore + seoScore + plagiarismScore) / 3),
      recommendations: this.generateRecommendations(readabilityScore, seoScore, plagiarismScore, keywordDensity, toxicity)
    };
  }

  /**
   * Interpret readability score
   */
  static interpretReadability(score) {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College)';
    return 'Very Difficult (College graduate)';
  }

  /**
   * Generate improvement recommendations
   */
  static generateRecommendations(readability, seo, plagiarism, keywordDensity, toxicity) {
    const recommendations = [];

    if (readability < 60) {
      recommendations.push('Consider simplifying language to improve readability');
    }

    if (seo < 70) {
      recommendations.push('Improve SEO by optimizing title, excerpt, and keyword placement');
    }

    if (plagiarism < 90) {
      recommendations.push('Add more original content and unique insights');
    }

    if (toxicity.hasToxicity) {
      recommendations.push(`Remove or rephrase toxic terms: ${toxicity.toxicTerms.join(', ')}`);
    }

    Object.entries(keywordDensity).forEach(([keyword, data]) => {
      const density = parseFloat(data.density);
      if (density > 2) {
        recommendations.push(`Reduce keyword "${keyword}" density (currently ${data.density}%)`);
      } else if (density < 0.5 && data.count > 0) {
        recommendations.push(`Increase keyword "${keyword}" visibility`);
      }
    });

    return recommendations.length > 0 ? recommendations : ['Content looks good!'];
  }
}

module.exports = ContentQualityService;

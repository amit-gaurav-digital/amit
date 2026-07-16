'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, Check, Trash2, Eye, Edit2 } from 'lucide-react';
import translationAPI from '@/lib/translation-api';
import blogAPI from '@/lib/api';

export default function TranslationsPage() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [translations, setTranslations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    loadBlogs();
    loadLanguages();
  }, []);

  useEffect(() => {
    if (selectedBlog) {
      loadTranslations();
    }
  }, [selectedBlog]);

  const loadBlogs = async () => {
    try {
      const response = await blogAPI.getBlogs(50, 0);
      setBlogs(response.blogs);
      if (response.blogs.length > 0) {
        setSelectedBlog(response.blogs[0]._id);
      }
    } catch (err) {
      setError('Failed to load blogs');
    }
  };

  const loadLanguages = async () => {
    try {
      const langs = await translationAPI.getAvailableLanguages();
      setLanguages(langs);
    } catch (err) {
      setError('Failed to load languages');
    }
  };

  const loadTranslations = async () => {
    setLoading(true);
    try {
      const trans = await translationAPI.getTranslations(selectedBlog);
      setTranslations(trans);
      setError('');
    } catch (err) {
      setError('Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (selectedLanguages.length === 0) {
      setError('Select at least one language');
      return;
    }

    setTranslating(true);
    try {
      const result = await translationAPI.bulkTranslate(selectedBlog, selectedLanguages);

      const successCount = result.results.filter(r => r.status === 'success').length;
      setError(`Translated to ${successCount} languages`);

      if (result.errors.length > 0) {
        console.error('Translation errors:', result.errors);
      }

      setShowTranslateModal(false);
      setSelectedLanguages([]);
      await loadTranslations();
    } catch (err) {
      setError(err.response?.data?.error || 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const handleReviewTranslation = async (translationId) => {
    try {
      await translationAPI.reviewTranslation(translationId);
      await loadTranslations();
    } catch (err) {
      setError('Failed to review translation');
    }
  };

  const handlePublishTranslation = async (translationId) => {
    try {
      await translationAPI.publishTranslation(translationId);
      await loadTranslations();
    } catch (err) {
      setError('Failed to publish translation');
    }
  };

  const handleDeleteTranslation = async (translationId) => {
    if (confirm('Delete this translation?')) {
      try {
        await translationAPI.deleteTranslation(translationId);
        await loadTranslations();
      } catch (err) {
        setError('Failed to delete translation');
      }
    }
  };

  const getLanguageName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.nativeName : code;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Multi-Language Support</h1>
        <p className="text-gray-600 mt-2">Generate and manage blog translations</p>
      </div>

      {error && (
        <div className={`mb-4 p-4 rounded border ${
          error.includes('failed') || error.includes('error')
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-4 items-center">
        <select
          value={selectedBlog}
          onChange={(e) => setSelectedBlog(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          {blogs.map(blog => (
            <option key={blog._id} value={blog._id}>
              {blog.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowTranslateModal(true)}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Globe className="w-5 h-5" />
          Translate to New Language
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading translations...</div>
      ) : translations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No translations yet</p>
          <button
            onClick={() => setShowTranslateModal(true)}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Translation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {translations.map(translation => (
            <div key={translation._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getLanguageName(translation.language)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(translation.status)}`}>
                      {translation.status}
                    </span>
                    {translation.translationMetadata.isReviewed && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Reviewed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 font-medium mb-1">{translation.title}</p>
                  <p className="text-gray-600 text-sm mb-3">{translation.excerpt}</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Translated: {new Date(translation.translationMetadata.translatedAt).toLocaleDateString()}</span>
                    <span>Views: {translation.viewCount}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-col">
                  {!translation.translationMetadata.isReviewed && (
                    <button
                      onClick={() => handleReviewTranslation(translation._id)}
                      className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Review
                    </button>
                  )}

                  {translation.status === 'draft' && translation.translationMetadata.isReviewed && (
                    <button
                      onClick={() => handlePublishTranslation(translation._id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Publish
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTranslation(translation._id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              {translation.translationMetadata.accuracy && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Translation Accuracy</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${translation.translationMetadata.accuracy}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {translation.translationMetadata.accuracy}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Translate Modal */}
      {showTranslateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Translate Blog</h2>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">
                Select Languages
              </label>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {languages
                  .filter(lang => !translations.some(t => t.language === lang.code))
                  .map(lang => (
                    <label key={lang.code} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLanguages([...selectedLanguages, lang.code]);
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <span className="block font-medium text-gray-900">{lang.name}</span>
                        <span className="text-sm text-gray-600">{lang.nativeName}</span>
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {selectedLanguages.length > 0 && (
              <p className="text-sm text-gray-600 mb-6">
                Will translate to {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''}
              </p>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleTranslate}
                disabled={translating || selectedLanguages.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {translating ? 'Translating...' : 'Translate'}
              </button>
              <button
                onClick={() => {
                  setShowTranslateModal(false);
                  setSelectedLanguages([]);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

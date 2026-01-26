import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ThumbsUp, User, Calendar, Filter, Plus } from 'lucide-react'
import { reviewsAPI } from '../services/api'

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const fetchReviews = async () => {
    try {
      const params = {}
      if (filter === 'featured') params.featured = 'true'
      if (filter !== 'all' && filter !== 'featured') {
        params.minRating = parseInt(filter)
      }
      
      const response = await reviewsAPI.getAll(params)
      setReviews(response.data.data)
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating, size = 'md') => {
    const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getRatingPercentage = (count) => {
    if (!stats || stats.totalReviews === 0) return 0
    return Math.round((count / stats.totalReviews) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-display font-bold mb-4">
            Client <span className="text-gradient">Reviews</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what our clients have to say about their tattoo experience
          </p>
        </motion.div>

        {/* Stats Overview */}
        {stats && stats.totalReviews > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Average Rating */}
              <div className="text-center md:border-r border-gray-200">
                <div className="text-6xl font-bold text-primary-600 mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                {renderStars(Math.round(stats.averageRating), 'lg')}
                <p className="text-gray-600 mt-2">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats[`${['oneStar', 'twoStars', 'threeStars', 'fourStars', 'fiveStars'][rating - 1]}`] || 0
                  const percentage = getRatingPercentage(count)
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-12">{rating} star{rating !== 1 ? 's' : ''}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Reviews</option>
              <option value="featured">Featured Reviews</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4+ Stars</option>
            </select>
          </div>

          {/* Leave Review Button */}
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Leave a Review
          </button>
        </div>

        {/* Reviews Grid */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No reviews yet. Be the first to leave one!</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4"
            >
              Leave First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card hover:scale-105 transition-transform ${
                  review.isFeatured ? 'border-2 border-primary-500' : ''
                }`}
              >
                {review.isFeatured && (
                  <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">
                    ⭐ Featured Review
                  </div>
                )}

                {/* Rating */}
                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>

                {/* Title */}
                <h3 className="text-lg font-display font-bold mb-2">
                  {review.title}
                </h3>

                {/* Comment */}
                <p className="text-gray-700 mb-4 line-clamp-4">
                  {review.comment}
                </p>

                {/* Author & Date */}
                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{review.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Helpful */}
                {review.helpfulCount > 0 && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                    <ThumbsUp size={14} />
                    <span>{review.helpfulCount} found this helpful</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ReviewFormModal
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false)
              fetchReviews()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Review Form Modal Component
const ReviewFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    authorName: '',
    isAnonymous: false,
    tattooType: ''
  })
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(prev => [...prev, ...files].slice(0, 5))
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      
      // Add photos
      photos.forEach(photo => {
        formDataToSend.append('photos', photo)
      })
      
      await reviewsAPI.create(formDataToSend)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-3xl font-display font-bold mb-6">Leave a Review</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="label">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="label">Review Title *</label>
              <input
                type="text"
                required
                maxLength={100}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input"
                placeholder="Sum up your experience"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="label">Your Review *</label>
              <textarea
                required
                maxLength={1000}
                rows="5"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                className="input"
                placeholder="Tell us about your experience..."
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.comment.length}/1000 characters
              </p>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  isAnonymous: e.target.checked,
                  authorName: e.target.checked ? '' : prev.authorName
                }))}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="anonymous" className="text-sm font-medium">
                Post anonymously
              </label>
            </div>

            {/* Author Name */}
            {!formData.isAnonymous && (
              <div>
                <label className="label">Your Name (Optional)</label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  className="input"
                  placeholder="Leave blank to remain anonymous"
                />
              </div>
            )}

            {/* Tattoo Type */}
            <div>
              <label className="label">Tattoo Type (Optional)</label>
              <select
                value={formData.tattooType}
                onChange={(e) => setFormData(prev => ({ ...prev, tattooType: e.target.value }))}
                className="input"
              >
                <option value="">Select type...</option>
                <option value="portrait">Portrait</option>
                <option value="traditional">Traditional</option>
                <option value="tribal">Tribal</option>
                <option value="geometric">Geometric</option>
                <option value="realistic">Realistic</option>
                <option value="abstract">Abstract</option>
                <option value="lettering">Lettering</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="label">Upload Photos (Optional, up to 5)</label>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3 text-sm text-purple-800">
                <p><strong>Share Your Tattoo!</strong> Upload photos of your finished tattoo. If Nate approves, your photos may be added to the official portfolio gallery.</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  id="reviewPhotos"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label htmlFor="reviewPhotos" className="cursor-pointer">
                  <Plus className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload photos of your tattoo</p>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG, or GIF (max 10MB each)</p>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-3">
                  {photos.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p><strong>Note:</strong> Your review will be visible after approval by our team. We review all submissions to ensure quality and authenticity.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Reviews

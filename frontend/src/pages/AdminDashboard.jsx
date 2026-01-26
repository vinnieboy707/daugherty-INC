import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Upload, Trash2, Eye, EyeOff, GripVertical, Calendar, Users, Image as ImageIcon, CheckCircle, Share2, RefreshCw, X, Check } from 'lucide-react'
import { portfolioAPI, consultationAPI, reviewsAPI, socialMediaAPI } from '../services/api'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [portfolio, setPortfolio] = useState([])
  const [consultations, setConsultations] = useState([])
  const [reviewsWithPhotos, setReviewsWithPhotos] = useState([])
  const [socialConnections, setSocialConnections] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (activeTab === 'portfolio') {
      fetchPortfolio()
    } else if (activeTab === 'consultations') {
      fetchConsultations()
    } else if (activeTab === 'client-photos') {
      fetchReviewsWithPhotos()
    } else if (activeTab === 'social-media') {
      fetchSocialConnections()
    }
  }, [activeTab])

  const fetchPortfolio = async () => {
    setLoading(true)
    try {
      const response = await portfolioAPI.getAll(false) // Get all including hidden
      setPortfolio(response.data.data)
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConsultations = async () => {
    setLoading(true)
    try {
      const response = await consultationAPI.getAll()
      setConsultations(response.data.data)
    } catch (error) {
      console.error('Error fetching consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewsWithPhotos = async () => {
    setLoading(true)
    try {
      const response = await reviewsAPI.getWithPhotos()
      setReviewsWithPhotos(response.data.data)
    } catch (error) {
      console.error('Error fetching reviews with photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSocialConnections = async () => {
    setLoading(true)
    try {
      const response = await socialMediaAPI.getAll()
      setSocialConnections(response.data.data)
    } catch (error) {
      console.error('Error fetching social connections:', error)
      // If no connections exist, initialize them
      if (error.response?.status === 404 || !response?.data?.data?.length) {
        try {
          await socialMediaAPI.initialize()
          const retryResponse = await socialMediaAPI.getAll()
          setSocialConnections(retryResponse.data.data)
        } catch (initError) {
          console.error('Error initializing connections:', initError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnectSocialMedia = async (platform) => {
    const username = prompt(`Enter your ${platform} username or profile URL:`)
    if (!username) return

    try {
      await socialMediaAPI.update(platform, {
        username,
        profileUrl: username.startsWith('http') ? username : `https://${platform}.com/${username}`,
        isConnected: true,
        isEnabled: true
      })
      alert(`${platform} connected successfully!`)
      fetchSocialConnections()
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error)
      alert(`Failed to connect ${platform}`)
    }
  }

  const handleDisconnectSocialMedia = async (platform) => {
    if (!confirm(`Disconnect ${platform}?`)) return

    try {
      await socialMediaAPI.disconnect(platform)
      alert(`${platform} disconnected`)
      fetchSocialConnections()
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error)
      alert(`Failed to disconnect ${platform}`)
    }
  }

  const handleSyncSocialMedia = async (platform) => {
    try {
      const response = await socialMediaAPI.sync(platform)
      alert(response.data.message || `${platform} synced successfully!`)
      fetchSocialConnections()
    } catch (error) {
      console.error(`Error syncing ${platform}:`, error)
      alert(`Failed to sync ${platform}`)
    }
  }

  const handleApprovePhotoForPortfolio = async (reviewId, photoIndex) => {
    if (!confirm('Add this photo to the official portfolio?')) return

    try {
      const description = prompt('Enter a description for this photo (optional):')
      const tags = prompt('Enter tags separated by commas (optional):')
      
      await reviewsAPI.approvePhotoForPortfolio(reviewId, photoIndex, {
        description,
        tags: tags ? tags.split(',').map(t => t.trim()) : []
      })
      
      alert('Photo successfully added to portfolio!')
      fetchReviewsWithPhotos()
    } catch (error) {
      console.error('Error approving photo:', error)
      alert('Failed to add photo to portfolio')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    const formData = new FormData()
    formData.append('image', file)
    formData.append('description', 'New portfolio item')

    try {
      await portfolioAPI.upload(formData)
      fetchPortfolio()
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const toggleVisibility = async (id, currentVisibility) => {
    try {
      await portfolioAPI.update(id, { isVisible: !currentVisibility })
      setPortfolio(prev => prev.map(item => 
        item._id === id ? { ...item, isVisible: !currentVisibility } : item
      ))
    } catch (error) {
      console.error('Error toggling visibility:', error)
    }
  }

  const deleteImage = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      await portfolioAPI.delete(id)
      setPortfolio(prev => prev.filter(item => item._id !== id))
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const onDragEnd = async (result) => {
    if (!result.destination) return

    const items = Array.from(portfolio)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display order
    const orders = items.map((item, index) => ({
      id: item._id,
      displayOrder: index
    }))

    setPortfolio(items)

    try {
      await portfolioAPI.updateOrder(orders)
    } catch (error) {
      console.error('Error updating order:', error)
      fetchPortfolio() // Reload on error
    }
  }

  const updateConsultationStatus = async (id, status) => {
    try {
      await consultationAPI.update(id, { status })
      setConsultations(prev => prev.map(item =>
        item._id === id ? { ...item, status } : item
      ))
    } catch (error) {
      console.error('Error updating consultation:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-display font-bold mb-4">
            Admin <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600">
            Manage your portfolio and consultation requests
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`btn ${activeTab === 'portfolio' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Upload size={20} />
            Portfolio Management
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`btn ${activeTab === 'consultations' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Calendar size={20} />
            Consultations
          </button>
          <button
            onClick={() => setActiveTab('client-photos')}
            className={`btn ${activeTab === 'client-photos' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <ImageIcon size={20} />
            Client Photo Submissions
          </button>
          <button
            onClick={() => setActiveTab('social-media')}
            className={`btn ${activeTab === 'social-media' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Share2 size={20} />
            Social Media & Integrations
          </button>
        </div>

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="card">
              <h2 className="text-2xl font-display font-bold mb-4">Upload New Image</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <label htmlFor="imageUpload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {uploadingImage ? 'Uploading...' : 'Click to upload portfolio image'}
                  </p>
                </label>
              </div>
            </div>

            {/* Portfolio Items */}
            <div className="card">
              <h2 className="text-2xl font-display font-bold mb-4">
                Portfolio Items ({portfolio.length})
              </h2>
              <p className="text-gray-600 mb-4">
                Drag to reorder • Click eye icon to show/hide • Click trash to delete
              </p>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : portfolio.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No portfolio items yet</p>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="portfolio">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {portfolio.map((item, index) => (
                          <Draggable
                            key={item._id}
                            draggableId={item._id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-4 p-4 bg-white border-2 rounded-lg ${
                                  snapshot.isDragging ? 'border-primary-500 shadow-lg' : 'border-gray-200'
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-move">
                                  <GripVertical className="text-gray-400" />
                                </div>
                                
                                <img
                                  src={item.url}
                                  alt={item.description}
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                                
                                <div className="flex-1">
                                  <p className="font-medium">{item.description || 'No description'}</p>
                                  <p className="text-sm text-gray-500">Order: {item.displayOrder}</p>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleVisibility(item._id, item.isVisible)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      item.isVisible
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    title={item.isVisible ? 'Visible' : 'Hidden'}
                                  >
                                    {item.isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                                  </button>
                                  
                                  <button
                                    onClick={() => deleteImage(item._id)}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="card">
            <h2 className="text-2xl font-display font-bold mb-6">
              <Users className="inline mr-2" />
              Consultation Requests ({consultations.length})
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : consultations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No consultation requests yet</p>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div key={consultation._id} className="border-2 border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-display font-bold">{consultation.fullName}</h3>
                        <p className="text-gray-600">{consultation.email}</p>
                        <p className="text-gray-600">{consultation.phoneNumber}</p>
                      </div>
                      <select
                        value={consultation.status}
                        onChange={(e) => updateConsultationStatus(consultation._id, e.target.value)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          consultation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          consultation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Best Contact Time</p>
                        <p className="font-medium">{consultation.bestContactTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Consultation Type</p>
                        <p className="font-medium capitalize">{consultation.consultationType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Placement</p>
                        <p className="font-medium">{consultation.desiredPlacement}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pain Threshold</p>
                        <p className="font-medium">{consultation.painThreshold}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Tattoo Description</p>
                      <p className="text-gray-700">{consultation.tattooDescription}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Background Story</p>
                      <p className="text-gray-700">{consultation.backgroundStory}</p>
                    </div>

                    {Object.values(consultation.vipServices).some(v => v) && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">VIP Services Requested</p>
                        <div className="flex flex-wrap gap-2">
                          {consultation.vipServices.priorityScheduling && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              Priority Scheduling
                            </span>
                          )}
                          {consultation.vipServices.homeVisit && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              Home Visit
                            </span>
                          )}
                          {consultation.vipServices.travelService && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              Travel Service
                            </span>
                          )}
                          {consultation.vipServices.extendedSession && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              Extended Session
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {consultation.referenceImages && consultation.referenceImages.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Reference Images</p>
                        <div className="flex gap-2 flex-wrap">
                          {consultation.referenceImages.map((img, index) => (
                            <img
                              key={index}
                              src={img.url}
                              alt={`Reference ${index + 1}`}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-4">
                      Submitted: {new Date(consultation.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Client Photo Submissions Tab */}
        {activeTab === 'client-photos' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-display font-bold mb-4">
                Client Submitted Photos for Portfolio Consideration
              </h2>
              <p className="text-gray-600 mb-6">
                Review photos submitted by clients and approve them to add to the official portfolio.
              </p>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading submissions...</p>
                </div>
              ) : reviewsWithPhotos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>No client photo submissions yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviewsWithPhotos.map((review) => (
                    <div key={review._id} className="border rounded-lg p-6 bg-gray-50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{review.title}</h3>
                          <p className="text-sm text-gray-600">
                            By {review.authorName} • {review.tattooType || 'Unspecified type'}
                          </p>
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {review.submittedPhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo.url}
                              alt={`Submission ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            {photo.approvedForPortfolio ? (
                              <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                  <CheckCircle size={16} />
                                  Approved
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleApprovePhotoForPortfolio(review._id, index)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                              >
                                <span className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                  <CheckCircle size={18} />
                                  Add to Portfolio
                                </span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-400 mt-4">
                        Submitted: {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Media & Integrations Tab */}
        {activeTab === 'social-media' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 p-6 rounded-lg">
              <h3 className="text-xl font-display font-semibold mb-4">Social Media Connections</h3>
              <p className="text-gray-400 mb-6">
                Connect your social media accounts to sync content and integrate Google Photos for easy portfolio management.
              </p>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {socialConnections.map((connection) => (
                    <motion.div
                      key={connection.platform}
                      className="bg-gray-900/50 p-6 rounded-lg border border-gray-700"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            {connection.displayName}
                            {connection.isConnected && (
                              <Check size={18} className="text-green-500" />
                            )}
                          </h4>
                          {connection.username && (
                            <p className="text-sm text-gray-400 mt-1">@{connection.username}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          connection.isConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {connection.isConnected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>

                      {connection.isConnected && (
                        <div className="space-y-2 mb-4 text-sm text-gray-400">
                          {connection.stats?.followers > 0 && (
                            <p>Followers: {connection.stats.followers.toLocaleString()}</p>
                          )}
                          {connection.stats?.posts > 0 && (
                            <p>Posts: {connection.stats.posts.toLocaleString()}</p>
                          )}
                          {connection.lastSync && (
                            <p>Last synced: {new Date(connection.lastSync).toLocaleString()}</p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!connection.isConnected ? (
                          <button
                            onClick={() => handleConnectSocialMedia(connection.platform)}
                            className="btn btn-primary flex-1"
                          >
                            Connect
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSyncSocialMedia(connection.platform)}
                              className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                              disabled={loading}
                            >
                              <RefreshCw size={16} />
                              Sync
                            </button>
                            <button
                              onClick={() => handleDisconnectSocialMedia(connection.platform)}
                              className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>

                      {connection.platform === 'google_photos' && connection.isConnected && (
                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-sm text-blue-300 mb-2">
                            <strong>Google Photos Integration:</strong>
                          </p>
                          <p className="text-xs text-gray-400 mb-3">
                            Sync your Google Photos albums directly to your portfolio. Photos will be automatically optimized and organized.
                          </p>
                          <button className="btn btn-sm btn-secondary">
                            Browse Photos
                          </button>
                        </div>
                      )}

                      {connection.platform === 'instagram' && connection.isConnected && (
                        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <p className="text-xs text-gray-400">
                            Instagram posts will be synced automatically. You can choose which posts to add to your portfolio.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Integration Benefits</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Instagram:</strong> Automatically sync your tattoo posts and engage with followers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Facebook:</strong> Share portfolio updates and consultation availability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>TikTok:</strong> Share tattoo process videos and time-lapses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Google Photos:</strong> Import high-quality photos directly to your portfolio with one click</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Pinterest:</strong> Reach a wider audience with your tattoo designs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

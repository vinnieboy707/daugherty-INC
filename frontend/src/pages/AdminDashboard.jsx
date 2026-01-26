import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Upload, Trash2, Eye, EyeOff, GripVertical, Calendar, Users } from 'lucide-react'
import { portfolioAPI, consultationAPI } from '../services/api'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('portfolio')
  const [portfolio, setPortfolio] = useState([])
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (activeTab === 'portfolio') {
      fetchPortfolio()
    } else {
      fetchConsultations()
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
        <div className="flex gap-4 mb-8">
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
      </div>
    </div>
  )
}

export default AdminDashboard

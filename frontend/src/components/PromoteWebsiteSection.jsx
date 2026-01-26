import { useState } from 'react'
import { Send, Calendar as CalendarIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { socialMediaAPI } from '../services/api'

const PromoteWebsiteSection = ({ socialConnections, onSuccess, onError }) => {
  const [message, setMessage] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [scheduleTime, setScheduleTime] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [posting, setPosting] = useState(false)
  const [results, setResults] = useState(null)

  const websiteUrl = window.location.origin
  const defaultMessage = `Check out Nate Daugherty, a talented Mendocino tattoo artist! Support local artists and promote individual business growth in our community. Book your consultation today! ${websiteUrl}`

  const connectedPlatforms = socialConnections.filter(c => c.isConnected && c.isEnabled)

  const messageTemplates = [
    {
      name: 'Default Pitch',
      content: defaultMessage
    },
    {
      name: 'New Portfolio Update',
      content: "Just added new pieces to my portfolio! Check out my latest tattoo work and get inspired for your next piece. Book your consultation today!"
    },
    {
      name: 'Limited Availability',
      content: "Limited consultation slots available this month! Book now to secure your spot for a custom tattoo design. Don't miss out!"
    },
    {
      name: 'Client Testimonial',
      content: "Another satisfied client! See what people are saying about their tattoo experience. Check out reviews and book your consultation today."
    }
  ]

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleSelectAll = () => {
    if (selectedPlatforms.length === connectedPlatforms.length) {
      setSelectedPlatforms([])
    } else {
      setSelectedPlatforms(connectedPlatforms.map(c => c.platform))
    }
  }

  const handlePromote = async () => {
    if (!message.trim()) {
      onError('Please enter a message to post')
      return
    }

    if (selectedPlatforms.length === 0) {
      onError('Please select at least one platform')
      return
    }

    if (isScheduled && !scheduleTime) {
      onError('Please select a schedule time')
      return
    }

    setPosting(true)
    setResults(null)

    try {
      const response = await socialMediaAPI.promote({
        message: message.trim(),
        platforms: selectedPlatforms,
        scheduleTime: isScheduled ? scheduleTime : null
      })

      setResults(response.data.results)
      onSuccess(response.data.message)
      
      // Reset form after successful post
      setTimeout(() => {
        setMessage('')
        setSelectedPlatforms([])
        setScheduleTime('')
        setIsScheduled(false)
        setResults(null)
      }, 5000)

    } catch (error) {
      onError(error.response?.data?.error || 'Failed to post to social media')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Message Templates */}
      <div>
        <label className="block text-sm font-medium mb-2">Quick Templates</label>
        <div className="flex flex-wrap gap-2">
          {messageTemplates.map((template) => (
            <button
              key={template.name}
              onClick={() => setMessage(template.content)}
              className="btn btn-sm btn-secondary"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your promotional message..."
          className="input w-full min-h-[120px]"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 mt-1">{message.length}/500 characters</p>
      </div>

      {/* Platform Selection */}
      {connectedPlatforms.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Select Platforms</label>
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              {selectedPlatforms.length === connectedPlatforms.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {connectedPlatforms.map((connection) => (
              <label
                key={connection.platform}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPlatforms.includes(connection.platform)
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(connection.platform)}
                  onChange={() => handlePlatformToggle(connection.platform)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{connection.displayName}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-300">
            No platforms connected. Please connect at least one social media platform above to post.
          </p>
        </div>
      )}

      {/* Schedule Options */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="schedule-post"
          checked={isScheduled}
          onChange={(e) => setIsScheduled(e.target.checked)}
          className="mt-1"
        />
        <div className="flex-1">
          <label htmlFor="schedule-post" className="block text-sm font-medium cursor-pointer">
            Schedule Post
          </label>
          {isScheduled && (
            <div className="mt-2">
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="input w-full md:w-auto"
              />
              <p className="text-xs text-gray-400 mt-1">
                Posts will be scheduled for the selected time
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Posting Results:</h4>
          {results.map((result) => (
            <div
              key={result.platform}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                result.status === 'posted' || result.status === 'scheduled'
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              {result.status === 'posted' || result.status === 'scheduled' ? (
                <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm">
                <p className="font-medium capitalize">{result.platform}</p>
                <p className="text-gray-400 text-xs">{result.message || result.error}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handlePromote}
        disabled={posting || !message.trim() || selectedPlatforms.length === 0 || connectedPlatforms.length === 0}
        className="btn btn-primary w-full flex items-center justify-center gap-2"
      >
        {posting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Posting...</span>
          </>
        ) : (
          <>
            {isScheduled ? <CalendarIcon size={18} /> : <Send size={18} />}
            <span>{isScheduled ? 'Schedule Post' : 'Post Now'}</span>
          </>
        )}
      </button>
    </div>
  )
}

export default PromoteWebsiteSection

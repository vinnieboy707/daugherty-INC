import { useState } from 'react'
import { Facebook, Twitter, Linkedin, Mail, Link2, Instagram, Share2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ShareWebsite = ({ compact = false, showLabel = true }) => {
  const [showCopied, setShowCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const websiteUrl = window.location.origin
  const defaultMessage = "Check out Nate Daugherty, a talented Mendocino tattoo artist! Support local artists and promote individual business growth in our community. Book your consultation today!"
  
  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}&quote=${encodeURIComponent(defaultMessage)}`
        window.open(url, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(defaultMessage)}&url=${encodeURIComponent(websiteUrl)}`
        window.open(url, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(websiteUrl)}`
        window.open(url, '_blank', 'width=600,height=400')
      }
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600',
      action: () => {
        // Instagram doesn't support direct sharing, show instructions
        alert('To share on Instagram:\n\n1. Copy the link using the "Copy Link" button\n2. Open Instagram app\n3. Create a new Story or Post\n4. Add the link to your bio or story')
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        const subject = 'Check out this talented tattoo artist!'
        const body = `${defaultMessage}\n\n${websiteUrl}`
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      }
    },
    {
      name: 'Copy Link',
      icon: Link2,
      color: 'bg-primary-600 hover:bg-primary-700',
      action: async () => {
        try {
          await navigator.clipboard.writeText(websiteUrl)
          setShowCopied(true)
          setTimeout(() => setShowCopied(false), 2000)
        } catch (err) {
          // Fallback for browsers that don't support clipboard API
          const textArea = document.createElement('textarea')
          textArea.value = websiteUrl
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          setShowCopied(true)
          setTimeout(() => setShowCopied(false), 2000)
        }
      }
    }
  ]

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="btn btn-primary flex items-center gap-2"
          aria-label="Share website"
        >
          <Share2 size={18} />
          {showLabel && <span>Share</span>}
        </button>
        
        <AnimatePresence>
          {showShareMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowShareMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[280px]"
              >
                <p className="text-sm text-gray-600 mb-3">Share this website</p>
                <div className="grid grid-cols-3 gap-2">
                  {shareButtons.map((button) => (
                    <button
                      key={button.name}
                      onClick={() => {
                        button.action()
                        setShowShareMenu(false)
                      }}
                      className={`${button.color} text-white p-3 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs`}
                      title={button.name}
                    >
                      <button.icon size={20} />
                      <span className="text-[10px]">{button.name}</span>
                    </button>
                  ))}
                </div>
                
                <AnimatePresence>
                  {showCopied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 flex items-center gap-2 text-green-600 text-sm bg-green-50 p-2 rounded"
                    >
                      <Check size={16} />
                      <span>Link copied!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="share-website">
      {showLabel && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Share & Support
        </h3>
      )}
      <p className="text-sm text-gray-600 mb-4">
        Help support local artists and promote individual business growth
      </p>
      
      <div className="flex flex-wrap gap-3">
        {shareButtons.map((button) => (
          <motion.button
            key={button.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={button.action}
            className={`${button.color} text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-md`}
            title={button.name}
          >
            <button.icon size={18} />
            <span>{button.name}</span>
          </motion.button>
        ))}
      </div>
      
      <AnimatePresence>
        {showCopied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg"
          >
            <Check size={20} />
            <span className="font-medium">Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShareWebsite

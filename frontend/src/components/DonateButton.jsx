import { useState } from 'react'
import { Heart } from 'lucide-react'
import DonateModal from './DonateModal'

const DonateButton = ({ className = '', variant = 'primary' }) => {
  const [showModal, setShowModal] = useState(false)

  const buttonClasses = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    outline: 'btn-outline border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white',
    icon: 'p-3 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:scale-110 transition-transform shadow-lg'
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${buttonClasses[variant]} ${className} flex items-center gap-2`}
        aria-label="Make a donation"
      >
        <Heart className="w-5 h-5" fill="currentColor" />
        {variant !== 'icon' && <span>Donate</span>}
      </button>

      {showModal && (
        <DonateModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

export default DonateButton

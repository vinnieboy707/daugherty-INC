import { Link } from 'react-router-dom'
import { Mail, Phone, Instagram, MapPin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  // Load contact info from environment variables
  const contactInfo = {
    phone: import.meta.env.VITE_CONTACT_PHONE || '[To be provided]',
    email: import.meta.env.VITE_CONTACT_EMAIL || '[To be provided]',
    instagram: import.meta.env.VITE_CONTACT_INSTAGRAM || '[To be provided]',
    location: import.meta.env.VITE_CONTACT_LOCATION || '[To be provided]'
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-2xl font-display font-bold text-gradient mb-4">
              Nate Daugherty
            </h3>
            <p className="text-gray-400 mb-4">
              Professional tattoo artist specializing in custom designs and meaningful artwork.
              Book your consultation today and bring your vision to life.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-primary-400 transition-colors">Portfolio</Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-primary-400 transition-colors">Reviews</Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-primary-400 transition-colors">Book Consultation</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-primary-400 transition-colors">Admin</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>{contactInfo.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram size={16} />
                <span>{contactInfo.instagram}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{contactInfo.location}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} Nate Daugherty. All rights reserved.</p>
          <p className="mt-2">Powered by cutting-edge technology and artistic passion.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

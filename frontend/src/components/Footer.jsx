import { Mail, Phone, Instagram, MapPin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

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
                <a href="/" className="hover:text-primary-400 transition-colors">Home</a>
              </li>
              <li>
                <a href="/portfolio" className="hover:text-primary-400 transition-colors">Portfolio</a>
              </li>
              <li>
                <a href="/book" className="hover:text-primary-400 transition-colors">Book Consultation</a>
              </li>
              <li>
                <a href="/admin" className="hover:text-primary-400 transition-colors">Admin</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>nate@daugherty-inc.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Instagram size={16} />
                <span>@natedaugherty_ink</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Los Angeles, CA</span>
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

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Image, Sparkles, Star, Shield, Clock } from 'lucide-react'
import ShareWebsite from '../components/ShareWebsite'

const Home = () => {
  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Smart Scheduling',
      description: 'AI-powered booking system that finds the perfect time for your consultation'
    },
    {
      icon: <Image className="w-8 h-8" />,
      title: 'Preview Your Tattoo',
      description: 'Upload your photo and see a preview of how your tattoo will look'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Custom Designs',
      description: 'Every tattoo is uniquely crafted to tell your personal story'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'VIP Services',
      description: 'Priority scheduling, home visits, and travel services available'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Professional Quality',
      description: 'Years of experience with safety and hygiene as top priorities'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Flexible Hours',
      description: 'Book consultations that fit your schedule, day or night'
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-accent-900 to-primary-800 text-white py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              Transform Your Vision Into
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-accent-200">
                Timeless Art
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-gray-200">
              Experience the future of tattoo consultations with AI-powered scheduling,
              preview technology, and personalized service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="btn btn-primary text-lg px-8 py-4">
                Book Your Consultation
              </Link>
              <Link to="/portfolio" className="btn bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-4">
                View Portfolio
              </Link>
              <ShareWebsite compact showLabel={false} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Why Choose <span className="text-gradient">Daugherty Inc</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cutting-edge technology meets artistic excellence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card hover:scale-105 transition-transform"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Book your consultation today and let's create something amazing together.
              Our AI assistant is ready to help you every step of the way.
            </p>
            <Link to="/book" className="btn bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-4 inline-flex">
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home

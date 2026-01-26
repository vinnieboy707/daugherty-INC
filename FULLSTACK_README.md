# Daugherty Inc - Professional Tattoo Consultation System

A cutting-edge full-stack web application for tattoo artist Nate Daugherty, featuring AI-powered scheduling, portfolio management, and tattoo preview visualization.

## 🌟 Features

### Client Features
- **Smart AI Assistant**: 24/7 AI chat bot for scheduling and inquiries
- **Advanced Booking System**: Comprehensive consultation request form
- **Image Upload**: Upload reference images and selfies
- **Tattoo Preview**: AI-powered visualization of how tattoos will look (simulated)
- **VIP Services**: Priority scheduling, home visits, travel services
- **Modern UI**: Responsive, animated interface with smooth transitions

### Admin Features
- **Portfolio Management**: Upload, reorder, and manage portfolio images
- **Drag-and-Drop Ordering**: Easily reorganize portfolio display order
- **Visibility Control**: Show/hide portfolio items
- **Consultation Dashboard**: View and manage all consultation requests
- **Status Management**: Update consultation status (pending/confirmed/completed/cancelled)

## 🚀 Technology Stack

### Backend
- **Node.js** & **Express.js**: Server and API
- **MongoDB** & **Mongoose**: Database
- **Multer**: File upload handling
- **Sharp**: Image processing and optimization
- **Helmet** & **CORS**: Security
- **Morgan**: Logging

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **React Beautiful DnD**: Drag and drop
- **Lucide React**: Icons
- **Axios**: API requests

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB installed and running

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The backend server will start on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173

## 🔧 Configuration

### Backend Environment Variables
Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/daugherty-inc
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key
```

### Frontend Environment Variables
Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

### Portfolio Endpoints
- `GET /api/portfolio` - Get all portfolio images
- `POST /api/portfolio` - Upload new image
- `PUT /api/portfolio/:id` - Update portfolio item
- `PUT /api/portfolio/order/update` - Update display order
- `DELETE /api/portfolio/:id` - Delete image

### Consultation Endpoints
- `POST /api/consultations` - Create consultation request
- `GET /api/consultations` - Get all consultations
- `GET /api/consultations/:id` - Get single consultation
- `PUT /api/consultations/:id` - Update consultation
- `POST /api/consultations/:id/preview` - Generate tattoo preview
- `POST /api/consultations/ai/chat` - AI assistant chat

## 🎨 Features in Detail

### Portfolio Management
- Upload high-quality portfolio images
- Drag-and-drop to reorder images
- Toggle visibility for each image
- Automatic image optimization
- Support for descriptions and tags

### Consultation Booking
- Comprehensive form with all required fields
- Upload up to 5 reference images
- Upload selfie for tattoo preview simulation
- Select consultation type (phone or in-person)
- Choose VIP services
- Real-time form validation

### AI Assistant
- Context-aware chat responses
- Helps with scheduling, pricing, and general inquiries
- Beautiful animated chat interface
- Real-time message updates

## 🚀 Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible
3. Run `npm start` or use a process manager like PM2

### Frontend Deployment
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables

## 🔐 Security

- Helmet.js for security headers
- CORS configuration
- File type validation
- File size limits
- Input sanitization
- MongoDB injection prevention

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

## 🎯 Future Enhancements

- Real AI tattoo preview using computer vision
- Email notifications for consultations
- Payment integration for deposits
- Calendar integration
- SMS reminders
- Client portal with appointment history
- Real-time chat with WebSocket
- Advanced analytics dashboard

## 📄 License

MIT License - feel free to use this project for your own purposes

## 👨‍💻 Developer

Created with ❤️ for Nate Daugherty by GitHub Copilot

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Note**: The tattoo preview feature uses simulated AI responses. For production use, integrate with actual AI/ML services like OpenAI DALL-E or Stable Diffusion for real tattoo visualizations.

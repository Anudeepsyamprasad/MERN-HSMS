Live Demo: https://asp-hospital-management-system.onrender.com

**MERN Hospital Management System (HSMS)**

A comprehensive, full-stack Hospital Management System built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This application provides efficient management of patients, doctors, appointments, and medical records through secure authentication and role-based access control.

**Project Overview**

_What is this project?_

This is a modern, web-based Hospital Management System designed to streamline healthcare operations by providing a centralized platform for managing patients, doctors, appointments, and medical records. The system serves as a digital solution for healthcare facilities to improve efficiency, reduce paperwork, and enhance patient care.

_Why was this built?_
- Digital Transformation: Replace traditional paper-based systems with a modern digital solution
- Efficiency: Streamline hospital operations and reduce administrative overhead
- Accessibility: Provide role-based access to different stakeholders (patients, doctors, admins)
- Data Management: Centralize patient data, medical records, and appointment scheduling
- Security: Implement secure authentication and authorization for sensitive medical data
- Scalability: Build a system that can grow with healthcare facility needs
  
_How does it work?_

The system follows a client-server architecture with clear separation of concerns:
- Frontend: React-based user interface with role-specific dashboards
- Backend: RESTful API built with Express.js and Node.js
- Database: MongoDB for flexible document storage
- Authentication: JWT-based security with role-based access control
- Real-time Updates: Dynamic UI updates based on user actions and data changes

**Key Features**
**Authentication and Authorization**
- Secure JWT-based authentication with encrypted passwords
- Role-based access control (Patient, Doctor, Admin)
- User registration and login with comprehensive validation
- Password change functionality with security checks
- Session management with automatic token refresh
  
_User Management_
- Patient Management: Complete patient profiles with medical history, demographics, and contact information
- Doctor Management: Doctor profiles with specializations, schedules, and professional details
- Admin Panel: Full system administration with user management capabilities
- Profile Management: Users can update their own profiles and preferences
  
_Appointment System_
- Smart Appointment Booking with conflict detection and availability checking
- Schedule Management for doctors with flexible time slots
- Status Tracking (booked, confirmed, in-progress, completed, cancelled, no-show)
- Real-time Availability checking based on doctor schedules
- Appointment History and future booking management
  
_Medical Records Management_
- Comprehensive Medical Records with detailed diagnoses and treatment plans
- Vital Signs Tracking (blood pressure, heart rate, temperature, etc.)
- Prescription Management with medication details and dosages
- Lab Results and Imaging record integration
- Treatment Plans and follow-up scheduling
- Medical History tracking across multiple visits
  
_Dashboard and Analytics_
- Role-based Dashboards with relevant statistics and quick actions
- Recent Activity Overview for all user types
- Quick Action Buttons for common tasks
- Real-time Data Updates and notifications
- Statistics and Reports for administrative insights
  
**Technology Stack**
  
_Backend Technologies_
- Node.js - JavaScript runtime environment for server-side development
- Express.js - Fast, unopinionated web framework for Node.js
- MongoDB - NoSQL document database for flexible data storage
- Mongoose - Elegant MongoDB object modeling for Node.js
- JWT (jsonwebtoken) - Secure authentication token management
- bcryptjs - Password hashing and security
- express-validator - Input validation and sanitization
- helmet - Security middleware for HTTP headers
- cors - Cross-origin resource sharing configuration
  
_Frontend Technologies_
- React.js - Modern UI library for building interactive user interfaces
- React Router - Declarative routing for React applications
- Axios - Promise-based HTTP client for API communication
- React Icons - Popular icon library (Font Awesome icons)
- Date-fns - Modern JavaScript date utility library
- Bootstrap - CSS framework for responsive design
- Custom CSS - Tailored styling for optimal user experience

**Development Tools**
- Nodemon - Development server with auto-restart
- Concurrently - Run multiple commands simultaneously
- ESLint - Code linting and quality assurance
- Git - Version control and collaboration


**Installation and Setup**

_Prerequisites_
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager
- Git for version control
  
_Backend Setup_
1. Clone the repository
   git clone <repository-url>
   cd MERN-HSMS
   
2. Install backend dependencies
   npm --prefix backend install
   
3. Configure environment variables
   # Update backend/config.env with your configuration
   Required environment variables:
   
   NODE_ENV=development
   
   PORT=5000
   
   MONGODB_URI=mongodb://localhost:27017/hospital_management
   
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
   
   JWT_EXPIRE=30d

4. Set up the database with sample data (optional)
   npm run setup

5. Start the backend server
   npm --prefix backend run server

_Frontend Setup_

1. Navigate to frontend directory
   cd frontend
2. Install frontend dependencies
   npm install
3. Start the React development server
   npm start

_Database Setup (Optional)_

To populate your database with sample data for testing:

1. Run the database setup script
   npm run setup

This will create:
- Test users (admin, doctor, patient)
- Sample patient and doctor records
- Sample appointments
- Sample medical records

Test Credentials:
- Admin: admin@hospital.com / admin123
- Doctor: doctor1@hospital.com / doctor123
- Patient: patient1@hospital.com / patient123

_Running Both Servers_

From the root directory, run both servers simultaneously:
npm run dev

**User Roles and Permissions**

_Admin Role_
- Full System Access: Complete administrative control
- User Management: Create, update, and delete all user accounts
- Patient Management: Full access to patient records and data
- Doctor Management: Manage doctor profiles and schedules
- Appointment Oversight: View and manage all appointments
- Medical Records: Access to all medical records
- System Analytics: View system statistics and reports
- Data Management: Backup, restore, and system maintenance
  
_Doctor Role_
- Patient Access: View and manage assigned patients
- Medical Records: Create, update, and view medical records
- Appointment Management: Manage personal schedule and appointments
- Patient History: Access complete patient medical history
- Profile Management: Update personal profile and schedule
- Prescription Authority: Create and manage prescriptions
- Treatment Planning: Develop and update treatment plans
  
_Patient Role_
- Personal Profile: View and update personal information
- Medical Records: View own medical records and history
- Appointment Booking: Book appointments with available doctors
- Appointment History: View past and upcoming appointments
- Health Tracking: Monitor personal health data and records
- Communication: Contact healthcare providers through the system
  
**Security Features**
- JWT Authentication with secure token management and expiration
- Password Hashing using bcryptjs with salt rounds
- Input Validation with express-validator for all endpoints
- Rate Limiting to prevent API abuse and brute force attacks
- CORS Protection for secure cross-origin requests
- Helmet.js for security headers and XSS protection
- Role-based Access Control for all sensitive operations
- Data Sanitization to prevent injection attacks
- Secure Headers for enhanced security posture
  
**UI/UX Features**
- Responsive Design optimized for desktop, tablet, and mobile devices
- Modern Interface with clean, intuitive navigation
- Role-based Navigation showing relevant features for each user type
- Real-time Updates with dynamic content loading
- Loading States and comprehensive error handling
- Form Validation with user-friendly error messages
- Accessible Design with proper ARIA labels and keyboard navigation
- Consistent Styling using Bootstrap and custom CSS
- Interactive Components with smooth animations and transitions

**Important Notes**
This is a demonstration project. 

**Disclaimer:** This Hospital system Management system is designed for educational and demonstration purposes. Built with the MERN Stack.



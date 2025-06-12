# DevLog Tracker

A web application for developers to track their project progress, log development activities, and manage tasks efficiently.

## Features

- 🔐 **User Authentication**
  - Secure sign-up and login
  - Password reset functionality
  - User profile management

- 📊 **Dashboard**
  - Overview of projects and logs
  - Quick access to recent activities
  - Project statistics and progress tracking

- 📝 **Project Management**
  - Create and manage multiple projects
  - Track project status (Not Started, In Progress, Completed)
  - Set due dates and priorities
  - Add detailed descriptions and notes

- 📓 **Development Logs**
  - Create detailed development logs
  - Categorize logs by project
  - Track time spent on tasks
  - Add code snippets and notes

- 🔔 **Reminders & Notifications**
  - Inactivity alerts for stale projects
  - Project deadline reminders
  - Daily/weekly progress reports

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Modern web browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Lint2016/DevLog-Tracker.git
   cd devlog-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Firebase:
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Set up Firestore database
   - Update Firebase configuration in your project files

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Project Structure

```
devlog-tracker/
├── public/                 # Static files
├── src/                    # Source files
│   ├── assets/            # Images, icons, etc.
│   ├── utils/             # Utility functions
│   ├── *.html             # HTML entry points
│   └── *.js               # JavaScript files
├── .gitignore
├── package.json
└── README.md
```

## Technologies Used

- **Frontend**: 
  - HTML5, CSS3, JavaScript
  - Firebase Authentication
  - Cloud Firestore

- **Development Tools**:
  - Git for version control
  - Firebase Console for backend management

## Security

- Secure user authentication
- Role-based access control
- Data validation
- Secure Firestore rules implementation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.

## Acknowledgments

- Built with Firebase
- Icons from [Font Awesome](https://fontawesome.com/)

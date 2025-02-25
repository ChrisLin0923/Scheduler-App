# Scheduler Web Application

## Overview

This is a web application designed for managing schedules within a church community. It allows users to add members, assign roles, and manage schedules for various events. The application is built using React and integrates with Firebase for data storage and retrieval.

## Features

- **Member Management**: Add, edit, and remove members from the church community.
- **Role Assignment**: Assign roles to members for different events (e.g., Vocalist, Drummer).
- **Schedule Management**: Create and manage schedules for church events, including the ability to view and edit existing schedules.
- **Conflict Detection**: Alerts users if there are conflicts in role assignments.
- **Calendar Integration**: Add scheduled events to a calendar for easy tracking.

## Technologies Used

- **Frontend**: React, TypeScript, CSS Modules
- **Backend**: Firebase (Firestore for database)
- **Date Management**: date-fns for date manipulation
- **State Management**: React hooks for managing component state

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/scheduler-webapp.git
   ```

2. Navigate to the project directory:
   ```bash
   cd scheduler-webapp
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Set up Firebase:
   - Create a Firebase project and configure Firestore.
   - Update the Firebase configuration in your project.

5. Start the development server:
   ```bash
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`.

## Usage

- **Adding Members**: Click on the "Add Member" button to open the form and fill in the member details.
- **Assigning Roles**: Select roles for each member from the dropdown menus in the schedule view.
- **Viewing Schedules**: Click on a month card to view and edit the schedule for that month.
- **Conflict Alerts**: If a member is assigned to multiple roles, an alert will notify you of the conflict.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## Acknowledgments

- Thanks to the contributors and the open-source community for their support and resources.
- Special thanks to Firebase for providing a robust backend solution.

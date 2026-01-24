
# Learning Management System
## Testing

**frontend**

Initialize environment
```bash
$ cd frontend
$ npm install
```

Test
```
$ npm run dev
```

Build
```
$ npm run build
```

**backend**

Initialize environment
```
$ cd backend
$ npm install
```

Test
```
$ npm test
```

Build
```
$ npm start
```

## Folder Structure
```
frontend
├── public
│   └── vite.svg
├── src
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── auth
│   │   │   ├── LoginForm.jsx
│   │   │   └── SignupForm.jsx
│   │   ├── common
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   └── PageHeader.jsx
│   │   ├── courses
│   │   │   └── CourseCard.jsx
│   │   ├── layout
│   │   │   ├── Navbar.jsx
│   │   │   ├── PageLayout.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── organization
│   │   │   ├── BrandingSettings.jsx
│   │   │   ├── LearningPolicies.jsx
│   │   │   ├── OrganizationProfile.jsx
│   │   │   └── OrganizationTabs.jsx
│   │   ├── ui
│   │   │   └── headles ui components
│   │   └── users
│   │       └── UsersTable.jsx
│   ├── hooks
│   │   ├── useAuth.js
│   │   ├── useCourses.js
│   │   ├── useOrganization.js
│   │   └── useUsers.js
│   ├── pages
│   │   ├── auth
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── courses
│   │   │   ├── CourseDetailsPage.jsx
│   │   │   └── CoursesListPage.jsx
│   │   ├── dashboard
│   │   │   └── DashBoardPage.jsx
│   │   ├── organization
│   │   │   └── OrganizationSettingsPage.jsx
│   │   ├── settings
│   │   │   └── AppSettingsPage.jsx
│   │   └── users
│   │       ├── UserDetailsPage.jsx
│   │       └── UsersListPage.jsx
│   ├── services
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── course.js
│   │   ├── organzation.js
│   │   └── user.js
│   ├── store
│   │   ├── auth.js
│   │   └── organization.js
│   ├── utils
│   │   ├── constant.js
│   │   └── helpers.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```


```
backend
├── models
│   ├── course.js
│   ├── organization.js
│   └── user.js
├── routes
|   ├── auth.js
|   ├── course.js
|   ├── index.js
|   ├── middleware.js
|   ├── organization.js
|   └── users.js
├── .gitignore
├── package-lock.json
├── package.json
└── server.js
```

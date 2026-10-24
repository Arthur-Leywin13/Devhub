import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import AccountGate from './components/AccountGate'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminReports from './pages/admin/AdminReports'
import AdminContent from './pages/admin/AdminContent'
import AdminAuditLog from './pages/admin/AdminAuditLog'

import Home from './pages/Home'
import Explore from './pages/Explore'
import Encyclopedia from './pages/Encyclopedia'
import CategoryDetail from './pages/CategoryDetail'
import ArticlePage from './pages/ArticlePage'
import WriteArticle from './pages/WriteArticle'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import PublishProject from './pages/PublishProject'
import ImportGithub from './pages/ImportGithub'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import LessonPage from './pages/LessonPage'
import CreateCourse from './pages/CreateCourse'
import Create from './pages/Create'
import Feed from './pages/Feed'
import PostPage from './pages/PostPage'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import Profile from './pages/Profile'
import MyProjects from './pages/MyProjects'
import MyCourses from './pages/MyCourses'
import Saved from './pages/Saved'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Help from './pages/Help'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <AccountGate>
    <Routes>
      <Route element={<AppLayout />}>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/explorer" element={<Explore />} />
        <Route path="/encyclopedie" element={<Encyclopedia />} />
        <Route path="/encyclopedie/:id" element={<CategoryDetail />} />
        <Route path="/cours" element={<Courses />} />
        <Route path="/cours/:id" element={<CourseDetail />} />
        <Route path="/cours/:courseId/lecon/:lessonId" element={<LessonPage />} />
        <Route path="/projets" element={<Projects />} />
        <Route path="/projets/:id" element={<ProjectDetail />} />
        <Route path="/articles/:id" element={<ArticlePage />} />
        <Route path="/fil" element={<Feed />} />
        <Route path="/publications/:id" element={<PostPage />} />
        <Route path="/profil/:username" element={<Profile />} />
        <Route path="/aide" element={<Help />} />

        {/* Routes privées */}
        <Route path="/mon-profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/mes-projets" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
        <Route path="/mes-cours" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
        <Route path="/enregistres" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/parametres" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/creer" element={<ProtectedRoute><Create /></ProtectedRoute>} />
        <Route path="/projets/nouveau" element={<ProtectedRoute><PublishProject /></ProtectedRoute>} />
        <Route path="/projets/importer-github" element={<ProtectedRoute><ImportGithub /></ProtectedRoute>} />
        <Route path="/articles/nouveau" element={<ProtectedRoute><WriteArticle /></ProtectedRoute>} />
        <Route path="/cours/nouveau" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
      </Route>

      <Route element={<RoleRoute roles={['moderator', 'admin']}><AdminLayout /></RoleRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/utilisateurs" element={<AdminUsers />} />
        <Route path="/admin/utilisateurs/:id" element={<AdminUserDetail />} />
        <Route path="/admin/signalements" element={<AdminReports />} />
        <Route path="/admin/contenus" element={<AdminContent />} />
        <Route path="/admin/journal" element={<AdminAuditLog />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
      </Route>
    </Routes>
    </AccountGate>
  )
}

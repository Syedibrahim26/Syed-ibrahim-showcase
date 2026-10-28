import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { dbRun, dbGet, dbAll, initDatabase } from './src/server/db';
import { generateToken, requireAuth, AuthenticatedRequest } from './src/server/auth';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Basic middlewares
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  // Initialize SQLite database and seed admin credentials if needed
  try {
    await initDatabase();
    console.log('✅ SQLite database initialized and seeded successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  }

  // Ensure public uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const normalizeImageUrl = (value: unknown): string => {
    if (typeof value !== 'string') return '';

    const url = value.trim();
    if (!url || /^file:/i.test(url) || /^[a-z]:[\\/]/i.test(url) || /^\\\\/.test(url)) return '';

    const uploadPath = url.match(/^\/?uploads\/+(.+)$/i);
    return uploadPath ? `/uploads/${uploadPath[1].replace(/^\/+/, '')}` : url;
  };

  const parseStoredArray = <T>(value: unknown): T[] => {
    if (typeof value !== 'string' || !value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to parse stored profile list:', err);
      return [];
    }
  };

  const removeUnusedUpload = async (imageUrl: string) => {
    const normalizedUrl = normalizeImageUrl(imageUrl);
    const match = normalizedUrl.match(/^\/uploads\/((?:upload_[a-zA-Z0-9_-]+\.(?:jpe?g|png|gif|webp|avif|bmp)|resume_[a-zA-Z0-9_-]+\.pdf))$/i);
    if (!match) return;

    const references = await dbAll<any>(
      'SELECT avatar_url AS image_url FROM profile UNION ALL SELECT resume_url FROM profile UNION ALL SELECT image_url FROM projects'
    );
    if (references.some((reference) => normalizeImageUrl(reference.image_url) === normalizedUrl)) return;

    try {
      await fs.promises.unlink(path.join(uploadsDir, match[1]));
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to remove unused uploaded image ${match[1]}:`, err);
      }
    }
  };

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ------------------------------------------
  // AUTHENTICATION ROUTES
  // ------------------------------------------

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await dbGet<any>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const userPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };

      const token = generateToken(userPayload);

      // Also set httpOnly cookie for extra security
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.json({
        success: true,
        token,
        user: userPayload,
        message: 'Login successful'
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
    }
  });

  // Get current logged-in user
  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await dbGet<any>('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [
        req.user?.id
      ]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      return res.json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch user session.' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });

  // ------------------------------------------
  // PUBLIC PORTFOLIO DATA ROUTES
  // ------------------------------------------

  // Get public student profile
  app.get('/api/profile', async (req, res) => {
    try {
      const profile = await dbGet<any>('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
      if (!profile) {
        return res.status(404).json({ error: 'Profile not configured yet.' });
      }

      let parsedSkills: string[] = [];
      try {
        parsedSkills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills || [];
      } catch (e) {
        parsedSkills = profile.skills ? profile.skills.split(',').map((s: string) => s.trim()) : [];
      }

      return res.json({
        ...profile,
        avatar_url: normalizeImageUrl(profile.avatar_url),
        resume_url: normalizeImageUrl(profile.resume_url),
        skills: parsedSkills,
        education: parseStoredArray(profile.education),
        certificates: parseStoredArray(profile.certificates)
      });
    } catch (err: any) {
      console.error('Get profile error:', err);
      return res.status(500).json({ error: 'Failed to fetch portfolio profile.' });
    }
  });

  // Get published projects for public portfolio
  app.get('/api/projects', async (req, res) => {
    try {
      const rows = await dbAll<any>(
        'SELECT * FROM projects WHERE is_published = 1 ORDER BY is_featured DESC, display_order ASC, created_at DESC'
      );

      const projects = rows.map((p) => {
        let parsedTech: string[] = [];
        try {
          parsedTech = typeof p.tech_stack === 'string' ? JSON.parse(p.tech_stack) : p.tech_stack || [];
        } catch (e) {
          parsedTech = p.tech_stack ? p.tech_stack.split(',').map((s: string) => s.trim()) : [];
        }

        return {
          ...p,
          image_url: normalizeImageUrl(p.image_url),
          tech_stack: parsedTech,
          is_published: Boolean(p.is_published),
          is_featured: Boolean(p.is_featured)
        };
      });

      return res.json(projects);
    } catch (err: any) {
      console.error('Get public projects error:', err);
      return res.status(500).json({ error: 'Failed to fetch portfolio projects.' });
    }
  });

  // Get single project details
  app.get('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid project ID.' });
      }

      const project = await dbGet<any>('SELECT * FROM projects WHERE id = ?', [id]);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      let parsedTech: string[] = [];
      try {
        parsedTech = typeof project.tech_stack === 'string' ? JSON.parse(project.tech_stack) : project.tech_stack || [];
      } catch (e) {
        parsedTech = project.tech_stack ? project.tech_stack.split(',').map((s: string) => s.trim()) : [];
      }

      return res.json({
        ...project,
        image_url: normalizeImageUrl(project.image_url),
        tech_stack: parsedTech,
        is_published: Boolean(project.is_published),
        is_featured: Boolean(project.is_featured)
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch project.' });
    }
  });

  // Submit public contact message
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
      const subjectText = typeof subject === 'string' ? subject.replace(/[\r\n]+/g, ' ').trim() : '';

      if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string' ||
          !name.trim() || !email.trim() || !message.trim()) {
        return res.status(400).json({ error: 'Name, email, and message are required fields.' });
      }

      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if ((subject !== undefined && typeof subject !== 'string') || phone.length > 40 ||
          name.trim().length > 150 || subjectText.length > 200 ||
          message.trim().length > 5000) {
        return res.status(400).json({ error: 'Please keep the contact details within the allowed length.' });
      }

      await dbRun(
        'INSERT INTO messages (sender_name, sender_email, sender_phone, subject, message) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), email.trim(), phone, subjectText, message.trim()]
      );

      const smtpHost = process.env.SMTP_HOST?.trim();
      const smtpUser = process.env.SMTP_USER?.trim();
      const smtpPass = process.env.SMTP_PASS;
      const recipient = process.env.CONTACT_EMAIL_TO?.trim() || 'rajarafic49@gmail.com';
      const from = process.env.EMAIL_FROM?.trim() || smtpUser;
      const port = Number(process.env.SMTP_PORT || 587);

      if (!smtpHost || !smtpUser || !smtpPass || !from || !recipient || !Number.isInteger(port) || port < 1 || port > 65535) {
        return res.status(503).json({
          error: 'Your message was saved to the admin inbox, but email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM in the server environment.'
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: process.env.SMTP_SECURE?.toLowerCase() === 'true' || port === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      try {
        await transporter.sendMail({
          from,
          to: recipient,
          replyTo: email.trim(),
          subject: `Portfolio message: ${subjectText || 'New contact'}`,
          text: [
            `Name: ${name.trim()}`,
            `Email: ${email.trim()}`,
            `Phone: ${phone || 'Not provided'}`,
            `Subject: ${subjectText || 'No subject'}`,
            '',
            'Message:',
            message.trim()
          ].join('\n')
        });
      } catch (mailError) {
        console.error('Contact email delivery failed:', mailError);
        return res.status(502).json({
          error: 'Your message was saved to the admin inbox, but email delivery failed. Please try again later.'
        });
      }

      return res.json({ success: true, message: 'Your message has been sent successfully!' });
    } catch (err: any) {
      console.error('Contact submit error:', err);
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
  });

  // ------------------------------------------
  // ADMIN PROTECTED ROUTES
  // ------------------------------------------

  // Admin Dashboard Overview Stats
  app.get('/api/admin/stats', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const totalProjectsRow = await dbGet<any>('SELECT COUNT(*) as count FROM projects');
      const publishedProjectsRow = await dbGet<any>('SELECT COUNT(*) as count FROM projects WHERE is_published = 1');
      const draftProjectsRow = await dbGet<any>('SELECT COUNT(*) as count FROM projects WHERE is_published = 0');
      const totalMessagesRow = await dbGet<any>('SELECT COUNT(*) as count FROM messages');
      const unreadMessagesRow = await dbGet<any>('SELECT COUNT(*) as count FROM messages WHERE is_read = 0');
      const profile = await dbGet<any>('SELECT name, title, skills FROM profile LIMIT 1');

      let skillsCount = 0;
      if (profile?.skills) {
        try {
          skillsCount = JSON.parse(profile.skills).length;
        } catch {
          skillsCount = profile.skills.split(',').length;
        }
      }

      return res.json({
        totalProjects: totalProjectsRow?.count || 0,
        publishedProjects: publishedProjectsRow?.count || 0,
        draftProjects: draftProjectsRow?.count || 0,
        totalMessages: totalMessagesRow?.count || 0,
        unreadMessages: unreadMessagesRow?.count || 0,
        profileStatus: {
          isConfigured: Boolean(profile?.name),
          name: profile?.name || 'Not configured',
          title: profile?.title || 'Not configured',
          skillsCount
        }
      });
    } catch (err: any) {
      console.error('Stats error:', err);
      return res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
    }
  });

  // Admin: Get all projects (Draft + Published)
  app.get('/api/admin/projects', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const rows = await dbAll<any>(
        'SELECT * FROM projects ORDER BY display_order ASC, created_at DESC'
      );

      const projects = rows.map((p) => {
        let parsedTech: string[] = [];
        try {
          parsedTech = typeof p.tech_stack === 'string' ? JSON.parse(p.tech_stack) : p.tech_stack || [];
        } catch (e) {
          parsedTech = p.tech_stack ? p.tech_stack.split(',').map((s: string) => s.trim()) : [];
        }

        return {
          ...p,
          image_url: normalizeImageUrl(p.image_url),
          tech_stack: parsedTech,
          is_published: Boolean(p.is_published),
          is_featured: Boolean(p.is_featured)
        };
      });

      return res.json(projects);
    } catch (err: any) {
      console.error('Admin get projects error:', err);
      return res.status(500).json({ error: 'Failed to fetch projects.' });
    }
  });

  // Admin: Create new project
  app.post('/api/admin/projects', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        title,
        short_description,
        detailed_description,
        tech_stack,
        image_url,
        live_demo_url,
        github_url,
        is_published,
        is_featured,
        display_order
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Project title is required.' });
      }
      if (!short_description || !short_description.trim()) {
        return res.status(400).json({ error: 'Short description is required.' });
      }
      if (image_url && !normalizeImageUrl(image_url)) {
        return res.status(400).json({ error: 'Choose an image with Upload; local file paths are not accessible to visitors.' });
      }

      // Convert tech_stack to JSON string
      let techStackString = '[]';
      if (Array.isArray(tech_stack)) {
        techStackString = JSON.stringify(tech_stack.filter((t: any) => typeof t === 'string' && t.trim().length > 0));
      } else if (typeof tech_stack === 'string') {
        techStackString = JSON.stringify(
          tech_stack
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        );
      }

      const publishedVal = is_published ? 1 : 0;
      const featuredVal = is_featured ? 1 : 0;
      const orderVal = typeof display_order === 'number' ? display_order : 0;

      const result = await dbRun(
        `INSERT INTO projects 
          (title, short_description, detailed_description, tech_stack, image_url, live_demo_url, github_url, is_published, is_featured, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          short_description.trim(),
          (detailed_description || '').trim(),
          techStackString,
          normalizeImageUrl(image_url),
          (live_demo_url || '').trim(),
          (github_url || '').trim(),
          publishedVal,
          featuredVal,
          orderVal
        ]
      );

      const created = await dbGet<any>('SELECT * FROM projects WHERE id = ?', [result.lastID]);
      return res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        project: {
          ...created,
          image_url: normalizeImageUrl(created.image_url),
          tech_stack: JSON.parse(created.tech_stack || '[]'),
          is_published: Boolean(created.is_published),
          is_featured: Boolean(created.is_featured)
        }
      });
    } catch (err: any) {
      console.error('Create project error:', err);
      return res.status(500).json({ error: 'Failed to create project.' });
    }
  });

  // Admin: Update existing project
  app.put('/api/admin/projects/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid project ID.' });
      }

      const existing = await dbGet<any>('SELECT * FROM projects WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      const {
        title,
        short_description,
        detailed_description,
        tech_stack,
        image_url,
        live_demo_url,
        github_url,
        is_published,
        is_featured,
        display_order
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Project title is required.' });
      }
      if (!short_description || !short_description.trim()) {
        return res.status(400).json({ error: 'Short description is required.' });
      }
      if (image_url && !normalizeImageUrl(image_url)) {
        return res.status(400).json({ error: 'Choose an image with Upload; local file paths are not accessible to visitors.' });
      }

      let techStackString = existing.tech_stack;
      if (Array.isArray(tech_stack)) {
        techStackString = JSON.stringify(tech_stack.filter((t: any) => typeof t === 'string' && t.trim().length > 0));
      } else if (typeof tech_stack === 'string') {
        techStackString = JSON.stringify(
          tech_stack
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        );
      }

      const publishedVal = is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published;
      const featuredVal = is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured;
      const orderVal = typeof display_order === 'number' ? display_order : existing.display_order;

      await dbRun(
        `UPDATE projects 
         SET title = ?, short_description = ?, detailed_description = ?, tech_stack = ?,
             image_url = ?, live_demo_url = ?, github_url = ?, is_published = ?,
             is_featured = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title.trim(),
          short_description.trim(),
          (detailed_description || '').trim(),
          techStackString,
          image_url !== undefined ? normalizeImageUrl(image_url) : normalizeImageUrl(existing.image_url),
          (live_demo_url !== undefined ? live_demo_url : existing.live_demo_url || '').trim(),
          (github_url !== undefined ? github_url : existing.github_url || '').trim(),
          publishedVal,
          featuredVal,
          orderVal,
          id
        ]
      );

      await removeUnusedUpload(existing.image_url || '');
      const updated = await dbGet<any>('SELECT * FROM projects WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: 'Project updated successfully.',
        project: {
          ...updated,
          image_url: normalizeImageUrl(updated.image_url),
          tech_stack: JSON.parse(updated.tech_stack || '[]'),
          is_published: Boolean(updated.is_published),
          is_featured: Boolean(updated.is_featured)
        }
      });
    } catch (err: any) {
      console.error('Update project error:', err);
      return res.status(500).json({ error: 'Failed to update project.' });
    }
  });

  // Admin: Toggle project visibility (Draft / Published)
  app.patch('/api/admin/projects/:id/visibility', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid project ID.' });
      }

      const existing = await dbGet<any>('SELECT is_published FROM projects WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      const newVisibility = existing.is_published === 1 ? 0 : 1;
      await dbRun(
        'UPDATE projects SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newVisibility, id]
      );

      return res.json({
        success: true,
        is_published: Boolean(newVisibility),
        message: `Project ${newVisibility === 1 ? 'published' : 'moved to drafts'}.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to toggle visibility.' });
    }
  });

  // Admin: Delete project
  app.delete('/api/admin/projects/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid project ID.' });
      }

      const existing = await dbGet<any>('SELECT title, image_url FROM projects WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      await dbRun('DELETE FROM projects WHERE id = ?', [id]);
      await removeUnusedUpload(existing.image_url || '');
      return res.json({ success: true, message: `Project "${existing.title}" deleted permanently.` });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete project.' });
    }
  });

  // Admin: Update Student Profile
  app.put('/api/admin/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        name,
        title,
        bio,
        avatar_url,
        email,
        github_url,
        linkedin_url,
        twitter_url,
        website_url,
        resume_url,
        skills,
        education,
        certificates
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Student name is required.' });
      }
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Headline title is required.' });
      }

      let skillsString = '[]';
      if (Array.isArray(skills)) {
        skillsString = JSON.stringify(skills.map((s: any) => String(s).trim()).filter((s) => s.length > 0));
      } else if (typeof skills === 'string') {
        skillsString = JSON.stringify(
          skills
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        );
      }

      const educationString = JSON.stringify(Array.isArray(education) ? education : []);
      const certificatesString = JSON.stringify(Array.isArray(certificates) ? certificates : []);
      const existing = await dbGet<any>('SELECT id, avatar_url, resume_url FROM profile LIMIT 1');
      if (avatar_url && !normalizeImageUrl(avatar_url)) {
        return res.status(400).json({ error: 'Choose an image with Upload; local file paths are not accessible to visitors.' });
      }
      if (resume_url && !normalizeImageUrl(resume_url)) {
        return res.status(400).json({ error: 'Upload your resume PDF or use a public resume URL; local file paths are not accessible to visitors.' });
      }
      if (existing) {
        await dbRun(
          `UPDATE profile 
           SET name = ?, title = ?, bio = ?, avatar_url = ?, email = ?,
               github_url = ?, linkedin_url = ?, twitter_url = ?, website_url = ?,
               resume_url = ?, skills = ?, education = ?, certificates = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            name.trim(),
            title.trim(),
            (bio || '').trim(),
            normalizeImageUrl(avatar_url),
            (email || '').trim(),
            (github_url || '').trim(),
            (linkedin_url || '').trim(),
            (twitter_url || '').trim(),
            (website_url || '').trim(),
            normalizeImageUrl(resume_url),
            skillsString,
            educationString,
            certificatesString,
            existing.id
          ]
        );
      } else {
        await dbRun(
          `INSERT INTO profile (name, title, bio, avatar_url, email, github_url, linkedin_url, twitter_url, website_url, resume_url, skills, education, certificates)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            name.trim(),
            title.trim(),
            (bio || '').trim(),
            normalizeImageUrl(avatar_url),
            (email || '').trim(),
            (github_url || '').trim(),
            (linkedin_url || '').trim(),
            (twitter_url || '').trim(),
            (website_url || '').trim(),
            normalizeImageUrl(resume_url),
            skillsString,
            educationString,
            certificatesString
          ]
        );
      }

      if (existing) await removeUnusedUpload(existing.avatar_url || '');
      if (existing && normalizeImageUrl(existing.resume_url) !== normalizeImageUrl(resume_url)) {
        await removeUnusedUpload(existing.resume_url || '');
      }
      const updated = await dbGet<any>('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        profile: {
          ...updated,
          avatar_url: normalizeImageUrl(updated.avatar_url),
          resume_url: normalizeImageUrl(updated.resume_url),
          skills: JSON.parse(updated.skills || '[]'),
          education: parseStoredArray(updated.education),
          certificates: parseStoredArray(updated.certificates)
        }
      });
    } catch (err: any) {
      console.error('Update profile error:', err);
      return res.status(500).json({ error: 'Failed to update student profile.' });
    }
  });

  // Admin: Update Account Security (Email, Name, Password)
  app.put('/api/admin/account', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { email, name, currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      const user = await dbGet<any>('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      let updatedEmail = user.email;
      let updatedName = user.name;

      if (email && email.trim() !== '') {
        const cleanEmail = email.trim().toLowerCase();
        // Check uniqueness if changing email
        if (cleanEmail !== user.email.toLowerCase()) {
          const emailCheck = await dbGet<any>('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [
            cleanEmail,
            userId
          ]);
          if (emailCheck) {
            return res.status(400).json({ error: 'This email is already in use by another account.' });
          }
          updatedEmail = cleanEmail;
        }
      }

      if (name && name.trim() !== '') {
        updatedName = name.trim();
      }

      // If user wants to change password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password.' });
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
          return res.status(400).json({ error: 'Current password does not match our records.' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await dbRun(
          'UPDATE users SET email = ?, name = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [updatedEmail, updatedName, hashedNewPassword, userId]
        );
      } else {
        await dbRun(
          'UPDATE users SET email = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [updatedEmail, updatedName, userId]
        );
      }

      const updatedUser = await dbGet<any>('SELECT id, email, name, role FROM users WHERE id = ?', [userId]);
      const newToken = generateToken(updatedUser);

      return res.json({
        success: true,
        message: 'Account settings updated successfully.',
        user: updatedUser,
        token: newToken
      });
    } catch (err: any) {
      console.error('Account update error:', err);
      return res.status(500).json({ error: 'Failed to update account settings.' });
    }
  });

  // Admin: Get contact messages
  app.get('/api/admin/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const messages = await dbAll<any>('SELECT * FROM messages ORDER BY created_at DESC');
      return res.json(
        messages.map((m) => ({
          ...m,
          is_read: Boolean(m.is_read)
        }))
      );
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
  });

  // Admin: Toggle message read status
  app.patch('/api/admin/messages/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const msg = await dbGet<any>('SELECT is_read FROM messages WHERE id = ?', [id]);
      if (!msg) {
        return res.status(404).json({ error: 'Message not found.' });
      }

      const newStatus = msg.is_read === 1 ? 0 : 1;
      await dbRun('UPDATE messages SET is_read = ? WHERE id = ?', [newStatus, id]);
      return res.json({ success: true, is_read: Boolean(newStatus) });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update message.' });
    }
  });

  // Admin: Delete message
  app.delete('/api/admin/messages/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await dbRun('DELETE FROM messages WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Message deleted.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete message.' });
    }
  });

  // Admin: Image Upload endpoint (accepts file or base64 data URI)
  app.post('/api/admin/upload', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { image } = req.body;
      if (typeof image !== 'string' || !image) {
        return res.status(400).json({ error: 'No image data provided.' });
      }

      const matches = image.match(/^data:image\/(jpeg|jpg|png|gif|webp|avif|bmp);base64,([A-Za-z0-9+/]+={0,2})$/i);
      if (!matches) {
        return res.status(400).json({ error: 'Upload a JPEG, PNG, GIF, WebP, AVIF, or BMP image.' });
      }

      const ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
      const imageData = Buffer.from(matches[2], 'base64');
      if (!imageData.length || imageData.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image file must be under 10MB.' });
      }

      const safeFilename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      await fs.promises.writeFile(path.join(uploadsDir, safeFilename), imageData, { flag: 'wx' });
      return res.json({ success: true, url: `/uploads/${safeFilename}` });
    } catch (err: any) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Failed to process image upload.' });
    }
  });

  app.post('/api/admin/upload-resume', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { file } = req.body;
      const match = typeof file === 'string' && file.match(/^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/i);
      if (!match) {
        return res.status(400).json({ error: 'Upload a valid PDF resume.' });
      }

      const pdfData = Buffer.from(match[1], 'base64');
      if (pdfData.length < 5 || pdfData.length > 10 * 1024 * 1024 || pdfData.subarray(0, 5).toString() !== '%PDF-') {
        return res.status(400).json({ error: 'Resume PDF must be valid and under 10MB.' });
      }

      const filename = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.pdf`;
      await fs.promises.writeFile(path.join(uploadsDir, filename), pdfData, { flag: 'wx' });
      return res.json({ success: true, url: `/uploads/${filename}` });
    } catch (err) {
      console.error('Resume upload error:', err);
      return res.status(500).json({ error: 'Failed to upload resume PDF.' });
    }
  });

  // Admin: Reset / Re-seed sample projects helper
  app.post('/api/admin/seed-demo', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await dbRun('DELETE FROM projects');
      // Re-trigger seed
      const defaultSkills = JSON.stringify([
        'TypeScript', 'React', 'Node.js', 'Express', 'Tailwind CSS', 'PostgreSQL', 'SQLite', 'Python', 'Git', 'REST APIs'
      ]);
      await dbRun('UPDATE profile SET skills = ? WHERE id = (SELECT id FROM profile LIMIT 1)', [defaultSkills]);
      
      const sampleProjects = [
        {
          title: 'AlgoCraft - Interactive Algorithm Visualizer',
          short_description: 'Interactive web platform visualizing graph traversal, dynamic programming, and sorting algorithms in real-time.',
          detailed_description: `## Overview\nAlgoCraft is an educational web application developed to help computer science students comprehend complex algorithms through dynamic, step-by-step visual transitions.\n\n### Key Features\n- **Graph Algorithms**: BFS, DFS, Dijkstra's shortest path, and A* pathfinding on custom grids.\n- **Sorting Visualizer**: QuickSort, MergeSort, HeapSort with adjustable playback speeds.\n- **Execution Timeline**: Pause, rewind, and step forwards through algorithmic states.\n- **Custom Input Support**: Create custom weighted graphs and weighted matrices.\n\n### Architectural Highlights\nBuilt with React, WebGL rendering canvas, and custom state machines to maintain zero-lag 60fps animations during heavy computation.`,
          tech_stack: JSON.stringify(['React', 'TypeScript', 'Canvas API', 'Tailwind CSS', 'Vite']),
          image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
          live_demo_url: 'https://algocraft-demo.example.com',
          github_url: 'https://github.com/alexrivera-dev/algocraft-visualizer',
          is_published: 1,
          is_featured: 1,
          display_order: 1
        },
        {
          title: 'CampusPulse - Student Collaboration Hub',
          short_description: 'Full-stack peer-to-peer study group coordinator, assignment deadline tracker, and campus resource finder.',
          detailed_description: `## Overview\nCampusPulse connects over 1,500 students across 6 departments to find study partners, share course materials, and synchronize group schedules.\n\n### Highlights\n- **Real-Time Study Rooms**: WebSocket-powered chat and collaborative markdown scratchpads.\n- **Automated Reminders**: Push alerts for upcoming assignment milestones.\n- **Course Review Aggregator**: Student-vetted reviews of electives and professors.\n\n### Tech Stack & Performance\n- Backend implemented with Express.js, SQLite / PostgreSQL data caching.\n- JWT authentication with role-based permissions (Student, TA, Moderator).`,
          tech_stack: JSON.stringify(['Node.js', 'Express', 'SQLite', 'React', 'Tailwind CSS', 'JWT']),
          image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
          live_demo_url: 'https://campuspulse.example.com',
          github_url: 'https://github.com/alexrivera-dev/campuspulse-hub',
          is_published: 1,
          is_featured: 1,
          display_order: 2
        },
        {
          title: 'NeuralSketch - Edge AI Doodle Classifier',
          short_description: 'Client-side deep learning web app that recognizes hand-drawn sketches with 94% accuracy in real-time.',
          detailed_description: `## Overview\nNeuralSketch allows users to draw sketches on a digital canvas and predicts what is being drawn using a custom lightweight Convolutional Neural Network (CNN) trained on the QuickDraw dataset.\n\n### Technical Details\n- **Model**: Custom quantized MobileNet trained using PyTorch, converted for in-browser inference.\n- **Performance**: Zero server round-trips; inferences execute in < 18ms on low-power mobile devices.\n- **Game Mode**: Competitive quick-draw challenge with leaderboards.`,
          tech_stack: JSON.stringify(['Python', 'PyTorch', 'TypeScript', 'Web Workers', 'Tailwind CSS']),
          image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          live_demo_url: 'https://neuralsketch.example.com',
          github_url: 'https://github.com/alexrivera-dev/neural-sketch-app',
          is_published: 1,
          is_featured: 0,
          display_order: 3
        },
        {
          title: 'DevMetrics - GitHub Activity Analytics Dashboard',
          short_description: 'Developer productivity tool analyzing Git commit rhythms, code reviews, and repo velocity with rich visualizations.',
          detailed_description: `## Overview\nDevMetrics ingests GitHub API webhooks and provides engineering students with insights into their coding consistency, language breakdown, and collaborative habits.\n\n### Features\n- Heatmaps of commit frequency and peak productivity hours.\n- Language distribution radar charts.\n- Pull request lifecycle analytics.`,
          tech_stack: JSON.stringify(['React', 'Recharts', 'Express', 'REST API', 'Tailwind CSS']),
          image_url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
          live_demo_url: 'https://devmetrics.example.com',
          github_url: 'https://github.com/alexrivera-dev/devmetrics-dashboard',
          is_published: 0,
          is_featured: 0,
          display_order: 4
        }
      ];

      for (const p of sampleProjects) {
        await dbRun(
          `INSERT INTO projects (title, short_description, detailed_description, tech_stack, image_url, live_demo_url, github_url, is_published, is_featured, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.title, p.short_description, p.detailed_description, p.tech_stack,
            p.image_url, p.live_demo_url, p.github_url, p.is_published, p.is_featured, p.display_order
          ]
        );
      }

      return res.json({ success: true, message: 'Sample projects reset successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to reset sample projects.' });
    }
  });

  // Serve static uploads
  app.use('/uploads', express.static(uploadsDir));

  // ==========================================
  // VITE MIDDLEWARE / PRODUCTION STATIC SERVE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Student Portfolio & CMS server running on port ${PORT}`);
  });
}

startServer();

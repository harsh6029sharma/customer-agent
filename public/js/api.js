/**
 * Customer Support Agent - API Service Layer
 * Supports both dummy mock data and real REST backend endpoints.
 */

(function (window) {
  'use strict';

  // Toggle flag for switching between local mock data and real backend APIs
  let USE_MOCK_DATA = true;
  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // Helper delay function to simulate async network latency
  const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

  // Current authenticated user state stored in localStorage or memory
  let currentUser = JSON.parse(localStorage.getItem('cs_user')) || {
    id: 'u-101',
    name: 'Harsh Vardhan',
    email: 'backend.admin@agent.io',
    role: 'Senior Support Engineer',
  };

  // Initial Mock Database
  let mockTickets = JSON.parse(localStorage.getItem('cs_tickets')) || [
    {
      id: 'TCK-1001',
      subject: 'Database connection pool timeout under peak load',
      customerName: 'Alex Rivera',
      customerEmail: 'alex.r@enterprise.co',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'Infrastructure',
      createdAt: '2026-07-26T18:30:00Z',
      updatedAt: '2026-07-26T19:15:00Z',
      assignedTo: 'Harsh Vardhan',
      messages: [
        {
          id: 'msg-1',
          sender: 'Alex Rivera',
          role: 'customer',
          text: 'We are experiencing intermittent connection timeout errors when query burst rate exceeds 500 req/sec. Could you inspect postgresql pool configuration?',
          timestamp: '2026-07-26T18:30:00Z'
        },
        {
          id: 'msg-2',
          sender: 'AI Assistant',
          role: 'ai',
          text: 'RAG Analysis: Recommended action is to adjust max_connections in postgresql.conf and verify Prisma client connection release settings.',
          timestamp: '2026-07-26T18:31:00Z'
        }
      ]
    },
    {
      id: 'TCK-1002',
      subject: 'JWT Auth token expiration handling in mobile client',
      customerName: 'Sarah Chen',
      customerEmail: 'sarah@fintechapp.io',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      category: 'Authentication',
      createdAt: '2026-07-26T16:20:00Z',
      updatedAt: '2026-07-26T18:00:00Z',
      assignedTo: 'Harsh Vardhan',
      messages: [
        {
          id: 'msg-3',
          sender: 'Sarah Chen',
          role: 'customer',
          text: 'Refresh token endpoint returns 401 when access token expires after 15 minutes. Need clarification on headers.',
          timestamp: '2026-07-26T16:20:00Z'
        }
      ]
    },
    {
      id: 'TCK-1003',
      subject: 'Webhook event delivery retry exponential backoff failure',
      customerName: 'Michael Scott',
      customerEmail: 'm.scott@dunder.com',
      status: 'RESOLVED',
      priority: 'HIGH',
      category: 'API Webhooks',
      createdAt: '2026-07-25T11:00:00Z',
      updatedAt: '2026-07-26T14:10:00Z',
      assignedTo: 'Support Agent',
      messages: [
        {
          id: 'msg-4',
          sender: 'Michael Scott',
          role: 'customer',
          text: 'Webhook retries stop after 3 attempts instead of standard 5. Resolved by updating retry queue worker config.',
          timestamp: '2026-07-25T11:00:00Z'
        }
      ]
    },
    {
      id: 'TCK-1004',
      subject: 'ChromaDB vector embedding sync delay for new documentation',
      customerName: 'David Kim',
      customerEmail: 'dkim@techcorp.org',
      status: 'OPEN',
      priority: 'LOW',
      category: 'RAG Knowledge Base',
      createdAt: '2026-07-26T19:00:00Z',
      updatedAt: '2026-07-26T19:00:00Z',
      assignedTo: 'Unassigned',
      messages: [
        {
          id: 'msg-5',
          sender: 'David Kim',
          role: 'customer',
          text: 'Newly uploaded Markdown files take up to 10 minutes to appear in AI agent search query context.',
          timestamp: '2026-07-26T19:00:00Z'
        }
      ]
    },
    {
      id: 'TCK-1005',
      subject: 'Rate limiter Redis cluster failover notification',
      customerName: 'Elena Rostova',
      customerEmail: 'elena@cloudscale.net',
      status: 'CLOSED',
      priority: 'MEDIUM',
      category: 'Rate Limiting',
      createdAt: '2026-07-24T09:40:00Z',
      updatedAt: '2026-07-25T16:00:00Z',
      assignedTo: 'Harsh Vardhan',
      messages: [
        {
          id: 'msg-6',
          sender: 'Elena Rostova',
          role: 'customer',
          text: 'Confirmed rate limit fallback to memory driver worked seamlessly during Redis node reboot.',
          timestamp: '2026-07-24T09:40:00Z'
        }
      ]
    }
  ];

  let mockKBDocs = JSON.parse(localStorage.getItem('cs_kb_docs')) || [
    { id: 'kb-1', title: 'PostgreSQL Connection Pooling Best Practices.md', chunks: 14, status: 'INDEXED', createdAt: '2026-07-20' },
    { id: 'kb-2', title: 'JWT Authentication & Refresh Flow Documentation.md', chunks: 8, status: 'INDEXED', createdAt: '2026-07-21' },
    { id: 'kb-3', title: 'Redis Rate Limiter Configuration Guide.md', chunks: 11, status: 'INDEXED', createdAt: '2026-07-23' },
    { id: 'kb-4', title: 'ChromaDB Vector Embeddings Pipeline Setup.md', chunks: 22, status: 'INDEXED', createdAt: '2026-07-24' }
  ];

  let mockAuditLogs = [
    { id: 'act-1', text: 'Ticket <strong>TCK-1004</strong> created by David Kim', time: '15 minutes ago', icon: 'fa-ticket' },
    { id: 'act-2', text: 'AI Agent updated RAG context for ticket <strong>TCK-1001</strong>', time: '45 minutes ago', icon: 'fa-robot' },
    { id: 'act-3', text: 'Status changed on <strong>TCK-1003</strong> to <span class="badge badge-green">RESOLVED</span>', time: '2 hours ago', icon: 'fa-check' },
    { id: 'act-4', text: 'New KB document <strong>ChromaDB Pipeline Setup</strong> indexed', time: 'Yesterday', icon: 'fa-file-code' }
  ];

  function persistData() {
    localStorage.setItem('cs_tickets', JSON.stringify(mockTickets));
    localStorage.setItem('cs_kb_docs', JSON.stringify(mockKBDocs));
    localStorage.setItem('cs_user', JSON.stringify(currentUser));
  }

  // API Service Object Interface
  const apiService = {
    // Check API mode
    isMockMode: () => USE_MOCK_DATA,
    setMockMode: (val) => {
      USE_MOCK_DATA = !!val;
    },

    // Current Auth User
    getCurrentUser: () => currentUser,

    // 1. Authentication Endpoints
    async login(email, password) {
      if (USE_MOCK_DATA) {
        await delay(300);
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        currentUser = {
          id: 'u-101',
          name: email.split('@')[0].toUpperCase(),
          email: email,
          role: 'Backend Engineer',
        };
        persistData();
        return { success: true, user: currentUser };
      }

      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Invalid credentials' }));
        throw new Error(err.message || 'Login failed');
      }
      const data = await res.json();
      currentUser = data.data.user;
      persistData();
      return data;
    },

    async register(userData) {
      if (USE_MOCK_DATA) {
        await delay(300);
        currentUser = {
          id: 'u-' + Date.now(),
          name: userData.name || 'Engineer',
          email: userData.email,
          role: 'Support Engineer',
        };
        persistData();
        return { success: true, user: currentUser };
      }

      const res = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(err.message || 'Registration error');
      }
      return await res.json();
    },

    async logout() {
      if (USE_MOCK_DATA) {
        await delay(150);
        currentUser = null;
        localStorage.removeItem('cs_user');
        return { success: true };
      }

      await fetch(`${API_BASE_URL}/users/logout`, { method: 'POST' });
      currentUser = null;
      localStorage.removeItem('cs_user');
      return { success: true };
    },

    // 2. Ticket Endpoints
    async getTickets({ search = '', status = '', priority = '' } = {}) {
      if (USE_MOCK_DATA) {
        await delay(200);
        let list = [...mockTickets];
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (t) =>
              t.id.toLowerCase().includes(q) ||
              t.subject.toLowerCase().includes(q) ||
              (t.customerName && t.customerName.toLowerCase().includes(q)) ||
              (t.category && t.category.toLowerCase().includes(q))
          );
        }
        if (status) {
          list = list.filter((t) => t.status === status);
        }
        if (priority) {
          list = list.filter((t) => t.priority === priority);
        }
        return { success: true, tickets: list };
      }

      const res = await fetch(`${API_BASE_URL}/tickets/my-tickets`, { credentials: 'include' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to fetch tickets' }));
        throw new Error(errData.message || 'Failed to fetch tickets');
      }
      const json = await res.json();
      const payload = json.data || {};
      const rawTickets = Array.isArray(payload) ? payload : payload.tickets || [];

      // Normalize backend model fields to frontend structure
      const formatted = rawTickets.map((t) => ({
        id: t.id,
        subject: t.title || t.subject,
        customerName: t.user?.name || t.customerName || 'Customer',
        customerEmail: t.user?.email || t.customerEmail || '',
        status: t.status || 'OPEN',
        priority: t.priority || 'MEDIUM',
        category: t.category || 'TECHNICAL',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        assignedTo: t.assignedTo || 'Support Engineer',
      }));

      return { success: true, tickets: formatted };
    },

    async getTicketById(id) {
      if (USE_MOCK_DATA) {
        await delay(150);
        const ticket = mockTickets.find((t) => t.id === id);
        if (!ticket) throw new Error(`Ticket ${id} not found`);
        return { success: true, ticket };
      }

      const res = await fetch(`${API_BASE_URL}/tickets/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Ticket ${id} not found`);
      const json = await res.json();
      const raw = json.data;

      // Fetch messages for ticket
      let messages = [];
      try {
        const msgRes = await fetch(`${API_BASE_URL}/tickets/${id}/messages`, { credentials: 'include' });
        if (msgRes.ok) {
          const msgJson = await msgRes.json();
          messages = (msgJson.data || []).map((m) => ({
            id: m.id,
            sender: m.sender === 'USER' ? 'Customer' : m.sender === 'AI' ? 'AI Assistant' : 'Support Engineer',
            role: m.sender === 'USER' ? 'customer' : m.sender === 'AI' ? 'ai' : 'engineer',
            text: m.message,
            timestamp: m.createdAt,
          }));
        }
      } catch (e) {
        console.warn('Could not load ticket messages:', e);
      }

      const formattedTicket = {
        id: raw.id,
        subject: raw.title || raw.subject,
        customerName: raw.user?.name || raw.customerName || 'Customer',
        customerEmail: raw.user?.email || raw.customerEmail || 'customer@client.com',
        status: raw.status || 'OPEN',
        priority: raw.priority || 'MEDIUM',
        category: raw.category || 'TECHNICAL',
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        assignedTo: raw.assignedTo || 'Support Engineer',
        messages: messages,
      };

      return { success: true, ticket: formattedTicket };
    },

    async createTicket(data) {
      if (USE_MOCK_DATA) {
        await delay(250);
        const newId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
        const newTicket = {
          id: newId,
          subject: data.subject,
          customerName: data.customerName || 'Internal Client',
          customerEmail: data.customerEmail || 'client@internal.dev',
          status: 'OPEN',
          priority: data.priority || 'MEDIUM',
          category: data.category || 'General',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: 'Harsh Vardhan',
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: data.customerName || 'Internal Client',
              role: 'customer',
              text: data.description,
              timestamp: new Date().toISOString(),
            },
          ],
        };
        mockTickets.unshift(newTicket);
        mockAuditLogs.unshift({
          id: `act-${Date.now()}`,
          text: `Ticket <strong>${newId}</strong> created: ${data.subject}`,
          time: 'Just now',
          icon: 'fa-plus-circle',
        });
        persistData();
        return { success: true, ticket: newTicket };
      }

      const res = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: data.subject || data.title,
          description: data.description,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: 'Failed to create ticket' }));
        throw new Error(errJson.message || 'Failed to create ticket');
      }
      const json = await res.json();
      const raw = json.data;
      return {
        success: true,
        ticket: {
          id: raw.id,
          subject: raw.title,
          status: raw.status || 'OPEN',
          priority: raw.priority || 'MEDIUM',
        },
      };
    },

    async updateTicket(id, updates) {
      if (USE_MOCK_DATA) {
        await delay(150);
        const index = mockTickets.findIndex((t) => t.id === id);
        if (index === -1) throw new Error('Ticket not found');
        mockTickets[index] = {
          ...mockTickets[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        if (updates.status) {
          mockAuditLogs.unshift({
            id: `act-${Date.now()}`,
            text: `Status updated on <strong>${id}</strong> to ${updates.status}`,
            time: 'Just now',
            icon: 'fa-sync',
          });
        }
        persistData();
        return { success: true, ticket: mockTickets[index] };
      }

      const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      const json = await res.json();
      return { success: true, ticket: json.data };
    },

    async deleteTicket(id) {
      if (USE_MOCK_DATA) {
        await delay(200);
        mockTickets = mockTickets.filter((t) => t.id !== id);
        persistData();
        return { success: true };
      }

      const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete ticket');
      return await res.json();
    },

    async addMessage(ticketId, text, role = 'engineer') {
      if (USE_MOCK_DATA) {
        await delay(200);
        const ticket = mockTickets.find((t) => t.id === ticketId);
        if (!ticket) throw new Error('Ticket not found');
        const newMsg = {
          id: `msg-${Date.now()}`,
          sender: role === 'engineer' ? currentUser.name : 'Customer',
          role: role,
          text: text,
          timestamp: new Date().toISOString(),
        };
        ticket.messages.push(newMsg);
        ticket.updatedAt = new Date().toISOString();
        persistData();
        return { success: true, message: newMsg };
      }

      const senderType = role === 'customer' ? 'USER' : role === 'ai' ? 'AI' : 'AGENT';
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, sender: senderType }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      const json = await res.json();
      return { success: true, message: json.data };
    },

    // 3. Dashboard Analytics & Logs
    async getAnalytics() {
      if (USE_MOCK_DATA) {
        await delay(150);
        const total = mockTickets.length;
        const open = mockTickets.filter((t) => t.status === 'OPEN').length;
        const inProgress = mockTickets.filter((t) => t.status === 'IN_PROGRESS').length;
        const resolved = mockTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
        return {
          success: true,
          stats: {
            totalTickets: total,
            openTickets: open,
            inProgressTickets: inProgress,
            resolvedTickets: resolved,
            avgResponseTime: '18 min',
            aiResolutionRate: '84%',
          },
          auditLogs: mockAuditLogs,
        };
      }

      const res = await fetch(`${API_BASE_URL}/tickets/analytics`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
      const payload = json.data || {};

      const total = payload.totalTickets || 0;
      const byStatus = payload.byStatus || {};

      return {
        success: true,
        stats: {
          totalTickets: total,
          openTickets: byStatus.OPEN || 0,
          inProgressTickets: byStatus.IN_PROGRESS || 0,
          resolvedTickets: (byStatus.RESOLVED || 0) + (byStatus.CLOSED || 0),
          avgResponseTime: '18 min',
          aiResolutionRate: '84%',
        },
        auditLogs: mockAuditLogs,
      };
    },

    // 4. Knowledge Base & Vector Indexing
    async getKBDocs() {
      if (USE_MOCK_DATA) {
        await delay(150);
        return { success: true, docs: mockKBDocs };
      }
      return { success: true, docs: mockKBDocs };
    },

    async ingestDoc(fileName, fileSize = 1024, content = '') {
      if (USE_MOCK_DATA) {
        await delay(400);
        const name = fileName || 'Uploaded_Document.md';
        // Calculate estimated vector chunks (1 chunk per ~250 chars or min 4)
        const computedChunks = content ? Math.max(2, Math.ceil(content.length / 250)) : Math.floor(6 + Math.random() * 15);
        
        const newDoc = {
          id: `kb-${Date.now()}`,
          title: name,
          chunks: computedChunks,
          status: 'INDEXED',
          createdAt: new Date().toISOString().split('T')[0],
        };
        mockKBDocs.unshift(newDoc);
        mockAuditLogs.unshift({
          id: `act-${Date.now()}`,
          text: `Knowledge base ingested file: <strong>${newDoc.title}</strong> (${(fileSize / 1024).toFixed(1)} KB)`,
          time: 'Just now',
          icon: 'fa-file-upload',
        });
        persistData();
        return { success: true, doc: newDoc };
      }
      return { success: true };
    },
  };

  // Expose API module globally
  window.api = apiService;
})(window);

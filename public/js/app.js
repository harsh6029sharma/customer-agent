/**
 * Customer Support Agent - Application Router & Main Controller
 * Vanilla ES6 SPA routing, event dispatching, and dynamic DOM rendering.
 */

(function (window) {
  'use strict';

  // Application State
  const state = {
    currentRoute: 'dashboard',
    ticketsFilter: { search: '', status: '', priority: '' },
    currentPage: 1,
    itemsPerPage: 5,
    selectedTicketId: null,
  };

  // 1. Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    setupAuthUI();
    setupEventListeners();
    setupMobileSidebar();

    // Check if user is logged in
    const user = api.getCurrentUser();
    if (user) {
      showMainApp(user);
      handleRouting();
    } else {
      showAuthScreen();
    }

    // Router listener
    window.addEventListener('hashchange', handleRouting);
  }

  // 2. Authentication UI & Tab Controller
  function setupAuthUI() {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tabLogin && tabRegister && loginForm && registerForm) {
      tabLogin.addEventListener('click', () => {
        tabLogin.style.borderBottomColor = 'var(--primary)';
        tabLogin.style.color = 'var(--text-main)';
        tabLogin.style.fontWeight = '600';

        tabRegister.style.borderBottomColor = 'transparent';
        tabRegister.style.color = 'var(--text-muted)';
        tabRegister.style.fontWeight = '500';

        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.style.borderBottomColor = 'var(--primary)';
        tabRegister.style.color = 'var(--text-main)';
        tabRegister.style.fontWeight = '600';

        tabLogin.style.borderBottomColor = 'transparent';
        tabLogin.style.color = 'var(--text-muted)';
        tabLogin.style.fontWeight = '500';

        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
      });
    }
  }

  function showAuthScreen() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
  }

  function showMainApp(user) {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    // Update user info in navbar
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar-initials');

    if (nameEl) nameEl.textContent = user.name || 'Engineer';
    if (roleEl) roleEl.textContent = user.role || 'Backend Engineer';
    if (avatarEl) {
      const initials = (user.name || 'BE')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      avatarEl.textContent = initials;
    }

    updateApiModeBadge();
  }

  function updateApiModeBadge() {
    const badge = document.getElementById('api-mode-badge');
    if (badge) {
      if (api.isMockMode()) {
        badge.className = 'badge badge-blue';
        badge.textContent = 'MOCK API';
      } else {
        badge.className = 'badge badge-green';
        badge.textContent = 'LIVE API';
      }
    }
  }

  // 3. Router & View Controller
  function handleRouting() {
    if (!api.getCurrentUser()) {
      showAuthScreen();
      return;
    }

    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const [route, queryString] = hash.split('?');
    state.currentRoute = route;

    // Parse query params if present (e.g. ticket-detail?id=TCK-1001)
    const params = new URLSearchParams(queryString || '');
    if (params.has('id')) {
      state.selectedTicketId = params.get('id');
    }

    // Update active nav link
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach((item) => {
      if (item.getAttribute('data-route') === route) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Hide all views
    const views = document.querySelectorAll('.page-view');
    views.forEach((v) => v.classList.add('hidden'));

    // Update Topbar Title & Render Target View
    const pageHeading = document.getElementById('page-heading');

    switch (route) {
      case 'dashboard':
        if (pageHeading) pageHeading.textContent = 'Engineering Dashboard';
        document.getElementById('view-dashboard').classList.remove('hidden');
        renderDashboard();
        break;

      case 'tickets':
        if (pageHeading) pageHeading.textContent = 'Support Tickets';
        document.getElementById('view-tickets').classList.remove('hidden');
        renderTickets();
        break;

      case 'ticket-detail':
        if (pageHeading) pageHeading.textContent = `Ticket Details - ${state.selectedTicketId || ''}`;
        document.getElementById('view-ticket-detail').classList.remove('hidden');
        if (state.selectedTicketId) {
          renderTicketDetail(state.selectedTicketId);
        } else {
          window.location.hash = 'tickets';
        }
        break;

      case 'kb':
        if (pageHeading) pageHeading.textContent = 'Knowledge Base & RAG Index';
        document.getElementById('view-kb').classList.remove('hidden');
        renderKB();
        break;

      case 'analytics':
        if (pageHeading) pageHeading.textContent = 'System Analytics';
        document.getElementById('view-analytics').classList.remove('hidden');
        break;

      case 'settings':
        if (pageHeading) pageHeading.textContent = 'Settings & API Config';
        document.getElementById('view-settings').classList.remove('hidden');
        renderSettings();
        break;

      default:
        if (pageHeading) pageHeading.textContent = '404 - Not Found';
        document.getElementById('view-404').classList.remove('hidden');
        break;
    }
  }

  // 4. View Renderers

  // Dashboard Renderer
  async function renderDashboard() {
    const tableBody = document.getElementById('dashboard-recent-table-body');
    const activityList = document.getElementById('dashboard-activity-list');

    if (tableBody) tableBody.innerHTML = `<tr><td colspan="5">${UI.renderLoadingSpinner()}</td></tr>`;

    try {
      const { stats, auditLogs } = await api.getAnalytics();
      const { tickets } = await api.getTickets();

      // Update stat cards
      document.getElementById('stat-total-tickets').textContent = stats.totalTickets;
      document.getElementById('stat-open-tickets').textContent = stats.openTickets;
      document.getElementById('stat-resolved-tickets').textContent = stats.resolvedTickets;
      document.getElementById('stat-avg-time').textContent = stats.avgResponseTime;

      // Render Recent Table (up to 4 records)
      const recent = tickets.slice(0, 4);
      if (recent.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center; padding: 1.5rem;">No tickets available.</td></tr>`;
      } else {
        tableBody.innerHTML = recent
          .map(
            (t) => `
          <tr>
            <td><strong style="color: var(--primary);">${t.id}</strong></td>
            <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.subject}</td>
            <td>${UI.renderPriorityBadge(t.priority)}</td>
            <td>${UI.renderStatusBadge(t.status)}</td>
            <td>
              <a href="#ticket-detail?id=${t.id}" class="table-action-btn">
                <i class="fas fa-eye"></i> View
              </a>
            </td>
          </tr>
        `
          )
          .join('');
      }

      // Render System Activity Stream
      if (activityList && auditLogs) {
        activityList.innerHTML = auditLogs
          .map(
            (log) => `
          <div class="activity-item">
            <div class="activity-badge"><i class="fas ${log.icon}"></i></div>
            <div class="activity-content">
              <span class="activity-text">${log.text}</span>
              <span class="activity-time">${log.time}</span>
            </div>
          </div>
        `
          )
          .join('');
      }
    } catch (err) {
      Toast.error('Failed to load dashboard data: ' + err.message);
    }
  }

  // Tickets List Renderer
  async function renderTickets() {
    const tableBody = document.getElementById('tickets-table-body');
    const paginationInfo = document.getElementById('tickets-pagination-info');
    const paginationControls = document.getElementById('tickets-pagination-controls');

    if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">${UI.renderLoadingSpinner()}</td></tr>`;

    try {
      const { tickets } = await api.getTickets(state.ticketsFilter);

      if (!tickets || tickets.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8">
              ${UI.renderEmptyState({
                icon: 'fa-ticket-alt',
                title: 'No Tickets Found',
                text: 'No tickets match your search or filter parameters.',
                actionBtnId: 'empty-reset-filters-btn',
                actionBtnText: 'Reset Filters',
              })}
            </td>
          </tr>
        `;
        const resetBtn = document.getElementById('empty-reset-filters-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            document.getElementById('tickets-search-input').value = '';
            document.getElementById('tickets-status-filter').value = '';
            document.getElementById('tickets-priority-filter').value = '';
            state.ticketsFilter = { search: '', status: '', priority: '' };
            renderTickets();
          });
        }
        if (paginationInfo) paginationInfo.textContent = 'Showing 0 items';
        if (paginationControls) paginationControls.innerHTML = '';
        return;
      }

      // Pagination calculations
      const totalItems = tickets.length;
      const totalPages = Math.ceil(totalItems / state.itemsPerPage);
      if (state.currentPage > totalPages) state.currentPage = 1;

      const startIndex = (state.currentPage - 1) * state.itemsPerPage;
      const endIndex = Math.min(startIndex + state.itemsPerPage, totalItems);
      const pageTickets = tickets.slice(startIndex, endIndex);

      tableBody.innerHTML = pageTickets
        .map(
          (t) => `
        <tr>
          <td><strong style="color: var(--primary);">${t.id}</strong></td>
          <td style="max-width: 240px; font-weight: 500;">${t.subject}</td>
          <td>${t.customerName}</td>
          <td><span style="font-size: 0.8rem; color: var(--text-muted);">${t.category}</span></td>
          <td>${UI.renderPriorityBadge(t.priority)}</td>
          <td>${UI.renderStatusBadge(t.status)}</td>
          <td style="font-size: 0.8rem; color: var(--text-dark);">${new Date(t.updatedAt).toLocaleDateString()}</td>
          <td>
            <a href="#ticket-detail?id=${t.id}" class="table-action-btn" title="View Details">
              <i class="fas fa-eye"></i>
            </a>
          </td>
        </tr>
      `
        )
        .join('');

      if (paginationInfo) {
        paginationInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalItems} tickets`;
      }

      if (paginationControls) {
        paginationControls.innerHTML = UI.renderPagination(
          state.currentPage,
          totalPages,
          'window.changeTicketsPage'
        );
      }
    } catch (err) {
      Toast.error('Error fetching tickets: ' + err.message);
    }
  }

  // Global helper for pagination click
  window.changeTicketsPage = function (page) {
    state.currentPage = page;
    renderTickets();
  };

  // Ticket Detail View Renderer
  async function renderTicketDetail(ticketId) {
    const threadContainer = document.getElementById('ticket-discussion-thread');
    if (threadContainer) threadContainer.innerHTML = UI.renderLoadingSpinner('Loading conversation...');

    try {
      const { ticket } = await api.getTicketById(ticketId);

      document.getElementById('detail-ticket-id').textContent = ticket.id;
      document.getElementById('detail-ticket-subject').textContent = ticket.subject;
      document.getElementById('detail-status-badge').innerHTML = UI.renderStatusBadge(ticket.status);
      document.getElementById('detail-priority-badge').innerHTML = UI.renderPriorityBadge(ticket.priority);

      document.getElementById('detail-customer-name').textContent = ticket.customerName;
      document.getElementById('detail-customer-email').textContent = ticket.customerEmail;
      document.getElementById('detail-category').textContent = ticket.category;
      document.getElementById('detail-assigned').textContent = ticket.assignedTo || 'Unassigned';

      // Render Messages
      if (threadContainer) {
        if (!ticket.messages || ticket.messages.length === 0) {
          threadContainer.innerHTML = `<p class="text-muted">No messages in this thread yet.</p>`;
        } else {
          threadContainer.innerHTML = ticket.messages
            .map((msg) => {
              const isAi = msg.role === 'ai';
              const aiClass = isAi ? 'ai-agent' : '';
              const icon = isAi ? 'fa-robot' : msg.role === 'customer' ? 'fa-user' : 'fa-user-shield';
              return `
              <div class="message-bubble ${aiClass}">
                <div class="message-header">
                  <span class="message-author">
                    <i class="fas ${icon}" style="color: var(--primary);"></i>
                    ${msg.sender}
                  </span>
                  <span>${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div class="message-body">${msg.text}</div>
              </div>
            `;
            })
            .join('');
        }
      }
    } catch (err) {
      Toast.error(err.message || 'Could not load ticket details');
      window.location.hash = 'tickets';
    }
  }

  // Knowledge Base Renderer
  async function renderKB() {
    const tableBody = document.getElementById('kb-table-body');
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="5">${UI.renderLoadingSpinner()}</td></tr>`;

    try {
      const { docs } = await api.getKBDocs();
      tableBody.innerHTML = docs
        .map(
          (d) => `
        <tr>
          <td><strong style="color: var(--text-muted);">${d.id}</strong></td>
          <td><i class="fas fa-file-code" style="color: var(--primary); margin-right: 0.5rem;"></i> ${d.title}</td>
          <td>${d.chunks} vector chunks</td>
          <td><span class="badge badge-green">${d.status}</span></td>
          <td style="font-size: 0.8rem; color: var(--text-dark);">${d.createdAt}</td>
        </tr>
      `
        )
        .join('');
    } catch (err) {
      Toast.error('Failed to load KB docs: ' + err.message);
    }
  }

  // Settings Renderer
  function renderSettings() {
    const radioMock = document.getElementById('radio-mode-mock');
    const radioLive = document.getElementById('radio-mode-live');
    if (api.isMockMode()) {
      if (radioMock) radioMock.checked = true;
    } else {
      if (radioLive) radioLive.checked = true;
    }
  }

  // 5. Global Event Listeners & Modals
  function setupEventListeners() {
    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        UI.clearInputErrors(loginForm);

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const submitBtn = document.getElementById('login-submit-btn');

        UI.setButtonLoading(submitBtn, true, 'Authenticating...');

        try {
          const res = await api.login(email, password);
          Toast.success('Login successful! Welcome back.');
          showMainApp(res.user || api.getCurrentUser());
          window.location.hash = 'dashboard';
        } catch (err) {
          Toast.error(err.message || 'Login failed');
          UI.showInputError(document.getElementById('login-email'), err.message);
        } finally {
          UI.setButtonLoading(submitBtn, false);
        }
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        UI.clearInputErrors(registerForm);

        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const role = document.getElementById('register-role').value;
        const password = document.getElementById('register-password').value.trim();
        const confirmPass = document.getElementById('register-confirm-password').value.trim();
        const submitBtn = document.getElementById('register-submit-btn');

        if (password !== confirmPass) {
          UI.showInputError(document.getElementById('register-confirm-password'), 'Passwords do not match');
          Toast.error('Passwords do not match');
          return;
        }

        UI.setButtonLoading(submitBtn, true, 'Creating Account...');

        try {
          const res = await api.register({ name, email, role, password });
          Toast.success('Account created successfully! Welcome aboard.');
          showMainApp(res.user || api.getCurrentUser());
          window.location.hash = 'dashboard';
        } catch (err) {
          Toast.error(err.message || 'Registration failed');
          UI.showInputError(document.getElementById('register-email'), err.message);
        } finally {
          UI.setButtonLoading(submitBtn, false);
        }
      });
    }

    // Demo Login Button
    const demoBtn = document.getElementById('btn-demo-login');
    if (demoBtn) {
      demoBtn.addEventListener('click', async () => {
        document.getElementById('login-email').value = 'backend.admin@agent.io';
        document.getElementById('login-password').value = 'admin123';
        document.getElementById('login-form').dispatchEvent(new Event('submit'));
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await api.logout();
        Toast.info('You have been signed out.');
        showAuthScreen();
      });
    }

    // Topbar & Tickets "+ Create Ticket" Triggers
    const createBtn1 = document.getElementById('topbar-create-ticket-btn');
    const createBtn2 = document.getElementById('btn-create-ticket-modal');

    const openCreateModal = () => {
      Modal.open({
        title: 'Create New Support Ticket',
        bodyHtml: `
          <form id="modal-create-ticket-form">
            <div class="form-group">
              <label class="form-label">Subject / Issue Title <span class="required">*</span></label>
              <input type="text" id="new-ticket-subject" class="form-control" placeholder="e.g. Database deadlock on transaction commit" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Customer Name</label>
                <input type="text" id="new-ticket-customer" class="form-control" placeholder="Jane Doe" value="Jane Doe">
              </div>
              <div class="form-group">
                <label class="form-label">Customer Email</label>
                <input type="email" id="new-ticket-email" class="form-control" placeholder="jane@client.com" value="jane@client.com">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select id="new-ticket-priority" class="form-select">
                  <option value="HIGH">High</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <input type="text" id="new-ticket-category" class="form-control" value="Backend API">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Issue Description <span class="required">*</span></label>
              <textarea id="new-ticket-desc" class="form-textarea" placeholder="Detailed technical steps to reproduce..." required></textarea>
            </div>
          </form>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-submit-create-ticket">Create Ticket</button>
        `,
        onOpen: (modalEl) => {
          const submitBtn = modalEl.querySelector('#btn-submit-create-ticket');
          submitBtn.addEventListener('click', async () => {
            const form = modalEl.querySelector('#modal-create-ticket-form');
            UI.clearInputErrors(form);

            const subject = modalEl.querySelector('#new-ticket-subject').value.trim();
            const desc = modalEl.querySelector('#new-ticket-desc').value.trim();

            if (!subject) {
              UI.showInputError(modalEl.querySelector('#new-ticket-subject'), 'Subject is required');
              return;
            }
            if (!desc) {
              UI.showInputError(modalEl.querySelector('#new-ticket-desc'), 'Description is required');
              return;
            }

            UI.setButtonLoading(submitBtn, true, 'Creating...');
            try {
              const res = await api.createTicket({
                subject,
                description: desc,
                customerName: modalEl.querySelector('#new-ticket-customer').value,
                customerEmail: modalEl.querySelector('#new-ticket-email').value,
                priority: modalEl.querySelector('#new-ticket-priority').value,
                category: modalEl.querySelector('#new-ticket-category').value,
              });

              Toast.success(`Ticket ${res.ticket.id} created successfully!`);
              Modal.close();
              if (state.currentRoute === 'tickets') {
                renderTickets();
              } else {
                window.location.hash = 'tickets';
              }
            } catch (err) {
              Toast.error(err.message || 'Failed to create ticket');
              UI.setButtonLoading(submitBtn, false);
            }
          });
        },
      });
    };

    if (createBtn1) createBtn1.addEventListener('click', openCreateModal);
    if (createBtn2) createBtn2.addEventListener('click', openCreateModal);

    // Search and Filter Listeners on Tickets Page
    const searchInput = document.getElementById('tickets-search-input');
    const statusFilter = document.getElementById('tickets-status-filter');
    const priorityFilter = document.getElementById('tickets-priority-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.ticketsFilter.search = e.target.value;
        state.currentPage = 1;
        renderTickets();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        state.ticketsFilter.status = e.target.value;
        state.currentPage = 1;
        renderTickets();
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        state.ticketsFilter.priority = e.target.value;
        state.currentPage = 1;
        renderTickets();
      });
    }

    // Reply Form Submission in Ticket Detail
    const replyForm = document.getElementById('ticket-reply-form');
    if (replyForm) {
      replyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textarea = document.getElementById('reply-text');
        const submitBtn = document.getElementById('btn-submit-reply');
        const text = textarea.value.trim();

        if (!text || !state.selectedTicketId) return;

        UI.setButtonLoading(submitBtn, true, 'Sending...');
        try {
          await api.addMessage(state.selectedTicketId, text, 'engineer');
          Toast.success('Reply posted successfully');
          textarea.value = '';
          renderTicketDetail(state.selectedTicketId);
        } catch (err) {
          Toast.error(err.message || 'Failed to post reply');
        } finally {
          UI.setButtonLoading(submitBtn, false);
        }
      });
    }

    // Update Status Modal Trigger
    const updateStatusBtn = document.getElementById('btn-change-status');
    if (updateStatusBtn) {
      updateStatusBtn.addEventListener('click', () => {
        if (!state.selectedTicketId) return;
        Modal.open({
          title: `Update Status - ${state.selectedTicketId}`,
          bodyHtml: `
            <div class="form-group">
              <label class="form-label">Select Ticket Status</label>
              <select id="modal-status-select" class="form-select">
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
            <button class="btn btn-primary btn-sm" id="btn-save-status">Save Status</button>
          `,
          onOpen: (modalEl) => {
            const saveBtn = modalEl.querySelector('#btn-save-status');
            saveBtn.addEventListener('click', async () => {
              const newStatus = modalEl.querySelector('#modal-status-select').value;
              UI.setButtonLoading(saveBtn, true, 'Updating...');
              try {
                await api.updateTicket(state.selectedTicketId, { status: newStatus });
                Toast.success(`Ticket status updated to ${newStatus}`);
                Modal.close();
                renderTicketDetail(state.selectedTicketId);
              } catch (err) {
                Toast.error(err.message || 'Failed to update status');
                UI.setButtonLoading(saveBtn, false);
              }
            });
          },
        });
      });
    }

    // Delete Ticket Confirmation Trigger
    const deleteTicketBtn = document.getElementById('btn-delete-ticket');
    if (deleteTicketBtn) {
      deleteTicketBtn.addEventListener('click', () => {
        if (!state.selectedTicketId) return;
        ConfirmDialog.show({
          title: 'Delete Ticket',
          message: `Are you sure you want to permanently delete ticket <strong>${state.selectedTicketId}</strong>? This action cannot be undone.`,
          confirmText: 'Delete Ticket',
          isDanger: true,
          onConfirm: async () => {
            await api.deleteTicket(state.selectedTicketId);
            Toast.success(`Ticket ${state.selectedTicketId} deleted`);
            window.location.hash = 'tickets';
          },
        });
      });
    }

    // Knowledge Base Ingest Document Modal Trigger
    const ingestBtn = document.getElementById('btn-ingest-kb-doc');
    if (ingestBtn) {
      ingestBtn.addEventListener('click', () => {
        let selectedFile = null;
        let fileContent = '';

        Modal.open({
          title: 'Ingest Document to RAG Vector Store',
          bodyHtml: `
            <form id="modal-ingest-form">
              <div class="form-group">
                <label class="form-label">Select File to Upload & Ingest <span class="required">*</span></label>
                <div style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; background: #181818; cursor: pointer; transition: border-color var(--transition-fast);" id="file-drop-zone">
                  <i class="fas fa-cloud-upload-alt" style="font-size: 2.2rem; color: var(--primary); margin-bottom: 0.5rem; display: block;"></i>
                  <span style="font-size: 0.9rem; font-weight: 500; display: block;" id="file-upload-label">Click to select or drop document file</span>
                  <span style="font-size: 0.75rem; color: var(--text-dark); display: block; margin-top: 4px;">Supports .md, .txt, .pdf, .json files</span>
                  <input type="file" id="kb-doc-file" accept=".md,.txt,.json,.pdf,.doc,.docx" style="display: none;">
                </div>
              </div>

              <!-- Live File Preview Container -->
              <div id="file-preview-box" class="hidden" style="padding: 0.85rem 1rem; background: #1E1E1E; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 1.1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-file-code" style="color: var(--primary); font-size: 1.4rem;"></i>
                    <div>
                      <strong style="font-size: 0.85rem; display: block; color: var(--text-main);" id="preview-file-name">filename.md</strong>
                      <span style="font-size: 0.75rem; color: var(--text-muted);" id="preview-file-size">0 KB</span>
                    </div>
                  </div>
                  <span class="badge badge-green">Ready for Indexing</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Document Title / Vector ID</label>
                <input type="text" id="kb-doc-title" class="form-control" placeholder="Will populate automatically when file is selected">
              </div>
            </form>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
            <button class="btn btn-primary btn-sm" id="btn-submit-ingest"><i class="fas fa-upload"></i> Upload & Vectorize</button>
          `,
          onOpen: (modalEl) => {
            const dropZone = modalEl.querySelector('#file-drop-zone');
            const fileInput = modalEl.querySelector('#kb-doc-file');
            const previewBox = modalEl.querySelector('#file-preview-box');
            const previewName = modalEl.querySelector('#preview-file-name');
            const previewSize = modalEl.querySelector('#preview-file-size');
            const titleInput = modalEl.querySelector('#kb-doc-title');
            const submitBtn = modalEl.querySelector('#btn-submit-ingest');

            dropZone.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
              const file = e.target.files[0];
              if (!file) return;

              selectedFile = file;
              previewName.textContent = file.name;
              previewSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
              titleInput.value = file.name;
              previewBox.classList.remove('hidden');
              dropZone.style.borderColor = 'var(--primary)';

              // Read content
              const reader = new FileReader();
              reader.onload = (evt) => {
                fileContent = evt.target.result || '';
              };
              reader.readAsText(file);
            });

            submitBtn.addEventListener('click', async () => {
              if (!selectedFile) {
                Toast.error('Please select a file to upload & ingest');
                return;
              }

              const docName = titleInput.value.trim() || selectedFile.name;

              UI.setButtonLoading(submitBtn, true, 'Uploading & Vectorizing...');
              try {
                const res = await api.ingestDoc(docName, selectedFile.size, fileContent);
                Toast.success(`File "${res.doc.title}" uploaded & ingested into vector store!`);
                Modal.close();
                renderKB();
              } catch (err) {
                Toast.error(err.message || 'Ingestion failed');
                UI.setButtonLoading(submitBtn, false);
              }
            });
          },
        });
      });
    }

    // Save Preferences in Settings
    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        const isMock = document.getElementById('radio-mode-mock').checked;
        api.setMockMode(isMock);
        updateApiModeBadge();
        Toast.success(`API mode switched to ${isMock ? 'Mock JSON Memory' : 'Live Express Backend'}`);
      });
    }
  }

  // 6. Responsive Mobile Sidebar Controller
  function setupMobileSidebar() {
    const toggleBtn = document.getElementById('mobile-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn && sidebar && backdrop) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('show');
      });

      backdrop.addEventListener('click', closeMobileSidebar);
    }
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
  }
})(window);

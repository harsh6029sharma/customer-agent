/**
 * Customer Support Agent - Reusable UI Components
 * Pure Vanilla JavaScript component utilities: Toasts, Modals, Confirmations, Badges, Table Helpers
 */

(function (window) {
  'use strict';

  // 1. Toast Notification Component
  const Toast = {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'info', duration = 3000) {
      this.init();

      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-triangle-exclamation',
        info: 'fa-info-circle',
      };

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <button class="toast-close" aria-label="Close Toast">
          <i class="fas fa-times"></i>
        </button>
      `;

      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.dismiss(toast));

      this.container.appendChild(toast);

      // Trigger reflow for CSS transition
      setTimeout(() => toast.classList.add('show'), 10);

      if (duration > 0) {
        setTimeout(() => this.dismiss(toast), duration);
      }
    },

    dismiss(toast) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    },

    success(msg, duration) { this.show(msg, 'success', duration); },
    error(msg, duration) { this.show(msg, 'error', duration); },
    warning(msg, duration) { this.show(msg, 'warning', duration); },
    info(msg, duration) { this.show(msg, 'info', duration); }
  };

  // 2. Modal Component
  const Modal = {
    backdrop: null,

    init() {
      if (!this.backdrop) {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        this.backdrop.id = 'global-modal-backdrop';
        this.backdrop.innerHTML = `
          <div class="modal" id="global-modal" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3 class="modal-title" id="global-modal-title">Modal Title</h3>
              <button class="modal-close" id="global-modal-close" aria-label="Close modal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body" id="global-modal-body"></div>
            <div class="modal-footer" id="global-modal-footer"></div>
          </div>
        `;
        document.body.appendChild(this.backdrop);

        const closeBtn = this.backdrop.querySelector('#global-modal-close');
        closeBtn.addEventListener('click', () => this.close());

        this.backdrop.addEventListener('click', (e) => {
          if (e.target === this.backdrop) {
            this.close();
          }
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.backdrop.classList.contains('show')) {
            this.close();
          }
        });
      }
    },

    open({ title, bodyHtml, footerHtml = '', onOpen = null }) {
      this.init();
      const titleEl = this.backdrop.querySelector('#global-modal-title');
      const bodyEl = this.backdrop.querySelector('#global-modal-body');
      const footerEl = this.backdrop.querySelector('#global-modal-footer');

      titleEl.textContent = title;
      bodyEl.innerHTML = bodyHtml;
      
      if (footerHtml) {
        footerEl.innerHTML = footerHtml;
        footerEl.classList.remove('hidden');
      } else {
        footerEl.classList.add('hidden');
      }

      this.backdrop.classList.add('show');
      if (onOpen) onOpen(this.backdrop);
    },

    close() {
      if (this.backdrop) {
        this.backdrop.classList.remove('show');
      }
    }
  };

  // 3. Confirmation Dialog Component
  const ConfirmDialog = {
    show({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', isDanger = false, onConfirm }) {
      const btnClass = isDanger ? 'btn-danger' : 'btn-primary';
      const bodyHtml = `<p style="font-size: 0.9rem; color: var(--text-main);">${message}</p>`;
      const footerHtml = `
        <button class="btn btn-secondary btn-sm" id="confirm-cancel-btn">Cancel</button>
        <button class="btn ${btnClass} btn-sm" id="confirm-proceed-btn">${confirmText}</button>
      `;

      Modal.open({
        title,
        bodyHtml,
        footerHtml,
        onOpen: (modalEl) => {
          const cancelBtn = modalEl.querySelector('#confirm-cancel-btn');
          const proceedBtn = modalEl.querySelector('#confirm-proceed-btn');

          cancelBtn.addEventListener('click', () => Modal.close());
          proceedBtn.addEventListener('click', async () => {
            proceedBtn.disabled = true;
            proceedBtn.innerHTML = '<span class="spinner"></span> Working...';
            try {
              if (onConfirm) await onConfirm();
              Modal.close();
            } catch (err) {
              Toast.error(err.message || 'Operation failed');
              proceedBtn.disabled = false;
              proceedBtn.textContent = confirmText;
            }
          });
        }
      });
    }
  };

  // 4. UI Helper Functions (Badges, Empty States, Buttons)
  const UI = {
    renderStatusBadge(status) {
      const s = (status || '').toUpperCase();
      switch (s) {
        case 'OPEN':
          return '<span class="badge badge-blue"><i class="fas fa-dot-circle"></i> Open</span>';
        case 'IN_PROGRESS':
          return '<span class="badge badge-yellow"><i class="fas fa-clock"></i> In Progress</span>';
        case 'RESOLVED':
          return '<span class="badge badge-green"><i class="fas fa-check-circle"></i> Resolved</span>';
        case 'CLOSED':
          return '<span class="badge badge-gray"><i class="fas fa-lock"></i> Closed</span>';
        default:
          return `<span class="badge badge-gray">${status}</span>`;
      }
    },

    renderPriorityBadge(priority) {
      const p = (priority || '').toUpperCase();
      switch (p) {
        case 'HIGH':
        case 'URGENT':
          return '<span class="badge badge-red">High</span>';
        case 'MEDIUM':
          return '<span class="badge badge-yellow">Medium</span>';
        case 'LOW':
          return '<span class="badge badge-blue">Low</span>';
        default:
          return `<span class="badge badge-gray">${priority}</span>`;
      }
    },

    renderEmptyState({ icon = 'fa-folder-open', title = 'No data found', text = 'There are no records matching your request.', actionBtnId = null, actionBtnText = null }) {
      let actionHtml = '';
      if (actionBtnId && actionBtnText) {
        actionHtml = `<button class="btn btn-primary btn-sm" id="${actionBtnId}">${actionBtnText}</button>`;
      }
      return `
        <div class="empty-state">
          <i class="fas ${icon} empty-icon"></i>
          <h4 class="empty-title">${title}</h4>
          <p class="empty-text">${text}</p>
          ${actionHtml}
        </div>
      `;
    },

    renderLoadingSpinner(text = 'Loading data...') {
      return `
        <div class="loading-overlay">
          <div class="spinner" style="width: 24px; height: 24px; color: var(--primary);"></div>
          <span>${text}</span>
        </div>
      `;
    },

    renderPagination(currentPage, totalPages, onPageChangeStr) {
      if (totalPages <= 1) return '';

      let itemsHtml = '';
      // Prev button
      const prevDisabled = currentPage === 1 ? 'disabled' : '';
      itemsHtml += `<button class="page-item ${prevDisabled}" onclick="${onPageChangeStr}(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;

      for (let i = 1; i <= totalPages; i++) {
        const active = i === currentPage ? 'active' : '';
        itemsHtml += `<button class="page-item ${active}" onclick="${onPageChangeStr}(${i})">${i}</button>`;
      }

      // Next button
      const nextDisabled = currentPage === totalPages ? 'disabled' : '';
      itemsHtml += `<button class="page-item ${nextDisabled}" onclick="${onPageChangeStr}(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;

      return `<div class="pagination">${itemsHtml}</div>`;
    },

    // Form Loading and Validation Utils
    setButtonLoading(btn, isLoading, loadingText = 'Processing...') {
      if (!btn) return;
      if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
      } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
      }
    },

    showInputError(inputEl, errorMsg) {
      if (!inputEl) return;
      inputEl.classList.add('is-invalid');
      const formGroup = inputEl.closest('.form-group');
      if (formGroup) {
        let errorEl = formGroup.querySelector('.form-error');
        if (!errorEl) {
          errorEl = document.createElement('span');
          errorEl.className = 'form-error';
          formGroup.appendChild(errorEl);
        }
        errorEl.textContent = errorMsg;
        errorEl.classList.add('show');
      }
    },

    clearInputErrors(formEl) {
      if (!formEl) return;
      const invalidInputs = formEl.querySelectorAll('.is-invalid');
      invalidInputs.forEach((el) => el.classList.remove('is-invalid'));
      const errorTexts = formEl.querySelectorAll('.form-error');
      errorTexts.forEach((el) => {
        el.textContent = '';
        el.classList.remove('show');
      });
    }
  };

  // Expose components to window
  window.Toast = Toast;
  window.Modal = Modal;
  window.ConfirmDialog = ConfirmDialog;
  window.UI = UI;
})(window);

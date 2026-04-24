(() => {
  const TOKEN_KEY = 'gakuzai.auth.token.v1';
  const SUBMIT_COOLDOWN_MS = 900;
  let mode = 'login';
  let submitting = false;
  let lastSubmitAt = 0;

  const els = {
    form: document.getElementById('authPageForm'),
    nameField: document.getElementById('authNameField'),
    name: document.getElementById('authNameInput'),
    email: document.getElementById('authEmailInput'),
    password: document.getElementById('authPasswordInput'),
    submit: document.getElementById('authSubmitBtn'),
    message: document.getElementById('authMessage'),
    title: document.getElementById('authCardTitle'),
    hint: document.getElementById('authModeHint'),
    tabs: Array.from(document.querySelectorAll('[data-auth-mode]'))
  };

  const labels = {
    login: {
      title: 'ログイン',
      submit: 'ログイン',
      loading: 'ログイン中...',
      hint: 'アカウントがない場合は「登録」タブへ。',
      passwordAutocomplete: 'current-password'
    },
    register: {
      title: '登録',
      submit: '登録して始める',
      loading: '登録中...',
      hint: '登録後、教材保存とツール設定がこのアカウントに紐づきます。',
      passwordAutocomplete: 'new-password'
    }
  };

  function setMessage(text, isError = false) {
    els.message.textContent = text;
    els.message.classList.toggle('is-error', isError);
  }

  function setSubmitting(next) {
    submitting = next;
    els.submit.disabled = next;
    els.submit.classList.toggle('is-loading', next);
    els.submit.textContent = next ? labels[mode].loading : labels[mode].submit;
  }

  function setMode(nextMode) {
    if (submitting) return;
    mode = nextMode === 'register' ? 'register' : 'login';
    const config = labels[mode];

    els.title.textContent = config.title;
    els.submit.textContent = config.submit;
    els.hint.textContent = config.hint;
    els.nameField.hidden = mode !== 'register';
    els.name.required = mode === 'register';
    els.password.setAttribute('autocomplete', config.passwordAutocomplete);
    setMessage('');

    els.tabs.forEach(tab => {
      const active = tab.dataset.authMode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  async function checkExistingSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) window.location.href = './app.html';
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  els.tabs.forEach(tab => {
    tab.addEventListener('click', () => setMode(tab.dataset.authMode));
  });

  els.form.addEventListener('submit', async event => {
    event.preventDefault();
    const now = Date.now();
    if (submitting || now - lastSubmitAt < SUBMIT_COOLDOWN_MS) return;
    lastSubmitAt = now;

    const email = els.email.value.trim();
    const password = els.password.value;
    const displayName = els.name.value.trim();

    if (!email || !password || (mode === 'register' && !displayName)) {
      setMessage(mode === 'register'
        ? '名前、メール、パスワードを入力してください。'
        : 'メールとパスワードを入力してください。', true);
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const data = await apiRequest(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName })
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      window.location.href = './app.html';
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      setSubmitting(false);
    }
  });

  setMode('login');
  checkExistingSession();
})();

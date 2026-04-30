    (() => {
      // ローカル完結デモで使う保存キー。
      const STORAGE_KEYS = {
        saves: 'gakuzai.demo.saves.v1',
        toolbar: 'gakuzai.toolbar.layout.v6',
        draft: 'gakuzai.demo.current.v1',
        sidebar: 'gakuzai.sidebar.collapsed.v1',
        authToken: 'gakuzai.auth.token.v1'
      };

      // 初期表示用の教材データ。
      // 既存挙動を崩さないため、取り込み済み文字列はこの段階ではそのまま保持する。
      const SAMPLE_LESSONS = window.GAKUZAI_SAMPLE_LESSONS || [];
      const GROUPS = [
        { id: 'conceal', title: '非表示・注釈', meta: 'CONCEAL / NOTE', subtitle: '入力オプションと一緒に、隠す・補足する系の加工をまとめています。' },
        { id: 'text-color', title: '文字カラー', meta: 'TEXT COLOR', subtitle: '覚えたい語句を色で見分けやすくします。' },
        { id: 'marker', title: 'マーカー', meta: 'HIGHLIGHT', subtitle: '下線より広く目立たせたい箇所に使います。' },
        { id: 'emphasis', title: '強調・文字サイズ', meta: 'EMPHASIS', subtitle: '太字・下線・大小で視線の強弱をつけます。' },
        { id: 'cleanup', title: '修正', meta: 'RESET', subtitle: '装飾解除など、仕上げと調整用の機能です。' }
      ];
      const ACTIONS = [
        { id: 'keyword', groupId: 'conceal', label: '非表示・キーワード化', hint: '語句を隠す／記号に置き換える', tone: 'dark' },
        { id: 'popup', groupId: 'conceal', label: 'ポップアップ追加', hint: '補足説明や意味を追加する', tone: 'violet' },
        { id: 'color-blue', groupId: 'text-color', label: '文字色：青', hint: '重要語句を落ち着いて強調', tone: 'blue' },
        { id: 'color-red', groupId: 'text-color', label: '文字色：赤', hint: '特に強く覚えたい部分向け', tone: 'red' },
        { id: 'marker-yellow', groupId: 'marker', label: 'マーカー：黄', hint: '基本のハイライト', tone: 'yellow' },
        { id: 'marker-green', groupId: 'marker', label: 'マーカー：緑', hint: '補助情報や整理用', tone: 'green' },
        { id: 'marker-pink', groupId: 'marker', label: 'マーカー：ピンク', hint: '目立たせたい箇所向け', tone: 'pink' },
        { id: 'strong', groupId: 'emphasis', label: '強調：太字', hint: 'キーワードを太く見せる', tone: 'dark' },
        { id: 'underline', groupId: 'emphasis', label: '強調：下線', hint: '自然に目を引かせる', tone: 'dark' },
        { id: 'size-small', groupId: 'emphasis', label: '文字サイズ：小', hint: '補足や注釈を控えめに', tone: 'dark' },
        { id: 'size-large', groupId: 'emphasis', label: '文字サイズ：大', hint: '大事な箇所をはっきり表示', tone: 'dark' },
        { id: 'clear-style', groupId: 'cleanup', label: '装飾を解除', hint: '選択範囲の装飾を元に戻す', tone: 'dark' }
      ];
      const DEFAULT_PREFS = {
        groupOrder: GROUPS.map(group => group.id),
        itemOrder: GROUPS.reduce((acc, group) => {
          acc[group.id] = ACTIONS.filter(action => action.groupId === group.id).map(action => action.id);
          return acc;
        }, {})
      };
      const GROUP_MAP = new Map(GROUPS.map(g => [g.id, g]));
      const ACTION_MAP = new Map(ACTIONS.map(a => [a.id, a]));
      const TOUCH_AUTO_ACTIONS = new Set(ACTIONS.map(action => action.id));
      const MOBILE_BREAKPOINT = 960;
      const TABLET_PORTRAIT_BREAKPOINT = 1100;
      const UNDO_MAX = 50;
      const STUDENT_AUTO_SAVE_DEBOUNCE_MS = 8000;
      const STUDENT_AUTO_SAVE_INTERVAL_MS = 60000;

      // 起動時に主要な DOM をまとめて参照しておく。
      const els = {
        body: document.body,
        courseSelectWrap: document.getElementById('courseSelectWrap'),
        courseSelect: document.getElementById('courseSelect'),
        lessonSelect: document.getElementById('lessonSelect'),
        lessonContainer: document.getElementById('lesson-container'),
        titleDisplay: document.getElementById('lesson-title-display'),
        hint: document.getElementById('hint'),
        toolbar: document.getElementById('toolbar'),
        saveBtn: document.getElementById('saveMaterialBtn'),
        loadBtn: document.getElementById('loadLessonBtn'),
        headerTitle: document.getElementById('headerTitle'),
        headerSubtitle: document.getElementById('headerSubtitle'),
        lessonSelectLabel: document.getElementById('lessonSelectLabel'),
        editorView: document.getElementById('editorView'),
        savedView: document.getElementById('savedView'),
        coursesView: document.getElementById('coursesView'),
        materialsView: document.getElementById('materialsView'),
        adminView: document.getElementById('adminView'),
        editorModeBtn: document.getElementById('editorModeBtn'),
        savedList: document.getElementById('savedList'),
        savedCount: document.getElementById('savedCount'),
        savedHint: document.getElementById('savedHint'),
        savedEmpty: document.getElementById('savedEmpty'),
        savedSearchInput: document.getElementById('savedSearchInput'),
        savedSortSelect: document.getElementById('savedSortSelect'),
        editorTopActions: document.getElementById('editorTopActions'),
        savedTopActions: document.getElementById('savedTopActions'),
        sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
        toolbarPrefsBtn: document.getElementById('toolbarPrefsBtn'),
        mobileToolBackdrop: document.getElementById('mobileToolBackdrop'),
        mobileToolNav: document.querySelector('.mobile-tool-nav'),
        mobileUndoBtn: document.getElementById('mobileUndoBtn'),
        mobileToolCloseBtn: document.getElementById('mobileToolCloseBtn'),
        mobileNavDialog: document.getElementById('mobileNavDialog'),
        mobileNavDrawer: document.getElementById('mobileNavDrawer'),
        mobileNavOpenBtn: document.getElementById('mobileNavOpenBtn'),
        mobileNavCloseBtn: document.getElementById('mobileNavCloseBtn'),
        mobileSelectionBar: document.getElementById('mobileSelectionBar'),
        mobileSelectionLabel: document.getElementById('mobileSelectionLabel'),
        mobileSelectionApplyBtn: document.getElementById('mobileSelectionApplyBtn'),
        mobileSelectionCancelBtn: document.getElementById('mobileSelectionCancelBtn'),
        previewDialogBackdrop: document.getElementById('previewDialogBackdrop'),
        previewMeta: document.getElementById('previewMeta'),
        previewContent: document.getElementById('previewContent'),
        closePreviewBtn: document.getElementById('closePreviewBtn'),
        saveDialogBackdrop: document.getElementById('saveDialogBackdrop'),
        saveTitleInput: document.getElementById('saveTitleInput'),
        saveTitleError: document.getElementById('saveTitleError'),
        confirmSaveBtn: document.getElementById('confirmSaveBtn'),
        cancelSaveBtn: document.getElementById('cancelSaveBtn'),
        confirmDialogBackdrop: document.getElementById('confirmDialogBackdrop'),
        confirmDialogTitle: document.getElementById('confirmDialogTitle'),
        confirmDialogMessage: document.getElementById('confirmDialogMessage'),
        confirmActionBtn: document.getElementById('confirmActionBtn'),
        cancelConfirmBtn: document.getElementById('cancelConfirmBtn'),
        toastWrap: document.getElementById('toastWrap'),
        keywordPopover: document.getElementById('keywordPopover'),
        importJsonBtn: document.getElementById('importJsonBtn'),
        importJsonInput: document.getElementById('importJsonInput'),
        inviteCodeInput: document.getElementById('inviteCodeInput'),
        joinCourseBtn: document.getElementById('joinCourseBtn'),
        courseJoinPanel: document.getElementById('courseJoinPanel'),
        courseCreatePanel: document.getElementById('courseCreatePanel'),
        courseNameInput: document.getElementById('courseNameInput'),
        courseSemesterInput: document.getElementById('courseSemesterInput'),
        courseDescriptionInput: document.getElementById('courseDescriptionInput'),
        createCourseBtn: document.getElementById('createCourseBtn'),
        courseList: document.getElementById('courseList'),
        dashboardSummary: document.getElementById('dashboardSummary'),
        courseWorkspace: document.getElementById('courseWorkspace'),
        courseDialogBackdrop: document.getElementById('courseDialogBackdrop'),
        courseDialogTitle: document.getElementById('courseDialogTitle'),
        courseDialogNameInput: document.getElementById('courseDialogNameInput'),
        courseDialogSemesterInput: document.getElementById('courseDialogSemesterInput'),
        courseDialogDescriptionInput: document.getElementById('courseDialogDescriptionInput'),
        courseDialogError: document.getElementById('courseDialogError'),
        confirmCourseDialogBtn: document.getElementById('confirmCourseDialogBtn'),
        cancelCourseDialogBtn: document.getElementById('cancelCourseDialogBtn'),
        materialsSummary: document.getElementById('materialsSummary'),
        teacherMaterialList: document.getElementById('teacherMaterialList'),
        workList: document.getElementById('workList'),
        adminPanel: document.getElementById('adminPanel'),
        exportAllBtn: document.getElementById('exportAllBtn'),
        mobileExportBtn: document.getElementById('mobileExportBtn'),
        resetDemoBtn: document.getElementById('resetDemoBtn'),
        mobileLogoutBtn: document.getElementById('mobileLogoutBtn'),
        editorStatusTag: document.getElementById('editorStatusTag'),
        authPanel: document.getElementById('authPanel'),
        authStatus: document.getElementById('authStatus'),
        mobileAuthStatus: document.getElementById('mobileAuthStatus'),
        authForm: document.getElementById('authForm'),
        authNameInput: document.getElementById('authNameInput'),
        authEmailInput: document.getElementById('authEmailInput'),
        authPasswordInput: document.getElementById('authPasswordInput'),
        loginBtn: document.getElementById('loginBtn'),
        registerBtn: document.getElementById('registerBtn'),
        logoutBtn: document.getElementById('logoutBtn')
      };

      // 単一 HTML全体で共有する可変状態。
      const state = {

        currentView: 'editor',
        currentLessonId: null,
        baseLessonId: null,
        currentSavedId: null,
        currentAction: null,
        currentOptions: {},
        log: [],
        undoStack: [],
        redoStack: [],
        prefs: loadPrefs(),
        desktopSidebarCollapsed: loadSidebarCollapsed(),
        mobileTextEditMode: false,
        sortMode: false,
        sortSelection: null,
        activeActionId: null,
        keywordDraft: '',
        popupDraft: '',
        lastScrollTop: 0,
        mobileOpen: false,
        mobileNavOpen: false,
        activeMobileTool: 'all',
        dragState: null,
        touchSortState: null,
        touchApplyTimer: null,
        lastTouchRange: null,
        lastTouchSelectionKey: '',
        touchSelectionUiLock: false,
        touchSelectionUiLockTimer: null,
        __historyHotkeyLock: false,
        draftChangedAt: null,
        authToken: localStorage.getItem(STORAGE_KEYS.authToken) || '',
        currentUser: null,
        coursesCache: [],
        courseMaterialsCache: [],
        currentCourseId: null,
        editingCourseId: null,
        savesCache: [],
        saveDialogResolver: null,
        confirmDialogResolver: null,
        studentAutoSaveDirty: false,
        studentAutoSaveTimer: null,
        studentAutoSaveInterval: null,
        studentAutoSaveInFlight: false,
        studentAutoSaveQueued: false,
        studentLastAutoSavedAt: null,
        studentLastAutoSaveErrorAt: null
      };
      let mobileNavCloseTimer = null;

      // エディタ，保存処画面表示で共通利用する小さな補助関数群。
      function clone(v) { return JSON.parse(JSON.stringify(v)); }
      function nowIso() { return new Date().toISOString(); }
      function esc(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
      function fmt(v) { const d = new Date(v); if (Number.isNaN(d.getTime())) return '-'; const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0'); return `${y}-${m}-${day} ${hh}:${mm}`; }
      function isMobileLayout() {
        const portraitTablet = isTouchMode()
          && window.matchMedia('(orientation: portrait)').matches
          && window.innerWidth <= TABLET_PORTRAIT_BREAKPOINT;
        return window.innerWidth <= MOBILE_BREAKPOINT || portraitTablet;
      }
      function syncViewportBottomOffset() {
        const vv = window.visualViewport;
        const bottomOffset = vv
          ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
          : 0;
        document.documentElement.style.setProperty('--vv-bottom-offset', `${Math.round(bottomOffset)}px`);
      }
      function shouldUseProtectedEditMode() { return isTouchMode(); }
      function isLessonTextEditable() { return !shouldUseProtectedEditMode() || state.mobileTextEditMode; }
      function syncEditorInteractionMode() {
        const protectedMode = shouldUseProtectedEditMode();
        const editable = isLessonTextEditable();
        els.lessonContainer.setAttribute('contenteditable', editable ? 'true' : 'false');
        els.lessonContainer.classList.toggle('is-touch-processing', protectedMode && !editable);
        if (!editable && document.activeElement === els.lessonContainer) els.lessonContainer.blur();
        if (els.editorModeBtn) {
          const showModeBtn = protectedMode && state.currentView === 'editor';
          els.editorModeBtn.hidden = !showModeBtn;
          els.editorModeBtn.classList.toggle('is-active', editable);
          els.editorModeBtn.setAttribute('aria-pressed', String(editable));
          els.editorModeBtn.textContent = editable ? '編集完了' : '本文編集';
        }
        syncMobileUndoButton();
      }
      function loadSidebarCollapsed() { try { return localStorage.getItem(STORAGE_KEYS.sidebar) === '1'; } catch { return false; } }
      function saveSidebarCollapsed(collapsed) { try { localStorage.setItem(STORAGE_KEYS.sidebar, collapsed ? '1' : '0'); } catch { } }
      function syncDesktopSidebarShell() {
        const collapsed = !isMobileLayout() && state.desktopSidebarCollapsed;
        document.body.classList.toggle('sidebar-collapsed', collapsed);
        if (!els.sidebarToggleBtn) return;
        els.sidebarToggleBtn.setAttribute('aria-expanded', String(!collapsed));
        els.sidebarToggleBtn.setAttribute('aria-label', collapsed ? 'サイドバーを展開する' : 'サイドバーを折りたたむ');
        const icon = els.sidebarToggleBtn.querySelector('.sidebar-toggle-btn__icon');
        const label = els.sidebarToggleBtn.querySelector('.sidebar-toggle-btn__label');
        if (icon) icon.textContent = collapsed ? '⇥' : '⇤';
        if (label) label.textContent = collapsed ? 'サイドバーを展開する' : 'サイドバーを折りたたむ';
      }
      function isTouchMode() { return window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0; }
      function showToast(msg, type = 'success', options = {}) {
        const t = document.createElement('div');
        t.className = `toast ${type === 'success' ? 'success' : type === 'warn' ? 'warn' : type === 'error' ? 'error' : ''}`;
        const text = document.createElement('span');
        text.textContent = msg;
        t.appendChild(text);
        if (options.actionLabel && typeof options.onAction === 'function') {
          const action = document.createElement('button');
          action.type = 'button';
          action.className = 'toast__action';
          action.textContent = options.actionLabel;
          action.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            options.onAction();
            t.remove();
          });
          t.appendChild(action);
        }
        els.toastWrap.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 220); }, options.duration || 2600);
      }
      function canUndo() { return state.undoStack.length > 1; }
      function syncMobileUndoButton() {
        if (!els.mobileUndoBtn) return;
        const visible = isTouchMode() && state.currentView === 'editor';
        els.mobileUndoBtn.hidden = !visible;
        els.mobileUndoBtn.disabled = !canUndo();
      }
      function showUndoToast(message = '変更しました。') {
        syncMobileUndoButton();
        if (!isTouchMode() || state.currentView !== 'editor' || !canUndo()) return;
        showToast(message, 'success', { actionLabel: '元に戻す', onAction: performMobileUndo, duration: 4200 });
      }
      function loadSaves() { return state.savesCache || []; }
      function saveSaves(items) { state.savesCache = Array.isArray(items) ? items : []; }
      function saveDraft() { localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify({ currentLessonId: state.currentLessonId, baseLessonId: state.baseLessonId, currentSavedId: state.currentSavedId, html: els.lessonContainer.innerHTML, title: els.titleDisplay.textContent, log: state.log, draftChangedAt: state.draftChangedAt })); syncEditorStatusTag(); }
      function loadDraft() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.draft) || 'null'); } catch { return null; } }
      function clearDraft() { localStorage.removeItem(STORAGE_KEYS.draft); }
      function isStudentEditingMaterial() {
        return (state.currentUser?.role || 'student') === 'student'
          && state.currentView === 'editor'
          && !!state.currentSavedId
          && !!state.baseLessonId;
      }
      function getStudentWorkPayload() {
        return {
          editedContent: els.lessonContainer.innerHTML,
          operationLogs: clone(state.log)
        };
      }
      function markStudentAutoSaveDirty() {
        if (!isStudentEditingMaterial()) return;
        state.studentAutoSaveDirty = true;
        syncEditorStatusTag();
        clearTimeout(state.studentAutoSaveTimer);
        state.studentAutoSaveTimer = setTimeout(() => {
          flushStudentAutoSave({ silent: true, reason: 'debounce' });
        }, STUDENT_AUTO_SAVE_DEBOUNCE_MS);
      }
      function clearStudentAutoSaveState() {
        state.studentAutoSaveDirty = false;
        clearTimeout(state.studentAutoSaveTimer);
        state.studentAutoSaveTimer = null;
        syncEditorStatusTag();
      }
      function updateStudentWorkCache(saved) {
        if (!saved) return;
        state.courseMaterialsCache = (state.courseMaterialsCache || []).map(item => String(item.id) === String(saved.id) ? saved : item);
        saveSaves(state.courseMaterialsCache);
      }
      async function saveStudentWork({ silent = false } = {}) {
        if (!state.currentSavedId) {
          if (!silent) showToast('授業教材がまだ読み込まれていません。', 'warn');
          return false;
        }
        if (state.studentAutoSaveInFlight) {
          state.studentAutoSaveQueued = true;
          if (!silent) showToast('保存中です。しばらくお待ちください。', 'warn');
          return false;
        }
        state.studentAutoSaveInFlight = true;
        try {
          const data = await apiRequest(`/api/materials/${state.currentSavedId}/work`, {
            method: 'POST',
            body: JSON.stringify(getStudentWorkPayload())
          });
          updateStudentWorkCache(data.material);
          state.draftChangedAt = nowIso();
          state.studentLastAutoSavedAt = state.draftChangedAt;
          state.studentAutoSaveDirty = false;
          saveDraft();
          renderSavedList();
          if (!silent) showToast('自分の加工結果を保存しました。');
          return true;
        } catch (error) {
          const previousErrorAt = state.studentLastAutoSaveErrorAt ? new Date(state.studentLastAutoSaveErrorAt).getTime() : 0;
          state.studentLastAutoSaveErrorAt = nowIso();
          if (!silent) showToast(error.message, 'error');
          else if (Date.now() - previousErrorAt > STUDENT_AUTO_SAVE_INTERVAL_MS) showToast('自動保存に失敗しました。手動で保存してください。', 'error');
          return false;
        } finally {
          state.studentAutoSaveInFlight = false;
          if (state.studentAutoSaveQueued) {
            state.studentAutoSaveQueued = false;
            flushStudentAutoSave({ silent: true, reason: 'queued' });
          }
          syncEditorStatusTag();
        }
      }
      function sendStudentWorkKeepalive() {
        if (!state.authToken || !state.currentSavedId || !state.studentAutoSaveDirty) return;
        state.draftChangedAt = nowIso();
        saveDraft();
        const body = JSON.stringify(getStudentWorkPayload());
        fetch(`/api/materials/${state.currentSavedId}/work`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.authToken}`
          },
          body,
          keepalive: true
        }).catch(() => {});
      }
      function flushStudentAutoSave({ silent = true, keepalive = false, reason = 'manual' } = {}) {
        if (!isStudentEditingMaterial() || !state.studentAutoSaveDirty) return Promise.resolve(false);
        clearTimeout(state.studentAutoSaveTimer);
        state.studentAutoSaveTimer = null;
        if (keepalive) {
          sendStudentWorkKeepalive();
          return Promise.resolve(true);
        }
        return saveStudentWork({ silent, reason });
      }
      function startStudentAutoSaveLoop() {
        clearInterval(state.studentAutoSaveInterval);
        state.studentAutoSaveInterval = setInterval(() => {
          flushStudentAutoSave({ silent: true, reason: 'interval' });
        }, STUDENT_AUTO_SAVE_INTERVAL_MS);
      }
      function setAuthSession(token, user) {
        state.authToken = token || '';
        state.currentUser = user || null;
        if (state.authToken) localStorage.setItem(STORAGE_KEYS.authToken, state.authToken);
        else localStorage.removeItem(STORAGE_KEYS.authToken);
        syncAuthUi();
      }
      function redirectToLogin() {
        window.location.href = './index.html';
      }
      function syncAuthUi() {
        const loggedIn = !!state.currentUser;
        const role = state.currentUser?.role || 'student';
        document.body.dataset.role = loggedIn ? role : 'guest';
        const label = loggedIn ? `${state.currentUser.displayName || state.currentUser.email} / ${role}` : '未ログイン';
        if (els.authStatus) els.authStatus.textContent = label;
        if (els.mobileAuthStatus) els.mobileAuthStatus.textContent = label;
        if (els.authForm) els.authForm.hidden = loggedIn;
        if (els.logoutBtn) els.logoutBtn.hidden = !loggedIn;
        document.querySelectorAll('[data-role-nav]').forEach(node => {
          const allowed = (node.dataset.roleNav || '').split(/\s+/).includes(role);
          node.hidden = loggedIn && !allowed;
        });
      }
      function translateApiError(message) {
        const text = String(message || '');
        const exact = {
          'Internal server error.': 'サーバーでエラーが発生しました。',
          'Authentication required.': 'ログインしてください。',
          'User no longer exists.': 'ユーザーが見つかりません。',
          'Invalid or expired token.': 'ログインの有効期限が切れています。もう一度ログインしてください。',
          'Permission denied.': 'この操作を行う権限がありません。',
          'Too many registration attempts. Please try again later.': '登録の試行回数が多すぎます。しばらくしてからもう一度お試しください。',
          'Valid email is required.': '正しいメールアドレスを入力してください。',
          'Password must be at least 8 characters.': 'パスワードは8文字以上で入力してください。',
          'Email is already registered.': 'このメールアドレスはすでに登録されています。',
          'Invalid email or password.': 'メールアドレスまたはパスワードが正しくありません。',
          'eventType is required.': 'イベント種別が指定されていません。',
          'Course name is required.': '授業名を入力してください。',
          'Valid teacher is required.': '有効な教師アカウントが必要です。',
          'Invite code is required.': '授業コードを入力してください。',
          'Course not found for this code.': 'この授業コードに一致する授業が見つかりません。',
          'You have already joined this course.': 'この授業にはすでに参加しています。',
          'Course not found.': '授業が見つかりません。',
          'Material not found.': '教材が見つかりません。',
          'courseId, title and baseLessonId are required.': '授業・教材名・ベース教材を指定してください。',
          'Status must be draft or published.': '教材の状態が正しくありません。',
          'Setting key is required.': '設定キーが指定されていません。'
        };
        if (exact[text]) return exact[text];
        const wait = text.match(/^Too many attempts\. Please try again in (\d+) minute\(s\)\.$/);
        if (wait) return `試行回数が多すぎます。${wait[1]}分後にもう一度お試しください。`;
        if (/[A-Za-z]/.test(text)) return '通信に失敗しました。';
        return text || '通信に失敗しました。';
      }
      async function apiRequest(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (state.authToken) headers.Authorization = `Bearer ${state.authToken}`;
        const response = await fetch(path, { ...options, headers });
        if (response.status === 204) return null;
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) setAuthSession('', null);
          throw new Error(translateApiError(data.error) || '通信に失敗しました。');
        }
        return data;
      }
      async function refreshSaves() {
        if (!state.currentUser) {
          state.savesCache = [];
          renderSavedList();
          return [];
        }
        const role = state.currentUser.role || 'student';
        const path = role === 'student'
          ? '/api/materials'
          : state.currentCourseId
            ? `/api/materials?courseId=${encodeURIComponent(state.currentCourseId)}`
            : '/api/materials';
        const data = await apiRequest(path);
        state.savesCache = data.materials || [];
        state.courseMaterialsCache = data.materials || [];
        renderSavedList();
        return state.savesCache;
      }
      async function refreshCourses() {
        if (!state.currentUser) return [];
        const data = await apiRequest('/api/courses');
        state.coursesCache = data.courses || [];
        if (!state.currentCourseId && state.coursesCache.length) state.currentCourseId = state.coursesCache[0].id;
        renderCourseList();
        renderLessonSelect();
        if (state.currentCourseId) await refreshCourseMaterials(state.currentCourseId);
        return state.coursesCache;
      }
      async function refreshCourseMaterials(courseId = state.currentCourseId) {
        if (!state.currentUser || !courseId) {
          state.courseMaterialsCache = [];
          renderLessonSelect();
          renderTeacherMaterialList();
          renderDashboardSummary();
          renderCourseWorkspace();
          return [];
        }
        const data = await apiRequest(`/api/materials?courseId=${encodeURIComponent(courseId)}`);
        state.courseMaterialsCache = data.materials || [];
        renderLessonSelect();
        renderTeacherMaterialList();
        renderDashboardSummary();
        renderCourseWorkspace();
        return state.courseMaterialsCache;
      }
      async function joinCourse() {
        const inviteCode = els.inviteCodeInput?.value.trim();
        if (!inviteCode) return showToast('授業コードを入力してください。', 'warn');
        try {
          await apiRequest('/api/courses/join', { method: 'POST', body: JSON.stringify({ inviteCode }) });
          els.inviteCodeInput.value = '';
          await refreshCourses();
          showToast('授業に参加しました。');
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
      async function createCourse() {
        openCourseDialog();
      }
      function openCourseDialog(course = null) {
        state.editingCourseId = course?.id || null;
        if (els.courseDialogTitle) els.courseDialogTitle.textContent = course ? '授業を編集' : '授業を作成';
        if (els.confirmCourseDialogBtn) els.confirmCourseDialogBtn.textContent = course ? '更新' : '作成';
        if (els.courseDialogNameInput) els.courseDialogNameInput.value = course?.name || '';
        if (els.courseDialogSemesterInput) els.courseDialogSemesterInput.value = course?.semester || '';
        if (els.courseDialogDescriptionInput) els.courseDialogDescriptionInput.value = course?.description || '';
        if (els.courseDialogError) {
          els.courseDialogError.hidden = true;
          els.courseDialogError.textContent = '';
        }
        openModal(els.courseDialogBackdrop);
        requestAnimationFrame(() => els.courseDialogNameInput?.focus());
      }
      function closeCourseDialog() {
        closeModal(els.courseDialogBackdrop);
        state.editingCourseId = null;
      }
      async function submitCourseDialog() {
        const name = els.courseDialogNameInput?.value.trim() || '';
        if (!name) {
          if (els.courseDialogError) {
            els.courseDialogError.textContent = '授業名を入力してください。';
            els.courseDialogError.hidden = false;
          }
          els.courseDialogNameInput?.focus();
          return;
        }
        const payload = {
          name,
          semester: els.courseDialogSemesterInput?.value.trim() || '',
          description: els.courseDialogDescriptionInput?.value.trim() || ''
        };
        try {
          const editingId = state.editingCourseId;
          const data = await apiRequest(editingId ? `/api/courses/${editingId}` : '/api/courses', {
            method: editingId ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
          });
          state.currentCourseId = data.course.id;
          closeCourseDialog();
          await refreshCourses();
          showToast(editingId ? '授業情報を更新しました。' : `授業を作成しました。授業コード: ${data.course.inviteCode}`);
        } catch (error) {
          if (els.courseDialogError) {
            els.courseDialogError.textContent = error.message;
            els.courseDialogError.hidden = false;
          } else {
            showToast(error.message, 'error');
          }
        }
      }
      async function deleteCourse(id) {
        const course = (state.coursesCache || []).find(item => String(item.id) === String(id));
        const ok = await confirmAction({
          title: '授業を削除',
          message: `「${course?.name || 'この授業'}」を削除します。教材と学生の作業も削除されます。元に戻せません。`,
          confirmLabel: '削除'
        });
        if (!ok) return;
        try {
          await apiRequest(`/api/courses/${id}`, { method: 'DELETE' });
          if (String(state.currentCourseId) === String(id)) state.currentCourseId = null;
          await refreshCourses();
          showToast('授業を削除しました。', 'warn');
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
      function getCurrentCourse() {
        return (state.coursesCache || []).find(course => String(course.id) === String(state.currentCourseId)) || null;
      }
      function findCourseName(id) {
        return (state.coursesCache || []).find(course => String(course.id) === String(id))?.name || '名称未設定の授業';
      }
      function getCourseMaterials(courseId = state.currentCourseId) {
        const list = state.courseMaterialsCache || [];
        return courseId ? list.filter(item => String(item.courseId) === String(courseId)) : list;
      }
      function renderDashboardSummary() {
        if (!els.dashboardSummary) return;
        const role = state.currentUser?.role || 'student';
        const courseCount = state.coursesCache.length;
        const materialCount = (state.courseMaterialsCache || []).length;
        const publishedCount = (state.courseMaterialsCache || []).filter(item => item.status === 'published').length;
        const draftCount = (state.courseMaterialsCache || []).filter(item => item.status === 'draft').length;
        const workCount = (state.savesCache || []).filter(item => item.hasStudentWork).length;
        els.dashboardSummary.hidden = true;
        if (role === 'student') {
          els.dashboardSummary.innerHTML = '';
          return;
        }
        const cards = role === 'student'
          ? [
            ['参加中の授業', courseCount, courseCount ? 'まず授業を選び、その授業の教材から作業を始めます。' : 'まず授業コードで授業に参加します。'],
            ['取り組める教材', publishedCount, '参加済み授業で公開中の教材だけが表示されます。'],
            ['学習記録', workCount, '教材を開くと、自分の保存内容が優先して読み込まれます。']
          ]
          : [
            ['担当授業', courseCount, '教師の作業は教材一覧ではなく、授業ごとの管理から始まります。'],
            ['授業教材', materialCount, `公開 ${publishedCount} / 下書き ${draftCount}`],
            ['未公開の下書き', draftCount, '授業内で編集し、準備が整ってから学生に公開します。']
          ];
        els.dashboardSummary.innerHTML = cards.map(([label, value, meta]) => `
          <article class="app-stat-card">
            <div class="app-stat-card__label">${label}</div>
            <div class="app-stat-card__value">${value}</div>
            <div class="app-stat-card__meta">${meta}</div>
          </article>
        `).join('');
      }
      function renderCourseWorkspace() {
        if (!els.courseWorkspace) return;
        const role = state.currentUser?.role || 'student';
        const course = getCurrentCourse();
        if (!course) {
          els.courseWorkspace.innerHTML = `
            <section class="workspace-card workspace-card--empty">
              <div>
                <h3 class="workspace-card__title">${role === 'student' ? '授業に参加すると、ここから学習を始められます' : '授業を作成すると、ここが教師用の作業入口になります'}</h3>
                <p class="workspace-card__desc">${role === 'student' ? 'まず授業コードを入力してください。参加後は公開中の教材と自分の学習記録だけが表示されます。' : 'まず授業を1つ作成してください。作成後はこの場所から教材管理へ進めます。'}</p>
              </div>
              <div class="workspace-actions">
                <span class="pill">${role === 'student' ? 'STEP 1: 授業コードで参加' : 'STEP 1: 授業を作成'}</span>
                <span class="pill">${role === 'student' ? 'STEP 2: 教材を開く' : 'STEP 2: 教材を管理'}</span>
              </div>
            </section>`;
          return;
        }
        if (role !== 'student') {
          els.courseWorkspace.innerHTML = '';
          return;
        }
        const materials = getCourseMaterials(course.id);
        const published = materials.filter(item => item.status === 'published');
        const recentWorks = role === 'student'
          ? materials.filter(item => item.hasStudentWork).slice(0, 4)
          : [];
        if (role === 'student') {
          els.courseWorkspace.innerHTML = `
            <section class="student-course-hero">
              <div class="student-course-hero__main">
                <div class="student-course-hero__eyebrow">選択中の授業</div>
                <h3 class="student-course-hero__title">${esc(course.name)}</h3>
                <p class="student-course-hero__desc">${esc(course.description || 'この授業で公開されている教材から学習を始められます。')}</p>
              </div>
              <div class="student-course-hero__meta">
                <span class="pill">${esc(course.semester || '学期未設定')}</span>
                <span class="pill">${published.length} 件の教材</span>
              </div>
            </section>
            <section class="student-section">
              <div class="student-section__head">
                <div>
                  <h3 class="student-section__title">教材を選ぶ</h3>
                  <p class="student-section__desc">開く教材を1つ選んで、加工画面へ進みます。</p>
                </div>
              </div>
              ${published.length ? `
                <div class="student-material-grid">
                  ${published.slice(0, 12).map(item => `
                    <article class="student-material-card">
                      <div class="student-material-card__body">
                        <div class="student-material-card__status">${item.hasStudentWork ? '保存済み' : '未着手'}</div>
                        <h4 class="student-material-card__title">${esc(item.title)}</h4>
                        <p class="student-material-card__meta">${item.hasStudentWork ? '自分の保存内容から再開します。' : '教師が公開した教材を開きます。'}</p>
                        <p class="student-material-card__date">更新 ${fmt(item.updatedAt)}</p>
                      </div>
                      <div class="student-material-card__actions">
                        <button class="sv-btn" type="button" data-course-action="open-material" data-id="${item.id}">${item.hasStudentWork ? '続きから再開' : '加工を開始'}</button>
                        <button class="sv-btn sv-btn--ghost" type="button" data-saved-action="preview" data-id="${item.id}">プレビュー</button>
                      </div>
                    </article>
                  `).join('')}
                </div>
              ` : '<div class="data-empty">この授業にはまだ公開中の教材がありません。教師が公開すると、ここに表示されます。</div>'}
            </section>
            <section class="student-section">
              <div class="student-section__head">
                <div>
                  <h3 class="student-section__title">最近の学習記録</h3>
                  <p class="student-section__desc">保存した教材だけを短く表示します。</p>
                </div>
              </div>
              ${recentWorks.length ? `
                <div class="student-history-list">
                  ${recentWorks.map(item => `
                    <article class="student-history-item">
                      <div>
                        <h4 class="student-history-item__title">${esc(item.title)}</h4>
                        <p class="student-history-item__meta">最終保存 ${fmt(item.updatedAt)}</p>
                      </div>
                      <button class="sv-btn sv-btn--ghost" type="button" data-course-action="open-material" data-id="${item.id}">再開</button>
                    </article>
                  `).join('')}
                </div>
              ` : '<div class="data-empty">この授業の学習記録はまだありません。教材を1件開いて保存すると、ここに表示されます。</div>'}
            </section>
          `;
          return;
        }
      }
      function renderCourseList() {
        if (!els.courseList) return;
        const role = state.currentUser?.role || 'student';
        if (els.courseJoinPanel) els.courseJoinPanel.hidden = role !== 'student';
        if (els.courseCreatePanel) els.courseCreatePanel.hidden = true;
        if (!state.coursesCache.length) {
          els.courseList.innerHTML = role === 'student' ? '' : `
            <section class="data-panel course-crud-panel">
              <div class="data-panel__head">
                <div>
                  <h3 class="data-panel__title">授業管理</h3>
                  <p class="data-panel__desc">授業を作成すると、教材管理画面で教材を追加できます。</p>
                </div>
                <div class="workspace-actions">
                  <button class="sa-btn se-btn--primary" type="button" data-course-action="new-course">授業を作成</button>
                </div>
              </div>
              <div class="data-empty">まだ担当授業がありません。</div>
            </section>`;
          renderDashboardSummary();
          renderCourseWorkspace();
          return;
        }
        if (role !== 'student') {
          els.courseList.innerHTML = `
            <section class="data-panel course-crud-panel">
              <div class="data-panel__head">
                <div>
                  <h3 class="data-panel__title">授業管理</h3>
                  <p class="data-panel__desc">授業の作成・編集・削除をここで行い、教材は教材管理画面で扱います。</p>
                </div>
                <div class="workspace-actions">
                  <button class="sa-btn se-btn--primary" type="button" data-course-action="new-course">授業を作成</button>
                </div>
              </div>
              <div class="data-table-wrap">
                <table class="data-table course-crud-table">
                  <thead>
                    <tr>
                      <th>授業名</th>
                      <th>学期</th>
                      <th>参加者</th>
                      <th>教材</th>
                      <th>授業コード</th>
                      <th>更新日時</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${state.coursesCache.map(course => `
                      <tr class="${String(state.currentCourseId) === String(course.id) ? 'is-selected' : ''}">
                        <td>
                          <div class="data-table__title">${esc(course.name)}</div>
                          <div class="data-table__meta">${esc(course.description || 'この授業の教材と学生作業を管理します。')}</div>
                        </td>
                        <td>${esc(course.semester || '学期未設定')}</td>
                        <td>${course.memberCount || 0}</td>
                        <td>${course.materialCount || 0}</td>
                        <td><span class="pill">${esc(course.inviteCode)}</span></td>
                        <td>${fmt(course.updatedAt)}</td>
                        <td class="course-crud-table__actions">
                          <div class="workspace-actions course-row-actions">
                            <button class="sv-btn sv-btn--ghost" type="button" data-course-action="focus" data-id="${course.id}">選択</button>
                            <button class="sv-btn" type="button" data-course-action="manage-materials" data-id="${course.id}">教材</button>
                            <button class="sv-btn sv-btn--ghost" type="button" data-course-action="edit-course" data-id="${course.id}">編集</button>
                            <button class="sv-btn sv-btn--danger" type="button" data-course-action="delete-course" data-id="${course.id}">削除</button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </section>`;
          renderDashboardSummary();
          renderCourseWorkspace();
          return;
        }
        els.courseList.innerHTML = `
          <aside class="course-sidebar">
            <div>
              <h3 class="course-sidebar__title">受講中の授業</h3>
              <p class="course-sidebar__desc">先に授業を選ぶと、教材と記録が右側にまとまります。</p>
            </div>
            <div class="course-sidebar__list">
              ${state.coursesCache.map(course => `
                <article class="course-nav-card ${String(state.currentCourseId) === String(course.id) ? 'is-active-course' : ''}">
                  <div>
                    <h4 class="course-nav-card__title">${esc(course.name)}</h4>
                    <p class="course-nav-card__meta">${esc(course.semester || '学期未設定')} / 教材 ${course.materialCount || 0} 件</p>
                  </div>
                  <button class="sv-btn ${String(state.currentCourseId) === String(course.id) ? '' : 'sv-btn--ghost'}" type="button" data-course-action="focus" data-id="${course.id}">
                    ${String(state.currentCourseId) === String(course.id) ? '選択中' : '選択'}
                  </button>
                </article>
              `).join('')}
            </div>
          </aside>`;
        renderDashboardSummary();
        renderCourseWorkspace();
      }
      function renderTeacherMaterialList() {
        if (!els.teacherMaterialList) return;
        const role = state.currentUser?.role || 'student';
        if (role !== 'teacher' && role !== 'admin') {
          els.teacherMaterialList.innerHTML = '';
          if (els.materialsSummary) els.materialsSummary.innerHTML = '';
          return;
        }
        const course = getCurrentCourse();
        const items = state.courseMaterialsCache || [];
        if (els.materialsSummary) {
          const courseButtons = (state.coursesCache || []).map(item => `
            <button class="sv-btn ${String(state.currentCourseId) === String(item.id) ? '' : 'sv-btn--ghost'}" type="button" data-course-action="focus" data-id="${item.id}">
              ${esc(item.name)}
            </button>
          `).join('');
          els.materialsSummary.innerHTML = `
            <section class="workspace-card workspace-card--compact materials-switcher">
              <div class="workspace-card__head">
                <div>
                  <h3 class="workspace-card__title">${course ? esc(course.name) : '授業を選択してください'}</h3>
                  <p class="workspace-card__desc">${course
                    ? `ここでは ${esc(course.name)} の教材だけを扱います。授業を切り替えても、この画面のまま続けられます。`
                    : '先に授業を選ぶと、その授業の教材一覧と学生の保存状況がここに表示されます。'
                  }</p>
                </div>
                <div class="workspace-meta">
                  ${course ? `<span class="pill">${esc(course.semester || '学期未設定')}</span>` : ''}
                  ${course ? `<span class="pill">授業コード ${esc(course.inviteCode)}</span>` : ''}
                </div>
              </div>
              <div class="workspace-actions">${courseButtons || '<span class="workspace-row__meta">担当授業がまだありません。</span>'}</div>
            </section>
          `;
        }
        if (!course) {
          els.teacherMaterialList.innerHTML = '<div class="sv-empty"><h2>授業を選択すると教材管理を始められます</h2><p>まず上の授業ボタンから1つ選んでください。教材の作成・公開・学生確認は授業ごとに行います。</p></div>';
          renderWorksPlaceholder();
          return;
        }
        const draftCount = items.filter(item => item.status === 'draft').length;
        const publishedCount = items.filter(item => item.status === 'published').length;
        if (!items.length) {
          els.teacherMaterialList.innerHTML = `
            <section class="data-panel">
              <div class="data-panel__head">
                <div>
                  <h3 class="data-panel__title">教材一覧</h3>
                  <p class="data-panel__desc">${esc(course.name)} にはまだ教材がありません。まず1件作成すると、この画面で一覧管理できるようになります。</p>
                </div>
                <div class="workspace-actions">
                  <button class="sa-btn se-btn--primary" type="button" data-course-action="new-material" data-id="${course.id}">教材を新規作成</button>
                </div>
              </div>
            </section>`;
          renderWorksPlaceholder();
          return;
        }
        const drafts = items.filter(item => item.status === 'draft');
        const published = items.filter(item => item.status === 'published');
        renderWorksPlaceholder();
        const renderMaterialRows = list => list.map(item => `
          <tr>
            <td>
              <div class="data-table__title">${esc(item.title || '無題')}</div>
              <div class="data-table__meta">ベース教材 ${esc(findLessonTitle(item.baseLessonId))}</div>
            </td>
            <td>${fmt(item.updatedAt)}</td>
            <td><span class="pill">${item.status === 'published' ? '公開中' : '下書き'}</span></td>
            <td>
              <div class="workspace-actions">
                <button class="sv-btn sv-btn--ghost" type="button" data-material-action="edit" data-id="${item.id}">編集</button>
                <button class="sv-btn" type="button" data-material-action="toggle-status" data-id="${item.id}" data-status="${item.status === 'published' ? 'draft' : 'published'}">${item.status === 'published' ? '公開取消' : '公開'}</button>
                <button class="sv-btn sv-btn--ghost" type="button" data-material-action="works" data-id="${item.id}">学生一覧</button>
                <button class="sv-btn sv-btn--danger" type="button" data-saved-action="delete" data-id="${item.id}">削除</button>
              </div>
            </td>
          </tr>
        `).join('');
        els.teacherMaterialList.innerHTML = `
          <section class="data-panel">
            <div class="data-panel__head">
              <div>
                <h3 class="data-panel__title">教材一覧</h3>
                <p class="data-panel__desc">この授業の教材だけを一覧表示しています。編集・公開・学生作業確認を表形式でまとめています。</p>
              </div>
              <div class="workspace-meta">
                <span class="pill">下書き ${draftCount}</span>
                <span class="pill">公開 ${publishedCount}</span>
              </div>
            </div>
            <div class="workspace-actions">
                <button class="sa-btn se-btn--primary" type="button" data-course-action="new-material" data-id="${course.id}">教材を新規作成</button>
                <button class="sa-btn sa-btn--ghost" type="button" data-course-action="focus" data-id="${course.id}">この授業を確認</button>
            </div>
            <div class="data-panel__stack">
              <div class="data-subpanel">
                <div class="data-subpanel__title">下書き教材</div>
                ${drafts.length ? `
                  <div class="data-table-wrap">
                    <table class="data-table">
                      <thead>
                        <tr><th>教材名</th><th>更新日時</th><th>状態</th><th>操作</th></tr>
                      </thead>
                      <tbody>${renderMaterialRows(drafts)}</tbody>
                    </table>
                  </div>
                ` : '<div class="data-empty">下書き教材はまだありません。</div>'}
              </div>
              <div class="data-subpanel">
                <div class="data-subpanel__title">公開中の教材</div>
                ${published.length ? `
                  <div class="data-table-wrap">
                    <table class="data-table">
                      <thead>
                        <tr><th>教材名</th><th>更新日時</th><th>状態</th><th>操作</th></tr>
                      </thead>
                      <tbody>${renderMaterialRows(published)}</tbody>
                    </table>
                  </div>
                ` : '<div class="data-empty">公開中の教材はまだありません。</div>'}
              </div>
            </div>
          </section>
        `;
      }
      async function toggleMaterialStatus(id, status) {
        try {
          await apiRequest(`/api/materials/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
          });
          await refreshCourseMaterials();
          showToast(status === 'published' ? '教材を公開しました。' : '教材を下書きに戻しました。');
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
      async function renderWorksForMaterial(id) {
        if (!els.workList) return;
        try {
          const data = await apiRequest(`/api/materials/${id}/works`);
          const works = data.works || [];
          const material = (state.courseMaterialsCache || []).find(item => String(item.id) === String(id));
          if (!works.length) {
            els.workList.innerHTML = `<section class="data-panel"><div class="data-panel__head"><div><h3 class="data-panel__title">${esc(material?.title || '現在の教材')}</h3><p class="data-panel__desc">まだ学生の保存記録はありません。学生が保存すると、ここに一覧表示されます。</p></div><div class="workspace-actions"><button class="sa-btn sa-btn--ghost" type="button" data-material-action="clear-works">閉じる</button></div></div></section>`;
            return;
          }
          els.workList.innerHTML = `
            <section class="data-panel">
              <div class="data-panel__head">
                <div>
                  <h3 class="data-panel__title">${esc(material?.title || '学生の作業一覧')}</h3>
                  <p class="data-panel__desc">この教材を保存した学生だけを一覧表示します。</p>
                </div>
                <div class="workspace-actions">
                  <button class="sa-btn sa-btn--ghost" type="button" data-material-action="clear-works">一覧を閉じる</button>
                </div>
              </div>
              <div class="data-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>学生</th>
                      <th>メール</th>
                      <th>更新日時</th>
                      <th>操作ログ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${works.map(work => `
                      <tr>
                        <td>${esc(work.studentName || work.studentEmail || `Student ${work.studentId}`)}</td>
                        <td>${esc(work.studentEmail || '-')}</td>
                        <td>${fmt(work.updatedAt)}</td>
                        <td>${Array.isArray(work.operationLogs) ? work.operationLogs.length : 0} 件</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </section>
          `;
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
      function renderWorksPlaceholder() {
        if (!els.workList) return;
        els.workList.innerHTML = '<section class="data-panel"><div class="data-panel__head"><div><h3 class="data-panel__title">学生の作業一覧</h3><p class="data-panel__desc">教材管理の各行にある「学生一覧」から、保存済み学生を表形式で確認できます。</p></div></div></section>';
      }
      async function renderAdminPanel() {
        if (!els.adminPanel) return;
        try {
          const data = await apiRequest('/api/admin/summary');
          els.adminPanel.innerHTML = ['ユーザー管理', '権限管理', '授業管理', 'システム設定'].map(label => `
            <article class="sv-card">
              <h3 class="sv-card__title">${label}</h3>
              <p class="sv-card__source">この段階ではプレースホルダーのみです。後続フェーズで実装します。</p>
            </article>
          `).join('') + `
            <article class="sv-card">
              <h3 class="sv-card__title">基本データ</h3>
              <p class="sv-card__source">users ${data.users} / courses ${data.courses} / materials ${data.materials} / works ${data.studentWorks}</p>
            </article>
          `;
        } catch (error) {
          els.adminPanel.innerHTML = `<div class="sv-empty"><h2>${esc(error.message)}</h2></div>`;
        }
      }
      async function recordEvent(eventType, metadata = {}) {
        if (!state.authToken) return;
        try {
          await apiRequest('/api/events', {
            method: 'POST',
            body: JSON.stringify({ eventType, metadata })
          });
        } catch { }
      }
      async function loadRemotePrefs() {
        if (!state.currentUser) return;
        const data = await apiRequest('/api/settings/toolbar');
        if (data.value) {
          state.prefs = normalizePrefs(data.value);
          localStorage.setItem(STORAGE_KEYS.toolbar, JSON.stringify(state.prefs));
          renderToolbar();
        }
      }
      async function initAuth() {
        syncAuthUi();
        if (!state.authToken) {
          if (document.body.dataset.requireAuth === 'true') redirectToLogin();
          return;
        }
        try {
          const data = await apiRequest('/api/auth/me');
          state.currentUser = data.user;
          syncAuthUi();
          await loadRemotePrefs();
          await refreshCourses();
          await refreshSaves();
        } catch {
          setAuthSession('', null);
          if (document.body.dataset.requireAuth === 'true') redirectToLogin();
        }
      }
      function fragmentToHTML(fragment) { const temp = document.createElement('div'); temp.appendChild(fragment.cloneNode(true)); return temp.innerHTML; }
      function htmlToFragment(html) { const temp = document.createElement('template'); temp.innerHTML = html || ''; return temp.content.cloneNode(true); }
      function isContainedIn(node, root) { return !!node && !!root && (node === root || root.contains(node)); }
      function unwrapElement(el) { const parent = el.parentNode; if (!parent) return; while (el.firstChild) parent.insertBefore(el.firstChild, el); parent.removeChild(el); }
      function sanitizeClearedFragment(fragment) {
        const root = document.createElement('div');
        root.appendChild(fragment);
        const nodes = Array.from(root.querySelectorAll('.popup-anchor, strong, u, span[style]'));
        nodes.reverse().forEach(node => {
          if (node.classList?.contains('popup-anchor')) {
            node.removeAttribute('data-popup');
            node.classList.remove('popup-anchor');
          }
          if (node.hasAttribute?.('style')) node.removeAttribute('style');
          const isPlainSpan = node.tagName === 'SPAN' && !node.getAttributeNames().length;
          if (node.tagName === 'STRONG' || node.tagName === 'U' || isPlainSpan) unwrapElement(node);
        });
        const out = document.createDocumentFragment();
        while (root.firstChild) out.appendChild(root.firstChild);
        return out;
      }
      function downloadJSON(filename, obj) { const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000); }
      function openModal(backdrop) { if (!backdrop) return; backdrop.classList.add('is-open'); backdrop.setAttribute('aria-hidden', 'false'); document.body.classList.add('dialog-open'); }
      function closeModal(backdrop) { if (!backdrop) return; backdrop.classList.remove('is-open'); backdrop.setAttribute('aria-hidden', 'true'); if (!document.querySelector('.dialog-backdrop.is-open')) document.body.classList.remove('dialog-open'); }
      function requestSaveTitle(defaultTitle) {
        return new Promise(resolve => {
          state.saveDialogResolver = resolve;
          els.saveTitleInput.value = defaultTitle || '';
          els.saveTitleError.hidden = true;
          els.saveTitleError.textContent = '';
          openModal(els.saveDialogBackdrop);
          requestAnimationFrame(() => { els.saveTitleInput.focus(); els.saveTitleInput.select(); });
        });
      }
      function resolveSaveDialog(value) { closeModal(els.saveDialogBackdrop); const resolver = state.saveDialogResolver; state.saveDialogResolver = null; if (resolver) resolver(value); }
      function confirmAction({ title, message, confirmLabel = '実行' }) {
        return new Promise(resolve => {
          state.confirmDialogResolver = resolve;
          els.confirmDialogTitle.textContent = title;
          els.confirmDialogMessage.textContent = message;
          els.confirmActionBtn.textContent = confirmLabel;
          openModal(els.confirmDialogBackdrop);
          requestAnimationFrame(() => els.confirmActionBtn.focus());
        });
      }
      function resolveConfirmDialog(value) { closeModal(els.confirmDialogBackdrop); const resolver = state.confirmDialogResolver; state.confirmDialogResolver = null; if (resolver) resolver(value); }
      function snapshot() { return { html: els.lessonContainer.innerHTML, log: clone(state.log || []) }; }
      function pushUndo() { state.undoStack.push(snapshot()); if (state.undoStack.length > UNDO_MAX) state.undoStack.shift(); state.redoStack = []; syncMobileUndoButton(); }
      function restoreState(s) { if (!s) return; els.lessonContainer.innerHTML = s.html; ensureResizableImages(); state.log = s.log || []; saveDraft(); syncMobileUndoButton(); }
      function undo() { if (state.undoStack.length <= 1) { syncMobileUndoButton(); return false; } state.redoStack.push(snapshot()); const previous = state.undoStack.pop(); restoreState(previous); return true; }
      function redo() { if (!state.redoStack.length) return false; state.undoStack.push(snapshot()); restoreState(state.redoStack.pop()); return true; }
      function performMobileUndo() {
        if (undo()) showToast('元に戻しました。', 'warn');
        else showToast('元に戻せる変更がありません。', 'warn');
        syncMobileUndoButton();
      }
      function lockHistoryHotkey() { state.__historyHotkeyLock = true; clearTimeout(state.__historyHotkeyTimer); state.__historyHotkeyTimer = setTimeout(() => { state.__historyHotkeyLock = false; }, 80); }
      function addLog(entry) {
        state.log.push(entry);
        state.draftChangedAt = nowIso();
        saveDraft();
        markStudentAutoSaveDirty();
        showUndoToast('変更を適用しました。');
      }

      // キーワード化した箇所は元の HTML を保持し、ポップオーバーから復元できるようにする。
      function closeKeywordPopover() {
        els.keywordPopover.hidden = true;
        els.keywordPopover.innerHTML = '';
        els.keywordPopover.dataset.owner = '';
        document.querySelectorAll('.keyword-wrapper.is-open').forEach(el => el.classList.remove('is-open'));
      }

      function openKeywordPopover(wrapper) {
        const encodedHtml = wrapper.dataset.originalHtml;
        if (!encodedHtml) return;
        const html = decodeURIComponent(encodedHtml);
        els.keywordPopover.innerHTML = html;
        els.keywordPopover.hidden = false;
        els.keywordPopover.dataset.owner = wrapper.dataset.keywordId || '';
        document.querySelectorAll('.keyword-wrapper.is-open').forEach(el => {
          if (el !== wrapper) el.classList.remove('is-open');
        });
        wrapper.classList.add('is-open');

        const rect = wrapper.getBoundingClientRect();
        const margin = 12;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const pop = els.keywordPopover;
        pop.style.left = `${margin}px`;
        pop.style.top = `${Math.min(vh - 120, rect.bottom + 10)}px`;

        const popRect = pop.getBoundingClientRect();
        let left = rect.left;
        if (left + popRect.width > vw - margin) left = vw - margin - popRect.width;
        if (left < margin) left = margin;

        let top = rect.bottom + 10;
        if (top + popRect.height > vh - margin) {
          top = Math.max(margin, rect.top - popRect.height - 10);
        }

        pop.style.left = `${left}px`;
        pop.style.top = `${top}px`;
      }

      // ツール配置はユーザーが並べ替えられるため、保存時と読込時の両方で正規化する。
      function loadPrefs() {
        try { return normalizePrefs(JSON.parse(localStorage.getItem(STORAGE_KEYS.toolbar) || 'null') || clone(DEFAULT_PREFS)); }
        catch { return clone(DEFAULT_PREFS); }
      }
      function savePrefs(p) {
        const normalized = normalizePrefs(p);
        localStorage.setItem(STORAGE_KEYS.toolbar, JSON.stringify(normalized));
        if (state.authToken) {
          apiRequest('/api/settings/toolbar', {
            method: 'PUT',
            body: JSON.stringify({ value: normalized })
          }).catch(() => showToast('ツール配置の保存に失敗しました。', 'error'));
        }
      }
      function normalizePrefs(prefs) {
        const normalized = { groupOrder: [], itemOrder: {} };
        const validGroupIds = GROUPS.map(g => g.id);
        const seenGroups = new Set();
        const requestedGroupOrder = Array.isArray(prefs?.groupOrder) ? prefs.groupOrder : [];
        for (const gid of requestedGroupOrder) if (validGroupIds.includes(gid) && !seenGroups.has(gid)) { normalized.groupOrder.push(gid); seenGroups.add(gid); }
        for (const gid of validGroupIds) if (!seenGroups.has(gid)) normalized.groupOrder.push(gid);
        const seenActions = new Set();
        for (const gid of validGroupIds) {
          const requested = Array.isArray(prefs?.itemOrder?.[gid]) ? prefs.itemOrder[gid] : [];
          normalized.itemOrder[gid] = [];
          for (const aid of requested) if (ACTION_MAP.has(aid) && !seenActions.has(aid)) { normalized.itemOrder[gid].push(aid); seenActions.add(aid); }
        }
        for (const action of ACTIONS) if (!seenActions.has(action.id)) { normalized.itemOrder[action.groupId].push(action.id); seenActions.add(action.id); }
        return normalized;
      }
      function moveGroup(prefs, sourceGroupId, targetGroupId, placeBefore = true) {
        if (!sourceGroupId || !targetGroupId || sourceGroupId === targetGroupId) return prefs;
        const next = clone(prefs); const order = next.groupOrder.filter(id => id !== sourceGroupId); let idx = order.indexOf(targetGroupId); if (idx < 0) idx = order.length; if (!placeBefore) idx += 1; order.splice(idx, 0, sourceGroupId); next.groupOrder = order; return normalizePrefs(next);
      }
      function moveAction(prefs, actionId, targetGroupId, targetActionId = null, placeBefore = true) {
        if (!actionId || !targetGroupId || !ACTION_MAP.has(actionId) || !GROUP_MAP.has(targetGroupId)) return prefs;
        const next = clone(prefs); for (const gid of Object.keys(next.itemOrder)) next.itemOrder[gid] = next.itemOrder[gid].filter(id => id !== actionId); const targetList = next.itemOrder[targetGroupId] || []; next.itemOrder[targetGroupId] = targetList; if (!targetActionId || !targetList.includes(targetActionId)) { targetList.push(actionId); return normalizePrefs(next); } let idx = targetList.indexOf(targetActionId); if (!placeBefore) idx += 1; targetList.splice(idx, 0, actionId); return normalizePrefs(next);
      }
      function moveItemInArray(list, index, delta) { const next = list.slice(); const target = index + delta; if (index < 0 || target < 0 || target >= next.length) return next; const [item] = next.splice(index, 1); next.splice(target, 0, item); return next; }

      // 教材の読込と保存済み教材一覧の描画まわり。
      function renderLessonSelect() {
        const role = state.currentUser?.role || 'student';
        const isStudent = role === 'student';
        if (els.courseSelectWrap) els.courseSelectWrap.hidden = !isStudent;
        if (els.courseSelect && isStudent) {
          els.courseSelect.innerHTML = (state.coursesCache || []).map(course => `<option value="${course.id}">${esc(course.name)}</option>`).join('');
          if (!state.coursesCache.length) {
            els.courseSelect.innerHTML = '<option value="">授業がありません</option>';
          } else {
            if (!state.currentCourseId || !state.coursesCache.some(course => String(course.id) === String(state.currentCourseId))) {
              state.currentCourseId = state.coursesCache[0].id;
            }
            els.courseSelect.value = String(state.currentCourseId);
          }
        }
        const source = role === 'student'
          ? (state.courseMaterialsCache || []).filter(item => item.status === 'published')
          : SAMPLE_LESSONS.map(l => ({ id: l.id, baseLessonId: l.id, title: l.title, isSample: true }));
        if (els.lessonSelectLabel) els.lessonSelectLabel.textContent = role === 'student' ? '教材' : 'ベース教材';
        els.lessonSelect.innerHTML = source.map(item => `<option value="${item.id}">${esc(item.title)}</option>`).join('');
        if (!source.length) {
          els.lessonSelect.innerHTML = '<option value="">教材がありません</option>';
          return;
        }
        if (!state.currentLessonId || !source.some(item => String(item.id) === String(state.currentLessonId))) {
          state.currentLessonId = source[0].id;
        }
        els.lessonSelect.value = state.currentLessonId;
      }

      function loadLessonById(lessonId, options = {}) {
        const role = state.currentUser?.role || 'student';
        if (role === 'student') {
          if (!state.currentCourseId) return showToast('先に授業を選択してください。', 'warn');
          const item = (state.courseMaterialsCache || []).find(material => String(material.id) === String(lessonId));
          if (!item) return showToast('公開中の教材を選択してください。', 'warn');
          state.currentLessonId = item.id;
          state.baseLessonId = item.baseLessonId;
          state.currentSavedId = item.id;
          state.log = Array.isArray(item.log) ? item.log : [];
          els.titleDisplay.textContent = item.title;
          els.lessonContainer.innerHTML = item.htmlContent || item.originalHtmlContent || '';
          ensureResizableImages();
          state.undoStack = [snapshot()];
          state.redoStack = [];
          clearCurrentAction();
          clearStudentAutoSaveState();
          saveDraft();
          if (!options.silent) showToast(item.hasStudentWork ? '自分の保存内容を読み込みました。' : '教師が公開した教材を読み込みました。');
          return;
        }
        const lesson = SAMPLE_LESSONS.find(l => l.id === lessonId);
        if (!lesson) return;
        state.currentLessonId = lesson.id;
        state.baseLessonId = lesson.id;
        state.currentSavedId = null;
        state.log = [];
        els.titleDisplay.textContent = lesson.title;
        els.lessonContainer.innerHTML = lesson.html;
        ensureResizableImages();
        state.undoStack = [snapshot()];
        state.redoStack = [];
        clearCurrentAction();
        clearStudentAutoSaveState();
        saveDraft();
        if (!options.silent) showToast('教材を読み込みました。');
      }

      async function handleAuthSubmit(mode) {
        const email = els.authEmailInput?.value.trim() || '';
        const password = els.authPasswordInput?.value || '';
        const displayName = els.authNameInput?.value.trim() || '';
        if (!email || !password) return showToast('メールとパスワードを入力してください。', 'warn');
        try {
          const data = await apiRequest(`/api/auth/${mode}`, {
            method: 'POST',
            body: JSON.stringify({ email, password, displayName })
          });
          setAuthSession(data.token, data.user);
          if (els.authPasswordInput) els.authPasswordInput.value = '';
          await refreshSaves();
          showToast(mode === 'register' ? '登録しました。' : 'ログインしました。');
        } catch (error) {
          showToast(error.message, 'error');
        }
      }

      function handleLogout() {
        recordEvent('auth_logout');
        setAuthSession('', null);
        state.savesCache = [];
        state.currentSavedId = null;
        renderSavedList();
        syncEditorStatusTag();
        showToast('ログアウトしました。', 'warn');
        redirectToLogin();
      }

      function renderSavedList() {
        if (!state.currentUser) {
          els.savedCount.textContent = '0';
          els.savedList.innerHTML = '';
          els.savedEmpty.hidden = false;
          return;
        }
        const q = (els.savedSearchInput.value || '').trim().toLowerCase();
        const sortKey = els.savedSortSelect.value || 'updated_desc';
        let items = loadSaves();
        if (q) items = items.filter(x => (x.title || '').toLowerCase().includes(q));
        items.sort(makeSorter(sortKey));
        els.savedCount.textContent = String(items.length);
        if (!items.length) { els.savedList.innerHTML = ''; els.savedEmpty.hidden = false; return; }
        els.savedEmpty.hidden = true;
        els.savedList.innerHTML = `
          <section class="data-panel">
            <div class="data-panel__head">
              <div>
                <h3 class="data-panel__title">保存済みの学習記録</h3>
                <p class="data-panel__desc">授業ごとに保存した教材を一覧で確認し、途中から再開できます。</p>
              </div>
            </div>
            <div class="data-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>教材名</th>
                    <th>授業</th>
                    <th>更新日時</th>
                    <th>ログ</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>
                        <div class="data-table__title">${esc(item.title || '無題')}</div>
                        <div class="data-table__meta">ベース教材 ${esc(findLessonTitle(item.baseLessonId))}</div>
                      </td>
                      <td>${item.courseId ? esc(findCourseName(item.courseId)) : '-'}</td>
                      <td>${fmt(item.updatedAt)}</td>
                      <td>${Array.isArray(item.log) ? item.log.length : 0} 件</td>
                      <td>
                        <div class="workspace-actions">
                          <button class="sv-btn sv-btn--ghost" type="button" data-saved-action="preview" data-id="${item.id}">プレビュー</button>
                          <button class="sv-btn" type="button" data-saved-action="open" data-id="${item.id}">${state.currentUser?.role === 'student' ? '続きから再開' : '編集に読み込む'}</button>
                          ${state.currentUser?.role === 'student' ? '' : `<button class="sv-btn sv-btn--danger" type="button" data-saved-action="delete" data-id="${item.id}">削除</button>`}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>
        `;
      }
      function makeSorter(key) {
        const byDate = (field, dir) => (a, b) => { const ta = new Date(a[field] || 0).getTime(); const tb = new Date(b[field] || 0).getTime(); return dir === 'asc' ? ta - tb : tb - ta; };
        const byTitle = dir => (a, b) => { const ta = (a.title || '').toLowerCase(), tb = (b.title || '').toLowerCase(); if (ta < tb) return dir === 'asc' ? -1 : 1; if (ta > tb) return dir === 'asc' ? 1 : -1; return 0; };
        switch (key) { case 'updated_asc': return byDate('updatedAt', 'asc'); case 'created_desc': return byDate('createdAt', 'desc'); case 'created_asc': return byDate('createdAt', 'asc'); case 'title_asc': return byTitle('asc'); case 'title_desc': return byTitle('desc'); default: return byDate('updatedAt', 'desc'); }
      }
      function findLessonTitle(id) { return SAMPLE_LESSONS.find(l => l.id === id)?.title || '不明な教材'; }

      function openTeacherMaterial(id) {
        const item = (state.courseMaterialsCache || []).find(material => String(material.id) === String(id));
        if (!item) return showToast('教材が見つかりません。', 'error');
        state.currentSavedId = item.id;
        state.currentLessonId = item.baseLessonId;
        state.baseLessonId = item.baseLessonId;
        state.currentCourseId = item.courseId || state.currentCourseId;
        state.log = Array.isArray(item.log) ? item.log : [];
        renderLessonSelect();
        if (els.lessonSelect) els.lessonSelect.value = String(item.baseLessonId);
        els.titleDisplay.textContent = item.title || findLessonTitle(item.baseLessonId);
        els.lessonContainer.innerHTML = item.htmlContent || '';
        ensureResizableImages();
        state.undoStack = [snapshot()];
        state.redoStack = [];
        clearStudentAutoSaveState();
        saveDraft();
        setView('editor');
        recordEvent('material_load_into_editor', { materialId: item.id, title: item.title || '' });
        showToast('教材を編集画面に読み込みました。');
      }

      async function openSavedItem(id) {
        if (!state.currentUser) return showToast('ログインしてください。', 'warn');
        const item = loadSaves().find(x => String(x.id) === String(id));
        if (!item) return showToast('保存済み教材が見つかりません。', 'error');
        const isStudent = (state.currentUser?.role || 'student') === 'student';
        state.currentSavedId = item.id; state.currentLessonId = isStudent ? item.id : item.baseLessonId; state.baseLessonId = item.baseLessonId; state.log = Array.isArray(item.log) ? item.log : [];
        state.currentCourseId = item.courseId || state.currentCourseId;
        els.lessonSelect.value = String(state.currentLessonId);
        els.titleDisplay.textContent = item.title || findLessonTitle(item.baseLessonId);
        els.lessonContainer.innerHTML = item.htmlContent || '';
        ensureResizableImages();
        state.undoStack = [snapshot()]; state.redoStack = [];
        clearStudentAutoSaveState();
        saveDraft();
        setView('editor');
        recordEvent('material_load_into_editor', { materialId: item.id, title: item.title || '' });
        showToast('保存済み教材を読み込みました。');
      }

      async function saveCurrentMaterial() {
        if (!state.currentUser) return showToast('保存するにはログインしてください。', 'warn');
        if (!state.baseLessonId) return showToast('教材が選択されていません。', 'warn');
        const role = state.currentUser.role || 'student';
        if (role === 'student') {
          await saveStudentWork({ silent: false });
          return;
        }
        if (!state.currentCourseId) return showToast('先に授業を作成または選択してください。', 'warn');
        const existing = loadSaves().find(x => String(x.id) === String(state.currentSavedId));
        const defaultTitle = existing?.title || `${els.titleDisplay.textContent}（加工版）`;
        const title = await requestSaveTitle(defaultTitle);
        if (!title) return;
        const now = nowIso();
        const payload = {
          baseLessonId: state.baseLessonId,
          courseId: state.currentCourseId,
          title: title.trim(),
          htmlContent: els.lessonContainer.innerHTML,
          log: clone(state.log),
          status: existing?.status || 'draft'
        };
        try {
          const data = await apiRequest(existing ? `/api/materials/${existing.id}` : '/api/materials', {
            method: existing ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
          });
          const saved = data.material;
          const items = loadSaves();
          saveSaves(existing ? items.map(item => String(item.id) === String(saved.id) ? saved : item) : [saved, ...items]);
          state.currentSavedId = saved.id;
          state.draftChangedAt = now;
          saveDraft();
          renderSavedList();
          showToast(existing ? '保存済み教材を更新しました。' : '教材をデータベースに保存しました。');
        } catch (error) {
          showToast(error.message, 'error');
        }
      }

      async function deleteSavedItem(id) {
        if (!state.currentUser) return showToast('ログインしてください。', 'warn');
        const target = loadSaves().find(item => String(item.id) === String(id));
        const ok = await confirmAction({
          title: '教材を削除',
          message: `「${target?.title || 'この教材'}」を削除します。元に戻せません。`,
          confirmLabel: '削除'
        });
        if (!ok) return;
        try {
          await apiRequest(`/api/materials/${id}`, { method: 'DELETE' });
          const next = loadSaves().filter(item => String(item.id) !== String(id));
          saveSaves(next);
          if (String(state.currentSavedId) === String(id)) state.currentSavedId = null;
          renderSavedList();
          showToast('削除しました。');
        } catch (error) {
          showToast(error.message, 'error');
        }
      }

      function exportSavedItem(id) { const item = loadSaves().find(x => String(x.id) === String(id)); if (!item) return; downloadJSON(`${sanitizeFileName(item.title || 'gakuzai-save')}.json`, item); showToast('JSONを書き出しました。'); }
      function sanitizeFileName(s) { return String(s).replace(/[\\/:*?"<>|]+/g, '_'); }
      function exportAll() { downloadJSON('gakuzai-demo-data.json', { exportedAt: nowIso(), lessons: SAMPLE_LESSONS.map(l => ({ id: l.id, title: l.title })), saves: loadSaves() }); showToast('データを書き出しました。'); }
      function resetDemo() { if (!confirm('ツール並べ替え・現在のドラフトを初期化しますか？ データベースの保存済み教材は削除しません。')) return; localStorage.removeItem(STORAGE_KEYS.toolbar); localStorage.removeItem(STORAGE_KEYS.sidebar); clearDraft(); state.prefs = clone(DEFAULT_PREFS); savePrefs(state.prefs); state.desktopSidebarCollapsed = false; syncDesktopSidebarShell(); state.currentSavedId = null; renderToolbar(); renderSavedList(); loadLessonById(SAMPLE_LESSONS[0].id, { silent: true }); showToast('ローカル表示状態を初期化しました。', 'warn'); }

      function previewSavedItem(id) {
        const item = loadSaves().find(x => String(x.id) === String(id));
        if (!item) return;
        els.previewMeta.textContent = `${item.title} / 更新 ${fmt(item.updatedAt)}`;
        els.previewContent.innerHTML = item.htmlContent || '';
        openModal(els.previewDialogBackdrop);
      }
      function closePreview() { closeModal(els.previewDialogBackdrop); }

      function setView(view) {
        const role = state.currentUser?.role || 'student';
        if (state.currentView === 'editor' && view !== 'editor') {
          flushStudentAutoSave({ silent: true, reason: 'view-change' });
        }
        if (view === 'editor' && role === 'teacher' && !state.currentCourseId) {
          showToast('先に授業を選択してください。教師の教材加工は授業ごとに行います。', 'warn');
          view = 'courses';
        }
        if (view === 'materials' && role !== 'student' && !state.currentCourseId && state.coursesCache.length) {
          state.currentCourseId = state.coursesCache[0].id;
        }
        state.currentView = view;
        const isEditor = view === 'editor';
        const isSaved = view === 'saved';
        els.editorView.hidden = !isEditor;
        els.savedView.hidden = !isSaved;
        if (els.coursesView) els.coursesView.hidden = view !== 'courses';
        if (els.materialsView) els.materialsView.hidden = view !== 'materials';
        if (els.adminView) els.adminView.hidden = view !== 'admin';
        els.editorTopActions.hidden = !isEditor;
        els.savedTopActions.hidden = !isSaved;
        const titles = {
          courses: role === 'teacher' ? '教師ダッシュボード / 授業一覧' : role === 'admin' ? '授業管理' : '授業一覧',
          editor: role === 'teacher' ? '教材編集' : '教材加工',
          saved: '学習記録',
          materials: '教材管理',
          admin: '管理者コンソール'
        };
        els.headerTitle.textContent = titles[view] || 'GAKUZAI';
        els.headerSubtitle.textContent = role === 'student'
          ? '参加中の授業で公開された教材だけを開けます。加工結果は自分専用の記録として保存されます。'
          : role === 'teacher'
            ? '教師はまず授業を選び、その授業の教材を管理・編集し、必要に応じて学生へ公開します。'
            : '管理者向けの基本入口を用意しています。システムの基礎データを確認できます。';
        document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
        if (view === 'courses') refreshCourses().catch(error => showToast(error.message, 'error'));
        if (view === 'materials') refreshCourseMaterials().then(() => renderWorksPlaceholder()).catch(error => showToast(error.message, 'error'));
        if (view === 'admin') renderAdminPanel();
        if (view === 'saved') {
          recordEvent('view_saved_materials');
          refreshSaves().catch(error => showToast(error.message, 'error'));
        }
        if (!isEditor) {
          hideMobileSelectionBar();
          state.mobileOpen = false;
        }
        closeKeywordPopover();
        closeMobileNav();
        syncEditorInteractionMode();
        syncMobileShell();
        syncMobileUndoButton();
      }

      function syncEditorStatusTag() {
        if (!els.editorStatusTag) return;
        if (isStudentEditingMaterial()) {
          if (state.studentAutoSaveDirty) {
            els.editorStatusTag.textContent = '未保存の変更があります';
            return;
          }
          if (state.studentLastAutoSavedAt) {
            els.editorStatusTag.textContent = `自動保存済み ${fmt(state.studentLastAutoSavedAt)}`;
            return;
          }
        }
        els.editorStatusTag.textContent = state.currentSavedId ? '保存済み教材を再編集中' : '本文編集エリア';
      }

      // contenteditable な教材本文に対して装飾を適用するための選択範囲ユーティリティ。
      function getActiveRange(container) { const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null; const range = sel.getRangeAt(0); return container.contains(range.commonAncestorContainer) ? range : null; }
      const BLOCK_SELECTOR = 'p, div, li, h1, h2, h3, blockquote, pre';
      const PROTECTED_INLINE_SELECTOR = 'math, svg';
      function closestBlock(node, container) { let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement; if (!el) return null; if (el === container) return container; return el.closest(BLOCK_SELECTOR) || container; }
      function rangeIntersectsNodeSafe(range, node) { try { return range.intersectsNode(node); } catch { return false; } }
      function getProtectedNodesInRange(container, range) {
        return Array.from(container.querySelectorAll(PROTECTED_INLINE_SELECTOR)).filter(node => rangeIntersectsNodeSafe(range, node));
      }
      function wrapTextNodesInRange(container, range, builder) {
        const textNodes = [];
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            if (node.parentElement?.closest(PROTECTED_INLINE_SELECTOR)) return NodeFilter.FILTER_REJECT;
            return rangeIntersectsNodeSafe(range, node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        });
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        for (let i = textNodes.length - 1; i >= 0; i -= 1) {
          const tn = textNodes[i];
          const len = tn.nodeValue.length;
          const start = tn === range.startContainer ? range.startOffset : 0;
          const end = tn === range.endContainer ? range.endOffset : len;
          if (start === end) continue;
          const r = document.createRange();
          r.setStart(tn, start);
          r.setEnd(tn, end);
          if (!r.toString().trim()) continue;
          const fragment = r.extractContents();
          r.insertNode(builder(fragment));
        }
      }
      function applySafeInlineSelection(container, textBuilder, protectedApplier = null) {
        const range = getActiveRange(container);
        if (!range || !range.toString().trim()) return false;
        getProtectedNodesInRange(container, range).forEach(node => protectedApplier?.(node));
        wrapTextNodesInRange(container, range, textBuilder);
        try { window.getSelection()?.removeAllRanges(); } catch { }
        return true;
      }
      function wrapRangeInline(range, builder) { const fragment = range.extractContents(); const wrapper = builder(fragment); range.insertNode(wrapper); range.collapse(false); return wrapper; }
      function wrapAcrossTextNodes(container, range, builder) { const textNodes = []; const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, { acceptNode(node) { if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT; try { return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } catch { return NodeFilter.FILTER_REJECT; } } }); while (walker.nextNode()) textNodes.push(walker.currentNode); for (let i = textNodes.length - 1; i >= 0; i--) { const tn = textNodes[i]; const len = tn.nodeValue.length; const start = (tn === range.startContainer) ? range.startOffset : 0; const end = (tn === range.endContainer) ? range.endOffset : len; if (start === end) continue; const r = document.createRange(); r.setStart(tn, start); r.setEnd(tn, end); const txt = r.toString(); if (!txt || !txt.trim()) continue; const frag = r.extractContents(); const wrapper = builder(frag); r.insertNode(wrapper); } try { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); range.collapse(false); } catch { } }
      function wrapSelectionSmart(container, builder) { const range = getActiveRange(container); if (!range) return null; const selectedText = range.toString(); if (!selectedText || !selectedText.trim()) return null; const startBlock = closestBlock(range.startContainer, container); const endBlock = closestBlock(range.endContainer, container); if (startBlock && endBlock && startBlock !== endBlock) { wrapAcrossTextNodes(container, range, builder); return true; } return wrapRangeInline(range, builder); }
      function applyKeyword(container, keywordText) {
        const keyword = keywordText || '▽';
        const range = getActiveRange(container);
        if (!range) return;

        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) return;
        if (getProtectedNodesInRange(container, range).length) {
          showToast('数式を含む範囲は、数式が壊れないようキーワード化できません。', 'warn');
          return;
        }

        let node = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        if (node && node.closest && node.closest('.keyword-wrapper')) return;

        const wrappers = Array.from(container.querySelectorAll('.keyword-wrapper'));
        for (const w of wrappers) {
          try {
            if (range.intersectsNode(w)) return;
          } catch { }
        }

        const startBlock = closestBlock(range.startContainer, container);
        const endBlock = closestBlock(range.endContainer, container);
        if (!startBlock || !endBlock) return;

        const originalHtml = fragmentToHTML(range.cloneContents());
        const keywordId = `kw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const createWrapper = () => {
          const wrapper = document.createElement('span');
          wrapper.className = 'keyword-wrapper';
          wrapper.dataset.originalHtml = encodeURIComponent(originalHtml);
          wrapper.dataset.keywordId = keywordId;

          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'keyword-toggle';
          toggle.textContent = keyword;

          wrapper.append(toggle);
          return wrapper;
        };

        if (startBlock === endBlock) {
          range.deleteContents();
          const wrapper = createWrapper();
          range.insertNode(wrapper);

          try {
            const sel = window.getSelection();
            sel.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStartAfter(wrapper);
            newRange.setEndAfter(wrapper);
            sel.addRange(newRange);
          } catch { }

          return;
        }

        const blockNodes = [];
        let walker = startBlock;
        while (walker) {
          blockNodes.push(walker);
          if (walker === endBlock) break;
          walker = walker.nextSibling;
        }
        if (!blockNodes.length || blockNodes[blockNodes.length - 1] !== endBlock) return;
        const originalBlocks = blockNodes.map(block => block.outerHTML);

        const beforeRange = document.createRange();
        beforeRange.selectNodeContents(startBlock);
        beforeRange.setEnd(range.startContainer, range.startOffset);
        const beforeFrag = beforeRange.cloneContents();

        const afterRange = document.createRange();
        afterRange.selectNodeContents(endBlock);
        afterRange.setStart(range.endContainer, range.endOffset);
        const afterFrag = afterRange.cloneContents();

        while (startBlock.firstChild) startBlock.removeChild(startBlock.firstChild);
        startBlock.appendChild(beforeFrag);
        const wrapper = createWrapper();
        wrapper.dataset.crossBlock = '1';
        wrapper.dataset.originalBlocks = encodeURIComponent(JSON.stringify(originalBlocks));
        wrapper.dataset.endBlockTag = (endBlock.tagName || 'p').toLowerCase();
        wrapper.dataset.endBlockAttrs = encodeURIComponent(JSON.stringify(
          Array.from(endBlock.attributes || []).map(attr => [attr.name, attr.value])
        ));
        startBlock.appendChild(wrapper);
        startBlock.appendChild(afterFrag);

        for (const block of blockNodes.slice(1)) {
          block.remove();
        }

        closeKeywordPopover();

        try {
          const sel = window.getSelection();
          sel.removeAllRanges();
        } catch { }
      }
      function applyColor(container, color) {
        applySafeInlineSelection(container, frag => { const span = document.createElement('span'); span.style.color = color; span.appendChild(frag); return span; }, node => { node.style.color = color; });
      }
      function applyMarker(container, color) {
        applySafeInlineSelection(container, frag => { const span = document.createElement('span'); span.style.backgroundColor = color; span.appendChild(frag); return span; }, node => { node.style.backgroundColor = color; });
      }
      function applyEmphasis(container, type) {
        applySafeInlineSelection(container, frag => { const el = document.createElement(type === 'underline' ? 'u' : 'strong'); el.appendChild(frag); return el; }, node => { if (type === 'underline') node.style.textDecoration = 'underline'; else node.style.fontWeight = '700'; });
      }
      function applyFontSize(container, size) {
        applySafeInlineSelection(container, frag => { const span = document.createElement('span'); span.style.fontSize = size; span.appendChild(frag); return span; }, node => { node.style.fontSize = size; });
      }
      function applyPopup(container, text) {
        if (!text) return;
        const range = getActiveRange(container);
        if (range && getProtectedNodesInRange(container, range).length) showToast('数式部分にはポップアップを付けず、通常テキストだけに適用します。', 'warn');
        applySafeInlineSelection(container, frag => { const span = document.createElement('span'); span.className = 'popup-anchor'; span.dataset.popup = text; span.appendChild(frag); return span; });
      }
      function clearSelectionStyle(container) {
        const range = getActiveRange(container);
        if (!range) return;
        const protectedNodes = getProtectedNodesInRange(container, range);
        if (protectedNodes.length) {
          protectedNodes.forEach(node => {
            node.style.color = '';
            node.style.backgroundColor = '';
            node.style.fontSize = '';
            node.style.fontWeight = '';
            node.style.textDecoration = '';
          });
          showToast('数式は壊れないよう、数式要素の装飾だけを解除しました。', 'warn');
          return;
        }

        const wrappers = Array.from(container.querySelectorAll('.keyword-wrapper'));
        let handledKeyword = false;

        wrappers.forEach(wrapper => {
          try {
            if (!range.intersectsNode(wrapper)) return;

            const encodedHtml = wrapper.dataset.originalHtml;
            const keywordId = wrapper.dataset.keywordId;
            const ownerPopover = els.keywordPopover.dataset.owner;

            if (ownerPopover && ownerPopover === keywordId) {
              closeKeywordPopover();
            }

            if (wrapper.dataset.crossBlock === '1') {
              const hostBlock = wrapper.closest(BLOCK_SELECTOR) || wrapper.parentElement;
              if (!hostBlock) return;

              const originalBlocks = JSON.parse(decodeURIComponent(wrapper.dataset.originalBlocks || '[]'));
              if (Array.isArray(originalBlocks) && originalBlocks.length) {
                const replacement = document.createDocumentFragment();
                originalBlocks.forEach(html => replacement.appendChild(htmlToFragment(html)));
                hostBlock.replaceWith(replacement);
              } else {
                const frag = htmlToFragment(decodeURIComponent(encodedHtml || ''));
                wrapper.replaceWith(frag);
              }
            } else {
              const frag = htmlToFragment(decodeURIComponent(encodedHtml || ''));
              wrapper.replaceWith(frag);
            }

            handledKeyword = true;
          } catch { }
        });

        if (handledKeyword) {
          saveDraft();
          return;
        }

        const extracted = range.extractContents();
        const sanitized = sanitizeClearedFragment(extracted);
        range.insertNode(sanitized);
      }


      function getSelectionInfo() { const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null; const range = sel.getRangeAt(0); const text = sel.toString(); let blockId = null, blockText = null, startOffset = null; let node = range.commonAncestorContainer; if (node.nodeType === Node.TEXT_NODE) node = node.parentElement; const blockEl = node.closest?.('[data-block-id]') || node.closest?.('p, h1, h2, h3, li, blockquote, pre') || null; if (blockEl) { blockId = blockEl.dataset.blockId || null; blockText = blockEl.textContent || ''; const idx = blockText.indexOf(text); startOffset = idx !== -1 ? idx : range.startOffset; } if (!blockId) blockId = 'unknown'; return { text, blockId, blockText, startOffset }; }

      // 実際の装飾適用はここに集約し、Undo と操作ログの整合を保つ。
      function applyCurrentActionToSelection() {
        if (!state.currentAction) return;
        const selection = getSelectionInfo();
        if (!selection) return;
        pushUndo();
        switch (state.currentAction) {
          case 'keyword': applyKeyword(els.lessonContainer, state.currentOptions.keywordText); addLog({ action: 'keyword', keyword: state.currentOptions.keywordText || '▽', time: nowIso(), selection }); break;
          case 'color-blue': applyColor(els.lessonContainer, '#0000cd'); addLog({ action: 'color', color: 'blue', time: nowIso(), selection }); break;
          case 'color-red': applyColor(els.lessonContainer, '#ff6347'); addLog({ action: 'color', color: 'red', time: nowIso(), selection }); break;
          case 'marker-yellow': applyMarker(els.lessonContainer, '#ffff00'); addLog({ action: 'marker', color: 'yellow', time: nowIso(), selection }); break;
          case 'marker-green': applyMarker(els.lessonContainer, '#7fff00'); addLog({ action: 'marker', color: 'green', time: nowIso(), selection }); break;
          case 'marker-pink': applyMarker(els.lessonContainer, '#ffc0cb'); addLog({ action: 'marker', color: 'pink', time: nowIso(), selection }); break;
          case 'strong': applyEmphasis(els.lessonContainer, 'strong'); addLog({ action: 'emphasis', type: 'bold', time: nowIso(), selection }); break;
          case 'underline': applyEmphasis(els.lessonContainer, 'underline'); addLog({ action: 'emphasis', type: 'underline', time: nowIso(), selection }); break;
          case 'size-small': applyFontSize(els.lessonContainer, '12px'); addLog({ action: 'font-size', size: 'small', time: nowIso(), selection }); break;
          case 'size-large': applyFontSize(els.lessonContainer, '24px'); addLog({ action: 'font-size', size: 'large', time: nowIso(), selection }); break;
          case 'popup': applyPopup(els.lessonContainer, state.currentOptions.popupText); addLog({ action: 'popup', text: state.currentOptions.popupText, time: nowIso(), selection }); break;
          case 'clear-style': clearSelectionStyle(els.lessonContainer); addLog({ action: 'clear-style', time: nowIso(), selection }); break;
        }
        recordEvent('editor_action_apply', { action: state.currentAction, selection });
        els.hint.textContent = '同じ機能を他の箇所にも適用できます。終了する場合は ESC を押してください。';
        saveDraft();
      }

      function clearCurrentAction() { state.currentAction = null; state.currentOptions = {}; state.activeActionId = null; syncActiveButtons(); hideMobileSelectionBar(); els.hint.textContent = 'ツールを選択してから、本文中の語句をドラッグしてください。'; }
      function handleToolbarAction(action, options) {
        const { keywordText, popupText } = options; if (action === 'popup' && !popupText) { els.hint.textContent = 'ポップアップの文言を入力してからボタンを押してください。'; return; } state.currentAction = action; state.currentOptions = { keywordText, popupText }; state.activeActionId = action; syncActiveButtons(); const hints = { keyword: '【非表示・キーワード化】キーワード化したい語句をドラッグして選択してください。', 'color-blue': '【文字色：青】色を付けたい語句をドラッグしてください。', 'color-red': '【文字色：赤】色を付けたい語句をドラッグしてください。', 'marker-yellow': '【マーカー：黄】ハイライトしたい語句をドラッグしてください。', 'marker-green': '【マーカー：緑】ハイライトしたい語句をドラッグしてください。', 'marker-pink': '【マーカー：ピンク】ハイライトしたい語句をドラッグしてください。', strong: '【強調（太字）】強調したい語句をドラッグしてください。', underline: '【下線】下線を付けたい語句をドラッグしてください。', 'size-small': '【小さい文字】サイズを小さくしたい語句をドラッグしてください。', 'size-large': '【大きい文字】サイズを大きくしたい語句をドラッグしてください。', popup: '【ポップアップ】補足を付けたい語句をドラッグしてください。', 'clear-style': '【装飾解除】元に戻したい部分の語句をドラッグしてください。' };
        els.hint.textContent = hints[action] || 'まずツールバーのボタンを押してから、編集したい語句をドラッグしてください。';
        if (isTouchMode()) { const sel = getLessonSelection(); if (sel) handleTouchSelectionChange(); else hideMobileSelectionBar(); }
      }

      // タッチ端末では選択が不安定になりやすいため、直前の Range を退避して再適用できるようにする。
      function getLessonSelection() { const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null; const range = sel.getRangeAt(0); return els.lessonContainer.contains(range.commonAncestorContainer) ? sel : null; }
      function getSelectionKey(sel) { if (!sel || sel.rangeCount === 0) return ''; const range = sel.getRangeAt(0); return [sel.toString(), range.startOffset, range.endOffset, range.startContainer?.nodeType, range.endContainer?.nodeType].join('|'); }
      function captureTouchRange(sel) { if (!sel || sel.rangeCount === 0) { state.lastTouchRange = null; return; } try { state.lastTouchRange = sel.getRangeAt(0).cloneRange(); } catch { state.lastTouchRange = null; } }
      function restoreTouchRange() { if (!state.lastTouchRange) return false; try { const sel = window.getSelection(); if (!sel) return false; sel.removeAllRanges(); sel.addRange(state.lastTouchRange); return true; } catch { return false; } }
      function clearTouchApplyTimer() { if (state.touchApplyTimer) { clearTimeout(state.touchApplyTimer); state.touchApplyTimer = null; } }
      function lockTouchSelectionUi(ms = 420) { state.touchSelectionUiLock = true; clearTimeout(state.touchSelectionUiLockTimer); state.touchSelectionUiLockTimer = setTimeout(() => state.touchSelectionUiLock = false, ms); }
      function hideMobileSelectionBar(preserveRange = false) { clearTouchApplyTimer(); els.mobileSelectionBar.hidden = true; els.mobileSelectionBar.classList.remove('is-auto', 'is-confirm'); if (!preserveRange) { state.lastTouchSelectionKey = ''; state.lastTouchRange = null; } }
      function showMobileSelectionBar(mode = 'confirm') { const labelMap = { keyword: '非表示・キーワード化', popup: 'ポップアップ追加', 'color-blue': '文字色：青', 'color-red': '文字色：赤', 'marker-yellow': 'マーカー：黄', 'marker-green': 'マーカー：緑', 'marker-pink': 'マーカー：ピンク', strong: '強調：太字', underline: '強調：下線', 'size-small': '文字サイズ：小', 'size-large': '文字サイズ：大', 'clear-style': '装飾解除' }; const actionLabel = labelMap[state.currentAction] || '選択中の機能'; els.mobileSelectionBar.hidden = false; els.mobileSelectionBar.classList.toggle('is-auto', mode === 'auto'); els.mobileSelectionBar.classList.toggle('is-confirm', mode !== 'auto'); els.mobileSelectionLabel.textContent = mode === 'auto' ? `${actionLabel} を自動で適用します…` : `${actionLabel} を選択範囲に適用できます`; els.mobileSelectionApplyBtn.textContent = mode === 'auto' ? '今すぐ適用' : '適用'; }
      function applyTouchSelection(force = false) { clearTouchApplyTimer(); let activeSel = getLessonSelection(); if (!activeSel) { const restored = restoreTouchRange(); if (!restored && !force) return false; activeSel = getLessonSelection(); } if (!activeSel && !force) return false; applyCurrentActionToSelection(); window.getSelection()?.removeAllRanges(); hideMobileSelectionBar(); return true; }
      function scheduleTouchAutoApply(sel) { clearTouchApplyTimer(); const selectionKey = getSelectionKey(sel); state.lastTouchSelectionKey = selectionKey; captureTouchRange(sel); showMobileSelectionBar('auto'); state.touchApplyTimer = setTimeout(() => { const currentSel = getLessonSelection(); const currentKey = currentSel ? getSelectionKey(currentSel) : state.lastTouchSelectionKey; if (currentKey !== selectionKey) return; applyTouchSelection(true); }, 650); }
      function handleTouchSelectionChange() { if (!isTouchMode()) return; if (state.touchSelectionUiLock) return; if (!state.currentAction) { hideMobileSelectionBar(); return; } const sel = getLessonSelection(); if (!sel) { if (!els.mobileSelectionBar.hidden && state.lastTouchRange) return; hideMobileSelectionBar(); return; } captureTouchRange(sel); state.lastTouchSelectionKey = getSelectionKey(sel); if (TOUCH_AUTO_ACTIONS.has(state.currentAction)) scheduleTouchAutoApply(sel); }

      function renderMoveControls(kind, id) { return `<span class="mobile-sort-controls"><button type="button" class="mobile-sort-btn" data-mobile-move-kind="${kind}" data-mobile-move-id="${id}" data-mobile-move-delta="-1">↑</button><button type="button" class="mobile-sort-btn" data-mobile-move-kind="${kind}" data-mobile-move-id="${id}" data-mobile-move-delta="1">↓</button></span>`; }
      function renderActionButton(action, groupId) { const activeClass = state.activeActionId === action.id ? ' is-active' : ''; return `<button type="button" class="tool-btn tool-btn--${action.tone || 'dark'}${activeClass}" data-action-id="${action.id}" data-group-id="${groupId}"><span class="tool-btn__drag" draggable="true" data-drag-handle="action" data-action-id="${action.id}" data-group-id="${groupId}">⋮⋮</span><span class="tool-btn__label">${action.label}</span><span class="tool-btn__hint">${action.hint || ''}</span>${state.sortMode && isMobileLayout() ? `<span class="tool-btn__sort">${renderMoveControls('action', action.id)}</span>` : ''}</button>`; }
      function renderGroup(group) { const items = (state.prefs.itemOrder[group.id] || []).map(id => ACTION_MAP.get(id)).filter(Boolean); const inputs = group.id === 'conceal' ? `<div class="tool-group__inputs"><label class="toolbar-field"><span class="toolbar-field__label">キーワード <small>空なら非表示</small></span><input id="keywordText" class="toolbar-input" type="text" placeholder="例：▽ / キーワードを入力"></label><label class="toolbar-field"><span class="toolbar-field__label">ポップアップテキスト</span><input id="popupText" class="toolbar-input" type="text" placeholder="例：補足説明・語句の意味を入力"></label><label class="toolbar-field"><span class="toolbar-field__label">画像追加 <small>貼付/ドラッグも可</small></span><input id="imageInput" class="toolbar-input" type="file" accept="image/*"></label></div>` : ''; return `<section class="tool-group${items.length ? '' : ' is-empty'}" data-group-id="${group.id}" id="tool-group-${group.id}"><div class="tool-group__head"><div class="tool-group__head-main"><div class="tool-group__title-row"><div class="tool-group__title">${group.title}</div><div class="tool-group__meta">${group.meta}</div></div><div class="tool-group__subtitle">${group.subtitle}</div></div><div class="tool-group__head-actions">${state.sortMode && isMobileLayout() ? renderMoveControls('group', group.id) : ''}<span class="tool-group__drag" draggable="true" data-drag-handle="group" data-group-id="${group.id}">⋮⋮</span></div></div><div class="tool-group__body">${inputs}<div class="tool-group__buttons" data-group-id="${group.id}">${items.map(action => renderActionButton(action, group.id)).join('')}</div><div class="tool-group__empty">ここにボタンをドラッグ</div></div></section>`; }
      function syncPrefsButton() { els.toolbarPrefsBtn.classList.toggle('is-open', state.sortMode); els.toolbarPrefsBtn.setAttribute('aria-expanded', String(state.sortMode)); const stateBadge = els.toolbarPrefsBtn.querySelector('.toolbar-toggle-btn__state'); if (stateBadge) stateBadge.textContent = state.sortMode ? 'ON' : 'OFF'; }
      function syncActiveButtons() { document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.actionId === state.activeActionId)); }
      function getScrollBox() { return els.toolbar.querySelector('.tool-groups'); }
      function rememberScroll() { const scrollBox = getScrollBox(); if (scrollBox) state.lastScrollTop = scrollBox.scrollTop; }
      function restoreScroll() { const scrollBox = getScrollBox(); if (!scrollBox) return; const maxTop = Math.max(0, scrollBox.scrollHeight - scrollBox.clientHeight); scrollBox.scrollTop = Math.min(state.lastScrollTop, maxTop); }
      function captureDraftInputs() { state.keywordDraft = els.toolbar.querySelector('#keywordText')?.value ?? state.keywordDraft; state.popupDraft = els.toolbar.querySelector('#popupText')?.value ?? state.popupDraft; }
      function clearDropState() { els.toolbar.querySelectorAll('.is-drop-target, .is-dragging').forEach(node => node.classList.remove('is-drop-target', 'is-dragging')); }

      function triggerAction(actionId) { const keywordText = els.toolbar.querySelector('#keywordText')?.value?.trim() || ''; const popupText = els.toolbar.querySelector('#popupText')?.value?.trim() || ''; if (shouldUseProtectedEditMode() && state.mobileTextEditMode) { state.mobileTextEditMode = false; syncEditorInteractionMode(); showToast('加工モードに戻りました。'); } handleToolbarAction(actionId, { keywordText, popupText }); captureDraftInputs(); if (isMobileLayout()) closeMobilePanel(); }
      function moveGroupByDelta(groupId, delta) { const idx = state.prefs.groupOrder.indexOf(groupId); state.prefs = normalizePrefs({ ...state.prefs, groupOrder: moveItemInArray(state.prefs.groupOrder, idx, delta) }); savePrefs(state.prefs); }
      function moveActionByDelta(actionId, delta) { const action = ACTION_MAP.get(actionId); if (!action) return; const list = state.prefs.itemOrder[action.groupId] || []; const idx = list.indexOf(actionId); state.prefs = normalizePrefs({ ...state.prefs, itemOrder: { ...state.prefs.itemOrder, [action.groupId]: moveItemInArray(list, idx, delta) } }); savePrefs(state.prefs); }

      function syncMobileShell() {
        const mobile = isMobileLayout();
        const editorView = state.currentView === 'editor';
        const canShowMobileTools = mobile && editorView;
        if (!canShowMobileTools) {
          state.mobileOpen = false;
          hideMobileSelectionBar(true);
        }
        document.body.classList.toggle('mobile-tools-open', canShowMobileTools && state.mobileOpen);
        els.mobileToolBackdrop.hidden = !(canShowMobileTools && state.mobileOpen);
        if (els.mobileToolNav) els.mobileToolNav.hidden = !canShowMobileTools;
        document.querySelectorAll('[data-mobile-tool]').forEach(button => {
          const key = button.dataset.mobileTool;
          button.classList.toggle('is-active', canShowMobileTools && state.mobileOpen && (key === state.activeMobileTool || (key === 'all' && state.activeMobileTool === 'all')));
        });
      }
      function closeMobilePanel() { state.mobileOpen = false; syncMobileShell(); }
      function openMobilePanel(groupId = 'all') { if (!isMobileLayout()) return; state.activeMobileTool = groupId; state.mobileOpen = true; syncMobileShell(); requestAnimationFrame(() => { const scrollBox = getScrollBox(); if (!scrollBox) return; if (groupId === 'all') { scrollBox.scrollTop = 0; return; } const target = els.toolbar.querySelector(`#tool-group-${groupId}`); if (!target) return; scrollBox.scrollTop = Math.max(0, target.offsetTop - 8); }); }
      function syncMobileNavShell() {
        const mobile = isMobileLayout();
        const open = mobile && state.mobileNavOpen;
        els.mobileNavOpenBtn?.setAttribute('aria-expanded', String(open));

        if (!mobile) {
          clearTimeout(mobileNavCloseTimer);
          els.mobileNavDialog.classList.remove('is-open', 'is-closing');
          if (els.mobileNavDialog.open) els.mobileNavDialog.close();
          document.body.classList.remove('mobile-nav-open');
          return;
        }

        document.body.classList.toggle('mobile-nav-open', open);
      }

      function openMobileNav() {
        if (!isMobileLayout()) return;

        clearTimeout(mobileNavCloseTimer);
        state.mobileNavOpen = true;
        syncMobileNavShell();

        if (!els.mobileNavDialog.open) {
          els.mobileNavDialog.showModal();
        }

        els.mobileNavDialog.classList.remove('is-closing');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            els.mobileNavDialog.classList.add('is-open');
          });
        });
      }

      function closeMobileNav() {
        clearTimeout(mobileNavCloseTimer);
        state.mobileNavOpen = false;
        syncMobileNavShell();

        if (!els.mobileNavDialog.open) return;

        els.mobileNavDialog.classList.remove('is-open');
        els.mobileNavDialog.classList.add('is-closing');

        mobileNavCloseTimer = setTimeout(() => {
          els.mobileNavDialog.classList.remove('is-closing');
          if (els.mobileNavDialog.open) els.mobileNavDialog.close();
        }, 320);
      }

      function renderToolbar() {
        syncPrefsButton();
        els.toolbar.classList.toggle('is-sort-mode', state.sortMode);
        els.toolbar.innerHTML = `${state.sortMode ? `<div class="toolbar-sort-banner"><div><div class="toolbar-sort-banner__title">並べ替えモード</div><div class="toolbar-sort-banner__meta">PCはドラッグ、スマホは↑↓で順番を変えられます。</div></div><button type="button" id="tbResetLayout" class="toolbar-reset-btn">初期配置に戻す</button></div>` : ''}<div class="tool-groups">${state.prefs.groupOrder.map(groupId => renderGroup(GROUP_MAP.get(groupId))).join('')}</div>`;
        const keywordInput = els.toolbar.querySelector('#keywordText'); if (keywordInput) keywordInput.value = state.keywordDraft;
        const popupInput = els.toolbar.querySelector('#popupText'); if (popupInput) popupInput.value = state.popupDraft;
        restoreScroll();
        els.toolbar.querySelectorAll('.tool-btn').forEach(button => button.addEventListener('click', event => { if (state.sortMode) { if (event.target.closest('[data-mobile-move-kind]')) return; return; } triggerAction(button.dataset.actionId); }));
        els.toolbar.querySelectorAll('[data-mobile-move-kind]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); rememberScroll(); const kind = button.dataset.mobileMoveKind; const id = button.dataset.mobileMoveId; const delta = Number(button.dataset.mobileMoveDelta || 0); if (kind === 'group') moveGroupByDelta(id, delta); if (kind === 'action') moveActionByDelta(id, delta); renderToolbar(); }));
        els.toolbar.querySelector('#tbResetLayout')?.addEventListener('click', () => { state.prefs = clone(DEFAULT_PREFS); savePrefs(state.prefs); state.lastScrollTop = 0; renderToolbar(); });
        els.toolbar.querySelector('#imageInput')?.addEventListener('change', handleImagePicker);
        const scrollBox = getScrollBox(); scrollBox?.addEventListener('scroll', () => state.lastScrollTop = scrollBox.scrollTop, { passive: true });
        wireDragHandlers(); syncMobileShell(); syncMobileNavShell(); syncActiveButtons();
      }

      function wireDragHandlers() {
        if (isMobileLayout() || isTouchMode()) return;
        els.toolbar.querySelectorAll('[data-drag-handle="group"]').forEach(handle => {
          handle.addEventListener('dragstart', event => { if (!state.sortMode) { event.preventDefault(); return; } const groupId = handle.dataset.groupId; state.dragState = { type: 'group', groupId }; event.dataTransfer.effectAllowed = 'move'; requestAnimationFrame(() => handle.closest('.tool-group')?.classList.add('is-dragging')); });
          handle.addEventListener('dragend', () => { state.dragState = null; clearDropState(); });
        });
        els.toolbar.querySelectorAll('[data-drag-handle="action"]').forEach(handle => {
          handle.addEventListener('dragstart', event => { if (!state.sortMode) { event.preventDefault(); return; } const actionId = handle.dataset.actionId; const fromGroupId = handle.dataset.groupId; state.dragState = { type: 'action', actionId, fromGroupId }; event.dataTransfer.effectAllowed = 'move'; requestAnimationFrame(() => handle.closest('.tool-btn')?.classList.add('is-dragging')); });
          handle.addEventListener('dragend', () => { state.dragState = null; clearDropState(); });
        });
        els.toolbar.querySelectorAll('.tool-group, .tool-group__buttons, .tool-btn').forEach(node => {
          node.addEventListener('dragover', event => { if (!state.sortMode || !state.dragState) return; const targetGroup = event.target.closest('.tool-group'); if (!targetGroup) return; event.preventDefault(); clearDropState(); targetGroup.classList.add('is-drop-target'); if (state.dragState.type === 'action') event.target.closest('.tool-btn')?.classList.add('is-drop-target'); });
          node.addEventListener('drop', event => {
            if (!state.sortMode || !state.dragState) return; const targetGroup = event.target.closest('.tool-group'); if (!targetGroup) return; event.preventDefault(); rememberScroll();
            if (state.dragState.type === 'group') { const targetGroupId = targetGroup.dataset.groupId; if (targetGroupId && targetGroupId !== state.dragState.groupId) { const rect = targetGroup.getBoundingClientRect(); const placeBefore = event.clientY < rect.top + rect.height / 2; state.prefs = moveGroup(state.prefs, state.dragState.groupId, targetGroupId, placeBefore); savePrefs(state.prefs); renderToolbar(); } }
            if (state.dragState.type === 'action') { const targetGroupId = targetGroup.dataset.groupId; const targetBtn = event.target.closest('.tool-btn'); const targetActionId = targetBtn?.dataset.actionId || null; let placeBefore = true; if (targetBtn && targetActionId !== state.dragState.actionId) { const rect = targetBtn.getBoundingClientRect(); placeBefore = event.clientY < rect.top + rect.height / 2; } state.prefs = moveAction(state.prefs, state.dragState.actionId, targetGroupId, targetActionId, placeBefore); savePrefs(state.prefs); renderToolbar(); }
          });
        });
      }

      // モバイル選択バーのボタンは、選択解除を防ぐため pointer/mouse/touch をまとめて吸収する。
      function bindTouchSelectionButton(button, handler) { if (!button) return;['pointerdown', 'mousedown', 'touchstart'].forEach(name => button.addEventListener(name, e => { e.preventDefault(); e.stopPropagation(); lockTouchSelectionUi(); }, { passive: false }));['pointerup', 'mouseup', 'touchend'].forEach(name => button.addEventListener(name, e => { e.preventDefault(); e.stopPropagation(); lockTouchSelectionUi(); handler(); }, { passive: false })); }

      // 画像はファイル選択・貼り付け・ドラッグ&ドロップの3経路で本文に挿入できる。
      function handleImagePicker(event) { const file = event.target.files?.[0]; if (!file) return; insertImageFile(file); event.target.value = ''; }
      function createImageAlignControls() {
        const controls = document.createElement('span');
        controls.className = 'image-align-controls';
        controls.setAttribute('aria-label', '画像配置');
        [
          ['left', '左'],
          ['center', '中'],
          ['right', '右']
        ].forEach(([align, label]) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'image-align-btn';
          button.dataset.imageAlign = align;
          button.textContent = label;
          controls.appendChild(button);
        });
        return controls;
      }
      function ensureImageChrome(wrapper) {
        if (!wrapper.querySelector('.image-align-controls')) wrapper.appendChild(createImageAlignControls());
        if (!wrapper.querySelector('.image-resize-handle')) {
          const handle = document.createElement('span');
          handle.className = 'image-resize-handle';
          handle.setAttribute('aria-hidden', 'true');
          wrapper.appendChild(handle);
        }
      }
      function createResizableImage(img) {
        const wrapper = document.createElement('span');
        wrapper.className = 'resizable-image image-align-center';
        wrapper.contentEditable = 'false';
        wrapper.style.width = img.getAttribute('width') ? `${img.getAttribute('width')}px` : (img.style.width || 'min(100%, 420px)');
        wrapper.style.maxWidth = '100%';
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        wrapper.appendChild(img);
        ensureImageChrome(wrapper);
        return wrapper;
      }
      function ensureResizableImages() {
        els.lessonContainer.querySelectorAll('img').forEach(img => {
          const existingWrapper = img.closest('.resizable-image');
          if (existingWrapper) {
            ensureImageChrome(existingWrapper);
            existingWrapper.contentEditable = 'false';
            existingWrapper.style.maxWidth = '100%';
            if (!existingWrapper.classList.contains('image-align-left') && !existingWrapper.classList.contains('image-align-right')) {
              existingWrapper.classList.add('image-align-center');
            }
            return;
          }
          img.replaceWith(createResizableImage(img.cloneNode(true)));
        });
      }
      function setImageAlignment(wrapper, align) {
        if (!wrapper) return;
        pushUndo();
        wrapper.classList.remove('image-align-left', 'image-align-center', 'image-align-right');
        wrapper.classList.add(`image-align-${align}`);
        els.lessonContainer.querySelectorAll('.resizable-image.is-selected').forEach(node => {
          if (node !== wrapper) node.classList.remove('is-selected');
        });
        wrapper.classList.add('is-selected');
        addLog({ action: 'image-align', align, time: nowIso() });
        saveDraft();
      }
      function insertImageFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
          pushUndo();
          const img = document.createElement('img');
          img.src = reader.result;
          img.alt = file.name || 'image';
          insertImageAtCursor(createResizableImage(img));
          addLog({ action: 'image-insert', fileName: file.name || 'image', time: nowIso() });
          showToast('画像を追加しました。');
        };
        reader.readAsDataURL(file);
      }
      function insertImageAtCursor(node) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          els.lessonContainer.appendChild(node);
          saveDraft();
          return;
        }
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
        range.setStartAfter(node);
        range.setEndAfter(node);
        sel.removeAllRanges();
        sel.addRange(range);
        saveDraft();
      }
      function startImageResize(event) {
        const handle = event.target.closest('.image-resize-handle');
        if (!handle) return;
        const wrapper = handle.closest('.resizable-image');
        if (!wrapper) return;
        event.preventDefault();
        event.stopPropagation();
        pushUndo();
        const rect = wrapper.getBoundingClientRect();
        const containerRect = els.lessonContainer.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = rect.width;
        const startHeight = rect.height;
        const aspect = startWidth / Math.max(1, startHeight);
        const maxWidth = Math.max(120, containerRect.width - 40);
        function onMove(moveEvent) {
          const delta = Math.max(moveEvent.clientX - startX, (moveEvent.clientY - startY) * aspect);
          const nextWidth = Math.min(maxWidth, Math.max(80, startWidth + delta));
          const nextHeight = Math.max(60, nextWidth / aspect);
          wrapper.style.width = `${Math.round(nextWidth)}px`;
          wrapper.style.height = `${Math.round(nextHeight)}px`;
        }
        function onUp() {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          addLog({ action: 'image-resize', width: wrapper.style.width, height: wrapper.style.height, time: nowIso() });
          saveDraft();
        }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp, { once: true });
      }

      // 画面全体のイベント登録をここに集め、起動順を追いやすくしている。
      function bindEvents() {
        renderLessonSelect();
        renderToolbar();
        bindTouchSelectionButton(els.mobileSelectionApplyBtn, () => applyTouchSelection(true));
        bindTouchSelectionButton(els.mobileSelectionCancelBtn, () => { window.getSelection()?.removeAllRanges(); hideMobileSelectionBar(); });

        document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
        document.querySelectorAll('[data-mobile-tool]').forEach(button => button.addEventListener('click', () => { const key = button.dataset.mobileTool || 'all'; if (state.mobileOpen && state.activeMobileTool === key) closeMobilePanel(); else openMobilePanel(key); }));
        els.mobileToolBackdrop.addEventListener('click', closeMobilePanel); els.mobileToolCloseBtn.addEventListener('click', closeMobilePanel);
        els.mobileNavOpenBtn.addEventListener('click', () => state.mobileNavOpen ? closeMobileNav() : openMobileNav());
        els.mobileNavCloseBtn.addEventListener('click', closeMobileNav);

        els.mobileNavDrawer.addEventListener('click', e => {
          e.stopPropagation();
        });

        els.mobileNavDialog.addEventListener('click', () => {
          closeMobileNav();
        });

        els.mobileNavDialog.addEventListener('cancel', e => {
          e.preventDefault();
          closeMobileNav();
        });

        els.mobileNavDialog.addEventListener('close', () => {
          els.mobileNavDialog.classList.remove('is-open', 'is-closing');
          if (state.mobileNavOpen) {
            state.mobileNavOpen = false;
            syncMobileNavShell();
          }
        });
        els.courseSelect?.addEventListener('change', handleEditorCourseChange);
        els.loadBtn.addEventListener('click', () => loadLessonById(els.lessonSelect.value));
        els.saveBtn.addEventListener('click', saveCurrentMaterial);
        els.savedSearchInput.addEventListener('input', renderSavedList); els.savedSortSelect.addEventListener('change', renderSavedList);
        els.savedList.addEventListener('click', event => { const btn = event.target.closest('[data-saved-action]'); if (!btn) return; const id = btn.dataset.id; const action = btn.dataset.savedAction; if (action === 'open') openSavedItem(id); if (action === 'delete') deleteSavedItem(id); if (action === 'export') exportSavedItem(id); if (action === 'preview') previewSavedItem(id); });
        els.lessonContainer.addEventListener('click', e => {
          const btn = e.target.closest('.keyword-toggle');
          if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const wrapper = btn.closest('.keyword-wrapper');
            if (!wrapper) return;
            const isSame = els.keywordPopover.dataset.owner && els.keywordPopover.dataset.owner === (wrapper.dataset.keywordId || '');
            if (!els.keywordPopover.hidden && isSame) {
              closeKeywordPopover();
            } else {
              openKeywordPopover(wrapper);
            }
            saveDraft();
            return;
          }

          if (!isContainedIn(e.target, els.keywordPopover)) {
            closeKeywordPopover();
          }
        });
        els.lessonContainer.addEventListener('mouseup', e => { if (isTouchMode()) return; if (e.target.closest('.keyword-toggle')) return; if (!state.currentAction) return; const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return; applyCurrentActionToSelection(); sel.removeAllRanges(); });
        els.lessonContainer.addEventListener('beforeinput', e => { if (e.inputType === 'historyUndo') { e.preventDefault(); if (state.__historyHotkeyLock) return; undo(); } if (e.inputType === 'historyRedo') { e.preventDefault(); if (state.__historyHotkeyLock) return; redo(); } }, { capture: true });
        els.lessonContainer.addEventListener('input', () => { state.draftChangedAt = nowIso(); saveDraft(); markStudentAutoSaveDirty(); });
        els.lessonContainer.addEventListener('paste', e => { const items = e.clipboardData?.items || []; for (const item of items) { if (item.type.startsWith('image/')) { e.preventDefault(); const file = item.getAsFile(); if (file) insertImageFile(file); return; } } });
        els.lessonContainer.addEventListener('dragover', e => e.preventDefault());
        els.lessonContainer.addEventListener('drop', e => { e.preventDefault(); const files = Array.from(e.dataTransfer?.files || []); files.filter(file => file.type.startsWith('image/')).forEach(insertImageFile); });
        document.addEventListener('selectionchange', () => { if (!isTouchMode()) return; handleTouchSelectionChange(); });
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape') { closePreview(); clearCurrentAction(); closeMobilePanel(); closeMobileNav(); return; }
          const ae = document.activeElement; const inEditor = (ae === els.lessonContainer) || els.lessonContainer.contains(ae);
          if (!inEditor) return; const isCtrl = e.ctrlKey || e.metaKey; if (!isCtrl || e.repeat) return;
          if (!e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); lockHistoryHotkey(); undo(); queueMicrotask(() => { state.__historyHotkeyLock = false; }); return; }
          if ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y') { e.preventDefault(); lockHistoryHotkey(); redo(); queueMicrotask(() => { state.__historyHotkeyLock = false; }); return; }
        });
        window.addEventListener('resize', () => { if (!isMobileLayout()) { state.mobileOpen = false; state.mobileNavOpen = false; } syncMobileShell(); syncMobileNavShell(); if (!els.keywordPopover.hidden) { const owner = els.keywordPopover.dataset.owner; const wrapper = owner ? els.lessonContainer.querySelector(`.keyword-wrapper[data-keyword-id="${owner}"]`) : null; if (wrapper) openKeywordPopover(wrapper); else closeKeywordPopover(); } });
        document.addEventListener('scroll', () => {
          if (els.keywordPopover.hidden) return;
          const owner = els.keywordPopover.dataset.owner;
          const wrapper = owner ? els.lessonContainer.querySelector(`.keyword-wrapper[data-keyword-id="${owner}"]`) : null;
          if (wrapper) openKeywordPopover(wrapper);
          else closeKeywordPopover();
        }, true);
        els.toolbarPrefsBtn.addEventListener('click', () => { captureDraftInputs(); state.sortMode = !state.sortMode; state.sortSelection = null; renderToolbar(); });
        els.importJsonBtn.addEventListener('click', () => els.importJsonInput.click());
        els.importJsonInput.addEventListener('change', async event => { const file = event.target.files?.[0]; if (!file) return; try { const text = await file.text(); const parsed = JSON.parse(text); const items = loadSaves(); const incoming = Array.isArray(parsed) ? parsed : Array.isArray(parsed.saves) ? parsed.saves : [parsed]; const normalized = incoming.map(item => ({ id: item.id || `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, baseLessonId: item.baseLessonId || item.base_lesson_id || SAMPLE_LESSONS[0].id, title: item.title || '取り込み教材', htmlContent: item.htmlContent || item.html_content || '', log: Array.isArray(item.log) ? item.log : [], createdAt: item.createdAt || item.created_at || nowIso(), updatedAt: item.updatedAt || item.updated_at || nowIso() })); saveSaves([...normalized, ...items]); renderSavedList(); showToast('JSON を取り込みました。'); } catch { showToast('JSON の取り込みに失敗しました。', 'error'); } finally { event.target.value = ''; } });
        els.exportAllBtn.addEventListener('click', exportAll); els.mobileExportBtn.addEventListener('click', () => { exportAll(); closeMobileNav(); }); els.resetDemoBtn.addEventListener('click', resetDemo);
        els.closePreviewBtn.addEventListener('click', closePreview); els.previewDialogBackdrop.addEventListener('click', e => { if (e.target === els.previewDialogBackdrop) closePreview(); });
      }

      // 起動時は下書き復元を優先し、なければサンプル教材を初期表示する。
      function initFromDraft() {
        const draft = loadDraft();
        if (draft?.html) {
          state.currentLessonId = draft.currentLessonId || SAMPLE_LESSONS[0].id;
          state.baseLessonId = draft.baseLessonId || draft.currentLessonId || SAMPLE_LESSONS[0].id;
          state.currentSavedId = draft.currentSavedId || null;
          state.log = Array.isArray(draft.log) ? draft.log : [];
          renderLessonSelect();
          els.lessonSelect.value = state.baseLessonId;
          els.lessonContainer.innerHTML = draft.html;
          ensureResizableImages();
          els.titleDisplay.textContent = draft.title || findLessonTitle(state.baseLessonId);
          state.undoStack = [snapshot()]; state.redoStack = [];
          syncEditorStatusTag();
          showToast('前回のローカル状態を復元しました。');
        } else {
          renderLessonSelect();
          loadLessonById(SAMPLE_LESSONS[0].id, { silent: true });
        }
      }

      const CLEAN_ACTION_HINTS = {
        keyword: '【非表示・キーワード化】キーワード化したい語句をドラッグして選択してください。',
        'color-blue': '【文字色: 青】色を付けたい語句をドラッグして選択してください。',
        'color-red': '【文字色: 赤】色を付けたい語句をドラッグして選択してください。',
        'marker-yellow': '【マーカー: 黄】強調したい語句をドラッグして選択してください。',
        'marker-green': '【マーカー: 緑】強調したい語句をドラッグして選択してください。',
        'marker-pink': '【マーカー: ピンク】強調したい語句をドラッグして選択してください。',
        strong: '【強調: 太字】強調したい語句をドラッグして選択してください。',
        underline: '【強調: 下線】下線を引きたい語句をドラッグして選択してください。',
        'size-small': '【文字サイズ: 小】小さくしたい語句をドラッグして選択してください。',
        'size-large': '【文字サイズ: 大】大きくしたい語句をドラッグして選択してください。',
        popup: '【ポップアップ】補足を付けたい語句をドラッグして選択してください。',
        'clear-style': '【装飾解除】元に戻したい語句をドラッグして選択してください。'
      };

      const CLEAN_MOBILE_ACTION_LABELS = {
        keyword: '非表示・キーワード化',
        popup: 'ポップアップ追加',
        'color-blue': '文字色: 青',
        'color-red': '文字色: 赤',
        'marker-yellow': 'マーカー: 黄',
        'marker-green': 'マーカー: 緑',
        'marker-pink': 'マーカー: ピンク',
        strong: '強調: 太字',
        underline: '強調: 下線',
        'size-small': '文字サイズ: 小',
        'size-large': '文字サイズ: 大',
        'clear-style': '装飾解除'
      };

      function clearCurrentAction() {
        state.currentAction = null;
        state.currentOptions = {};
        state.activeActionId = null;
        syncActiveButtons();
        hideMobileSelectionBar();
        els.hint.textContent = 'ツールを選択してから、本文中の語句をドラッグして選択してください。';
      }

      function handleToolbarAction(action, options) {
        const { keywordText, popupText } = options;
        if (action === 'popup' && !popupText) {
          els.hint.textContent = 'ポップアップの文言を入力してからボタンを押してください。';
          return;
        }

        state.currentAction = action;
        state.currentOptions = { keywordText, popupText };
        state.activeActionId = action;
        syncActiveButtons();
        els.hint.textContent = CLEAN_ACTION_HINTS[action] || 'まずツールボタンを押してから、編集したい語句をドラッグして選択してください。';

        if (isTouchMode()) {
          const sel = getLessonSelection();
          if (sel) handleTouchSelectionChange();
          else hideMobileSelectionBar();
        }
      }

      function showMobileSelectionBar(mode = 'confirm') {
        const actionLabel = CLEAN_MOBILE_ACTION_LABELS[state.currentAction] || '選択中の機能';
        els.mobileSelectionBar.hidden = false;
        els.mobileSelectionBar.classList.toggle('is-auto', mode === 'auto');
        els.mobileSelectionBar.classList.toggle('is-confirm', mode !== 'auto');
        els.mobileSelectionLabel.textContent = mode === 'auto'
          ? `${actionLabel} を自動で適用します…`
          : `${actionLabel} を選択範囲に適用できます`;
        els.mobileSelectionApplyBtn.textContent = mode === 'auto' ? '今すぐ適用' : '適用';
      }

      function applyCurrentActionToSelection() {
        if (!state.currentAction) return;

        const selection = getSelectionInfo();
        if (!selection) return;

        pushUndo();
        switch (state.currentAction) {
          case 'keyword': applyKeyword(els.lessonContainer, state.currentOptions.keywordText); addLog({ action: 'keyword', keyword: state.currentOptions.keywordText || '▽', time: nowIso(), selection }); break;
          case 'color-blue': applyColor(els.lessonContainer, '#0000cd'); addLog({ action: 'color', color: 'blue', time: nowIso(), selection }); break;
          case 'color-red': applyColor(els.lessonContainer, '#ff6347'); addLog({ action: 'color', color: 'red', time: nowIso(), selection }); break;
          case 'marker-yellow': applyMarker(els.lessonContainer, '#ffff00'); addLog({ action: 'marker', color: 'yellow', time: nowIso(), selection }); break;
          case 'marker-green': applyMarker(els.lessonContainer, '#7fff00'); addLog({ action: 'marker', color: 'green', time: nowIso(), selection }); break;
          case 'marker-pink': applyMarker(els.lessonContainer, '#ffc0cb'); addLog({ action: 'marker', color: 'pink', time: nowIso(), selection }); break;
          case 'strong': applyEmphasis(els.lessonContainer, 'strong'); addLog({ action: 'emphasis', type: 'bold', time: nowIso(), selection }); break;
          case 'underline': applyEmphasis(els.lessonContainer, 'underline'); addLog({ action: 'emphasis', type: 'underline', time: nowIso(), selection }); break;
          case 'size-small': applyFontSize(els.lessonContainer, '12px'); addLog({ action: 'font-size', size: 'small', time: nowIso(), selection }); break;
          case 'size-large': applyFontSize(els.lessonContainer, '24px'); addLog({ action: 'font-size', size: 'large', time: nowIso(), selection }); break;
          case 'popup': applyPopup(els.lessonContainer, state.currentOptions.popupText); addLog({ action: 'popup', text: state.currentOptions.popupText, time: nowIso(), selection }); break;
          case 'clear-style': clearSelectionStyle(els.lessonContainer); addLog({ action: 'clear-style', time: nowIso(), selection }); break;
        }

        els.hint.textContent = '同じ機能を別の箇所にも適用できます。終了するときは ESC を押してください。';
        saveDraft();
      }

      function renderMoveControls(kind, id) {
        return `<span class="mobile-sort-controls"><button type="button" class="mobile-sort-btn" data-mobile-move-kind="${kind}" data-mobile-move-id="${id}" data-mobile-move-delta="-1">↑</button><button type="button" class="mobile-sort-btn" data-mobile-move-kind="${kind}" data-mobile-move-id="${id}" data-mobile-move-delta="1">↓</button></span>`;
      }

      function shouldUseStepSortControls() {
        return isMobileLayout() || isTouchMode();
      }

      function isSortSelected(kind, id) {
        return state.sortSelection?.kind === kind && String(state.sortSelection.id) === String(id);
      }

      function selectSortItem(kind, id) {
        if (!state.sortMode || !shouldUseStepSortControls()) return;
        state.sortSelection = { kind, id };
        renderToolbar();
      }

      function renderActionButton(action, groupId) {
        const activeClass = state.activeActionId === action.id ? ' is-active' : '';
        const selectedClass = isSortSelected('action', action.id) ? ' is-sort-selected' : '';
        const draggable = isTouchMode() ? 'false' : 'true';
        return `<button type="button" class="tool-btn tool-btn--${action.tone || 'dark'}${activeClass}${selectedClass}" data-action-id="${action.id}" data-group-id="${groupId}"><span class="tool-btn__drag" draggable="${draggable}" data-drag-handle="action" data-action-id="${action.id}" data-group-id="${groupId}">⋮⋮</span><span class="tool-btn__label">${action.label}</span><span class="tool-btn__hint">${action.hint || ''}</span></button>`;
      }

      function renderGroup(group) {
        const items = (state.prefs.itemOrder[group.id] || []).map(id => ACTION_MAP.get(id)).filter(Boolean);
        const inputs = group.id === 'conceal'
          ? `<div class="tool-group__inputs"><label class="toolbar-field"><span class="toolbar-field__label">キーワード <small>空なら非表示</small></span><input id="keywordText" class="toolbar-input" type="text" placeholder="例: ▽ / キーワードを入力"></label><label class="toolbar-field"><span class="toolbar-field__label">ポップアップテキスト</span><input id="popupText" class="toolbar-input" type="text" placeholder="例: 補足説明・語句の意味を入力"></label><label class="toolbar-field"><span class="toolbar-field__label">画像追加 <small>貼り付け/ドラッグも可</small></span><input id="imageInput" class="toolbar-input" type="file" accept="image/*"></label></div>`
          : '';

        const selectedClass = isSortSelected('group', group.id) ? ' is-sort-selected' : '';
        const draggable = isTouchMode() ? 'false' : 'true';
        return `<section class="tool-group${items.length ? '' : ' is-empty'}${selectedClass}" data-group-id="${group.id}" id="tool-group-${group.id}"><div class="tool-group__head"><div class="tool-group__head-main"><div class="tool-group__title-row"><div class="tool-group__title">${group.title}</div><div class="tool-group__meta">${group.meta}</div></div><div class="tool-group__subtitle">${group.subtitle}</div></div><div class="tool-group__head-actions"><span class="tool-group__drag" draggable="${draggable}" data-drag-handle="group" data-group-id="${group.id}">⋮⋮</span></div></div><div class="tool-group__body">${inputs}<div class="tool-group__buttons" data-group-id="${group.id}">${items.map(action => renderActionButton(action, group.id)).join('')}</div><div class="tool-group__empty">ここにボタンをドラッグ</div></div></section>`;
      }

      function renderToolbar() {
        syncPrefsButton();
        els.toolbar.classList.toggle('is-sort-mode', state.sortMode);
        els.toolbar.innerHTML = `${state.sortMode ? `<div class="toolbar-sort-banner"><div><div class="toolbar-sort-banner__title">並べ替えモード</div><div class="toolbar-sort-banner__meta">${isTouchMode() ? '把手を長押しして、そのまま移動先へドラッグします。' : 'PC はドラッグで順番を変更できます。'}</div></div><button type="button" id="tbResetLayout" class="toolbar-reset-btn">初期配置に戻す</button></div>` : ''}<div class="tool-groups">${state.prefs.groupOrder.map(groupId => renderGroup(GROUP_MAP.get(groupId))).join('')}</div>`;

        const keywordInput = els.toolbar.querySelector('#keywordText');
        if (keywordInput) keywordInput.value = state.keywordDraft;
        const popupInput = els.toolbar.querySelector('#popupText');
        if (popupInput) popupInput.value = state.popupDraft;

        restoreScroll();
        els.toolbar.querySelectorAll('.tool-group__head').forEach(head => head.addEventListener('click', event => {
          if (state.sortMode) event.preventDefault();
        }));
        els.toolbar.querySelectorAll('.tool-btn').forEach(button => button.addEventListener('click', event => {
          if (state.sortMode) {
            event.preventDefault();
            return;
          }
          triggerAction(button.dataset.actionId);
        }));
        els.toolbar.querySelector('#tbResetLayout')?.addEventListener('click', () => { state.prefs = clone(DEFAULT_PREFS); savePrefs(state.prefs); state.lastScrollTop = 0; renderToolbar(); });
        els.toolbar.querySelector('#imageInput')?.addEventListener('change', handleImagePicker);
        const scrollBox = getScrollBox();
        scrollBox?.addEventListener('scroll', () => state.lastScrollTop = scrollBox.scrollTop, { passive: true });
        wireDragHandlers();
        wireTouchSortHandlers();
        syncMobileShell();
        syncMobileNavShell();
        syncActiveButtons();
      }

      function wireTouchSortHandlers() {
        if (!isTouchMode()) return;
        els.toolbar.querySelectorAll('[data-drag-handle]').forEach(handle => {
          handle.addEventListener('pointerdown', startTouchSortPress, { passive: false });
        });
      }

      function startTouchSortPress(event) {
        if (!state.sortMode || !event.isPrimary) return;
        const handle = event.currentTarget;
        const type = handle.dataset.dragHandle;
        const sourceEl = type === 'group' ? handle.closest('.tool-group') : handle.closest('.tool-btn');
        if (!sourceEl) return;
        event.preventDefault();
        event.stopPropagation();
        handle.setPointerCapture?.(event.pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        const drag = {
          type,
          pointerId: event.pointerId,
          handle,
          sourceEl,
          sourceId: type === 'group' ? handle.dataset.groupId : handle.dataset.actionId,
          pressTimer: null,
          dragging: false,
          ghost: null,
          indicator: null,
          targetGroupId: null,
          targetActionId: null,
          targetEl: null,
          placeBefore: true
        };
        state.touchSortState = drag;
        drag.pressTimer = setTimeout(() => beginTouchSortDrag(startX, startY), 180);

        drag.onMove = moveEvent => {
          if (moveEvent.pointerId !== drag.pointerId) return;
          moveEvent.preventDefault();
          const moved = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
          if (!drag.dragging && moved > 8) beginTouchSortDrag(moveEvent.clientX, moveEvent.clientY);
          if (drag.dragging) updateTouchSortDrag(moveEvent.clientX, moveEvent.clientY);
        };
        drag.onUp = upEvent => {
          if (upEvent.pointerId !== drag.pointerId) return;
          upEvent.preventDefault();
          endTouchSort(drag.dragging);
        };
        drag.onCancel = () => endTouchSort(false);
        window.addEventListener('pointermove', drag.onMove, { passive: false });
        window.addEventListener('pointerup', drag.onUp, { passive: false });
        window.addEventListener('pointercancel', drag.onCancel, { passive: false });
      }

      function beginTouchSortDrag(clientX, clientY) {
        const drag = state.touchSortState;
        if (!drag || drag.dragging) return;
        clearTimeout(drag.pressTimer);
        drag.dragging = true;
        document.body.classList.add('touch-sorting');
        drag.sourceEl.classList.add('is-touch-sort-source');
        drag.ghost = drag.sourceEl.cloneNode(true);
        drag.ghost.classList.add('touch-sort-ghost');
        drag.ghost.style.width = `${Math.round(drag.sourceEl.getBoundingClientRect().width)}px`;
        drag.indicator = document.createElement('div');
        drag.indicator.className = 'touch-sort-indicator';
        drag.indicator.hidden = true;
        document.body.appendChild(drag.ghost);
        document.body.appendChild(drag.indicator);
        updateTouchSortDrag(clientX, clientY);
      }

      function updateTouchSortDrag(clientX, clientY) {
        const drag = state.touchSortState;
        if (!drag?.dragging) return;
        drag.ghost.style.left = `${Math.round(clientX + 12)}px`;
        drag.ghost.style.top = `${Math.round(clientY + 12)}px`;
        if (drag.type === 'group') updateTouchGroupTarget(clientY);
        else updateTouchActionTarget(clientX, clientY);
        positionTouchSortIndicator();
      }

      function updateTouchGroupTarget(clientY) {
        const drag = state.touchSortState;
        const groups = Array.from(els.toolbar.querySelectorAll('.tool-group')).filter(node => node !== drag.sourceEl);
        const target = groups.find(node => {
          const rect = node.getBoundingClientRect();
          return clientY >= rect.top && clientY <= rect.bottom;
        }) || groups.reduce((best, node) => {
          const rect = node.getBoundingClientRect();
          const distance = Math.abs(clientY - (rect.top + rect.height / 2));
          return !best || distance < best.distance ? { node, distance } : best;
        }, null)?.node;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        drag.targetGroupId = target.dataset.groupId;
        drag.targetEl = target;
        drag.placeBefore = clientY < rect.top + rect.height / 2;
      }

      function updateTouchActionTarget(clientX, clientY) {
        const drag = state.touchSortState;
        const group = document.elementFromPoint(clientX, clientY)?.closest('.tool-group')
          || Array.from(els.toolbar.querySelectorAll('.tool-group')).reduce((best, node) => {
            const rect = node.getBoundingClientRect();
            const distance = Math.abs(clientY - (rect.top + rect.height / 2));
            return !best || distance < best.distance ? { node, distance } : best;
          }, null)?.node;
        if (!group) return;
        const buttons = Array.from(group.querySelectorAll('.tool-btn')).filter(node => node !== drag.sourceEl);
        const target = buttons.find(node => {
          const rect = node.getBoundingClientRect();
          return clientY >= rect.top && clientY <= rect.bottom;
        }) || null;
        drag.targetGroupId = group.dataset.groupId;
        drag.targetEl = target || group.querySelector('.tool-group__buttons') || group;
        if (target) {
          const rect = target.getBoundingClientRect();
          drag.targetActionId = target.dataset.actionId;
          drag.placeBefore = clientY < rect.top + rect.height / 2;
        } else {
          drag.targetActionId = null;
          drag.placeBefore = false;
        }
      }

      function positionTouchSortIndicator() {
        const drag = state.touchSortState;
        if (!drag?.indicator || !drag.targetEl) return;
        const rect = drag.targetEl.getBoundingClientRect();
        const top = drag.type === 'action' && !drag.targetActionId
          ? rect.bottom - 2
          : drag.placeBefore ? rect.top : rect.bottom;
        drag.indicator.style.left = `${Math.round(rect.left)}px`;
        drag.indicator.style.top = `${Math.round(top)}px`;
        drag.indicator.style.width = `${Math.round(rect.width)}px`;
        drag.indicator.hidden = false;
      }

      function endTouchSort(commit) {
        const drag = state.touchSortState;
        if (!drag) return;
        clearTimeout(drag.pressTimer);
        window.removeEventListener('pointermove', drag.onMove);
        window.removeEventListener('pointerup', drag.onUp);
        window.removeEventListener('pointercancel', drag.onCancel);
        drag.handle?.releasePointerCapture?.(drag.pointerId);
        document.body.classList.remove('touch-sorting');
        drag.sourceEl?.classList.remove('is-touch-sort-source');
        drag.ghost?.remove();
        drag.indicator?.remove();
        if (commit && drag.targetGroupId) {
          rememberScroll();
          if (drag.type === 'group' && drag.targetGroupId !== drag.sourceId) {
            state.prefs = moveGroup(state.prefs, drag.sourceId, drag.targetGroupId, drag.placeBefore);
            savePrefs(state.prefs);
          }
          if (drag.type === 'action') {
            state.prefs = moveAction(state.prefs, drag.sourceId, drag.targetGroupId, drag.targetActionId, drag.placeBefore);
            savePrefs(state.prefs);
          }
          state.sortSelection = null;
          renderToolbar();
        }
        state.touchSortState = null;
      }

      function bindTouchSelectionButton(button, handler) {
        if (!button) return;
        ['pointerdown', 'mousedown', 'touchstart'].forEach(name => button.addEventListener(name, event => { event.preventDefault(); event.stopPropagation(); lockTouchSelectionUi(); }, { passive: false }));
        ['pointerup', 'mouseup', 'touchend'].forEach(name => button.addEventListener(name, event => { event.preventDefault(); event.stopPropagation(); lockTouchSelectionUi(); handler(); }, { passive: false }));
      }

      function handleSavedListClick(event) {
        const btn = event.target.closest('[data-saved-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.savedAction;
        if (action === 'open') openSavedItem(id);
        if (action === 'delete') deleteSavedItem(id);
        if (action === 'export') exportSavedItem(id);
        if (action === 'preview') previewSavedItem(id);
      }

      function handleLessonContainerClick(event) {
        const alignBtn = event.target.closest('[data-image-align]');
        if (alignBtn) {
          event.preventDefault();
          event.stopPropagation();
          const wrapper = alignBtn.closest('.resizable-image');
          setImageAlignment(wrapper, alignBtn.dataset.imageAlign || 'center');
          return;
        }
        const imageWrapper = event.target.closest('.resizable-image');
        els.lessonContainer.querySelectorAll('.resizable-image.is-selected').forEach(node => {
          if (node !== imageWrapper) node.classList.remove('is-selected');
        });
        if (imageWrapper) {
          imageWrapper.classList.add('is-selected');
          closeKeywordPopover();
          return;
        }
        const btn = event.target.closest('.keyword-toggle');
        if (btn) {
          event.preventDefault();
          event.stopPropagation();
          const wrapper = btn.closest('.keyword-wrapper');
          if (!wrapper) return;
          const isSameOwner = els.keywordPopover.dataset.owner && els.keywordPopover.dataset.owner === (wrapper.dataset.keywordId || '');
          if (!els.keywordPopover.hidden && isSameOwner) closeKeywordPopover();
          else openKeywordPopover(wrapper);
          saveDraft();
          return;
        }

        if (!isContainedIn(event.target, els.keywordPopover)) closeKeywordPopover();
      }

      function handleEditorMouseUp(event) {
        if (isTouchMode()) return;
        if (event.target.closest('.keyword-toggle')) return;
        if (!state.currentAction) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
        applyCurrentActionToSelection();
        sel.removeAllRanges();
      }

      function handleEditorBeforeInput(event) {
        if (event.inputType === 'historyUndo') {
          event.preventDefault();
          if (state.__historyHotkeyLock) return;
          undo();
        }
        if (event.inputType === 'historyRedo') {
          event.preventDefault();
          if (state.__historyHotkeyLock) return;
          redo();
        }
      }

      function handleEditorPaste(event) {
        const items = event.clipboardData?.items || [];
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) insertImageFile(file);
            return;
          }
        }
      }

      function handleEditorDrop(event) {
        event.preventDefault();
        const files = Array.from(event.dataTransfer?.files || []);
        files.filter(file => file.type.startsWith('image/')).forEach(insertImageFile);
      }

      function handleGlobalKeydown(event) {
        if (event.key === 'Escape') {
          closePreview();
          clearCurrentAction();
          closeMobilePanel();
          closeMobileNav();
          return;
        }

        const activeElement = document.activeElement;
        const inEditor = (activeElement === els.lessonContainer) || els.lessonContainer.contains(activeElement);
        if (!inEditor) return;

        const isCtrl = event.ctrlKey || event.metaKey;
        if (!isCtrl || event.repeat) return;
        if (!event.shiftKey && (event.key === 'z' || event.key === 'Z')) { event.preventDefault(); lockHistoryHotkey(); undo(); queueMicrotask(() => { state.__historyHotkeyLock = false; }); return; }
        if ((event.shiftKey && (event.key === 'z' || event.key === 'Z')) || event.key === 'y' || event.key === 'Y') { event.preventDefault(); lockHistoryHotkey(); redo(); queueMicrotask(() => { state.__historyHotkeyLock = false; }); }
      }

      function syncKeywordPopoverToOwner() {
        if (els.keywordPopover.hidden) return;
        const owner = els.keywordPopover.dataset.owner;
        const wrapper = owner ? els.lessonContainer.querySelector(`.keyword-wrapper[data-keyword-id="${owner}"]`) : null;
        if (wrapper) openKeywordPopover(wrapper);
        else closeKeywordPopover();
      }

      async function handleImportJsonChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!state.currentUser) {
          event.target.value = '';
          return showToast('取り込むにはログインしてください。', 'warn');
        }
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const incoming = Array.isArray(parsed) ? parsed : Array.isArray(parsed.saves) ? parsed.saves : [parsed];
          const normalized = incoming.map(item => ({ id: item.id || `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, baseLessonId: item.baseLessonId || item.base_lesson_id || SAMPLE_LESSONS[0].id, title: item.title || '取り込み教材', htmlContent: item.htmlContent || item.html_content || '', log: Array.isArray(item.log) ? item.log : [], createdAt: item.createdAt || item.created_at || nowIso(), updatedAt: item.updatedAt || item.updated_at || nowIso() }));
          for (const item of normalized) {
            await apiRequest('/api/materials', {
              method: 'POST',
              body: JSON.stringify({
                baseLessonId: item.baseLessonId,
                title: item.title,
                htmlContent: item.htmlContent,
                log: item.log
              })
            });
          }
          await refreshSaves();
          showToast('JSON を取り込みました。');
        } catch {
          showToast('JSON の取り込みに失敗しました。', 'error');
        } finally {
          event.target.value = '';
        }
      }

      async function handleEditorCourseChange() {
        const courseId = Number(els.courseSelect?.value || 0);
        if (!courseId) {
          state.currentCourseId = null;
          state.courseMaterialsCache = [];
          state.currentLessonId = null;
          renderLessonSelect();
          return;
        }
        state.currentCourseId = courseId;
        state.currentLessonId = null;
        state.currentSavedId = null;
        try {
          await refreshCourseMaterials(courseId);
        } catch (error) {
          showToast(error.message, 'error');
        }
      }

      async function handleCourseActionClick(event) {
        const btn = event.target.closest('[data-course-action]');
        if (!btn) return false;
        const action = btn.dataset.courseAction;
        const role = state.currentUser?.role || 'student';
        if (action === 'new-course') {
          openCourseDialog();
          return true;
        }
        if (action === 'edit-course') {
          const course = (state.coursesCache || []).find(item => String(item.id) === String(btn.dataset.id));
          if (course) openCourseDialog(course);
          return true;
        }
        if (action === 'delete-course') {
          await deleteCourse(btn.dataset.id);
          return true;
        }
        if (action === 'open-material') {
          const material = (state.courseMaterialsCache || []).find(item => String(item.id) === String(btn.dataset.id));
          if (material?.courseId) state.currentCourseId = material.courseId;
          loadLessonById(btn.dataset.id);
          setView('editor');
          renderLessonSelect();
          return true;
        }
        const courseId = Number(btn.dataset.id || state.currentCourseId);
        if (courseId) {
          state.currentCourseId = courseId;
          await refreshCourseMaterials(state.currentCourseId);
        }
        if (action === 'focus') {
          renderCourseList();
          return true;
        }
        if (action === 'open') {
          setView(role === 'student' ? 'editor' : 'materials');
          return true;
        }
        if (action === 'manage-materials') {
          setView('materials');
          return true;
        }
        if (action === 'new-material') {
          if (!SAMPLE_LESSONS[0]) return true;
          loadLessonById(SAMPLE_LESSONS[0].id, { silent: true });
          state.currentSavedId = null;
          showToast('現在の授業向けにベース教材を読み込みました。新しい教材として保存してください。');
          setView('editor');
          return true;
        }
        return true;
      }

      function bindEvents() {
        renderLessonSelect();
        renderToolbar();
        bindTouchSelectionButton(els.mobileSelectionApplyBtn, () => applyTouchSelection(true));
        bindTouchSelectionButton(els.mobileSelectionCancelBtn, () => { window.getSelection()?.removeAllRanges(); hideMobileSelectionBar(); });

        document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
        document.querySelectorAll('[data-mobile-tool]').forEach(button => button.addEventListener('click', () => { const key = button.dataset.mobileTool || 'all'; if (state.mobileOpen && state.activeMobileTool === key) closeMobilePanel(); else openMobilePanel(key); }));
        els.mobileToolBackdrop.addEventListener('click', closeMobilePanel);
        els.mobileUndoBtn?.addEventListener('click', performMobileUndo);
        els.mobileToolCloseBtn.addEventListener('click', closeMobilePanel);
        els.mobileNavOpenBtn.addEventListener('click', () => state.mobileNavOpen ? closeMobileNav() : openMobileNav());
        els.mobileNavCloseBtn.addEventListener('click', closeMobileNav);
        els.mobileNavDrawer.addEventListener('click', event => event.stopPropagation());
        els.mobileNavDialog.addEventListener('click', closeMobileNav);
        els.mobileNavDialog.addEventListener('cancel', event => { event.preventDefault(); closeMobileNav(); });
        els.mobileNavDialog.addEventListener('close', () => { els.mobileNavDialog.classList.remove('is-open', 'is-closing'); if (state.mobileNavOpen) { state.mobileNavOpen = false; syncMobileNavShell(); } });

        els.courseSelect?.addEventListener('change', handleEditorCourseChange);
        els.loadBtn.addEventListener('click', () => loadLessonById(els.lessonSelect.value));
        els.saveBtn.addEventListener('click', saveCurrentMaterial);
        els.savedSearchInput.addEventListener('input', renderSavedList);
        els.savedSortSelect.addEventListener('change', renderSavedList);
        els.savedList.addEventListener('click', handleSavedListClick);
        els.courseList?.addEventListener('click', async event => {
          await handleCourseActionClick(event);
        });
        els.courseWorkspace?.addEventListener('click', async event => {
          const previewBtn = event.target.closest('[data-saved-action]');
          if (previewBtn) return handleSavedListClick(event);
          const materialBtn = event.target.closest('[data-material-action]');
          if (materialBtn?.dataset.materialAction === 'edit') return openTeacherMaterial(materialBtn.dataset.id);
          await handleCourseActionClick(event);
        });
        els.joinCourseBtn?.addEventListener('click', joinCourse);
        els.createCourseBtn?.addEventListener('click', createCourse);
        els.confirmCourseDialogBtn?.addEventListener('click', submitCourseDialog);
        els.cancelCourseDialogBtn?.addEventListener('click', closeCourseDialog);
        els.courseDialogBackdrop?.addEventListener('click', event => { if (event.target === els.courseDialogBackdrop) closeCourseDialog(); });
        [els.courseDialogNameInput, els.courseDialogSemesterInput, els.courseDialogDescriptionInput].forEach(input => {
          input?.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); closeCourseDialog(); }
            if (event.key === 'Enter' && event.target !== els.courseDialogDescriptionInput) { event.preventDefault(); submitCourseDialog(); }
          });
        });
        els.teacherMaterialList?.addEventListener('click', event => {
          const viewBtn = event.target.closest('[data-view]');
          if (viewBtn) {
            setView(viewBtn.dataset.view);
            return;
          }
          const courseBtn = event.target.closest('[data-course-action]');
          if (courseBtn) return void handleCourseActionClick(event);
          const savedBtn = event.target.closest('[data-saved-action]');
          if (savedBtn) return handleSavedListClick(event);
          const btn = event.target.closest('[data-material-action]');
          if (!btn) return;
          if (btn.dataset.materialAction === 'edit') return openTeacherMaterial(btn.dataset.id);
          if (btn.dataset.materialAction === 'toggle-status') return toggleMaterialStatus(btn.dataset.id, btn.dataset.status);
          if (btn.dataset.materialAction === 'works') return renderWorksForMaterial(btn.dataset.id);
        });
        els.workList?.addEventListener('click', event => {
          const btn = event.target.closest('[data-material-action]');
          if (!btn) return;
          if (btn.dataset.materialAction === 'clear-works') renderWorksPlaceholder();
        });

        els.lessonContainer.addEventListener('click', handleLessonContainerClick);
        els.lessonContainer.addEventListener('pointerdown', startImageResize);
        els.lessonContainer.addEventListener('mouseup', handleEditorMouseUp);
        els.lessonContainer.addEventListener('beforeinput', handleEditorBeforeInput, { capture: true });
        els.lessonContainer.addEventListener('input', () => { state.draftChangedAt = nowIso(); saveDraft(); markStudentAutoSaveDirty(); });
        els.lessonContainer.addEventListener('paste', handleEditorPaste);
        els.lessonContainer.addEventListener('dragover', event => event.preventDefault());
        els.lessonContainer.addEventListener('drop', handleEditorDrop);

        document.addEventListener('selectionchange', () => { if (!isTouchMode()) return; handleTouchSelectionChange(); });
        document.addEventListener('keydown', handleGlobalKeydown);
        window.addEventListener('resize', () => { if (!isMobileLayout()) { state.mobileOpen = false; state.mobileNavOpen = false; } syncMobileShell(); syncMobileNavShell(); syncDesktopSidebarShell(); syncKeywordPopoverToOwner(); });
        document.addEventListener('scroll', syncKeywordPopoverToOwner, true);
        window.addEventListener('resize', syncViewportBottomOffset);
        window.visualViewport?.addEventListener('resize', syncViewportBottomOffset);
        window.visualViewport?.addEventListener('scroll', syncViewportBottomOffset);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') flushStudentAutoSave({ silent: true, keepalive: true, reason: 'hidden' });
        });
        window.addEventListener('pagehide', () => flushStudentAutoSave({ silent: true, keepalive: true, reason: 'pagehide' }));
        window.addEventListener('beforeunload', () => flushStudentAutoSave({ silent: true, keepalive: true, reason: 'beforeunload' }));
        startStudentAutoSaveLoop();

        els.sidebarToggleBtn?.addEventListener('click', () => {
          state.desktopSidebarCollapsed = !state.desktopSidebarCollapsed;
          saveSidebarCollapsed(state.desktopSidebarCollapsed);
          syncDesktopSidebarShell();
        });
        els.editorModeBtn?.addEventListener('click', () => {
          state.mobileTextEditMode = !state.mobileTextEditMode;
          if (state.mobileTextEditMode) {
            clearCurrentAction();
            closeMobilePanel();
          }
          syncEditorInteractionMode();
          if (state.mobileTextEditMode) {
            requestAnimationFrame(() => els.lessonContainer.focus());
            showToast('本文編集モードに切り替えました。');
          } else {
            showToast('加工モードに戻りました。');
          }
        });
        els.toolbarPrefsBtn.addEventListener('click', () => { captureDraftInputs(); state.sortMode = !state.sortMode; state.sortSelection = null; renderToolbar(); });
        els.importJsonBtn.addEventListener('click', () => els.importJsonInput.click());
        els.importJsonInput.addEventListener('change', handleImportJsonChange);
        els.exportAllBtn?.addEventListener('click', exportAll);
        els.mobileExportBtn?.addEventListener('click', () => { exportAll(); closeMobileNav(); });
        els.resetDemoBtn?.addEventListener('click', resetDemo);
        els.closePreviewBtn.addEventListener('click', closePreview);
        els.previewDialogBackdrop.addEventListener('click', event => { if (event.target === els.previewDialogBackdrop) closePreview(); });
        els.loginBtn?.addEventListener('click', () => handleAuthSubmit('login'));
        els.registerBtn?.addEventListener('click', () => handleAuthSubmit('register'));
        els.logoutBtn?.addEventListener('click', handleLogout);
        els.mobileLogoutBtn?.addEventListener('click', () => { handleLogout(); closeMobileNav(); });
        els.confirmSaveBtn?.addEventListener('click', () => {
          const value = els.saveTitleInput.value.trim();
          if (!value) {
            els.saveTitleError.textContent = 'タイトルを入力してください。';
            els.saveTitleError.hidden = false;
            els.saveTitleInput.focus();
            return;
          }
          resolveSaveDialog(value);
        });
        els.cancelSaveBtn?.addEventListener('click', () => resolveSaveDialog(null));
        els.saveTitleInput?.addEventListener('keydown', event => {
          if (event.key === 'Enter') { event.preventDefault(); els.confirmSaveBtn.click(); }
          if (event.key === 'Escape') { event.preventDefault(); resolveSaveDialog(null); }
        });
        els.confirmActionBtn?.addEventListener('click', () => resolveConfirmDialog(true));
        els.cancelConfirmBtn?.addEventListener('click', () => resolveConfirmDialog(false));
        els.saveDialogBackdrop?.addEventListener('click', event => { if (event.target === els.saveDialogBackdrop) resolveSaveDialog(null); });
        els.confirmDialogBackdrop?.addEventListener('click', event => { if (event.target === els.confirmDialogBackdrop) resolveConfirmDialog(false); });
      }

      function initFromDraft() {
        const draft = loadDraft();
        if (draft?.html) {
          state.currentLessonId = draft.currentLessonId || SAMPLE_LESSONS[0].id;
          state.baseLessonId = draft.baseLessonId || draft.currentLessonId || SAMPLE_LESSONS[0].id;
          state.currentSavedId = draft.currentSavedId || null;
          state.log = Array.isArray(draft.log) ? draft.log : [];
          renderLessonSelect();
          els.lessonSelect.value = state.baseLessonId;
          els.lessonContainer.innerHTML = draft.html;
          ensureResizableImages();
          els.titleDisplay.textContent = draft.title || findLessonTitle(state.baseLessonId);
          state.undoStack = [snapshot()];
          state.redoStack = [];
          syncEditorStatusTag();
          showToast('前回のローカル状態を復元しました。');
        } else {
          renderLessonSelect();
          loadLessonById(SAMPLE_LESSONS[0].id, { silent: true });
        }
      }

      bindEvents();
      syncViewportBottomOffset();
      syncDesktopSidebarShell();
      syncEditorInteractionMode();
      initFromDraft();
      initAuth();
      renderSavedList();
      setView('courses');
      syncEditorStatusTag();

    })();

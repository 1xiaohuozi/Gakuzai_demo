(() => {
  // ローカル完結デモで使う保存キー。
  const STORAGE_KEYS = {
    saves: 'gakuzai.demo.saves.v1',
    toolbar: 'gakuzai.toolbar.layout.v6',
    draft: 'gakuzai.demo.current.v1',
    sidebar: 'gakuzai.sidebar.collapsed.v1',
    authToken: 'gakuzai.auth.token.v1',
    sessionId: 'gakuzai.research.session.v1'
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
    assignmentsView: document.getElementById('assignmentsView'),
    assignmentsCourseList: document.getElementById('assignmentsCourseList'),
    assignmentsWorkspace: document.getElementById('assignmentsWorkspace'),
    assignmentsTitle: document.getElementById('assignmentsTitle'),
    assignmentsHint: document.getElementById('assignmentsHint'),
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
    analysisDialogBackdrop: document.getElementById('analysisDialogBackdrop'),
    analysisDialogTitle: document.getElementById('analysisDialogTitle'),
    analysisDialogMeta: document.getElementById('analysisDialogMeta'),
    analysisDialogContent: document.getElementById('analysisDialogContent'),
    closeAnalysisDialogBtn: document.getElementById('closeAnalysisDialogBtn'),
    assignmentDialogBackdrop: document.getElementById('assignmentDialogBackdrop'),
    assignmentDialogTitle: document.getElementById('assignmentDialogTitle'),
    assignmentDialogMeta: document.getElementById('assignmentDialogMeta'),
    assignmentDialogContent: document.getElementById('assignmentDialogContent'),
    closeAssignmentDialogBtn: document.getElementById('closeAssignmentDialogBtn'),
    studentAssignmentDialogBackdrop: document.getElementById('studentAssignmentDialogBackdrop'),
    studentAssignmentDialogTitle: document.getElementById('studentAssignmentDialogTitle'),
    studentAssignmentDialogMeta: document.getElementById('studentAssignmentDialogMeta'),
    studentAssignmentDialogContent: document.getElementById('studentAssignmentDialogContent'),
    closeStudentAssignmentDialogBtn: document.getElementById('closeStudentAssignmentDialogBtn'),
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
    imageDragState: null,
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
    sessionId: getSessionId(),
    coursesCache: [],
    courseMaterialsCache: [],
    currentCourseId: null,
    currentWorkMaterialId: null,
    pendingWorkMaterialId: null,
    analysisMaterialId: null,
    analyticsSummary: null,
    analyticsDetails: null,
    analyticsInsights: null,
    analyticsLoading: false,
    analyticsDetailsLoading: false,
    analyticsInsightsLoading: false,
    analyticsCourseId: null,
    selectedAnalysisStudentId: null,
    analysisStudentFilterId: null,
    analysisActionFilter: '',
    editingCourseId: null,
    savesCache: [],
    assignmentsCache: [],
    assignmentSubmissionsCache: {},
    assignmentParticipantsCache: {},
    selectedAssignmentId: null,
    editingAssignmentId: null,
    selectedAssignmentMaterialId: null,
    assignmentMaterialFilter: '',
    assignmentStatusFilter: '',
    assignmentTypeFilter: '',
    assignmentSubmissionsLoading: false,
    saveDialogResolver: null,
    confirmDialogResolver: null,
    studentAutoSaveDirty: false,
    studentAutoSaveTimer: null,
    studentAutoSaveInterval: null,
    studentAutoSaveInFlight: false,
    studentAutoSaveQueued: false,
    studentLastAutoSavedAt: null,
    studentLastAutoSaveErrorAt: null,
    lastOperationEventId: null,
    lastOperationAt: null
  };
  let mobileNavCloseTimer = null;

  // エディタ，保存処画面表示で共通利用する小さな補助関数群。
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function nowIso() { return new Date().toISOString(); }
  function randomId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function getSessionId() {
    try {
      let id = sessionStorage.getItem(STORAGE_KEYS.sessionId);
      if (!id) {
        id = randomId('session');
        sessionStorage.setItem(STORAGE_KEYS.sessionId, id);
      }
      return id;
    } catch {
      return randomId('session');
    }
  }
  function normalizeResearchText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }
  function stableHash(value) {
    const text = normalizeResearchText(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `h${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }
  function normalizeReplacementText(text) {
    return normalizeResearchText(text).toLowerCase();
  }
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
      operationLogs: (state.log || []).map(sanitizeOperationLogEntry)
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
    }).catch(() => { });
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
      'Request body is too large.': '画像データが大きすぎます。画像サイズを小さくしてからもう一度お試しください。',
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
      'courseId is required.': '授業を選択してください。',
      'Material does not belong to the selected course.': '選択中の授業に属していない教材です。',
      'courseId, title and baseLessonId are required.': '授業・教材名・ベース教材を指定してください。',
      'Status must be draft or published.': '教材の状態が正しくありません。',
      'Material order direction must be up or down.': '教材の移動方向が正しくありません。',
      'courseId, materialId, title and questionText are required.': '授業・教材・課題タイトル・問題文を入力してください。',
      'At least two choices are required.': '選択肢を2つ以上入力してください。',
      'Correct choice index is invalid.': '正解の選択肢が正しくありません。',
      'Assignment not found.': '課題が見つかりません。',
      'Assignment status is invalid.': '課題の状態が正しくありません。',
      'Assignment is not accepting submissions.': 'この課題は現在提出できません。',
      'Choice index is invalid.': '回答の選択肢が正しくありません。',
      'Text answer is required.': 'テキスト回答を入力してください。',
      'Submission file is required.': '提出ファイルを選択してください。',
      'Submission file type is invalid.': '提出できるファイルは Word、PDF、画像のみです。',
      'Submission file size is invalid.': '提出ファイルは10MB以下にしてください。',
      'Submission file is invalid.': '提出ファイルを読み込めませんでした。',
      'Submission not found.': '提出データが見つかりません。',
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
      const error = new Error(translateApiError(data.error) || '通信に失敗しました。');
      error.status = response.status;
      error.apiError = data.error || '';
      throw error;
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
      state.assignmentsCache = [];
      state.analyticsSummary = null;
      state.analyticsDetails = null;
      state.analyticsInsights = null;
      state.analyticsCourseId = null;
      renderLessonSelect();
      renderTeacherMaterialList();
      renderDashboardSummary();
      renderCourseWorkspace();
      renderAssignmentsPage();
      return [];
    }
    const data = await apiRequest(`/api/materials?courseId=${encodeURIComponent(courseId)}`);
    state.courseMaterialsCache = data.materials || [];
    await refreshCourseAssignments(courseId, { render: false });
    if (state.selectedAssignmentMaterialId && !state.assignmentsCache.some(item => String(item.materialId) === String(state.selectedAssignmentMaterialId))) {
      state.selectedAssignmentMaterialId = null;
    }
    state.currentWorkMaterialId = null;
    if (state.analysisMaterialId && !state.courseMaterialsCache.some(item => String(item.id) === String(state.analysisMaterialId))) {
      state.analysisMaterialId = null;
    }
    renderLessonSelect();
    renderTeacherMaterialList();
    renderDashboardSummary();
    renderCourseWorkspace();
    renderAssignmentsPage();
    await refreshAnalyticsSummary({ courseId, materialId: state.analysisMaterialId });
    return state.courseMaterialsCache;
  }
  async function refreshCourseAssignments(courseId = state.currentCourseId, { render = true } = {}) {
    if (!state.currentUser || !courseId) {
      state.assignmentsCache = [];
      state.selectedAssignmentId = null;
      state.assignmentSubmissionsCache = {};
      if (render) {
        renderDashboardSummary();
        renderCourseWorkspace();
        renderAssignmentsPage();
      }
      return [];
    }
    const data = await apiRequest(`/api/assignments?courseId=${encodeURIComponent(courseId)}`);
    state.assignmentsCache = data.assignments || [];
    if (state.selectedAssignmentId && !state.assignmentsCache.some(item => String(item.id) === String(state.selectedAssignmentId))) {
      state.selectedAssignmentId = null;
    }
    if (render) {
      renderDashboardSummary();
      renderCourseWorkspace();
      renderAssignmentsPage();
    }
    return state.assignmentsCache;
  }
  async function refreshAnalyticsSummary({ courseId = state.currentCourseId, materialId = null } = {}) {
    const role = state.currentUser?.role || 'student';
    if (!state.currentUser || (role !== 'teacher' && role !== 'admin') || !courseId) {
      state.analyticsSummary = null;
      state.analyticsCourseId = null;
      state.analyticsDetails = null;
      state.analyticsInsights = null;
      return null;
    }
    state.analyticsLoading = true;
    state.analyticsDetailsLoading = true;
    state.analyticsInsightsLoading = true;
    state.analyticsCourseId = courseId;
    const previousMaterialId = state.analysisMaterialId;
    state.analysisMaterialId = materialId ? String(materialId) : null;
    if (previousMaterialId !== state.analysisMaterialId) state.selectedAnalysisStudentId = null;
    renderTeacherMaterialList();
    try {
      const params = new URLSearchParams({ courseId: String(courseId) });
      if (materialId) params.set('materialId', String(materialId));
      if (state.analysisStudentFilterId) params.set('studentId', String(state.analysisStudentFilterId));
      if (state.analysisActionFilter) params.set('actionType', String(state.analysisActionFilter));
      const [data, details, insights] = await Promise.all([
        apiRequest(`/api/analytics/summary?${params.toString()}`),
        apiRequest(`/api/analytics/details?${params.toString()}`),
        apiRequest(`/api/analytics/insights?${params.toString()}`)
      ]);
      if (String(state.currentCourseId) === String(courseId)) {
        state.analyticsSummary = data;
        state.analyticsDetails = details;
        state.analyticsInsights = insights;
        state.analyticsCourseId = courseId;
      }
      return data;
    } catch (error) {
      if (String(state.currentCourseId) === String(courseId)) state.analyticsSummary = null;
      if (String(state.currentCourseId) === String(courseId)) state.analyticsDetails = null;
      if (String(state.currentCourseId) === String(courseId)) state.analyticsInsights = null;
      showToast(error.message, 'error');
      return null;
    } finally {
      if (String(state.currentCourseId) === String(courseId)) {
        state.analyticsLoading = false;
        state.analyticsDetailsLoading = false;
        state.analyticsInsightsLoading = false;
        renderTeacherMaterialList();
      }
    }
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
        ['学生作業', workCount, '公開教材を開いた学生の加工記録を確認できます。']
      ];
    els.dashboardSummary.innerHTML = cards.map(([label, value, meta]) => `
          <article class="app-stat-card">
            <div class="app-stat-card__label">${label}</div>
            <div class="app-stat-card__value">${value}</div>
            <div class="app-stat-card__meta">${meta}</div>
          </article>
        `).join('');
  }
  function renderTeacherMaterialTable(items) {
    if (!items.length) {
      return '<div class="clean-empty">この授業にはまだ教材がありません。右上の「教材作成」から追加できます。</div>';
    }
    const renderOrderControls = (item, index) => `
      <div class="material-order-controls" aria-label="教材順序">
        <button class="sv-btn sv-btn--icon" type="button" data-material-action="move-order" data-id="${item.id}" data-direction="up" ${index === 0 ? 'disabled' : ''} aria-label="上へ移動">↑</button>
        <button class="sv-btn sv-btn--icon" type="button" data-material-action="move-order" data-id="${item.id}" data-direction="down" ${index === items.length - 1 ? 'disabled' : ''} aria-label="下へ移動">↓</button>
      </div>`;
    return `
      <div class="clean-table-wrap">
        <table class="clean-table">
          <thead>
            <tr><th>順序</th><th>教材</th><th>公開状態</th><th>教材更新</th><th>学生作業</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td>${renderOrderControls(item, index)}</td>
                <td>
                  <strong>${esc(item.title || '無題')}</strong>
                  <span>${esc(findLessonTitle(item.baseLessonId))}</span>
                </td>
                <td><span class="status-dot ${item.status === 'published' ? 'is-published' : ''}">${item.status === 'published' ? '公開中' : '下書き'}</span></td>
                <td>${fmt(item.materialUpdatedAt || item.updatedAt)}</td>
                <td>${item.hasStudentWork ? 'あり' : 'なし'}</td>
                <td>
                  <div class="clean-actions">
                    <button class="sv-btn" type="button" data-material-action="edit" data-id="${item.id}">編集</button>
                    <button class="sv-btn sv-btn--ghost" type="button" data-material-action="toggle-status" data-id="${item.id}" data-status="${item.status === 'published' ? 'draft' : 'published'}">${item.status === 'published' ? '非公開' : '公開'}</button>
                    <button class="sv-btn sv-btn--ghost" type="button" data-material-action="works" data-id="${item.id}">作業</button>
                    <button class="sv-btn sv-btn--danger" type="button" data-saved-action="delete" data-id="${item.id}">削除</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }
  function renderAssignmentStatus(status) {
    const labels = { draft: '下書き', published: '公開中', closed: '締切' };
    return labels[status] || status || '公開中';
  }
  function renderAssignmentTypeLabel(type) {
    return ({ choice: '選択式', text: 'テキスト', file: 'ファイル' })[type || 'choice'] || '選択式';
  }
  function getReviewStatusLabel(status) {
    return ({ pending: '未確認', reviewed: '確認済み', needs_revision: '再提出' })[status || 'pending'] || '未確認';
  }
  function renderAnswerPreview(answer, choices = []) {
    const data = answer || {};
    if (data.type === 'file' && data.file) {
      return `<a class="assignment-file-link" href="${esc(data.file.url || '#')}" target="_blank" rel="noopener">${esc(data.file.name || '提出ファイル')}</a>`;
    }
    if (data.type === 'text') {
      return `<span class="assignment-answer-text">${esc(data.text || '')}</span>`;
    }
    const choiceIndex = Number(data.choiceIndex ?? -1);
    if (choiceIndex >= 0) return `${choiceIndex + 1}. ${esc(data.choiceText || choices[choiceIndex] || '')}`;
    return '-';
  }
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('File read failed.'));
      reader.readAsDataURL(file);
    });
  }
  function assignmentRate(correctCount, submissionCount) {
    const total = Number(submissionCount || 0);
    if (!total) return 0;
    return Math.round((Number(correctCount || 0) / total) * 100);
  }
  function getAssignmentById(id = state.selectedAssignmentId) {
    if (!id) return null;
    return (state.assignmentsCache || []).find(item => String(item.id) === String(id)) || null;
  }
  function groupAssignmentsByMaterial(assignments, materials = []) {
    const materialMap = new Map((materials || []).map(item => [String(item.id), item]));
    const groups = [];
    const groupMap = new Map();
    (assignments || []).forEach(item => {
      const key = String(item.materialId || 'none');
      if (!groupMap.has(key)) {
        const material = materialMap.get(key);
        const group = {
          materialId: item.materialId || '',
          materialTitle: item.materialTitle || material?.title || '教材未設定',
          materialStatus: material?.status || '',
          assignments: []
        };
        groupMap.set(key, group);
        groups.push(group);
      }
      groupMap.get(key).assignments.push(item);
    });
    return groups;
  }
  function getSelectedAssignmentMaterial(groups) {
    const list = groups || [];
    if (!list.length) return null;
    const selected = list.find(group => String(group.materialId) === String(state.selectedAssignmentMaterialId));
    return selected || list[0];
  }
  function getAssignmentGroupStats(assignments) {
    const list = assignments || [];
    const total = list.length;
    const submitted = list.filter(item => item.submission).length;
    const correct = list.filter(item => item.submission?.isCorrect).length;
    const submissions = list.reduce((sum, item) => sum + Number(item.submissionCount || 0), 0);
    const published = list.filter(item => item.status === 'published').length;
    const progress = total ? Math.round((submitted / total) * 100) : 0;
    return { total, submitted, correct, submissions, published, progress };
  }
  function getAssignmentHealth(item) {
    const total = Number(item?.submissionCount || 0);
    if ((item?.assignmentType || 'choice') !== 'choice') {
      if (!total) return { label: '未提出', tone: 'muted', message: 'まだ提出がありません。提出後に内容を確認します。' };
      return { label: '審査待ち', tone: 'warn', message: '提出内容を開き、必要に応じてフィードバックを返してください。' };
    }
    const rate = assignmentRate(item?.correctCount, total);
    if (!total) return { label: '未提出', tone: 'muted', message: 'まだ提出がないため、公開後の様子を見ます。' };
    if (rate < 50) return { label: '要フォロー', tone: 'danger', message: '正解率が低めです。授業で解き直しや説明を入れると効果的です。' };
    if (rate < 75) return { label: '確認推奨', tone: 'warn', message: '理解が分かれています。迷いやすい選択肢を確認してください。' };
    return { label: '良好', tone: 'good', message: '多くの学生が理解できています。必要に応じて次へ進めます。' };
  }
  function renderTeacherPracticeOverview(assignments, course, materials) {
    const published = assignments.filter(item => item.status === 'published').length;
    const closed = assignments.filter(item => item.status === 'closed').length;
    const totalSubmissions = assignments.reduce((sum, item) => sum + Number(item.submissionCount || 0), 0);
    const needsFollow = assignments.filter(item => Number(item.submissionCount || 0) > 0 && assignmentRate(item.correctCount, item.submissionCount) < 60).length;
    return `
     `;
  }
  function renderStudentAssignmentSummary(assignments) {
    const total = assignments.length;
    const submitted = assignments.filter(item => item.submission).length;
    const correct = assignments.filter(item => item.submission?.isCorrect).length;
    const pending = Math.max(0, total - submitted);
    const progress = total ? Math.round((submitted / total) * 100) : 0;
    return `
      <div class="assignment-learner-status">
        <div>
          <strong>${progress}%</strong>
          <span>提出進度</span>
        </div>
        <div class="assignment-progress-track"><i style="width:${progress}%"></i></div>
      </div>
      <div class="assignment-summary-grid">
        <article><span>公開中</span><strong>${total}</strong><small>件</small></article>
        <article><span>未回答</span><strong>${pending}</strong><small>優先</small></article>
        <article><span>提出済み</span><strong>${submitted}</strong><small>件</small></article>
        <article><span>正解</span><strong>${correct}</strong><small>件</small></article>
      </div>`;
  }
  function renderTeacherAssignmentResults() {
    const selected = getAssignmentById();
    if (!selected) {
      return `
        <section class="assignment-results">
          <div class="assignment-results__empty">課題カードの「結果」を押すと、提出状況と選択肢別の傾向を確認できます。</div>
        </section>`;
    }
    const rows = state.assignmentSubmissionsCache[String(selected.id)] || [];
    const participants = state.assignmentParticipantsCache[String(selected.id)] || [];
    const total = Number(selected.submissionCount || rows.length || 0);
    const correct = Number(selected.correctCount ?? rows.filter(row => row.isCorrect).length);
    const isChoice = (selected.assignmentType || 'choice') === 'choice';
    const rate = isChoice ? assignmentRate(correct, total) : (participants.length ? Math.round((total / participants.length) * 100) : 0);
    const choiceCounts = (selected.choices || []).map((choice, index) => ({
      choice,
      index,
      count: rows.filter(row => Number(row.choiceIndex) === index).length
    }));
    const maxChoiceCount = Math.max(1, ...choiceCounts.map(item => item.count));
    const wrongChoices = choiceCounts.filter(item => item.index !== Number(selected.correctChoiceIndex));
    const topWrong = wrongChoices.slice().sort((a, b) => b.count - a.count)[0] || null;
    const unsubmitted = participants.filter(row => !row.submitted);
    const health = getAssignmentHealth(selected);
    return `
      <section class="assignment-results">
        <div class="assignment-results__head">
          <div>
            <h4>${esc(selected.title)}</h4>
            <p>${esc(selected.materialTitle || '教材')} / ${esc(renderAssignmentTypeLabel(selected.assignmentType))}${isChoice ? ` / 正解 ${Number(selected.correctChoiceIndex || 0) + 1}` : ''}</p>
          </div>
          <div class="assignment-results__score">
            <strong>${rate}%</strong>
            <span>${isChoice ? '正解率' : '提出率'}</span>
          </div>
        </div>
        <div class="assignment-insight assignment-insight--${health.tone}">
          <strong>${esc(health.label)}</strong>
          <span>${esc(health.message)}</span>
          ${isChoice ? (topWrong?.count ? `<small>最も多い誤答: ${topWrong.index + 1}. ${esc(topWrong.choice)} (${topWrong.count} 件)</small>` : '<small>誤答の集中はまだありません。</small>') : '<small>提出内容を確認してフィードバックを返せます。</small>'}
        </div>
        <div class="assignment-summary-grid">
          <article><span>提出</span><strong>${total}</strong><small>件</small></article>
          <article><span>${isChoice ? '正解' : '確認済み'}</span><strong>${isChoice ? correct : rows.filter(row => row.answer?.review?.status === 'reviewed').length}</strong><small>件</small></article>
          <article><span>${isChoice ? '未正解' : '再提出'}</span><strong>${isChoice ? Math.max(0, total - correct) : rows.filter(row => row.answer?.review?.status === 'needs_revision').length}</strong><small>件</small></article>
          <article><span>未提出</span><strong>${unsubmitted.length}</strong><small>人</small></article>
        </div>
        ${isChoice ? `<div class="assignment-choice-analysis">
          ${choiceCounts.map(item => `
            <div class="assignment-choice-bar ${Number(selected.correctChoiceIndex) === item.index ? 'is-correct-choice' : ''}">
              <div class="assignment-choice-bar__top">
                <span>${item.index + 1}. ${esc(item.choice)}</span>
                <strong>${item.count} 件</strong>
              </div>
              <div class="assignment-choice-bar__track"><i style="width:${Math.max(4, Math.round((item.count / maxChoiceCount) * 100))}%"></i></div>
            </div>
          `).join('')}
        </div>` : ''}
        ${participants.length ? `
          <div class="assignment-roster-strip">
            <strong>未提出</strong>
            <span>${unsubmitted.length ? unsubmitted.slice(0, 8).map(row => esc(row.studentName || row.studentEmail || `学生 ${row.studentId}`)).join(' / ') : '全員提出済み'}</span>
          </div>` : ''}
        <div class="assignment-submission-table">
          ${state.assignmentSubmissionsLoading ? '<div class="data-empty">提出データを読み込み中です。</div>' : rows.length ? `
            <table class="clean-table">
              <thead><tr><th>学生</th><th>回答</th><th>結果</th><th>フィードバック</th><th>提出日時</th></tr></thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    <td><strong>${esc(row.studentName || row.studentEmail || `学生 ${row.studentId}`)}</strong><span>${esc(row.studentEmail || '')}</span></td>
                    <td>${renderAnswerPreview(row.answer, selected.choices)}</td>
                    <td><span class="status-dot ${row.isCorrect ? 'is-published' : ''}">${isChoice ? (row.isCorrect ? '正解' : '確認') : getReviewStatusLabel(row.answer?.review?.status)}</span></td>
                    <td>
                      <div class="assignment-review-tools" data-submission-id="${row.id}">
                        <select class="sa-select" data-review-status>
                          ${['pending', 'reviewed', 'needs_revision'].map(status => `<option value="${status}" ${(row.answer?.review?.status || 'pending') === status ? 'selected' : ''}>${getReviewStatusLabel(status)}</option>`).join('')}
                        </select>
                        <input class="sa-input" data-review-feedback type="text" maxlength="300" value="${esc(row.answer?.review?.feedback || '')}" placeholder="学生へのコメント">
                        <button class="sv-btn sv-btn--ghost" type="button" data-assignment-action="review" data-id="${selected.id}" data-submission-id="${row.id}">保存</button>
                      </div>
                    </td>
                    <td>${fmt(row.updatedAt || row.submittedAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="data-empty">まだ提出はありません。</div>'}
        </div>
      </section>`;
  }
  function renderAssignmentDialogContent(materials) {
    const publishedMaterials = (materials || []).filter(item => item.status === 'published');
    const editing = state.editingAssignmentId ? getAssignmentById(state.editingAssignmentId) : null;
    const editorChoices = editing?.choices || [];
    const editorChoiceCount = Math.max(4, Math.min(6, editorChoices.length || 4));
    return `
      <div class="assignment-form">
        <label class="form-field">
          <span class="form-label">対象教材</span>
          <select class="sa-select" id="assignmentMaterialInput">
            ${publishedMaterials.map(item => `<option value="${item.id}" ${String(editing?.materialId || '') === String(item.id) ? 'selected' : ''}>${esc(item.title || '無題')}</option>`).join('')}
          </select>
        </label>
        <label class="form-field">
          <span class="form-label">公開状態</span>
          <select class="sa-select" id="assignmentStatusInput">
            ${['draft', 'published', 'closed'].map(status => `<option value="${status}" ${(editing?.status || 'published') === status ? 'selected' : ''}>${esc(renderAssignmentStatus(status))}</option>`).join('')}
          </select>
        </label>
        <label class="form-field">
          <span class="form-label">提交方式</span>
          <select class="sa-select" id="assignmentTypeInput" data-assignment-type-input>
            ${['choice', 'text', 'file'].map(type => `<option value="${type}" ${(editing?.assignmentType || 'choice') === type ? 'selected' : ''}>${esc(renderAssignmentTypeLabel(type))}</option>`).join('')}
          </select>
        </label>
        <label class="form-field assignment-form__wide">
          <span class="form-label">課題タイトル</span>
          <input class="sa-input" id="assignmentTitleInput" type="text" maxlength="100" placeholder="例：第1回 確認問題" value="${esc(editing?.title || '')}">
        </label>
        <label class="form-field assignment-form__wide">
          <span class="form-label">問題文</span>
          <textarea class="sa-textarea" id="assignmentQuestionInput" rows="4" placeholder="学生に提示する問題文を入力">${esc(editing?.questionText || '')}</textarea>
        </label>
        <div class="assignment-choice-grid assignment-form__wide" data-choice-editor ${(editing?.assignmentType || 'choice') !== 'choice' ? 'hidden' : ''}>
          ${Array.from({ length: editorChoiceCount }, (_, index) => `
            <label class="form-field">
              <span class="form-label">選択肢 ${index + 1}</span>
              <input class="sa-input" data-assignment-choice="${index}" type="text" maxlength="160" value="${esc(editorChoices[index] || '')}">
            </label>
          `).join('')}
        </div>
        <label class="form-field" data-choice-editor ${(editing?.assignmentType || 'choice') !== 'choice' ? 'hidden' : ''}>
          <span class="form-label">正解</span>
          <select class="sa-select" id="assignmentCorrectInput">
            ${Array.from({ length: editorChoiceCount }, (_, index) => `<option value="${index}" ${Number(editing?.correctChoiceIndex || 0) === index ? 'selected' : ''}>選択肢 ${index + 1}</option>`).join('')}
          </select>
        </label>
        <div class="assignment-type-help assignment-form__wide" data-non-choice-help ${(editing?.assignmentType || 'choice') === 'choice' ? 'hidden' : ''}>
          テキスト提出は学生が本文を入力します。ファイル提出は Word / PDF / 画像、10MB以下に制限されます。
        </div>
        <label class="form-field">
          <span class="form-label">締切メモ</span>
          <input class="sa-input" id="assignmentDueInput" type="text" maxlength="80" placeholder="例：次回授業まで" value="${esc(editing?.dueAt || '')}">
        </label>
        <div class="assignment-form__actions assignment-form__wide">
          <button class="sa-btn sa-btn--ghost" type="button" data-assignment-action="cancel-edit">キャンセル</button>
          <button class="sa-btn se-btn--primary" type="button" data-assignment-action="create">${editing ? '練習問題を更新' : '練習問題を保存'}</button>
        </div>
      </div>`;
  }
  function openAssignmentDialog(id = null) {
    state.editingAssignmentId = id || null;
    const editing = id ? getAssignmentById(id) : null;
    if (els.assignmentDialogTitle) els.assignmentDialogTitle.textContent = editing ? '練習問題を編集' : '練習問題を作成';
    if (els.assignmentDialogMeta) els.assignmentDialogMeta.textContent = editing ? '既存の提出は残したまま問題情報を更新します。' : '公開教材に紐づく練習問題を作成します。';
    if (els.assignmentDialogContent) els.assignmentDialogContent.innerHTML = renderAssignmentDialogContent(state.courseMaterialsCache || []);
    openModal(els.assignmentDialogBackdrop);
    requestAnimationFrame(() => els.assignmentDialogContent?.querySelector('#assignmentTitleInput')?.focus());
  }
  function closeAssignmentDialog() {
    closeModal(els.assignmentDialogBackdrop);
    state.editingAssignmentId = null;
  }
  function renderTeacherAssignmentPanel(materials) {
    const publishedMaterials = materials.filter(item => item.status === 'published');
    const assignments = state.assignmentsCache || [];
    const filteredAssignments = assignments.filter(item => {
      if (state.assignmentMaterialFilter && String(item.materialId) !== String(state.assignmentMaterialFilter)) return false;
      if (state.assignmentStatusFilter && item.status !== state.assignmentStatusFilter) return false;
      if (state.assignmentTypeFilter && (item.assignmentType || 'choice') !== state.assignmentTypeFilter) return false;
      return true;
    });
    return `
      <section class="assignment-panel">
        <div class="assignment-panel__head">
          <div>
            <h4>練習問題管理</h4>
            <p>上部で条件を絞り込み、表から公開・編集・結果確認を行います。</p>
          </div>
        </div>
        ${renderTeacherPracticeOverview(assignments, getCurrentCourse(), materials)}
        ${publishedMaterials.length ? `
          <div class="assignment-admin-toolbar">
            <label>
              <span>教材</span>
              <select class="sa-select" data-assignment-filter="material">
                <option value="">全教材</option>
                ${publishedMaterials.map(item => `<option value="${item.id}" ${String(state.assignmentMaterialFilter || '') === String(item.id) ? 'selected' : ''}>${esc(item.title || '無題')}</option>`).join('')}
              </select>
            </label>
            <label>
              <span>状態</span>
              <select class="sa-select" data-assignment-filter="status">
                <option value="">すべて</option>
                ${['draft', 'published', 'closed'].map(status => `<option value="${status}" ${state.assignmentStatusFilter === status ? 'selected' : ''}>${esc(renderAssignmentStatus(status))}</option>`).join('')}
              </select>
            </label>
            <label>
              <span>方式</span>
              <select class="sa-select" data-assignment-filter="type">
                <option value="">すべて</option>
                ${['choice', 'text', 'file'].map(type => `<option value="${type}" ${state.assignmentTypeFilter === type ? 'selected' : ''}>${esc(renderAssignmentTypeLabel(type))}</option>`).join('')}
              </select>
            </label>
            <div class="assignment-admin-toolbar__actions">
              <button class="sa-btn sa-btn--ghost" type="button" data-assignment-action="reset-filters">条件クリア</button>
              <button class="sa-btn se-btn--primary" type="button" data-assignment-action="new">新規作成</button>
            </div>
          </div>
          <div class="clean-table-wrap">
            <table class="clean-table assignment-admin-table">
              <thead>
                <tr><th>教材</th><th>問題</th><th>方式</th><th>状態</th><th>提出</th><th>診断</th><th>更新</th><th>操作</th></tr>
              </thead>
              <tbody>
                ${filteredAssignments.length ? filteredAssignments.map(item => {
      const health = getAssignmentHealth(item);
      return `
                    <tr>
                      <td><strong>${esc(item.materialTitle || '教材')}</strong></td>
                      <td><strong>${esc(item.title)}</strong><span>${esc(item.questionText)}</span></td>
                      <td>${esc(renderAssignmentTypeLabel(item.assignmentType))}</td>
                      <td><span class="status-dot ${item.status === 'published' ? 'is-published' : ''}">${esc(renderAssignmentStatus(item.status))}</span></td>
                      <td>${item.submissionCount || 0} 件${(item.assignmentType || 'choice') === 'choice' ? ` / ${assignmentRate(item.correctCount, item.submissionCount)}%` : ''}</td>
                      <td><span class="assignment-health assignment-health--${health.tone}">${esc(health.label)}</span></td>
                      <td>${fmt(item.updatedAt)}</td>
                      <td>
                        <div class="clean-actions">
                          <button class="sv-btn" type="button" data-assignment-action="results" data-id="${item.id}">結果</button>
                          <button class="sv-btn sv-btn--ghost" type="button" data-assignment-action="edit" data-id="${item.id}">編集</button>
                          <button class="sv-btn sv-btn--ghost" type="button" data-assignment-action="toggle-status" data-id="${item.id}" data-status="${item.status === 'published' ? 'closed' : 'published'}">${item.status === 'published' ? '締切' : '公開'}</button>
                          <button class="sv-btn sv-btn--danger" type="button" data-assignment-action="delete" data-id="${item.id}">削除</button>
                        </div>
                      </td>
                    </tr>`;
    }).join('') : '<tr><td colspan="8"><div class="data-empty">条件に一致する練習問題がありません。</div></td></tr>'}
              </tbody>
            </table>
            </div>
        ` : '<div class="data-empty">課題を作成するには、先に教材を公開してください。</div>'}
      </section>`;
  }
  function getStudentAssignmentState(item) {
    const submitted = item.submission;
    const type = item.assignmentType || 'choice';
    if (!submitted) return { label: '未提出', tone: 'warn', detail: '回答待ち' };
    if (type === 'choice') {
      return submitted.isCorrect
        ? { label: '正解', tone: 'good', detail: `提出 ${fmt(submitted.updatedAt || submitted.submittedAt)}` }
        : { label: '提出済み', tone: 'review', detail: `提出 ${fmt(submitted.updatedAt || submitted.submittedAt)}` };
    }
    const reviewStatus = submitted.answer?.review?.status || 'pending';
    return {
      label: getReviewStatusLabel(reviewStatus),
      tone: reviewStatus === 'needs_revision' ? 'review' : reviewStatus === 'reviewed' ? 'good' : 'muted',
      detail: `提出 ${fmt(submitted.updatedAt || submitted.submittedAt)}`
    };
  }
  function renderStudentAssignmentFeedback(item) {
    const submitted = item.submission;
    if (!submitted) return '';
    const type = item.assignmentType || 'choice';
    if (type === 'choice') {
      return `<div class="assignment-feedback ${submitted.isCorrect ? 'is-good' : 'is-review'}">${submitted.isCorrect ? 'よくできました。この理解で次の教材に進めます。' : '提出を受け付けました。正解選択肢を確認して、教材をもう一度見直してください。'}</div>`;
    }
    return `<div class="assignment-feedback ${submitted.answer?.review?.status === 'needs_revision' ? 'is-review' : 'is-good'}">提出を受け付けました。${submitted.answer?.review?.feedback ? ` 教師コメント: ${esc(submitted.answer.review.feedback)}` : '教師の確認を待っています。'}</div>`;
  }
  function renderStudentAssignmentDialogContent(item) {
    if (!item) return '<div class="data-empty">課題が見つかりません。</div>';
    const submitted = item.submission;
    const type = item.assignmentType || 'choice';
    const correctIndex = Number(submitted?.correctChoiceIndex ?? -1);
    return `
      <section class="student-answer-dialog" data-student-assignment-dialog="${item.id}">
        <div class="student-answer-dialog__summary">
          <span class="assignment-health">${esc(renderAssignmentTypeLabel(type))}</span>
          <span class="student-assignment-status student-assignment-status--${getStudentAssignmentState(item).tone}">${esc(getStudentAssignmentState(item).label)}</span>
          <small>${submitted ? getStudentAssignmentState(item).detail : '未提出'}</small>
        </div>
        <div class="student-answer-dialog__question">
          <h4>${esc(item.title)}</h4>
          <p>${esc(item.questionText)}</p>
        </div>
        ${type === 'choice' ? `<div class="assignment-options" data-assignment-options="${item.id}">
          ${(item.choices || []).map((choice, index) => `
            <label class="assignment-option ${submitted?.choiceIndex === index ? 'is-selected' : ''} ${submitted && correctIndex === index ? 'is-correct-choice' : ''} ${submitted && submitted.choiceIndex === index && !submitted.isCorrect ? 'is-wrong-choice' : ''}">
              <input type="radio" name="assignment-${item.id}" value="${index}" ${submitted?.choiceIndex === index ? 'checked' : ''}>
              <span>${esc(choice)}</span>
              ${submitted && correctIndex === index ? '<em>正解</em>' : ''}
            </label>
          `).join('')}
        </div>` : type === 'text' ? `
          <label class="form-field">
            <span class="form-label">回答テキスト</span>
            <textarea class="sa-textarea assignment-text-answer" data-text-answer rows="8" maxlength="4000" placeholder="ここに回答を入力">${esc(submitted?.answer?.text || '')}</textarea>
          </label>
        ` : `
          <div class="assignment-file-answer">
            <label class="form-field">
              <span class="form-label">提出ファイル</span>
              <input class="sa-input" data-file-answer type="file" accept=".doc,.docx,.pdf,image/*">
            </label>
            ${submitted?.answer?.file ? `<div class="assignment-feedback is-good">提出済み: ${renderAnswerPreview(submitted.answer, item.choices)}</div>` : '<small>Word / PDF / 画像、10MB以下</small>'}
          </div>
        `}
        ${renderStudentAssignmentFeedback(item)}
        <div class="student-answer-dialog__actions">
          <button class="sa-btn sa-btn--ghost" type="button" data-course-action="open-material" data-id="${item.materialId}">教材を見る</button>
          <button class="sa-btn se-btn--primary" type="button" data-assignment-action="submit" data-id="${item.id}">${submitted ? '再提出' : '回答を提出'}</button>
        </div>
      </section>`;
  }
  function openStudentAssignmentDialog(id) {
    const item = getAssignmentById(id);
    if (!item) return showToast('課題が見つかりません。', 'error');
    if (els.studentAssignmentDialogTitle) els.studentAssignmentDialogTitle.textContent = item.submission ? '回答を確認・再提出' : '回答を提出';
    if (els.studentAssignmentDialogMeta) els.studentAssignmentDialogMeta.textContent = `${item.materialTitle || '教材'} / ${renderAssignmentTypeLabel(item.assignmentType)}`;
    if (els.studentAssignmentDialogContent) els.studentAssignmentDialogContent.innerHTML = renderStudentAssignmentDialogContent(item);
    openModal(els.studentAssignmentDialogBackdrop);
  }
  function closeStudentAssignmentDialog() {
    closeModal(els.studentAssignmentDialogBackdrop);
  }
  function renderStudentAssignments(assignments = state.assignmentsCache || [], materialTitle = '') {
    const orderedAssignments = [
      ...assignments.filter(item => !item.submission),
      ...assignments.filter(item => item.submission)
    ];
    return `
      <section class="admin-section student-assignment-section">
        <div class="admin-section__head">
          <div>
            <h4>${esc(materialTitle || '練習キュー')}</h4>
            <p>この教材に紐づく問題だけを表で表示しています。回答は行の操作から開きます。</p>
          </div>
        </div>
        ${renderStudentAssignmentSummary(assignments)}
        ${assignments.length ? `
          <div class="clean-table-wrap">
            <table class="clean-table student-assignment-table">
              <thead>
                <tr><th>状態</th><th>問題</th><th>方式</th><th>提出内容</th><th>更新</th><th>操作</th></tr>
              </thead>
              <tbody>
                ${orderedAssignments.map(item => {
          const stateInfo = getStudentAssignmentState(item);
          const type = item.assignmentType || 'choice';
          const submitted = item.submission;
          return `
                  <tr class="${submitted ? 'is-submitted-row' : 'is-pending-row'}">
                    <td><span class="student-assignment-status student-assignment-status--${stateInfo.tone}">${esc(stateInfo.label)}</span></td>
                    <td><strong>${esc(item.title)}</strong><span>${esc(item.questionText)}</span></td>
                    <td>${esc(renderAssignmentTypeLabel(type))}</td>
                    <td>${submitted ? renderAnswerPreview(submitted.answer, item.choices) : '<span>未提出</span>'}</td>
                    <td>${submitted ? stateInfo.detail : '-'}</td>
                    <td>
                      <div class="clean-actions">
                        <button class="sv-btn sv-btn--ghost" type="button" data-course-action="open-material" data-id="${item.materialId}">教材</button>
                        <button class="sv-btn" type="button" data-assignment-action="open-answer" data-id="${item.id}">${submitted ? '確認・再提出' : '回答'}</button>
                      </div>
                    </td>
                  </tr>`;
        }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="data-empty">この教材にはまだ公開中の課題がありません。</div>'}
      </section>`;
  }
  function renderAssignmentsCourseList() {
    if (!els.assignmentsCourseList) return;
    els.assignmentsCourseList.innerHTML = '';
  }
  function renderAssignmentsWorkspace() {
    if (!els.assignmentsWorkspace) return;
    const role = state.currentUser?.role || 'student';
    const course = getCurrentCourse();
    if (!course) {
      els.assignmentsWorkspace.innerHTML = `
        <section class="clean-main">
          <div class="clean-empty">${role === 'student' ? '授業を選択すると、公開中の練習問題がここに表示されます。' : '授業を選択すると、練習問題の作成と管理ができます。'}</div>
        </section>`;
      return;
    }
    const materials = getCourseMaterials(course.id);
    if (role === 'student') {
      const assignmentGroups = groupAssignmentsByMaterial(state.assignmentsCache || [], materials);
      const selectedGroup = getSelectedAssignmentMaterial(assignmentGroups);
      if (selectedGroup && String(state.selectedAssignmentMaterialId || '') !== String(selectedGroup.materialId)) {
        state.selectedAssignmentMaterialId = selectedGroup.materialId;
      }
      const assignmentCount = (state.assignmentsCache || []).length;
      const selectedStats = getAssignmentGroupStats(selectedGroup?.assignments || []);
      els.assignmentsWorkspace.innerHTML = `
        <section class="clean-main student-assignment-admin">
          <div class="clean-main__head">
            <div>
              <h3>練習問題</h3>
              <p>${esc(course.name)} / ${assignmentCount ? '教材を選ぶと、その教材の問題だけを表示します。' : '公開中の練習問題はまだありません。'}</p>
            </div>
          </div>
          <div class="admin-toolbar admin-toolbar--student-assignment">
            <label>
              <span>授業</span>
              <select class="sa-select" data-student-assignment-course-select>
                ${(state.coursesCache || []).map(item => `<option value="${item.id}" ${String(state.currentCourseId) === String(item.id) ? 'selected' : ''}>${esc(item.name)} / ${esc(item.semester || '学期未設定')}</option>`).join('')}
              </select>
            </label>
            <label>
              <span>教材</span>
              <select class="sa-select" data-assignment-material-select ${assignmentGroups.length ? '' : 'disabled'}>
                ${assignmentGroups.length ? assignmentGroups.map(group => {
        const stats = getAssignmentGroupStats(group.assignments);
        const incomplete = Math.max(0, stats.total - stats.submitted);
        return `<option value="${group.materialId}" ${String(selectedGroup?.materialId) === String(group.materialId) ? 'selected' : ''}>${esc(group.materialTitle)}${incomplete ? `（未完了 ${incomplete}）` : '（完了）'}</option>`;
      }).join('') : '<option value="">課題なし</option>'}
              </select>
            </label>
            <div class="admin-toolbar__metrics">
              <span>進度 ${selectedStats.progress}%</span>
              <span>提出 ${selectedStats.submitted}/${selectedStats.total}</span>
              <span>${selectedStats.total - selectedStats.submitted ? `未完了 ${selectedStats.total - selectedStats.submitted}` : '完了'}</span>
            </div>
            <div class="admin-toolbar__actions">
              <button class="sa-btn sa-btn--ghost" type="button" data-view="courses">教材を見る</button>
            </div>
          </div>
          ${assignmentGroups.length && selectedGroup ? renderStudentAssignments(selectedGroup.assignments, selectedGroup.materialTitle) : '<div class="data-empty">この授業にはまだ公開中の練習問題がありません。</div>'}
        </section>`;
      return;
    }
    const published = materials.filter(item => item.status === 'published').length;
    els.assignmentsWorkspace.innerHTML = `
      <section class="clean-main">
        <div class="clean-main__head">
          <div>
            <h3>${esc(course.name)}</h3>
            <p>${esc(course.semester || '学期未設定')} / 公開教材 ${published} 件</p>
          </div>
          <div class="clean-actions">
            <button class="sa-btn sa-btn--ghost" type="button" data-view="courses">教材管理へ</button>
          </div>
        </div>
        ${renderTeacherAssignmentPanel(materials)}
      </section>`;
  }
  function renderAssignmentsPage() {
    if (els.assignmentsTitle) els.assignmentsTitle.textContent = (state.currentUser?.role || 'student') === 'student' ? '練習問題' : '課題管理';
    if (els.assignmentsHint) {
      els.assignmentsHint.textContent = (state.currentUser?.role || 'student') === 'student'
        ? '参加中の授業から公開中の練習問題に回答します。'
        : '公開教材に紐づけて練習問題を作成し、提出状況を確認します。';
    }
    renderAssignmentsCourseList();
    renderAssignmentsWorkspace();
  }
  function renderTeacherManagementWorkspace(course) {
    if (!course) {
      return `
        <section class="clean-main">
          <div class="clean-empty">
            授業を選択するか、新しい授業を作成してください。
          </div>
        </section>`;
    }
    const items = state.courseMaterialsCache || [];
    const published = items.filter(item => item.status === 'published').length;
    const drafts = items.length - published;
    return `
      <section class="clean-main">
        <div class="clean-main__head">
          <div>
            <h3>${esc(course.name)}</h3>
            <p>${esc(course.semester || '学期未設定')} / 授業コード ${esc(course.inviteCode)}</p>
          </div>
          <div class="clean-actions">
            <button class="sa-btn se-btn--primary" type="button" data-course-action="new-material" data-id="${course.id}">教材作成</button>
            <button class="sa-btn sa-btn--ghost" type="button" data-course-action="edit-course" data-id="${course.id}">授業編集</button>
            <button class="sa-btn sa-btn--ghost" type="button" data-view="materials">分析を見る</button>
          </div>
        </div>
        <div class="clean-metrics">
          <span>教材 ${items.length}</span>
          <span>公開 ${published}</span>
          <span>下書き ${drafts}</span>
          <span>参加者 ${course.memberCount || 0}</span>
        </div>
        ${renderTeacherMaterialTable(items)}
      </section>`;
  }
  function renderCourseWorkspace() {
    if (!els.courseWorkspace) return;
    const role = state.currentUser?.role || 'student';
    const course = getCurrentCourse();
    if (role !== 'student') {
      els.courseWorkspace.innerHTML = renderTeacherManagementWorkspace(course);
      return;
    }
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
      ? materials
        .filter(item => item.hasStudentWork)
        .slice()
        .sort((a, b) => new Date(b.workUpdatedAt || b.updatedAt || 0) - new Date(a.workUpdatedAt || a.updatedAt || 0))
        .slice(0, 4)
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
                        <p class="student-material-card__date">教材更新 ${fmt(item.materialUpdatedAt || item.updatedAt)}${item.workUpdatedAt ? ` / 自分の保存 ${fmt(item.workUpdatedAt)}` : ''}</p>
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
                        <p class="student-history-item__meta">自分の保存 ${fmt(item.workUpdatedAt || item.updatedAt)}</p>
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
            <aside class="clean-course-nav">
              <div class="clean-course-nav__head">
                <h3>授業</h3>
                <button class="sv-btn" type="button" data-course-action="new-course">新規</button>
              </div>
              <div class="clean-empty">まだ担当授業がありません。</div>
            </aside>`;
      renderDashboardSummary();
      renderCourseWorkspace();
      return;
    }
    if (role !== 'student') {
      els.courseList.innerHTML = `
            <aside class="clean-course-nav">
              <div class="clean-course-nav__head">
                <h3>授業</h3>
                <button class="sv-btn" type="button" data-course-action="new-course">新規</button>
              </div>
              <div class="clean-course-list">
                ${state.coursesCache.map(course => `
                  <button class="clean-course-item ${String(state.currentCourseId) === String(course.id) ? 'is-active-course' : ''}" type="button" data-course-action="focus" data-id="${course.id}">
                    <strong>${esc(course.name)}</strong>
                    <span>${esc(course.semester || '学期未設定')} / 教材 ${course.materialCount || 0}</span>
                  </button>
                `).join('')}
              </div>
            </aside>`;
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
  function actionLabel(actionType) {
    const labels = {
      keyword: '非表示・キーワード化',
      popup: 'ポップアップ',
      marker: 'マーカー',
      color: '文字色',
      emphasis: '強調',
      'font-size': '文字サイズ',
      'clear-style': '装飾解除',
      'image-insert': '画像追加',
      'image-resize': '画像サイズ',
      'image-align': '画像配置',
      'image-move': '画像移動',
      'image-delete': '画像削除'
    };
    return labels[actionType] || actionType || 'その他';
  }
  function familyLabel(family) {
    const labels = {
      keyword: '縮略中心',
      popup: '注釈中心',
      marker: '強調整理',
      color: '色分け整理',
      emphasis: '視覚強調',
      revision: '修正調整',
      image: '画像活用',
      other: 'その他'
    };
    return labels[family] || family || '未分類';
  }
  function maxCount(rows) {
    return Math.max(1, ...((rows || []).map(row => Number(row.count || row.totalActions || 0))));
  }
  function renderBarRows(rows, { labelKey = 'actionType', valueKey = 'count', labelFn = value => value, metaFn = null } = {}) {
    const max = maxCount(rows);
    if (!rows?.length) return '<div class="analytics-empty">まだ学生操作データがありません。</div>';
    return rows.map(row => {
      const value = Number(row[valueKey] || 0);
      const pct = Math.max(4, Math.round((value / max) * 100));
      const meta = metaFn ? metaFn(row) : `${value} 件`;
      return `
        <div class="analytics-bar-row">
          <div class="analytics-bar-row__top">
            <span>${esc(labelFn(row[labelKey], row))}</span>
            <strong>${esc(meta)}</strong>
          </div>
          <div class="analytics-bar"><span style="width:${pct}%"></span></div>
        </div>`;
    }).join('');
  }
  function renderStudentStrategyRows(students) {
    if (!students?.length) return '<div class="analytics-empty">学生ごとの操作傾向は、学生が教材を加工すると表示されます。</div>';
    return students.slice(0, 8).map(student => {
      const families = student.families || {};
      const total = Math.max(1, Number(student.totalActions || 0));
      const segments = ['keyword', 'marker', 'popup', 'color', 'emphasis', 'revision', 'image', 'other']
        .map(family => {
          const count = Number(families[family] || 0);
          if (!count) return '';
          const width = Math.max(5, Math.round((count / total) * 100));
          return `<span class="strategy-segment strategy-segment--${family}" style="width:${width}%" title="${familyLabel(family)} ${count}"></span>`;
        }).join('');
      return `
        <article class="strategy-row">
          <div class="strategy-row__main">
            <div class="strategy-row__name">${esc(student.studentName || student.studentEmail || `学生 ${student.studentId}`)}</div>
            <div class="strategy-row__meta">${esc(familyLabel(student.dominantFamily))} / ${student.totalActions || 0} 操作 / ${student.uniqueActions || 0} 種類</div>
          </div>
          <div class="strategy-track">${segments || '<span class="strategy-segment strategy-segment--other" style="width:100%"></span>'}</div>
        </article>`;
    }).join('');
  }
  function erpRate(value) {
    return value == null ? '-' : `${Math.round(Number(value) * 100)}%`;
  }
  function erpPct(value) {
    return `${Number(value || 0)}%`;
  }
  function actionFilterLabel(value) {
    if (!value) return 'すべて';
    return actionLabel(value);
  }
  function renderErpFilterBar(materials, insights) {
    const students = insights?.students || [];
    const actionTypes = [
      ['', 'すべて'],
      ['keyword', '本文縮約'],
      ['marker', 'マーカー'],
      ['color', '文字色'],
      ['emphasis', '強調'],
      ['font-size', '文字サイズ'],
      ['popup', '注釈'],
      ['clear-style', '修正'],
      ['image-insert', '画像追加'],
      ['image-resize', '画像サイズ'],
      ['image-align', '画像配置'],
      ['image-move', '画像移動'],
      ['image-delete', '画像削除']
    ];
    return `
      <div class="erp-filterbar">
        <label><span>教材</span><select data-analytics-filter="material">
          <option value="">全教材</option>
          ${materials.map(item => `<option value="${item.id}" ${String(state.analysisMaterialId || '') === String(item.id) ? 'selected' : ''}>${esc(item.title || '無題')}</option>`).join('')}
        </select></label>
        <label><span>学生</span><select data-analytics-filter="student">
          <option value="">全学生</option>
          ${students.map(student => `<option value="${student.studentId}" ${String(state.analysisStudentFilterId || '') === String(student.studentId) ? 'selected' : ''}>${esc(student.studentName || student.studentEmail || `学生 ${student.studentId}`)}</option>`).join('')}
        </select></label>
        <label><span>操作</span><select data-analytics-filter="action">
          ${actionTypes.map(([value, label]) => `<option value="${value}" ${String(state.analysisActionFilter || '') === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}
        </select></label>
      </div>`;
  }
  function renderErpOverview(insights) {
    const totals = insights?.totals || {};
    return `
      <div class="erp-kpi-grid">
        <article><span>参加率</span><strong>${erpPct(totals.participationRate)}</strong><small>${totals.startedStudents || 0}/${totals.enrolledStudents || 0} 人が操作</small></article>
        <article><span>保存率</span><strong>${erpPct(totals.saveRate)}</strong><small>${totals.savedStudents || 0} 人が保存</small></article>
        <article><span>縮約参加</span><strong>${erpPct(totals.reductionParticipationRate)}</strong><small>${totals.reductionStudents || 0} 人が本文縮約</small></article>
        <button class="erp-kpi-card erp-kpi-card--action" type="button" data-analytics-action="open-attention-detail">
          <span>要確認候補</span><strong>${totals.attentionCount || 0}</strong><small>未参加・装飾のみ・置換語確認</small>
        </button>
      </div>`;
  }
  function renderErpProcess(insights) {
    const p = insights?.processTotals || {};
    return `
      <div class="erp-process-grid">
        <article class="erp-process-card erp-process-card--primary">
          <div><span>本文縮約プロセス</span><strong>${p.reductionActions || 0}</strong></div>
          <p>隠す・キーワード化の回数。この方法で最も重要な理解加工の痕跡です。</p>
          <div class="erp-metric-grid">
            <span><small>削減文字</small><strong>${p.hiddenChars || 0}</strong></span>
            <span><small>縮約率</small><strong>${erpRate(p.reductionRate)}</strong></span>
            <span><small>反復編集</small><strong>${p.repeatedReductionEdits || 0}</strong></span>
          </div>
        </article>
        <article class="erp-process-card">
          <div><span>本文装飾プロセス</span><strong>${p.formattingActions || 0}</strong></div>
          <p>マーカー・色・強調。最低限の参加確認には有効ですが、理解の深さは別途確認します。</p>
          <div class="erp-metric-grid">
            <span><small>注釈</small><strong>${p.annotationActions || 0}</strong></span>
            <span><small>修正</small><strong>${p.revisionActions || 0}</strong></span>
            <span><small>画像/配置</small><strong>${p.layoutActions || 0}</strong></span>
          </div>
        </article>
        <article class="erp-process-card erp-process-card--review">
          <div><span>置換語確認候補</span><strong>${p.replacementReviewCount || 0}</strong></div>
          <p>短縮表現やキーワードの妥当性は単純な文字数で判定しない方針です。教師または人工知能による確認の対象です。</p>
          <button class="sv-btn sv-btn--ghost" type="button" data-analytics-action="open-replacement-detail">候補を見る</button>
        </article>
      </div>`;
  }
  function renderErpAttention(insights) {
    const items = insights?.attentionQueue || [];
    return `
      <section class="erp-panel">
        <div class="erp-panel__head"><div><h4>確認候補一覧</h4><p>採点ではなく、授業中・授業後に確認すべき学生を自動抽出します。</p></div></div>
        <div class="erp-attention-list">
          ${items.length ? items.slice(0, 8).map(item => `
            <button class="erp-attention-item erp-attention-item--${esc(item.severity || 'medium')}" type="button" data-analytics-action="open-student-detail" data-id="${item.studentId || ''}">
              <strong>${esc(item.studentName || '学生')}</strong>
              <span>${esc(item.message || '')}</span>
            </button>
          `).join('') : '<div class="analysis-empty">現在、強く確認すべき項目はありません。</div>'}
        </div>
      </section>`;
  }
  function renderErpMaterials(insights) {
    const materials = insights?.materials || [];
    return `
      <section class="erp-panel">
        <div class="erp-panel__head"><div><h4>教材診断</h4><p>教材ごとの参加・本文縮約・要確認項目を比較します。</p></div></div>
        <div class="erp-material-grid">
          ${materials.length ? materials.map(item => `
            <button class="erp-material-card ${String(state.analysisMaterialId || '') === String(item.materialId) ? 'is-active' : ''}" type="button" data-analytics-action="select-material" data-id="${item.materialId}">
              <strong>${esc(item.materialTitle || '無題')}</strong>
              <span>参加 ${erpPct(item.participationRate)} / 保存 ${erpPct(item.saveRate)}</span>
              <div class="erp-card-meter"><i style="width:${Math.max(4, Number(item.participationRate || 0))}%"></i></div>
              <small>本文縮約 ${item.reductionActions || 0} / 装飾のみ ${item.formattingOnlyStudents || 0} / 確認 ${item.attentionCount || 0}</small>
            </button>
          `).join('') : '<div class="analysis-empty">教材データがありません。</div>'}
        </div>
      </section>`;
  }
  function renderErpBlockMap(insights) {
    const blocks = insights?.blocks || [];
    return `
      <section class="erp-panel">
        <div class="erp-panel__head">
          <div><h4>段落別縮約マップ</h4><p>単なる操作熱量ではなく、段落ごとの本文縮約と反復編集を見ます。</p></div>
          <button class="sv-btn sv-btn--ghost" type="button" data-analytics-action="open-heatmap-detail">詳細</button>
        </div>
        <div class="erp-block-map">
          ${blocks.length ? blocks.slice(0, 10).map(block => {
      const reductionScore = Math.min(100, Math.max(4, Number(block.reductionActions || 0) * 12));
      return `
              <button class="erp-block-row" type="button" data-analytics-action="open-block-detail" data-id="${esc(`${block.materialId || ''}:${block.blockId || ''}`)}">
                <span>${esc(block.blockText || block.blockId || '位置不明')}</span>
                <div><i style="width:${reductionScore}%"></i></div>
                <strong>${block.reductionActions || 0}</strong>
                <small>削減 ${block.hiddenChars || 0}字 / 率 ${erpRate(block.reductionRate)}</small>
              </button>`;
    }).join('') : '<div class="analysis-empty">本文縮約の対象段落データがありません。</div>'}
        </div>
      </section>`;
  }
  function renderErpStudentProfiles(insights) {
    const students = insights?.students || [];
    return `
      <section class="erp-panel">
        <div class="erp-panel__head"><div><h4>学生別加工傾向</h4><p>学生ごとの参加・縮約深度・試行錯誤を確認します。</p></div></div>
        <div class="erp-student-profile-list">
          ${students.length ? students.slice(0, 10).map(student => `
            <button class="erp-student-profile ${student.needsAttention ? 'needs-attention' : ''}" type="button" data-analytics-action="open-student-detail" data-id="${student.studentId}">
              <div><strong>${esc(student.studentName || student.studentEmail || `学生 ${student.studentId}`)}</strong><span>${esc(student.strategyLabel || '')}</span></div>
              <div class="erp-metric-grid erp-metric-grid--student">
                <span><small>操作</small><strong>${student.actionCount || 0}</strong></span>
                <span><small>本文縮約</small><strong>${student.reductionActions || 0}</strong></span>
                <span><small>反復</small><strong>${student.repeatedReductionEdits || 0}</strong></span>
                <span><small>確認</small><strong>${student.replacementReviewCount || 0}</strong></span>
              </div>
            </button>
          `).join('') : '<div class="analysis-empty">学生データがありません。</div>'}
        </div>
      </section>`;
  }
  function renderAnalyticsPanel(course, items) {
    const summary = String(state.analyticsCourseId) === String(state.currentCourseId)
      ? state.analyticsSummary
      : null;
    const totals = summary?.totals || {};
    const byAction = summary?.byAction || [];
    const byMaterial = summary?.byMaterial || [];
    const byBlock = summary?.byBlock || [];
    const byStudent = summary?.byStudent || [];
    const sequences = summary?.sequences || [];
    return `
      <section class="analytics-panel">
        <div class="analytics-panel__head">
          <div>
            <h3 class="analytics-panel__title">学生操作データ分析</h3>
            <p class="analytics-panel__desc">どの教材で、どの機能が、どのような順番で使われたかを授業単位で確認します。</p>
          </div>
          <div class="workspace-actions">
            <button class="sv-btn sv-btn--ghost" type="button" data-analytics-action="refresh-course" data-id="${course.id}">更新</button>
            <button class="sv-btn" type="button" data-analytics-action="export-course" data-id="${course.id}">操作記録を書き出し</button>
          </div>
        </div>
        ${state.analyticsLoading ? '<div class="analytics-empty">操作データを読み込んでいます...</div>' : `
          <div class="analytics-kpi-grid">
            <article><span>操作数</span><strong>${totals.operations || 0}</strong></article>
            <article><span>学生数</span><strong>${totals.students || 0}</strong></article>
            <article><span>教材数</span><strong>${totals.materials || 0}</strong></article>
            <article><span>セッション</span><strong>${totals.sessions || 0}</strong></article>
          </div>
          <div class="analytics-grid">
            <section class="analytics-card">
              <h4>機能別の使われ方</h4>
              ${renderBarRows(byAction, {
      labelFn: actionLabel,
      metaFn: row => `${row.count || 0} 件 / ${row.students || 0} 人`
    })}
            </section>
            <section class="analytics-card">
              <h4>教材別の操作量</h4>
              ${renderBarRows(byMaterial, {
      labelKey: 'materialTitle',
      labelFn: (value, row) => value || `教材 ${row.materialId}`,
      metaFn: row => `${row.count || 0} 件 / ${row.students || 0} 人`
    })}
            </section>
            <section class="analytics-card analytics-card--wide">
              <h4>学生ごとの操作思路</h4>
              <div class="strategy-legend">
                <span class="strategy-dot strategy-dot--keyword"></span>縮略
                <span class="strategy-dot strategy-dot--marker"></span>マーカー
                <span class="strategy-dot strategy-dot--popup"></span>注釈
                <span class="strategy-dot strategy-dot--emphasis"></span>強調
                <span class="strategy-dot strategy-dot--revision"></span>修正
              </div>
              <div class="strategy-list">${renderStudentStrategyRows(byStudent)}</div>
            </section>
            <section class="analytics-card">
              <h4>よく加工された位置</h4>
              ${renderBarRows(byBlock.slice(0, 8), {
      labelKey: 'blockId',
      labelFn: (value, row) => `${row.materialTitle || '教材'} / ${value || '位置不明'}`,
      metaFn: row => `${row.count || 0} 件`
    })}
            </section>
            <section class="analytics-card">
              <h4>よく見られる操作順</h4>
              ${renderBarRows(sequences, {
      labelKey: 'key',
      labelFn: value => String(value || '').split(' -> ').map(familyLabel).join(' -> '),
      metaFn: row => `${row.count || 0} 回`
    })}
            </section>
          </div>
        `}
      </section>`;
  }
  function renderDonutChart(rows) {
    const total = (rows || []).reduce((sum, row) => sum + Number(row.count || 0), 0);
    if (!total) return '<div class="analysis-empty">データなし</div>';
    let offset = 25;
    const colors = ['#0f766e', '#2563eb', '#eab308', '#7c3aed', '#f97316', '#ef4444', '#64748b'];
    const segments = rows.slice(0, 7).map((row, index) => {
      const value = Number(row.count || 0);
      const len = (value / total) * 100;
      const segment = `<circle r="15.915" cx="18" cy="18" fill="transparent" stroke="${colors[index]}" stroke-width="5" stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${offset}" />`;
      offset -= len;
      return segment;
    }).join('');
    return `
      <div class="donut-chart">
        <svg viewBox="0 0 36 36" aria-hidden="true">${segments}</svg>
        <div><strong>${total}</strong><span>操作</span></div>
      </div>`;
  }
  function parseMaterialBlocks(material) {
    if (!material?.htmlContent) return [];
    const tpl = document.createElement('template');
    tpl.innerHTML = material.htmlContent || '';
    const nodes = Array.from(tpl.content.querySelectorAll('[data-block-id], p, h1, h2, h3, li, blockquote, pre'));
    const seen = new Set();
    return nodes.map((node, index) => {
      const blockId = node.dataset.blockId || `block-${index + 1}`;
      if (seen.has(blockId)) return null;
      seen.add(blockId);
      return {
        blockId,
        tag: node.tagName.toLowerCase(),
        text: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 220) || '[画像・数式・空白ブロック]'
      };
    }).filter(Boolean);
  }
  function renderActionParams(event) {
    const params = event.actionParams || {};
    const bits = [];
    const action = event.actionType;
    if (action === 'keyword') bits.push(`置換: ${params.keyword || params.keywordText || '非表示'}`);
    if (action === 'popup') bits.push(`注釈: ${params.text || params.popupText || '-'}`);
    if (action === 'marker' || action === 'color') bits.push(`色: ${params.color || '-'}`);
    if (action === 'emphasis') bits.push(`種類: ${params.type || '-'}`);
    if (action === 'font-size') bits.push(`サイズ: ${params.size || '-'}`);
    if (action === 'image-insert') bits.push(`画像: ${params.fileName || params.image?.alt || '-'}`, `サイズ: ${params.fileSize || params.image?.srcLength || 0}`);
    if (action === 'image-resize') bits.push(`変更: ${params.before?.width || '-'} → ${params.after?.width || params.width || '-'}`);
    if (action === 'image-align') bits.push(`配置: ${params.before?.align || '-'} → ${params.after?.align || params.align || '-'}`);
    if (action === 'image-move') bits.push(`移動: ${params.before?.blockId || params.before?.parentTag || '-'} → ${params.after?.blockId || params.after?.parentTag || '-'}`);
    if (action === 'image-delete') bits.push(`削除画像: ${params.image?.alt || params.image?.imageId || '-'}`);
    if (!bits.length && event.selectedText) bits.push(`選択: ${event.selectedText}`);
    return bits.length ? bits.map(bit => `<span>${esc(bit)}</span>`).join('') : '<span>詳細なし</span>';
  }
  function renderBlockHeatmap(material, details) {
    const detailBlocks = material
      ? (details?.blocks || []).filter(block => String(block.materialId || '') === String(material.id || ''))
      : (details?.blocks || []);
    if (!material) {
      if (!detailBlocks.length) return '<div class="analysis-empty">段落操作データがありません。</div>';
      const max = Math.max(1, ...detailBlocks.map(block => Number(block.count || 0)));
      return `
        <div class="heatmap-list">
          ${detailBlocks.map(block => {
        const level = block.count ? Math.ceil((Number(block.count || 0) / max) * 4) : 0;
        const topActions = Object.entries(block.actions || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
        return `
              <article class="heatmap-row heatmap-row--${level}">
                <div class="heatmap-row__score">
                  <strong>${block.count || 0}</strong>
                  <span>${block.students || 0}人</span>
                </div>
                <div class="heatmap-row__body">
                  <div class="heatmap-row__meta">${esc(block.materialTitle || '教材')} / ${esc(block.blockId || '位置不明')}</div>
                  <p>${esc(block.blockText || '本文情報なし')}</p>
                  <div class="heatmap-row__actions">${topActions.length ? topActions.map(([type, count]) => `<span>${esc(actionLabel(type))} ${count}</span>`).join('') : '<span>操作なし</span>'}</div>
                </div>
              </article>`;
      }).join('')}
        </div>`;
    }
    const blocks = parseMaterialBlocks(material);
    const byId = new Map(detailBlocks.map(block => [String(block.blockId || ''), block]));
    const fallback = detailBlocks.filter(block => !byId.has(String(block.blockId || '')) || !blocks.some(item => String(item.blockId) === String(block.blockId)));
    const rows = (blocks.length ? blocks : fallback).map((block, index) => {
      const stat = byId.get(String(block.blockId || '')) || block;
      return {
        blockId: block.blockId || stat.blockId || `block-${index + 1}`,
        text: block.text || stat.blockText || '本文なし',
        count: Number(stat.count || 0),
        students: Number(stat.students || 0),
        actions: stat.actions || {}
      };
    });
    const max = Math.max(1, ...rows.map(row => row.count));
    if (!rows.length) return '<div class="analysis-empty">この教材の段落情報がありません。</div>';
    return `
      <div class="heatmap-list">
        ${rows.map(row => {
      const level = row.count ? Math.ceil((row.count / max) * 4) : 0;
      const topActions = Object.entries(row.actions || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
      return `
            <article class="heatmap-row heatmap-row--${level}">
              <div class="heatmap-row__score">
                <strong>${row.count}</strong>
                <span>${row.students}人</span>
              </div>
              <div class="heatmap-row__body">
                <div class="heatmap-row__meta">${esc(row.blockId)}</div>
                <p>${esc(row.text)}</p>
                <div class="heatmap-row__actions">${topActions.length ? topActions.map(([type, count]) => `<span>${esc(actionLabel(type))} ${count}</span>`).join('') : '<span>操作なし</span>'}</div>
              </div>
            </article>`;
    }).join('')}
      </div>`;
  }
  function renderStudentTimeline(details) {
    const students = details?.students || [];
    const events = details?.events || [];
    if (!students.length) return '<div class="analysis-empty">学生の操作タイムラインはまだありません。</div>';
    const selectedId = state.selectedAnalysisStudentId && students.some(s => String(s.studentId) === String(state.selectedAnalysisStudentId))
      ? String(state.selectedAnalysisStudentId)
      : String(students[0].studentId);
    const studentEvents = events.filter(event => String(event.studentId) === selectedId);
    const visibleEvents = studentEvents.slice(-30);
    return `
      <div class="student-timeline-shell">
        <div class="student-picker">
          ${students.map(student => `
            <button class="${String(student.studentId) === selectedId ? 'is-active' : ''}" type="button" data-analytics-action="select-student" data-id="${student.studentId}">
              <strong>${esc(student.studentName || student.studentEmail || `学生 ${student.studentId}`)}</strong>
              <span>${student.count || 0}操作</span>
            </button>
          `).join('')}
        </div>
        <div class="timeline-list">
          ${studentEvents.length ? `
            <div class="timeline-list__summary">最新 ${visibleEvents.length} / 全 ${studentEvents.length} 操作</div>
            ${visibleEvents.map(event => `
            <article class="timeline-item timeline-item--${esc(event.actionFamily || 'other')}">
              <div class="timeline-item__time">${fmt(event.clientTime || event.createdAt)}</div>
              <div class="timeline-item__body">
                <div class="timeline-item__head">
                  <strong>${esc(actionLabel(event.actionType))}</strong>
                  <span>${esc(event.blockId || '位置不明')}</span>
                </div>
                ${event.selectedText ? `<p class="timeline-item__selection">${esc(event.selectedText).slice(0, 180)}</p>` : ''}
                <div class="timeline-item__params">${renderActionParams(event)}</div>
              </div>
            </article>
          `).join('')}` : '<div class="analysis-empty">この学生の操作はありません。</div>'}
        </div>
      </div>`;
  }
  function getSelectedAnalysisStudent(details) {
    const students = details?.students || [];
    if (!students.length) return null;
    if (state.selectedAnalysisStudentId) {
      const selected = students.find(student => String(student.studentId) === String(state.selectedAnalysisStudentId));
      if (selected) return selected;
    }
    return students[0];
  }
  function renderHeatmapOverview(selectedMaterial, details) {
    if (!selectedMaterial) return '<div class="analysis-empty">教材を選択すると段落ヒートマップを表示します。</div>';
    const blocks = (details?.blocks || []).filter(block => String(block.materialId || '') === String(selectedMaterial.id || ''));
    const max = Math.max(1, ...blocks.map(block => Number(block.count || 0)));
    if (!blocks.length) return '<div class="analysis-empty">この教材にはまだ段落操作データがありません。</div>';
    return `
      <div class="analysis-overview-list">
        ${blocks.slice(0, 6).map(block => {
      const width = Math.max(6, Math.round((Number(block.count || 0) / max) * 100));
      return `
            <button class="analysis-overview-row" type="button" data-analytics-action="open-block-detail" data-id="${esc(`${block.materialId || ''}:${block.blockId || ''}`)}">
              <span class="analysis-overview-row__label">${esc(block.blockText || block.blockId || '位置不明')}</span>
              <span class="analysis-overview-row__meter"><i style="width:${width}%"></i></span>
              <strong>${block.count || 0}</strong>
            </button>`;
    }).join('')}
      </div>
      <button class="sv-btn sv-btn--ghost" type="button" data-analytics-action="open-heatmap-detail">全段落を見る</button>`;
  }
  function renderStudentOverview(details) {
    const students = details?.students || [];
    if (!students.length) return '<div class="analysis-empty">学生操作データがありません。</div>';
    return `
      <div class="analysis-student-card-grid">
        ${students.slice(0, 6).map(student => `
          <button class="analysis-student-card ${String(student.studentId) === String(state.selectedAnalysisStudentId || '') ? 'is-active' : ''}" type="button" data-analytics-action="open-student-detail" data-id="${student.studentId}">
            <strong>${esc(student.studentName || student.studentEmail || `学生 ${student.studentId}`)}</strong>
            <span>${student.count || 0} 操作</span>
          </button>
        `).join('')}
      </div>`;
  }
  function openAnalysisDialog(kind, id = '') {
    const details = state.analyticsDetails || {};
    const insights = state.analyticsInsights || {};
    const selectedMaterial = state.analysisMaterialId
      ? (state.courseMaterialsCache || []).find(item => String(item.id) === String(state.analysisMaterialId))
      : null;
    if (!els.analysisDialogBackdrop) return;
    if (kind === 'heatmap') {
      els.analysisDialogTitle.textContent = '段落ヒートマップ詳細';
      els.analysisDialogMeta.textContent = selectedMaterial ? selectedMaterial.title : '教材未選択';
      els.analysisDialogContent.innerHTML = renderBlockHeatmap(selectedMaterial, details);
      openModal(els.analysisDialogBackdrop);
      return;
    }
    if (kind === 'block') {
      const rawId = String(id || '');
      const separatorIndex = rawId.indexOf(':');
      const blockMaterialId = separatorIndex >= 0 ? rawId.slice(0, separatorIndex) : String(selectedMaterial?.id || '');
      const blockId = separatorIndex >= 0 ? rawId.slice(separatorIndex + 1) : rawId;
      const sameBlock = item => String(item.blockId || '') === blockId
        && (!blockMaterialId || String(item.materialId || '') === blockMaterialId);
      const block = (details.blocks || []).find(sameBlock);
      const events = (details.events || []).filter(sameBlock);
      els.analysisDialogTitle.textContent = `段落 ${block?.blockId || blockId || '詳細'}`;
      els.analysisDialogMeta.textContent = `${block?.materialTitle || selectedMaterial?.title || '教材'} / ${block?.count || events.length || 0} 操作 / ${block?.students || 0} 人`;
      els.analysisDialogContent.innerHTML = `
        <div class="analysis-dialog-block">
          <p>${esc(block?.blockText || '本文情報なし')}</p>
          <div class="timeline-list">
            ${events.slice(-60).map(event => `
              <article class="timeline-item timeline-item--${esc(event.actionFamily || 'other')}">
                <div class="timeline-item__time">${fmt(event.clientTime || event.createdAt)}</div>
                <div class="timeline-item__body">
                  <div class="timeline-item__head"><strong>${esc(actionLabel(event.actionType))}</strong><span>${esc(event.studentName || event.studentEmail || '')}</span></div>
                  ${event.selectedText ? `<p class="timeline-item__selection">${esc(event.selectedText).slice(0, 180)}</p>` : ''}
                  <div class="timeline-item__params">${renderActionParams(event)}</div>
                </div>
              </article>
            `).join('') || '<div class="analysis-empty">この段落の操作はありません。</div>'}
          </div>
        </div>`;
      openModal(els.analysisDialogBackdrop);
      return;
    }
    if (kind === 'student') {
      state.selectedAnalysisStudentId = id || state.selectedAnalysisStudentId;
      const student = getSelectedAnalysisStudent(details);
      els.analysisDialogTitle.textContent = '学生操作タイムライン';
      els.analysisDialogMeta.textContent = student ? `${student.studentName || student.studentEmail || `学生 ${student.studentId}`} / ${student.count || 0} 操作` : '';
      els.analysisDialogContent.innerHTML = renderStudentTimeline(details);
      openModal(els.analysisDialogBackdrop);
      return;
    }
    if (kind === 'replacement') {
      const rows = insights.replacements || [];
      els.analysisDialogTitle.textContent = '置換語確認候補';
      els.analysisDialogMeta.textContent = `${rows.length} 件 / 文字数だけで評価しない項目`;
      els.analysisDialogContent.innerHTML = `
        <div class="replacement-review-list">
          ${rows.length ? rows.map(row => `
            <article class="replacement-review-item">
              <div><strong>${esc(row.studentName || '学生')}</strong><span>${esc(row.materialTitle || '')} / ${esc(row.blockId || '')}</span></div>
              <p>${esc(row.originalText || '')}</p>
              <div class="replacement-review-item__result"><span>${row.originalChars || 0}字</span><strong>→ ${esc(row.replacement || '')}</strong><span>${row.replacementChars || 0}字</span></div>
            </article>
          `).join('') : '<div class="analysis-empty">確認候補はありません。</div>'}
        </div>`;
      openModal(els.analysisDialogBackdrop);
      return;
    }
    if (kind === 'attention') {
      const rows = insights.attentionQueue || [];
      els.analysisDialogTitle.textContent = '要確認候補';
      els.analysisDialogMeta.textContent = `${rows.length} 件 / 教師が授業中・授業後に確認する対象`;
      els.analysisDialogContent.innerHTML = `
        <div class="attention-detail-list">
          ${rows.length ? rows.map(row => `
            <button class="attention-detail-item attention-detail-item--${esc(row.severity || 'medium')}" type="button" data-analytics-action="open-student-detail" data-id="${row.studentId || ''}">
              <strong>${esc(row.studentName || '学生')}</strong>
              <span>${esc(row.message || '')}</span>
              <small>${row.type === 'not-started' ? '教材をまだ操作していない可能性があります。' : row.type === 'formatting-only' ? 'マーカー等は使っていますが、本文縮約がありません。' : row.type === 'replacement-review' ? '置換語・短縮語の妥当性を確認してください。' : '本文縮約の過程が少なく、理解過程の確認が必要です。'}</small>
            </button>
          `).join('') : '<div class="analysis-empty">現在、確認候補はありません。</div>'}
        </div>`;
      openModal(els.analysisDialogBackdrop);
    }
  }
  function renderDetailedAnalysisWorkspace(selectedMaterial, details) {
    if (!selectedMaterial) {
      return `
        <div class="analysis-focus-empty">
          <h4>教材を選択してください</h4>
          <p>詳細分析は教材単位で見ると読みやすくなります。上の教材タブから1つ選ぶと、段落ヒートマップと学生タイムラインを表示します。</p>
        </div>`;
    }
    return `
      <div class="analysis-detail-summary">
        <section class="analysis-detail-panel">
          <div class="analysis-detail-panel__head">
            <div>
              <h4>段落ヒートマップ</h4>
              <p>操作が集中した段落を上位だけ表示します。</p>
            </div>
          </div>
          ${renderHeatmapOverview(selectedMaterial, details)}
        </section>
        <section class="analysis-detail-panel">
          <div class="analysis-detail-panel__head">
            <div>
              <h4>学生タイムライン</h4>
              <p>学生を選ぶと詳細タイムラインを開きます。</p>
            </div>
          </div>
          ${renderStudentOverview(details)}
        </section>
      </div>`;
  }
  function renderCleanAnalysisPage(course) {
    if (!course) {
      return '<div class="analysis-empty">左側で授業を選択してください。</div>';
    }
    const insights = String(state.analyticsCourseId) === String(state.currentCourseId) ? state.analyticsInsights : null;
    const details = String(state.analyticsCourseId) === String(state.currentCourseId) ? state.analyticsDetails : null;
    const materials = state.courseMaterialsCache || [];
    const selectedMaterial = state.analysisMaterialId
      ? materials.find(item => String(item.id) === String(state.analysisMaterialId))
      : null;
    return `
      <section class="analysis-page">
        <div class="analysis-titlebar">
          <div>
            <h3>学習データ分析</h3>
            <p>${esc(course.name)}${selectedMaterial ? ` / ${esc(selectedMaterial.title)}` : ''} / ${actionFilterLabel(state.analysisActionFilter)}</p>
          </div>
          <div class="clean-actions">
            <button class="sv-btn sv-btn--ghost" type="button" data-analytics-action="refresh-course" data-id="${course.id}">更新</button>
            <button class="sv-btn" type="button" data-analytics-action="${selectedMaterial ? 'export-selected-material' : 'export-course'}" data-id="${selectedMaterial?.id || course.id}">書き出し</button>
          </div>
        </div>
        ${renderErpFilterBar(materials, insights)}
        ${state.analyticsInsightsLoading ? '<div class="analysis-empty">評価指標を読み込んでいます...</div>' : `
          ${renderErpOverview(insights)}
          ${renderErpProcess(insights)}
          <div class="erp-workbench-grid">
            <div class="erp-workbench-main">
              ${renderErpMaterials(insights)}
              ${renderErpBlockMap(insights)}
            </div>
            <div class="erp-workbench-side">
              ${renderErpAttention(insights)}
              ${renderErpStudentProfiles(insights)}
            </div>
          </div>
        `}
      </section>`;
  }
  function renderTeacherAnalysisView() {
    const course = getCurrentCourse();
    if (els.materialsSummary) {
      els.materialsSummary.innerHTML = `
        <aside class="clean-course-nav clean-course-nav--analysis">
          <div class="clean-course-nav__head">
            <h3>分析する授業</h3>
          </div>
          <div class="clean-course-list">
            ${(state.coursesCache || []).map(item => `
              <button class="clean-course-item ${String(state.currentCourseId) === String(item.id) ? 'is-active-course' : ''}" type="button" data-course-action="focus" data-id="${item.id}">
                <strong>${esc(item.name)}</strong>
                <span>${esc(item.semester || '学期未設定')}</span>
              </button>
            `).join('') || '<div class="clean-empty">担当授業がありません。</div>'}
          </div>
        </aside>`;
    }
    els.teacherMaterialList.innerHTML = renderCleanAnalysisPage(course);
    if (els.workList) els.workList.innerHTML = '';
  }
  function renderTeacherMaterialList() {
    if (!els.teacherMaterialList) return;
    const role = state.currentUser?.role || 'student';
    if (role !== 'teacher' && role !== 'admin') {
      els.teacherMaterialList.innerHTML = '';
      if (els.materialsSummary) els.materialsSummary.innerHTML = '';
      return;
    }
    renderTeacherAnalysisView();
    return;
    const course = getCurrentCourse();
    const items = state.courseMaterialsCache || [];
    const draftCount = items.filter(item => item.status === 'draft').length;
    const publishedCount = items.filter(item => item.status === 'published').length;
    const analyticsTotals = String(state.analyticsCourseId) === String(state.currentCourseId)
      ? (state.analyticsSummary?.totals || {})
      : {};
    if (els.materialsSummary) {
      const courseButtons = (state.coursesCache || []).map(item => `
            <button class="course-chip ${String(state.currentCourseId) === String(item.id) ? 'is-active-course' : ''}" type="button" data-course-action="focus" data-id="${item.id}">
              <span>${esc(item.name)}</span>
              <small>${item.materialCount || 0} 教材</small>
            </button>
          `).join('');
      els.materialsSummary.innerHTML = `
            <section class="teacher-course-shell">
              <div class="teacher-course-shell__head">
                <div>
                  <div class="teacher-course-shell__eyebrow">COURSE CONTEXT</div>
                  <h3 class="teacher-course-shell__title">${course ? esc(course.name) : '授業を選択してください'}</h3>
                  <p class="teacher-course-shell__desc">${course
          ? `${esc(course.name)} に紐づく教材と学生操作データだけを表示しています。`
          : '授業を選ぶと、その授業の教材・公開状態・学生操作データがまとまって表示されます。'
        }</p>
                </div>
                <div class="workspace-meta">
                  ${course ? `<span class="pill">${esc(course.semester || '学期未設定')}</span>` : ''}
                  ${course ? `<span class="pill">授業コード ${esc(course.inviteCode)}</span>` : ''}
                </div>
              </div>
              <div class="course-chip-row">${courseButtons || '<span class="workspace-row__meta">担当授業がまだありません。</span>'}</div>
              ${course ? `
                <div class="teacher-kpi-grid">
                  <article><span>教材</span><strong>${items.length}</strong><small>公開 ${publishedCount} / 下書き ${draftCount}</small></article>
                  <article><span>学生操作</span><strong>${analyticsTotals.operations || 0}</strong><small>記録済みイベント</small></article>
                  <article><span>参加学生</span><strong>${analyticsTotals.students || 0}</strong><small>操作データあり</small></article>
                  <article><span>分析対象</span><strong>${analyticsTotals.sessions || 0}</strong><small>セッション</small></article>
                </div>
              ` : ''}
            </section>
          `;
    }
    if (!course) {
      els.teacherMaterialList.innerHTML = '<div class="sv-empty"><h2>授業を選択してください</h2><p>担当授業を選ぶと、教材一覧と学生操作データ分析が表示されます。</p></div>';
      if (!state.currentWorkMaterialId) renderWorksPlaceholder();
      return;
    }
    const renderMaterialCard = item => `
      <article class="teacher-material-card">
        <div class="teacher-material-card__main">
          <div class="teacher-material-card__status ${item.status === 'published' ? 'is-published' : 'is-draft'}">${item.status === 'published' ? '公開中' : '下書き'}</div>
          <h4 class="teacher-material-card__title">${esc(item.title || '無題')}</h4>
          <p class="teacher-material-card__meta">ベース教材 ${esc(findLessonTitle(item.baseLessonId))} / 更新 ${fmt(item.updatedAt)}</p>
        </div>
        <div class="teacher-material-card__actions">
          <button class="sv-btn" type="button" data-material-action="edit" data-id="${item.id}">編集</button>
          <button class="sv-btn sv-btn--ghost" type="button" data-material-action="toggle-status" data-id="${item.id}" data-status="${item.status === 'published' ? 'draft' : 'published'}">${item.status === 'published' ? '公開を止める' : '学生へ公開'}</button>
          <button class="sv-btn sv-btn--ghost" type="button" data-material-action="works" data-id="${item.id}">学生作業</button>
          <button class="sv-btn sv-btn--ghost" type="button" data-analytics-action="export-material" data-id="${item.id}">教材記録を書き出し</button>
          <button class="sv-btn sv-btn--danger" type="button" data-saved-action="delete" data-id="${item.id}">削除</button>
        </div>
      </article>`;
    if (!items.length) {
      els.teacherMaterialList.innerHTML = `
            <section class="teacher-material-panel">
              <div class="data-panel__head">
                <div>
                  <h3 class="data-panel__title">教材一覧</h3>
                  <p class="data-panel__desc">${esc(course.name)} にはまだ教材がありません。教材を作成すると、公開状態と学生操作分析をこの画面で追えます。</p>
                </div>
                <div class="workspace-actions">
                  <button class="sa-btn se-btn--primary" type="button" data-course-action="new-material" data-id="${course.id}">教材を新規作成</button>
                </div>
              </div>
            </section>
            ${renderAnalyticsPanel(course, items)}`;
      renderWorksPlaceholder();
      return;
    }
    const drafts = items.filter(item => item.status === 'draft');
    const published = items.filter(item => item.status === 'published');
    if (!state.currentWorkMaterialId) renderWorksPlaceholder();
    els.teacherMaterialList.innerHTML = `
          <section class="teacher-material-panel">
            <div class="data-panel__head">
              <div>
                <h3 class="data-panel__title">教材一覧</h3>
                <p class="data-panel__desc">教材は授業ごとに分離されています。公開中だけが学生側に表示されます。</p>
              </div>
              <div class="workspace-actions">
                <button class="sa-btn se-btn--primary" type="button" data-course-action="new-material" data-id="${course.id}">教材を新規作成</button>
                <button class="sa-btn sa-btn--ghost" type="button" data-analytics-action="refresh-course" data-id="${course.id}">分析更新</button>
              </div>
            </div>
            <div class="teacher-material-sections">
              <div class="teacher-material-section">
                <div class="teacher-material-section__head">
                  <h4>公開中</h4>
                  <span>${published.length} 件</span>
                </div>
                <div class="teacher-material-list">${published.length ? published.map(renderMaterialCard).join('') : '<div class="data-empty">学生に公開中の教材はありません。</div>'}</div>
              </div>
              <div class="teacher-material-section">
                <div class="teacher-material-section__head">
                  <h4>下書き</h4>
                  <span>${drafts.length} 件</span>
                </div>
                <div class="teacher-material-list">${drafts.length ? drafts.map(renderMaterialCard).join('') : '<div class="data-empty">準備中の下書き教材はありません。</div>'}</div>
              </div>
            </div>
          </section>
          ${renderAnalyticsPanel(course, items)}
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
      state.currentWorkMaterialId = id;
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
                        <td>${esc(work.studentName || work.studentEmail || `学生 ${work.studentId}`)}</td>
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
    state.currentWorkMaterialId = null;
    els.workList.innerHTML = '<section class="data-panel"><div class="data-panel__head"><div><h3 class="data-panel__title">学生の作業一覧</h3><p class="data-panel__desc">教材管理の各行にある「学生一覧」から、保存済み学生を表形式で確認できます。</p></div></div></section>';
  }
  async function moveMaterialOrder(id, direction) {
    try {
      const data = await apiRequest(`/api/materials/${id}/order`, {
        method: 'PATCH',
        body: JSON.stringify({ direction })
      });
      state.courseMaterialsCache = data.materials || [];
      renderLessonSelect();
      renderTeacherMaterialList();
      renderDashboardSummary();
      renderCourseWorkspace();
      showToast('教材順序を更新しました。');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  async function handleTeacherMaterialClick(event) {
    const materialBtn = event.target.closest('[data-material-action]');
    if (materialBtn) {
      const action = materialBtn.dataset.materialAction;
      const id = materialBtn.dataset.id;
      if (!id && action !== 'clear-works') return false;
      if (action === 'edit') {
        await openTeacherMaterial(id);
        return true;
      }
      if (action === 'toggle-status') {
        await toggleMaterialStatus(id, materialBtn.dataset.status);
        return true;
      }
      if (action === 'works') {
        state.pendingWorkMaterialId = id;
        if (state.currentView !== 'materials') {
          setView('materials');
          return true;
        }
        state.pendingWorkMaterialId = null;
        await renderWorksForMaterial(id);
        return true;
      }
      if (action === 'move-order') {
        await moveMaterialOrder(id, materialBtn.dataset.direction);
        return true;
      }
      if (action === 'clear-works') {
        renderWorksPlaceholder();
        return true;
      }
    }

    const deleteBtn = event.target.closest('[data-saved-action="delete"]');
    if (deleteBtn) {
      await deleteSavedItem(deleteBtn.dataset.id);
      return true;
    }

    const previewBtn = event.target.closest('[data-saved-action="preview"]');
    if (previewBtn) {
      previewSavedItem(previewBtn.dataset.id);
      return true;
    }

    return false;
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
  function getDeviceInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      touch: isTouchMode(),
      mobileLayout: isMobileLayout(),
      userAgent: navigator.userAgent || '',
      language: navigator.language || ''
    };
  }
  function compactImageHtml(html) {
    return String(html || '').replace(/src=(["'])data:[^"']+\1/gi, 'src="[data-url]"');
  }
  function compactLargeStrings(value, key = '') {
    if (value == null) return value;
    if (typeof value === 'string') {
      const compacted = key.toLowerCase().includes('html') ? compactImageHtml(value) : value;
      return compacted.length > 1200 ? `${compacted.slice(0, 1200)}...` : compacted;
    }
    if (Array.isArray(value)) return value.map(item => compactLargeStrings(item, key));
    if (typeof value === 'object') {
      const out = {};
      for (const [childKey, childValue] of Object.entries(value)) {
        out[childKey] = compactLargeStrings(childValue, childKey);
      }
      return out;
    }
    return value;
  }
  function getCurrentMaterialVersionId() {
    const material = (state.courseMaterialsCache || []).find(item => String(item.id) === String(state.currentSavedId));
    const versionSource = [
      state.currentSavedId || '',
      material?.updatedAt || material?.materialUpdatedAt || '',
      material?.displayOrder ?? '',
      material?.status || '',
      state.baseLessonId || ''
    ].join('|');
    return stableHash(versionSource);
  }
  function getResearchBlocks() {
    return Array.from(els.lessonContainer.querySelectorAll('[data-block-id], p, h1, h2, h3, li, blockquote, pre'));
  }
  function getBlockOrder(blockEl) {
    if (!blockEl) return null;
    return getResearchBlocks().indexOf(blockEl);
  }
  function findResearchBlock(selection = {}) {
    const blocks = getResearchBlocks();
    if (selection.blockId && selection.blockId !== 'unknown') {
      const byId = blocks.find(block => String(block.dataset.blockId || '') === String(selection.blockId));
      if (byId) return byId;
    }
    if (Number.isFinite(Number(selection.blockOrder)) && blocks[Number(selection.blockOrder)]) {
      return blocks[Number(selection.blockOrder)];
    }
    return null;
  }
  function getBlockSnapshot(blockEl) {
    if (!blockEl) return {};
    const text = blockEl.textContent || '';
    return {
      text,
      html: compactImageHtml(blockEl.outerHTML || ''),
      hash: stableHash(text)
    };
  }
  function getPostOperationContext(selection = {}) {
    const block = findResearchBlock(selection);
    const snapshot = getBlockSnapshot(block);
    return {
      afterText: snapshot.text || '',
      afterHtml: snapshot.html || '',
      blockHash: snapshot.hash || selection.blockHash || ''
    };
  }
  function sanitizeOperationLogEntry(entry) {
    return compactLargeStrings(entry || {});
  }
  function getActionParams(entry) {
    const params = {};
    const researchKeys = new Set([
      'operationIndex',
      'materialVersionId',
      'blockOrder',
      'blockHash',
      'selectedTextHash',
      'beforeText',
      'afterText',
      'beforeHtml',
      'afterHtml',
      'replacementText',
      'normalizedReplacement',
      'previousEventId',
      'timeSincePreviousMs',
      'isRepeatedBlockEdit'
    ]);
    for (const [key, value] of Object.entries(entry || {})) {
      if (!['action', 'time', 'selection', 'clientEventId'].includes(key) && !researchKeys.has(key)) {
        params[key] = compactLargeStrings(value, key);
      }
    }
    return params;
  }
  function getReplacementFromEntry(entry) {
    if (!entry) return '';
    if (entry.action === 'keyword') return entry.keyword || entry.keywordText || '▽';
    if (entry.action === 'popup') return entry.text || entry.popupText || '';
    return '';
  }
  function enrichOperationResearchFields(entry) {
    const selection = entry.selection || {};
    const post = getPostOperationContext(selection);
    const previous = state.log.length ? state.log[state.log.length - 1] : null;
    const eventTime = entry.time || nowIso();
    const eventMs = new Date(eventTime).getTime();
    const previousMs = previous?.time ? new Date(previous.time).getTime() : NaN;
    const replacementText = getReplacementFromEntry(entry);
    const isRepeatedBlockEdit = !!selection.blockId && state.log.some(item => (
      String(item.selection?.blockId || '') === String(selection.blockId || '')
      && String(item.selection?.materialId || state.currentSavedId || '') === String(state.currentSavedId || '')
    ));
    return {
      ...entry,
      operationIndex: state.log.length + 1,
      materialVersionId: getCurrentMaterialVersionId(),
      blockOrder: selection.blockOrder ?? null,
      blockHash: selection.blockHash || post.blockHash || '',
      selectedTextHash: selection.selectedTextHash || stableHash(selection.text || ''),
      beforeText: selection.beforeText || selection.blockText || '',
      afterText: post.afterText || selection.afterText || '',
      beforeHtml: selection.beforeHtml || '',
      afterHtml: post.afterHtml || selection.afterHtml || '',
      replacementText,
      normalizedReplacement: normalizeReplacementText(replacementText),
      previousEventId: previous?.clientEventId || state.lastOperationEventId || '',
      timeSincePreviousMs: Number.isFinite(eventMs) && Number.isFinite(previousMs) ? Math.max(0, eventMs - previousMs) : null,
      isRepeatedBlockEdit
    };
  }
  function recordOperationEvent(entry) {
    if (!state.authToken || (state.currentUser?.role || 'student') !== 'student') return;
    if (!state.currentSavedId || !entry?.action) return;
    const payload = {
      clientEventId: entry.clientEventId || randomId('op'),
      sessionId: state.sessionId,
      materialId: state.currentSavedId,
      courseId: state.currentCourseId,
      baseLessonId: state.baseLessonId,
      actionType: entry.action,
      actionParams: getActionParams(entry),
      selection: compactLargeStrings(entry.selection || null, 'selection'),
      research: {
        operationIndex: entry.operationIndex,
        materialVersionId: entry.materialVersionId,
        blockOrder: entry.blockOrder,
        blockHash: entry.blockHash,
        selectedTextHash: entry.selectedTextHash,
        beforeText: compactLargeStrings(entry.beforeText || '', 'beforeText'),
        afterText: compactLargeStrings(entry.afterText || '', 'afterText'),
        beforeHtml: compactLargeStrings(entry.beforeHtml || '', 'beforeHtml'),
        afterHtml: compactLargeStrings(entry.afterHtml || '', 'afterHtml'),
        replacementText: entry.replacementText || '',
        normalizedReplacement: entry.normalizedReplacement || '',
        previousEventId: entry.previousEventId || '',
        timeSincePreviousMs: entry.timeSincePreviousMs,
        isRepeatedBlockEdit: !!entry.isRepeatedBlockEdit
      },
      clientTime: entry.time || nowIso(),
      device: getDeviceInfo()
    };
    apiRequest('/api/analytics/operation-events', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(() => { });
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
  function restoreState(s) {
    if (!s) return;
    els.lessonContainer.innerHTML = s.html;
    ensureResizableImages();
    state.log = s.log || [];
    const latest = state.log[state.log.length - 1] || null;
    state.lastOperationEventId = latest?.clientEventId || null;
    state.lastOperationAt = latest?.time || null;
    state.draftChangedAt = nowIso();
    saveDraft();
    markStudentAutoSaveDirty();
    syncMobileUndoButton();
  }
  function undo() { if (state.undoStack.length <= 1) { syncMobileUndoButton(); return false; } state.redoStack.push(snapshot()); const previous = state.undoStack.pop(); restoreState(previous); return true; }
  function redo() { if (!state.redoStack.length) return false; state.undoStack.push(snapshot()); restoreState(state.redoStack.pop()); return true; }
  function performMobileUndo() {
    if (undo()) showToast('元に戻しました。', 'warn');
    else showToast('元に戻せる変更がありません。', 'warn');
    syncMobileUndoButton();
  }
  function lockHistoryHotkey() { state.__historyHotkeyLock = true; clearTimeout(state.__historyHotkeyTimer); state.__historyHotkeyTimer = setTimeout(() => { state.__historyHotkeyLock = false; }, 80); }
  function addLog(entry) {
    const withId = {
      clientEventId: entry.clientEventId || randomId('op'),
      ...entry
    };
    const normalized = sanitizeOperationLogEntry(enrichOperationResearchFields(withId));
    state.log.push(normalized);
    state.lastOperationEventId = normalized.clientEventId;
    state.lastOperationAt = normalized.time || nowIso();
    state.draftChangedAt = nowIso();
    saveDraft();
    markStudentAutoSaveDirty();
    recordOperationEvent(normalized);
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
      await refreshCourseMaterials(state.currentCourseId);
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
      if ((state.currentUser?.role || 'student') !== 'student') {
        await refreshCourseMaterials(state.currentCourseId);
      }
      showToast('削除しました。');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function exportSavedItem(id) { const item = loadSaves().find(x => String(x.id) === String(id)); if (!item) return; downloadJSON(`${sanitizeFileName(item.title || 'gakuzai-save')}.json`, item); showToast('JSONを書き出しました。'); }
  function sanitizeFileName(s) { return String(s).replace(/[\\/:*?"<>|]+/g, '_'); }
  function exportAll() { downloadJSON('gakuzai-demo-data.json', { exportedAt: nowIso(), lessons: SAMPLE_LESSONS.map(l => ({ id: l.id, title: l.title })), saves: loadSaves() }); showToast('データを書き出しました。'); }
  async function exportOperationCsv({ courseId = null, materialId = null } = {}) {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (materialId) params.set('materialId', materialId);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    try {
      const response = await fetch(`/api/analytics/operations.csv${suffix}`, {
        headers: { Authorization: `Bearer ${state.authToken}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'CSV export failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const scope = materialId ? `material-${materialId}` : courseId ? `course-${courseId}` : 'all';
      a.href = url;
      a.download = `gakuzai-operation-events-${scope}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
      showToast('操作記録CSVを書き出しました。');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  function resetDemo() { if (!confirm('ツール並べ替え・現在のドラフトを初期化しますか？ データベースの保存済み教材は削除しません。')) return; localStorage.removeItem(STORAGE_KEYS.toolbar); localStorage.removeItem(STORAGE_KEYS.sidebar); clearDraft(); state.prefs = clone(DEFAULT_PREFS); savePrefs(state.prefs); state.desktopSidebarCollapsed = false; syncDesktopSidebarShell(); state.currentSavedId = null; renderToolbar(); renderSavedList(); loadLessonById(SAMPLE_LESSONS[0].id, { silent: true }); showToast('ローカル表示状態を初期化しました。', 'warn'); }

  function previewSavedItem(id) {
    const item = loadSaves().find(x => String(x.id) === String(id));
    if (!item) return;
    els.previewMeta.textContent = `${item.title} / 更新 ${fmt(item.updatedAt)}`;
    els.previewContent.innerHTML = item.htmlContent || '';
    openModal(els.previewDialogBackdrop);
  }
  function closePreview() { closeModal(els.previewDialogBackdrop); }
  function closeAnalysisDialog() { closeModal(els.analysisDialogBackdrop); }

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
    if (view === 'assignments' && !state.currentCourseId && state.coursesCache.length) {
      state.currentCourseId = state.coursesCache[0].id;
    }
    state.currentView = view;
    const isEditor = view === 'editor';
    const isSaved = view === 'saved';
    const isAssignments = view === 'assignments';
    els.editorView.hidden = !isEditor;
    els.savedView.hidden = !isSaved;
    if (els.coursesView) els.coursesView.hidden = view !== 'courses';
    if (els.assignmentsView) els.assignmentsView.hidden = !isAssignments;
    if (els.materialsView) els.materialsView.hidden = view !== 'materials';
    if (els.adminView) els.adminView.hidden = view !== 'admin';
    els.editorTopActions.hidden = !isEditor;
    els.savedTopActions.hidden = !isSaved;
    const titles = {
      courses: role === 'teacher' ? '授業・教材管理' : role === 'admin' ? '授業管理' : '授業一覧',
      editor: role === 'teacher' ? '教材編集' : '教材加工',
      saved: '学習記録',
      assignments: role === 'student' ? '練習問題' : '課題管理',
      materials: role === 'teacher' ? '学習データ分析' : '教材管理',
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
    if (view === 'assignments') {
      const refresh = state.currentCourseId ? refreshCourseMaterials(state.currentCourseId) : refreshCourses();
      refresh
        .then(renderAssignmentsPage)
        .catch(error => showToast(error.message, 'error'));
    }
    if (view === 'materials') {
      refreshCourseMaterials()
        .then(async () => {
          if (state.pendingWorkMaterialId) {
            const id = state.pendingWorkMaterialId;
            state.pendingWorkMaterialId = null;
            await renderWorksForMaterial(id);
            return;
          }
          if (role !== 'teacher') renderWorksPlaceholder();
        })
        .catch(error => showToast(error.message, 'error'));
    }
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


  function getSelectionInfo() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const text = sel.toString();
    let blockId = null;
    let blockText = null;
    let startOffset = null;
    let endOffset = null;
    let blockOrder = null;
    let blockHash = '';
    let beforeHtml = '';
    let html = '';
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const blockEl = node.closest?.('[data-block-id]') || node.closest?.('p, h1, h2, h3, li, blockquote, pre') || null;
    try {
      html = fragmentToHTML(range.cloneContents());
    } catch {
      html = '';
    }
    if (blockEl) {
      blockId = blockEl.dataset.blockId || null;
      blockText = blockEl.textContent || '';
      blockOrder = getBlockOrder(blockEl);
      blockHash = stableHash(blockText);
      beforeHtml = compactImageHtml(blockEl.outerHTML || '');
      try {
        const before = document.createRange();
        before.selectNodeContents(blockEl);
        before.setEnd(range.startContainer, range.startOffset);
        startOffset = before.toString().length;
        endOffset = startOffset + text.length;
      } catch {
        const idx = blockText.indexOf(text);
        startOffset = idx !== -1 ? idx : range.startOffset;
        endOffset = startOffset + text.length;
      }
    }
    if (!blockId) blockId = 'unknown';
    return {
      text,
      html,
      blockId,
      blockText,
      blockOrder,
      blockHash,
      selectedTextHash: stableHash(text),
      beforeText: blockText || '',
      beforeHtml,
      startOffset,
      endOffset
    };
  }

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
  function createImageDeleteButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'image-delete-btn';
    button.dataset.imageDelete = 'true';
    button.textContent = '削';
    button.setAttribute('aria-label', '画像を削除');
    return button;
  }
  function ensureImageChrome(wrapper) {
    if (!wrapper.dataset.imageId) wrapper.dataset.imageId = randomId('img');
    if (!wrapper.querySelector('.image-align-controls')) wrapper.appendChild(createImageAlignControls());
    if (!wrapper.querySelector('.image-delete-btn')) wrapper.appendChild(createImageDeleteButton());
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
    wrapper.dataset.imageId = randomId('img');
    wrapper.contentEditable = 'false';
    wrapper.draggable = true;
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', img.alt || '画像');
    wrapper.style.width = img.getAttribute('width') ? `${img.getAttribute('width')}px` : (img.style.width || 'min(100%, 420px)');
    wrapper.style.maxWidth = '100%';
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.draggable = false;
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
        existingWrapper.draggable = true;
        existingWrapper.tabIndex = 0;
        existingWrapper.setAttribute('role', 'img');
        existingWrapper.setAttribute('aria-label', img.alt || '画像');
        existingWrapper.style.maxWidth = '100%';
        img.draggable = false;
        if (!existingWrapper.classList.contains('image-align-left') && !existingWrapper.classList.contains('image-align-right')) {
          existingWrapper.classList.add('image-align-center');
        }
        return;
      }
      img.replaceWith(createResizableImage(img.cloneNode(true)));
    });
  }
  function getImageAlign(wrapper) {
    if (wrapper?.classList.contains('image-align-left')) return 'left';
    if (wrapper?.classList.contains('image-align-right')) return 'right';
    return 'center';
  }
  function getNodeIndex(node) {
    if (!node?.parentNode) return -1;
    return Array.from(node.parentNode.childNodes).indexOf(node);
  }
  function getImageBlock(wrapper) {
    return wrapper?.closest?.('[data-block-id], p, h1, h2, h3, li, blockquote, pre') || null;
  }
  function getImageOperationInfo(wrapper) {
    if (!wrapper) return null;
    const img = wrapper.querySelector('img');
    const block = getImageBlock(wrapper);
    const rect = wrapper.getBoundingClientRect();
    const src = img?.getAttribute('src') || '';
    return {
      imageId: wrapper.dataset.imageId || '',
      alt: img?.alt || '',
      srcType: src.startsWith('data:') ? 'data-url' : src ? 'url' : '',
      srcLength: src.length,
      width: wrapper.style.width || '',
      height: wrapper.style.height || '',
      renderedWidth: Math.round(rect.width || 0),
      renderedHeight: Math.round(rect.height || 0),
      align: getImageAlign(wrapper),
      imageIndex: Array.from(els.lessonContainer.querySelectorAll('.resizable-image')).indexOf(wrapper),
      parentTag: wrapper.parentElement?.tagName?.toLowerCase() || '',
      parentChildIndex: getNodeIndex(wrapper),
      blockId: block?.dataset?.blockId || '',
      blockTag: block?.tagName?.toLowerCase() || '',
      blockText: block?.textContent?.trim().slice(0, 200) || ''
    };
  }
  function getImageSelectionHtml(wrapper) {
    const clone = wrapper.cloneNode(true);
    clone.querySelectorAll('.image-align-controls, .image-delete-btn, .image-resize-handle').forEach(node => node.remove());
    const img = clone.querySelector('img');
    if (img) {
      const src = img.getAttribute('src') || '';
      img.setAttribute('src', src.startsWith('data:') ? '[data-url]' : src.slice(0, 240));
    }
    return clone.outerHTML;
  }
  function getImageSelectionInfo(wrapper) {
    const info = getImageOperationInfo(wrapper);
    if (!info) return null;
    const text = info.alt ? `[image: ${info.alt}]` : '[image]';
    const html = getImageSelectionHtml(wrapper);
    return {
      text,
      html,
      blockId: info.blockId || `image-${info.imageId || info.imageIndex}`,
      blockText: info.blockText,
      blockOrder: info.parentChildIndex,
      blockHash: stableHash(info.blockText || text),
      selectedTextHash: stableHash(text),
      beforeText: info.blockText || text,
      beforeHtml: html,
      startOffset: info.parentChildIndex,
      endOffset: info.parentChildIndex + 1
    };
  }
  function getRangePositionInfo(range) {
    if (!range) return null;
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const block = node?.closest?.('[data-block-id], p, h1, h2, h3, li, blockquote, pre') || null;
    return {
      parentTag: range.startContainer?.parentElement?.tagName?.toLowerCase?.() || node?.tagName?.toLowerCase?.() || '',
      offset: range.startOffset,
      blockId: block?.dataset?.blockId || '',
      blockTag: block?.tagName?.toLowerCase() || '',
      blockText: block?.textContent?.trim().slice(0, 200) || ''
    };
  }
  function setImageAlignment(wrapper, align) {
    if (!wrapper) return;
    pushUndo();
    const before = getImageOperationInfo(wrapper);
    wrapper.classList.remove('image-align-left', 'image-align-center', 'image-align-right');
    wrapper.classList.add(`image-align-${align}`);
    els.lessonContainer.querySelectorAll('.resizable-image.is-selected').forEach(node => {
      if (node !== wrapper) node.classList.remove('is-selected');
    });
    wrapper.classList.add('is-selected');
    const after = getImageOperationInfo(wrapper);
    addLog({ action: 'image-align', align, before, after, image: after, selection: getImageSelectionInfo(wrapper), time: nowIso() });
    saveDraft();
  }
  function getEditorDropRange(event) {
    const targetImage = event.target.closest?.('.resizable-image');
    if (targetImage && els.lessonContainer.contains(targetImage)) {
      const range = document.createRange();
      const rect = targetImage.getBoundingClientRect();
      const placeBefore = event.clientY < rect.top + rect.height / 2;
      range[placeBefore ? 'setStartBefore' : 'setStartAfter'](targetImage);
      range.collapse(true);
      return range;
    }
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (range && els.lessonContainer.contains(range.commonAncestorContainer)) return range;
    }
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (pos?.offsetNode && els.lessonContainer.contains(pos.offsetNode)) {
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        return range;
      }
    }
    const range = document.createRange();
    range.selectNodeContents(els.lessonContainer);
    range.collapse(false);
    return range;
  }
  function isRangeInsideNode(range, node) {
    return !!range && !!node && (node.contains(range.startContainer) || node === range.startContainer);
  }
  function selectImageWrapper(wrapper) {
    els.lessonContainer.querySelectorAll('.resizable-image.is-selected').forEach(node => {
      if (node !== wrapper) node.classList.remove('is-selected');
    });
    if (wrapper) {
      wrapper.classList.add('is-selected');
      wrapper.focus({ preventScroll: true });
      closeKeywordPopover();
    }
  }
  function deleteImageWrapper(wrapper) {
    if (!wrapper || !els.lessonContainer.contains(wrapper)) return false;
    pushUndo();
    const image = getImageOperationInfo(wrapper);
    const selection = getImageSelectionInfo(wrapper);
    wrapper.remove();
    addLog({ action: 'image-delete', image, selection, time: nowIso() });
    saveDraft();
    showToast('画像を削除しました。', 'warn');
    return true;
  }
  function deleteSelectedImage() {
    const wrapper = els.lessonContainer.querySelector('.resizable-image.is-selected');
    return deleteImageWrapper(wrapper);
  }
  function insertImageFile(file, range = null) {
    const reader = new FileReader();
    reader.onload = () => {
      pushUndo();
      const img = document.createElement('img');
      img.src = reader.result;
      img.alt = file.name || 'image';
      const wrapper = createResizableImage(img);
      insertImageAtCursor(wrapper, range);
      selectImageWrapper(wrapper);
      const image = getImageOperationInfo(wrapper);
      addLog({
        action: 'image-insert',
        fileName: file.name || 'image',
        fileType: file.type || '',
        fileSize: file.size || 0,
        image,
        selection: getImageSelectionInfo(wrapper),
        time: nowIso()
      });
      showToast('画像を追加しました。');
    };
    reader.readAsDataURL(file);
  }
  function insertImageAtCursor(node, suppliedRange = null) {
    const sel = window.getSelection();
    if (!suppliedRange && (!sel || sel.rangeCount === 0)) {
      els.lessonContainer.appendChild(node);
      saveDraft();
      return;
    }
    const range = suppliedRange || sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    saveDraft();
  }
  function moveImageToRange(wrapper, range) {
    if (!wrapper || !range || !els.lessonContainer.contains(wrapper) || isRangeInsideNode(range, wrapper)) return false;
    pushUndo();
    const before = getImageOperationInfo(wrapper);
    const target = getRangePositionInfo(range);
    const marker = document.createTextNode('');
    range.insertNode(marker);
    marker.parentNode.insertBefore(wrapper, marker);
    marker.remove();
    selectImageWrapper(wrapper);
    const after = getImageOperationInfo(wrapper);
    addLog({ action: 'image-move', before, target, after, image: after, selection: getImageSelectionInfo(wrapper), time: nowIso() });
    saveDraft();
    return true;
  }
  function handleImageDragStart(event) {
    const wrapper = event.target.closest?.('.resizable-image');
    if (!wrapper || event.target.closest('.image-align-controls, .image-delete-btn, .image-resize-handle')) return;
    state.imageDragState = { wrapper };
    selectImageWrapper(wrapper);
    wrapper.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'gakuzai-image');
  }
  function handleImageDragEnd() {
    state.imageDragState?.wrapper?.classList.remove('is-dragging');
    state.imageDragState = null;
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
    const before = getImageOperationInfo(wrapper);
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
      const after = getImageOperationInfo(wrapper);
      addLog({
        action: 'image-resize',
        width: wrapper.style.width,
        height: wrapper.style.height,
        before,
        after,
        image: after,
        selection: getImageSelectionInfo(wrapper),
        time: nowIso()
      });
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
    els.lessonContainer.addEventListener('paste', handleEditorPaste);
    els.lessonContainer.addEventListener('dragover', e => e.preventDefault());
    els.lessonContainer.addEventListener('drop', handleEditorDrop);
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
    const deleteBtn = event.target.closest('[data-image-delete]');
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      deleteImageWrapper(deleteBtn.closest('.resizable-image'));
      return;
    }
    const imageWrapper = event.target.closest('.resizable-image');
    if (imageWrapper) {
      selectImageWrapper(imageWrapper);
      return;
    }
    els.lessonContainer.querySelectorAll('.resizable-image.is-selected').forEach(node => node.classList.remove('is-selected'));
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
    if (event.__gakuzaiImagePasteHandled) return;
    const items = event.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        event.__gakuzaiImagePasteHandled = true;
        const file = item.getAsFile();
        if (file) insertImageFile(file);
        return;
      }
    }
  }

  function handleEditorDrop(event) {
    if (event.__gakuzaiImageDropHandled) return;
    event.preventDefault();
    event.__gakuzaiImageDropHandled = true;
    const dropRange = getEditorDropRange(event);
    if (state.imageDragState?.wrapper) {
      if (moveImageToRange(state.imageDragState.wrapper, dropRange)) {
        showToast('画像を移動しました。');
      }
      handleImageDragEnd();
      return;
    }
    const files = Array.from(event.dataTransfer?.files || []);
    files.filter(file => file.type.startsWith('image/')).forEach(file => insertImageFile(file, dropRange.cloneRange()));
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

    if ((event.key === 'Delete' || event.key === 'Backspace') && deleteSelectedImage()) {
      event.preventDefault();
      return;
    }

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

  async function createAssignmentFromPanel(root = document) {
    const materialId = Number(root.querySelector('#assignmentMaterialInput')?.value || 0);
    const title = root.querySelector('#assignmentTitleInput')?.value.trim() || '';
    const questionText = root.querySelector('#assignmentQuestionInput')?.value.trim() || '';
    const status = root.querySelector('#assignmentStatusInput')?.value || 'published';
    const dueAt = root.querySelector('#assignmentDueInput')?.value.trim() || '';
    const assignmentType = root.querySelector('[data-assignment-type-input]')?.value || 'choice';
    const rawChoices = Array.from(root.querySelectorAll('[data-assignment-choice]'))
      .sort((a, b) => Number(a.dataset.assignmentChoice) - Number(b.dataset.assignmentChoice))
      .map(input => input.value.trim());
    const originalCorrectIndex = Number(root.querySelector('#assignmentCorrectInput')?.value || 0);
    const choices = rawChoices.filter(Boolean);
    const correctChoiceIndex = rawChoices
      .slice(0, originalCorrectIndex + 1)
      .filter(Boolean).length - 1;
    if (!state.currentCourseId || !materialId) return showToast('授業と教材を選択してください。', 'warn');
    if (!title || !questionText) return showToast('課題タイトルと問題文を入力してください。', 'warn');
    if (assignmentType === 'choice' && choices.length < 2) return showToast('選択肢を2つ以上入力してください。', 'warn');
    if (assignmentType === 'choice' && (!rawChoices[originalCorrectIndex] || correctChoiceIndex < 0 || correctChoiceIndex >= choices.length)) return showToast('正解は入力済みの選択肢から選んでください。', 'warn');
    try {
      const editingId = state.editingAssignmentId;
      const data = await apiRequest(editingId ? `/api/assignments/${editingId}` : '/api/assignments', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          courseId: state.currentCourseId,
          materialId,
          title,
          assignmentType,
          questionText,
          choices: assignmentType === 'choice' ? choices : [],
          correctChoiceIndex: assignmentType === 'choice' ? correctChoiceIndex : 0,
          status,
          dueAt
        })
      });
      state.selectedAssignmentId = data.assignment?.id || state.selectedAssignmentId;
      state.editingAssignmentId = null;
      closeModal(els.assignmentDialogBackdrop);
      await refreshCourseAssignments(state.currentCourseId);
      showToast(editingId ? '練習問題を更新しました。' : '練習問題を保存しました。');
    } catch (error) {
      if (state.editingAssignmentId && error.status === 404) {
        await refreshCourseAssignments(state.currentCourseId).catch(() => []);
        showToast('練習問題を更新できませんでした。サーバーを再起動してから、問題リストで編集対象を選び直してください。', 'error', { duration: 5200 });
        return;
      }
      showToast(error.message, 'error');
    }
  }

  async function toggleAssignmentStatus(id, status) {
    try {
      await apiRequest(`/api/assignments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await refreshCourseAssignments(state.currentCourseId);
      showToast(status === 'published' ? '課題を公開しました。' : '課題を締め切りました。');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function deleteAssignment(id) {
    const item = getAssignmentById(id);
    const ok = await confirmAction({
      title: '練習問題を削除',
      message: `「${item?.title || 'この練習問題'}」を削除します。学生の提出データも削除されます。元に戻せません。`,
      confirmLabel: '削除'
    });
    if (!ok) return;
    try {
      await apiRequest(`/api/assignments/${id}`, { method: 'DELETE' });
      if (String(state.selectedAssignmentId) === String(id)) state.selectedAssignmentId = null;
      if (String(state.editingAssignmentId) === String(id)) state.editingAssignmentId = null;
      delete state.assignmentSubmissionsCache[String(id)];
      delete state.assignmentParticipantsCache[String(id)];
      await refreshCourseAssignments(state.currentCourseId);
      showToast('練習問題を削除しました。', 'warn');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function loadAssignmentResults(id) {
    if (!id) return;
    state.selectedAssignmentId = id;
    state.assignmentSubmissionsLoading = true;
    if (els.analysisDialogTitle) els.analysisDialogTitle.textContent = '練習結果';
    if (els.analysisDialogMeta) els.analysisDialogMeta.textContent = getAssignmentById(id)?.title || '';
    if (els.analysisDialogContent) els.analysisDialogContent.innerHTML = renderTeacherAssignmentResults();
    openModal(els.analysisDialogBackdrop);
    try {
      const data = await apiRequest(`/api/assignments/${id}/submissions`);
      state.assignmentSubmissionsCache[String(id)] = data.submissions || [];
      state.assignmentParticipantsCache[String(id)] = data.participants || [];
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      state.assignmentSubmissionsLoading = false;
      if (els.analysisDialogContent) els.analysisDialogContent.innerHTML = renderTeacherAssignmentResults();
      renderAssignmentsPage();
    }
  }

  async function saveSubmissionReview(assignmentId, submissionId, root = document) {
    const row = root.querySelector(`[data-submission-id="${CSS.escape(String(submissionId))}"]`);
    const reviewStatus = row?.querySelector('[data-review-status]')?.value || 'reviewed';
    const feedback = row?.querySelector('[data-review-feedback]')?.value.trim() || '';
    try {
      await apiRequest(`/api/assignments/${assignmentId}/submissions/${submissionId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ reviewStatus, feedback })
      });
      await loadAssignmentResults(assignmentId);
      showToast('フィードバックを保存しました。');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function submitAssignmentAnswer(id, root = document) {
    const assignment = getAssignmentById(id);
    const type = assignment?.assignmentType || 'choice';
    let payload = {};
    if (type === 'choice') {
      const optionGroup = Array.from(root.querySelectorAll('[data-assignment-options]'))
        .find(node => String(node.dataset.assignmentOptions) === String(id));
      const checked = optionGroup?.querySelector('input:checked');
      if (!checked) return showToast('回答を選択してください。', 'warn');
      payload = { choiceIndex: Number(checked.value) };
    } else if (type === 'text') {
      const textAnswer = root.querySelector('[data-text-answer]')?.value.trim() || '';
      if (!textAnswer) return showToast('テキスト回答を入力してください。', 'warn');
      payload = { textAnswer };
    } else if (type === 'file') {
      const file = root.querySelector('[data-file-answer]')?.files?.[0];
      if (!file) return showToast('提出ファイルを選択してください。', 'warn');
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      if (!allowed.includes(file.type)) return showToast('提出できるファイルは Word、PDF、画像のみです。', 'warn');
      if (file.size > 10 * 1024 * 1024) return showToast('提出ファイルは10MB以下にしてください。', 'warn');
      const dataUrl = await readFileAsDataUrl(file);
      payload = { file: { name: file.name, type: file.type, size: file.size, dataUrl } };
    }
    try {
      const data = await apiRequest(`/api/assignments/${id}/submissions`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await refreshCourseAssignments(state.currentCourseId);
      closeStudentAssignmentDialog();
      showToast(type === 'choice' && data.submission?.isCorrect ? '提出しました。正解です。' : '提出しました。');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleAssignmentActionClick(event) {
    const btn = event.target.closest('[data-assignment-action]');
    if (!btn) return false;
    const action = btn.dataset.assignmentAction;
    if (action === 'create') {
      await createAssignmentFromPanel(btn.closest('.assignment-form') || btn.closest('.assignment-panel') || document);
      return true;
    }
    if (action === 'new') {
      openAssignmentDialog(null);
      return true;
    }
    if (action === 'edit') {
      openAssignmentDialog(btn.dataset.id);
      return true;
    }
    if (action === 'cancel-edit') {
      closeAssignmentDialog();
      return true;
    }
    if (action === 'reset-filters') {
      state.assignmentMaterialFilter = '';
      state.assignmentStatusFilter = '';
      state.assignmentTypeFilter = '';
      renderAssignmentsPage();
      return true;
    }
    if (action === 'toggle-status') {
      await toggleAssignmentStatus(btn.dataset.id, btn.dataset.status || 'published');
      return true;
    }
    if (action === 'delete') {
      await deleteAssignment(btn.dataset.id);
      return true;
    }
    if (action === 'results') {
      await loadAssignmentResults(btn.dataset.id);
      return true;
    }
    if (action === 'open-answer') {
      openStudentAssignmentDialog(btn.dataset.id);
      return true;
    }
    if (action === 'close-answer') {
      closeStudentAssignmentDialog();
      return true;
    }
    if (action === 'review') {
      await saveSubmissionReview(btn.dataset.id, btn.dataset.submissionId, btn.closest('.assignment-results') || document);
      return true;
    }
    if (action === 'submit') {
      await submitAssignmentAnswer(btn.dataset.id, btn.closest('[data-student-assignment-dialog]') || btn.closest('.assignment-card') || document);
      return true;
    }
    return false;
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
      state.analysisMaterialId = null;
      state.analysisStudentFilterId = null;
      state.selectedAnalysisStudentId = null;
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
      const viewBtn = event.target.closest('[data-view]');
      if (viewBtn) {
        setView(viewBtn.dataset.view);
        return;
      }
      await handleCourseActionClick(event);
    });
    els.courseList?.addEventListener('change', async event => {
      const courseSelect = event.target.closest('[data-course-select]');
      if (!courseSelect) return;
      const courseId = Number(courseSelect.value || 0);
      if (!courseId || String(courseId) === String(state.currentCourseId)) return;
      state.analysisMaterialId = null;
      state.analysisStudentFilterId = null;
      state.selectedAnalysisStudentId = null;
      state.currentCourseId = courseId;
      await refreshCourseMaterials(state.currentCourseId);
      renderCourseList();
    });
    els.courseWorkspace?.addEventListener('click', async event => {
      const viewBtn = event.target.closest('[data-view]');
      if (viewBtn) {
        setView(viewBtn.dataset.view);
        return;
      }
      if (await handleAssignmentActionClick(event)) return;
      if (await handleTeacherMaterialClick(event)) return;
      await handleCourseActionClick(event);
    });
    els.assignmentsCourseList?.addEventListener('click', async event => {
      if (await handleCourseActionClick(event)) renderAssignmentsPage();
    });
    els.assignmentsWorkspace?.addEventListener('click', async event => {
      const viewBtn = event.target.closest('[data-view]');
      if (viewBtn) {
        setView(viewBtn.dataset.view);
        return;
      }
      if (await handleAssignmentActionClick(event)) return;
      await handleCourseActionClick(event);
    });
    els.assignmentsWorkspace?.addEventListener('change', event => {
      const studentCourseSelect = event.target.closest('[data-student-assignment-course-select]');
      if (studentCourseSelect) {
        const courseId = Number(studentCourseSelect.value || 0);
        if (!courseId || String(courseId) === String(state.currentCourseId)) return;
        state.selectedAssignmentMaterialId = null;
        state.currentCourseId = courseId;
        refreshCourseMaterials(state.currentCourseId).catch(error => showToast(error.message, 'error'));
        return;
      }
      const courseSelect = event.target.closest('[data-assignment-course-select]');
      if (courseSelect) {
        const courseId = Number(courseSelect.value || 0);
        if (!courseId || String(courseId) === String(state.currentCourseId)) return;
        state.assignmentMaterialFilter = '';
        state.assignmentStatusFilter = '';
        state.assignmentTypeFilter = '';
        state.currentCourseId = courseId;
        refreshCourseMaterials(state.currentCourseId).catch(error => showToast(error.message, 'error'));
        return;
      }
      const filter = event.target.closest('[data-assignment-filter]');
      if (filter) {
        const key = filter.dataset.assignmentFilter;
        if (key === 'material') state.assignmentMaterialFilter = filter.value;
        if (key === 'status') state.assignmentStatusFilter = filter.value;
        if (key === 'type') state.assignmentTypeFilter = filter.value;
        renderAssignmentsPage();
        return;
      }
      const typeInput = event.target.closest('[data-assignment-type-input]');
      if (!typeInput) return;
      const form = typeInput.closest('.assignment-form');
      const isChoice = typeInput.value === 'choice';
      form?.querySelectorAll('[data-choice-editor]').forEach(node => { node.hidden = !isChoice; });
      const help = form?.querySelector('[data-non-choice-help]');
      if (help) help.hidden = isChoice;
    });
    els.assignmentsWorkspace?.addEventListener('change', event => {
      const materialSelect = event.target.closest('[data-assignment-material-select]');
      if (!materialSelect) return;
      state.selectedAssignmentMaterialId = materialSelect.value;
      renderAssignmentsPage();
    });
    els.assignmentDialogBackdrop?.addEventListener('click', async event => {
      if (event.target === els.assignmentDialogBackdrop) {
        closeAssignmentDialog();
        return;
      }
      await handleAssignmentActionClick(event);
    });
    els.assignmentDialogBackdrop?.addEventListener('change', event => {
      const typeInput = event.target.closest('[data-assignment-type-input]');
      if (!typeInput) return;
      const form = typeInput.closest('.assignment-form');
      const isChoice = typeInput.value === 'choice';
      form?.querySelectorAll('[data-choice-editor]').forEach(node => { node.hidden = !isChoice; });
      const help = form?.querySelector('[data-non-choice-help]');
      if (help) help.hidden = isChoice;
    });
    els.closeAssignmentDialogBtn?.addEventListener('click', closeAssignmentDialog);
    els.studentAssignmentDialogBackdrop?.addEventListener('click', async event => {
      if (event.target === els.studentAssignmentDialogBackdrop) {
        closeStudentAssignmentDialog();
        return;
      }
      if (await handleAssignmentActionClick(event)) return;
      if (await handleCourseActionClick(event)) closeStudentAssignmentDialog();
    });
    els.closeStudentAssignmentDialogBtn?.addEventListener('click', closeStudentAssignmentDialog);
    els.analysisDialogContent?.addEventListener('click', event => {
      handleAssignmentActionClick(event).catch(error => showToast(error.message, 'error'));
    });
    els.joinCourseBtn?.addEventListener('click', joinCourse);
    els.createCourseBtn?.addEventListener('click', createCourse);
    els.confirmCourseDialogBtn?.addEventListener('click', submitCourseDialog);
    els.cancelCourseDialogBtn?.addEventListener('click', closeCourseDialog);
    els.courseDialogBackdrop?.addEventListener('click', event => { if (event.target === els.courseDialogBackdrop) closeCourseDialog(); });
    els.closeAnalysisDialogBtn?.addEventListener('click', closeAnalysisDialog);
    els.analysisDialogBackdrop?.addEventListener('click', event => { if (event.target === els.analysisDialogBackdrop) closeAnalysisDialog(); });
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
      if (courseBtn) {
        handleCourseActionClick(event).catch(error => showToast(error.message, 'error'));
        return;
      }
      const analyticsBtn = event.target.closest('[data-analytics-action]');
      if (analyticsBtn?.dataset.analyticsAction === 'export-material') {
        return exportOperationCsv({ courseId: state.currentCourseId, materialId: analyticsBtn.dataset.id });
      }
      if (analyticsBtn?.dataset.analyticsAction === 'select-material') {
        const materialId = analyticsBtn.dataset.id || null;
        return refreshAnalyticsSummary({ courseId: state.currentCourseId, materialId });
      }
      if (analyticsBtn?.dataset.analyticsAction === 'select-student') {
        state.selectedAnalysisStudentId = analyticsBtn.dataset.id || null;
        renderTeacherMaterialList();
        return;
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-heatmap-detail') {
        openAnalysisDialog('heatmap');
        return;
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-block-detail') {
        openAnalysisDialog('block', analyticsBtn.dataset.id || '');
        return;
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-student-detail') {
        openAnalysisDialog('student', analyticsBtn.dataset.id || '');
        return;
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-replacement-detail') {
        openAnalysisDialog('replacement');
        return;
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-attention-detail') {
        openAnalysisDialog('attention');
        return;
      }
      if (analyticsBtn?.dataset.analyticsAction === 'export-selected-material') {
        return exportOperationCsv({ courseId: state.currentCourseId, materialId: analyticsBtn.dataset.id });
      }
      if (analyticsBtn?.dataset.analyticsAction === 'refresh-course') {
        return refreshAnalyticsSummary({ courseId: analyticsBtn.dataset.id || state.currentCourseId });
      }
      handleTeacherMaterialClick(event).catch(error => showToast(error.message, 'error'));
    });
    els.teacherMaterialList?.addEventListener('change', event => {
      const control = event.target.closest('[data-analytics-filter]');
      if (!control) return;
      if (control.dataset.analyticsFilter === 'material') {
        state.analysisMaterialId = control.value || null;
      }
      if (control.dataset.analyticsFilter === 'student') {
        state.analysisStudentFilterId = control.value || null;
        state.selectedAnalysisStudentId = control.value || null;
      }
      if (control.dataset.analyticsFilter === 'action') {
        state.analysisActionFilter = control.value || '';
      }
      refreshAnalyticsSummary({ courseId: state.currentCourseId, materialId: state.analysisMaterialId })
        .catch(error => showToast(error.message, 'error'));
    });
    els.materialsSummary?.addEventListener('click', event => {
      const courseBtn = event.target.closest('[data-course-action]');
      if (courseBtn) {
        handleCourseActionClick(event).catch(error => showToast(error.message, 'error'));
        return;
      }
      const analyticsBtn = event.target.closest('[data-analytics-action]');
      if (analyticsBtn?.dataset.analyticsAction === 'export-course') {
        exportOperationCsv({ courseId: analyticsBtn.dataset.id || state.currentCourseId });
      }
      if (analyticsBtn?.dataset.analyticsAction === 'select-material') {
        refreshAnalyticsSummary({ courseId: state.currentCourseId, materialId: analyticsBtn.dataset.id || null });
      }
      if (analyticsBtn?.dataset.analyticsAction === 'select-student') {
        state.selectedAnalysisStudentId = analyticsBtn.dataset.id || null;
        renderTeacherMaterialList();
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-heatmap-detail') {
        openAnalysisDialog('heatmap');
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-block-detail') {
        openAnalysisDialog('block', analyticsBtn.dataset.id || '');
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-student-detail') {
        openAnalysisDialog('student', analyticsBtn.dataset.id || '');
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-replacement-detail') {
        openAnalysisDialog('replacement');
      }
      if (analyticsBtn?.dataset.analyticsAction === 'open-attention-detail') {
        openAnalysisDialog('attention');
      }
      if (analyticsBtn?.dataset.analyticsAction === 'export-selected-material') {
        exportOperationCsv({ courseId: state.currentCourseId, materialId: analyticsBtn.dataset.id });
      }
      if (analyticsBtn?.dataset.analyticsAction === 'refresh-course') {
        refreshAnalyticsSummary({ courseId: analyticsBtn.dataset.id || state.currentCourseId });
      }
    });
    els.workList?.addEventListener('click', event => {
      handleTeacherMaterialClick(event).catch(error => showToast(error.message, 'error'));
    });

    els.lessonContainer.addEventListener('click', handleLessonContainerClick);
    els.lessonContainer.addEventListener('pointerdown', startImageResize);
    els.lessonContainer.addEventListener('mouseup', handleEditorMouseUp);
    els.lessonContainer.addEventListener('beforeinput', handleEditorBeforeInput, { capture: true });
    els.lessonContainer.addEventListener('input', () => { state.draftChangedAt = nowIso(); saveDraft(); markStudentAutoSaveDirty(); });
    els.lessonContainer.addEventListener('paste', handleEditorPaste);
    els.lessonContainer.addEventListener('dragstart', handleImageDragStart);
    els.lessonContainer.addEventListener('dragend', handleImageDragEnd);
    els.lessonContainer.addEventListener('dragover', event => {
      if (state.imageDragState?.wrapper || Array.from(event.dataTransfer?.types || []).includes('Files')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = state.imageDragState?.wrapper ? 'move' : 'copy';
      }
    });
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

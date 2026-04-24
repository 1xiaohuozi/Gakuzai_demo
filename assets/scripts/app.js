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

      // 起動時に主要な DOM をまとめて参照しておく。
      const els = {
        body: document.body,
        lessonSelect: document.getElementById('lessonSelect'),
        lessonContainer: document.getElementById('lesson-container'),
        titleDisplay: document.getElementById('lesson-title-display'),
        hint: document.getElementById('hint'),
        toolbar: document.getElementById('toolbar'),
        saveBtn: document.getElementById('saveMaterialBtn'),
        loadBtn: document.getElementById('loadLessonBtn'),
        headerTitle: document.getElementById('headerTitle'),
        headerSubtitle: document.getElementById('headerSubtitle'),
        editorView: document.getElementById('editorView'),
        savedView: document.getElementById('savedView'),
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
        activeActionId: null,
        keywordDraft: '',
        popupDraft: '',
        lastScrollTop: 0,
        mobileOpen: false,
        mobileNavOpen: false,
        activeMobileTool: 'all',
        dragState: null,
        touchApplyTimer: null,
        lastTouchRange: null,
        lastTouchSelectionKey: '',
        touchSelectionUiLock: false,
        touchSelectionUiLockTimer: null,
        __historyHotkeyLock: false,
        draftChangedAt: null,
        authToken: localStorage.getItem(STORAGE_KEYS.authToken) || '',
        currentUser: null,
        savesCache: [],
        saveDialogResolver: null,
        confirmDialogResolver: null
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
      function showToast(msg, type = 'success') { const t = document.createElement('div'); t.className = `toast ${type === 'success' ? 'success' : type === 'warn' ? 'warn' : type === 'error' ? 'error' : ''}`; t.textContent = msg; els.toastWrap.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 220); }, 2600); }
      function loadSaves() { return state.savesCache || []; }
      function saveSaves(items) { state.savesCache = Array.isArray(items) ? items : []; }
      function saveDraft() { localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify({ currentLessonId: state.currentLessonId, baseLessonId: state.baseLessonId, currentSavedId: state.currentSavedId, html: els.lessonContainer.innerHTML, title: els.titleDisplay.textContent, log: state.log, draftChangedAt: state.draftChangedAt })); syncEditorStatusTag(); }
      function loadDraft() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.draft) || 'null'); } catch { return null; } }
      function clearDraft() { localStorage.removeItem(STORAGE_KEYS.draft); }
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
        const label = loggedIn ? (state.currentUser.displayName || state.currentUser.email) : '未ログイン';
        if (els.authStatus) els.authStatus.textContent = label;
        if (els.mobileAuthStatus) els.mobileAuthStatus.textContent = label;
        if (els.authForm) els.authForm.hidden = loggedIn;
        if (els.logoutBtn) els.logoutBtn.hidden = !loggedIn;
      }
      async function apiRequest(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (state.authToken) headers.Authorization = `Bearer ${state.authToken}`;
        const response = await fetch(path, { ...options, headers });
        if (response.status === 204) return null;
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) setAuthSession('', null);
          throw new Error(data.error || 'API request failed.');
        }
        return data;
      }
      async function refreshSaves() {
        if (!state.currentUser) {
          state.savesCache = [];
          renderSavedList();
          return [];
        }
        const data = await apiRequest('/api/materials');
        state.savesCache = data.materials || [];
        renderSavedList();
        return state.savesCache;
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
      function confirmAction({ title, message, confirmLabel = 'OK' }) {
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
      function pushUndo() { state.undoStack.push(snapshot()); if (state.undoStack.length > UNDO_MAX) state.undoStack.shift(); state.redoStack = []; }
      function restoreState(s) { if (!s) return; els.lessonContainer.innerHTML = s.html; state.log = s.log || []; saveDraft(); }
      function undo() { if (state.undoStack.length <= 1) return; state.redoStack.push(snapshot()); state.undoStack.pop(); restoreState(state.undoStack[state.undoStack.length - 1]); }
      function redo() { if (!state.redoStack.length) return; state.undoStack.push(snapshot()); restoreState(state.redoStack.pop()); }
      function lockHistoryHotkey() { state.__historyHotkeyLock = true; clearTimeout(state.__historyHotkeyTimer); state.__historyHotkeyTimer = setTimeout(() => { state.__historyHotkeyLock = false; }, 80); }
      function addLog(entry) { state.log.push(entry); state.draftChangedAt = nowIso(); saveDraft(); }

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
        els.lessonSelect.innerHTML = SAMPLE_LESSONS.map(l => `<option value="${l.id}">${esc(l.title)}</option>`).join('');
        if (!state.currentLessonId) state.currentLessonId = SAMPLE_LESSONS[0].id;
        els.lessonSelect.value = state.currentLessonId;
      }

      function loadLessonById(lessonId, options = {}) {
        const lesson = SAMPLE_LESSONS.find(l => l.id === lessonId);
        if (!lesson) return;
        state.currentLessonId = lesson.id;
        state.baseLessonId = lesson.id;
        state.currentSavedId = null;
        state.log = [];
        els.titleDisplay.textContent = lesson.title;
        els.lessonContainer.innerHTML = lesson.html;
        state.undoStack = [snapshot()];
        state.redoStack = [];
        clearCurrentAction();
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
        els.savedList.innerHTML = items.map(item => `
      <article class="sv-card">
        <div class="sv-card__top">
          <div>
            <h3 class="sv-card__title">${esc(item.title || '(no title)')}</h3>
            <div class="sv-card__source">元教材: ${esc(findLessonTitle(item.baseLessonId))}</div>
          </div>
          <div class="sv-card__meta">
            <span class="pill">ログ ${Array.isArray(item.log) ? item.log.length : 0} 件</span>
          </div>
        </div>
        <div class="sv-card__bottom">
          <div class="sv-card__dates">
            <span>作成 ${fmt(item.createdAt)}</span>
            <span>更新 ${fmt(item.updatedAt)}</span>
          </div>
          <div class="sv-card__actions">
            <button class="sv-btn sv-btn--ghost" type="button" data-saved-action="preview" data-id="${item.id}">プレビュー</button>
            <button class="sv-btn" type="button" data-saved-action="open" data-id="${item.id}">導入</button>
            <button class="sv-btn sv-btn--danger" type="button" data-saved-action="delete" data-id="${item.id}">削除</button>
          </div>
        </div>
      </article>
    `).join('');
      }
      function makeSorter(key) {
        const byDate = (field, dir) => (a, b) => { const ta = new Date(a[field] || 0).getTime(); const tb = new Date(b[field] || 0).getTime(); return dir === 'asc' ? ta - tb : tb - ta; };
        const byTitle = dir => (a, b) => { const ta = (a.title || '').toLowerCase(), tb = (b.title || '').toLowerCase(); if (ta < tb) return dir === 'asc' ? -1 : 1; if (ta > tb) return dir === 'asc' ? 1 : -1; return 0; };
        switch (key) { case 'updated_asc': return byDate('updatedAt', 'asc'); case 'created_desc': return byDate('createdAt', 'desc'); case 'created_asc': return byDate('createdAt', 'asc'); case 'title_asc': return byTitle('asc'); case 'title_desc': return byTitle('desc'); default: return byDate('updatedAt', 'desc'); }
      }
      function findLessonTitle(id) { return SAMPLE_LESSONS.find(l => l.id === id)?.title || '不明な教材'; }

      async function openSavedItem(id) {
        if (!state.currentUser) return showToast('ログインしてください。', 'warn');
        const item = loadSaves().find(x => String(x.id) === String(id));
        if (!item) return showToast('保存済み教材が見つかりません。', 'error');
        state.currentSavedId = item.id; state.currentLessonId = item.baseLessonId; state.baseLessonId = item.baseLessonId; state.log = Array.isArray(item.log) ? item.log : [];
        els.lessonSelect.value = item.baseLessonId;
        els.titleDisplay.textContent = item.title || findLessonTitle(item.baseLessonId);
        els.lessonContainer.innerHTML = item.htmlContent || '';
        state.undoStack = [snapshot()]; state.redoStack = [];
        saveDraft();
        setView('editor');
        recordEvent('material_load_into_editor', { materialId: item.id, title: item.title || '' });
        showToast('保存済み教材を読み込みました。');
      }

      async function saveCurrentMaterial() {
        if (!state.currentUser) return showToast('保存するにはログインしてください。', 'warn');
        if (!state.baseLessonId) return showToast('教材が選択されていません。', 'warn');
        const existing = loadSaves().find(x => String(x.id) === String(state.currentSavedId));
        const defaultTitle = existing?.title || `${els.titleDisplay.textContent}（加工版）`;
        const title = await requestSaveTitle(defaultTitle);
        if (!title) return;
        const now = nowIso();
        const payload = {
          baseLessonId: state.baseLessonId,
          title: title.trim(),
          htmlContent: els.lessonContainer.innerHTML,
          log: clone(state.log)
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
        state.currentView = view;
        const isEditor = view === 'editor';
        els.editorView.hidden = !isEditor;
        els.savedView.hidden = isEditor;
        els.editorTopActions.hidden = !isEditor;
        els.savedTopActions.hidden = isEditor;
        els.headerTitle.textContent = isEditor ? '加工教材' : '保存済み教材';
        els.headerSubtitle.textContent = isEditor
          ? 'ログイン中のユーザーごとに教材加工データと編集ツール設定を保存します。'
          : 'データベースに保存した教材を一覧管理できます。';
        document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
        if (view === 'saved') {
          recordEvent('view_saved_materials');
          refreshSaves().catch(error => showToast(error.message, 'error'));
        }
        closeKeywordPopover();
        closeMobileNav();
        syncEditorInteractionMode();
      }

      function syncEditorStatusTag() { els.editorStatusTag.textContent = state.currentSavedId ? '保存済み教材を再編集中' : '本文編集エリア'; }

      // contenteditable な教材本文に対して装飾を適用するための選択範囲ユーティリティ。
      function getActiveRange(container) { const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null; const range = sel.getRangeAt(0); return container.contains(range.commonAncestorContainer) ? range : null; }
      const BLOCK_SELECTOR = 'p, div, li, h1, h2, h3, blockquote, pre';
      function closestBlock(node, container) { let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement; if (!el) return null; if (el === container) return container; return el.closest(BLOCK_SELECTOR) || container; }
      function wrapRangeInline(range, builder) { const fragment = range.extractContents(); const wrapper = builder(fragment); range.insertNode(wrapper); range.collapse(false); return wrapper; }
      function wrapAcrossTextNodes(container, range, builder) { const textNodes = []; const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, { acceptNode(node) { if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT; try { return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } catch { return NodeFilter.FILTER_REJECT; } } }); while (walker.nextNode()) textNodes.push(walker.currentNode); for (let i = textNodes.length - 1; i >= 0; i--) { const tn = textNodes[i]; const len = tn.nodeValue.length; const start = (tn === range.startContainer) ? range.startOffset : 0; const end = (tn === range.endContainer) ? range.endOffset : len; if (start === end) continue; const r = document.createRange(); r.setStart(tn, start); r.setEnd(tn, end); const txt = r.toString(); if (!txt || !txt.trim()) continue; const frag = r.extractContents(); const wrapper = builder(frag); r.insertNode(wrapper); } try { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); range.collapse(false); } catch { } }
      function wrapSelectionSmart(container, builder) { const range = getActiveRange(container); if (!range) return null; const selectedText = range.toString(); if (!selectedText || !selectedText.trim()) return null; const startBlock = closestBlock(range.startContainer, container); const endBlock = closestBlock(range.endContainer, container); if (startBlock && endBlock && startBlock !== endBlock) { wrapAcrossTextNodes(container, range, builder); return true; } return wrapRangeInline(range, builder); }
      function applyKeyword(container, keywordText) {
        const keyword = keywordText || '▽';
        const range = getActiveRange(container);
        if (!range) return;

        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) return;

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
      function applyColor(container, color) { wrapSelectionSmart(container, frag => { const span = document.createElement('span'); span.style.color = color; span.appendChild(frag); return span; }); }
      function applyMarker(container, color) { wrapSelectionSmart(container, frag => { const span = document.createElement('span'); span.style.backgroundColor = color; span.appendChild(frag); return span; }); }
      function applyEmphasis(container, type) { wrapSelectionSmart(container, frag => { const el = document.createElement(type === 'underline' ? 'u' : 'strong'); el.appendChild(frag); return el; }); }
      function applyFontSize(container, size) { wrapSelectionSmart(container, frag => { const span = document.createElement('span'); span.style.fontSize = size; span.appendChild(frag); return span; }); }
      function applyPopup(container, text) { if (!text) return; wrapSelectionSmart(container, frag => { const span = document.createElement('span'); span.className = 'popup-anchor'; span.dataset.popup = text; span.appendChild(frag); return span; }); }
      function clearSelectionStyle(container) {
        const range = getActiveRange(container);
        if (!range) return;

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

      function syncMobileShell() { const mobile = isMobileLayout(); document.body.classList.toggle('mobile-tools-open', mobile && state.mobileOpen); els.mobileToolBackdrop.hidden = !(mobile && state.mobileOpen); document.querySelectorAll('[data-mobile-tool]').forEach(button => { const key = button.dataset.mobileTool; button.classList.toggle('is-active', mobile && state.mobileOpen && (key === state.activeMobileTool || (key === 'all' && state.activeMobileTool === 'all'))); }); }
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
        if (isMobileLayout()) return;
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
      function insertImageFile(file) { const reader = new FileReader(); reader.onload = () => { pushUndo(); const img = document.createElement('img'); img.src = reader.result; img.alt = file.name || 'image'; insertImageAtCursor(img); addLog({ action: 'image-insert', fileName: file.name || 'image', time: nowIso() }); showToast('画像を追加しました。'); }; reader.readAsDataURL(file); }
      function insertImageAtCursor(img) { const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) { els.lessonContainer.appendChild(img); saveDraft(); return; } const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(img); range.setStartAfter(img); range.setEndAfter(img); sel.removeAllRanges(); sel.addRange(range); saveDraft(); }

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
        els.lessonContainer.addEventListener('input', () => { state.draftChangedAt = nowIso(); saveDraft(); });
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
        els.toolbarPrefsBtn.addEventListener('click', () => { captureDraftInputs(); state.sortMode = !state.sortMode; renderToolbar(); });
        els.importJsonBtn.addEventListener('click', () => els.importJsonInput.click());
        els.importJsonInput.addEventListener('change', async event => { const file = event.target.files?.[0]; if (!file) return; try { const text = await file.text(); const parsed = JSON.parse(text); const items = loadSaves(); const incoming = Array.isArray(parsed) ? parsed : Array.isArray(parsed.saves) ? parsed.saves : [parsed]; const normalized = incoming.map(item => ({ id: item.id || `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, baseLessonId: item.baseLessonId || item.base_lesson_id || SAMPLE_LESSONS[0].id, title: item.title || 'Imported save', htmlContent: item.htmlContent || item.html_content || '', log: Array.isArray(item.log) ? item.log : [], createdAt: item.createdAt || item.created_at || nowIso(), updatedAt: item.updatedAt || item.updated_at || nowIso() })); saveSaves([...normalized, ...items]); renderSavedList(); showToast('JSON を取り込みました。'); } catch { showToast('JSON の取り込みに失敗しました。', 'error'); } finally { event.target.value = ''; } });
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

      function renderActionButton(action, groupId) {
        const activeClass = state.activeActionId === action.id ? ' is-active' : '';
        return `<button type="button" class="tool-btn tool-btn--${action.tone || 'dark'}${activeClass}" data-action-id="${action.id}" data-group-id="${groupId}"><span class="tool-btn__drag" draggable="true" data-drag-handle="action" data-action-id="${action.id}" data-group-id="${groupId}">⋮⋮</span><span class="tool-btn__label">${action.label}</span><span class="tool-btn__hint">${action.hint || ''}</span>${state.sortMode && isMobileLayout() ? `<span class="tool-btn__sort">${renderMoveControls('action', action.id)}</span>` : ''}</button>`;
      }

      function renderGroup(group) {
        const items = (state.prefs.itemOrder[group.id] || []).map(id => ACTION_MAP.get(id)).filter(Boolean);
        const inputs = group.id === 'conceal'
          ? `<div class="tool-group__inputs"><label class="toolbar-field"><span class="toolbar-field__label">キーワード <small>空なら非表示</small></span><input id="keywordText" class="toolbar-input" type="text" placeholder="例: ▽ / キーワードを入力"></label><label class="toolbar-field"><span class="toolbar-field__label">ポップアップテキスト</span><input id="popupText" class="toolbar-input" type="text" placeholder="例: 補足説明・語句の意味を入力"></label><label class="toolbar-field"><span class="toolbar-field__label">画像追加 <small>貼り付け/ドラッグも可</small></span><input id="imageInput" class="toolbar-input" type="file" accept="image/*"></label></div>`
          : '';

        return `<section class="tool-group${items.length ? '' : ' is-empty'}" data-group-id="${group.id}" id="tool-group-${group.id}"><div class="tool-group__head"><div class="tool-group__head-main"><div class="tool-group__title-row"><div class="tool-group__title">${group.title}</div><div class="tool-group__meta">${group.meta}</div></div><div class="tool-group__subtitle">${group.subtitle}</div></div><div class="tool-group__head-actions">${state.sortMode && isMobileLayout() ? renderMoveControls('group', group.id) : ''}<span class="tool-group__drag" draggable="true" data-drag-handle="group" data-group-id="${group.id}">⋮⋮</span></div></div><div class="tool-group__body">${inputs}<div class="tool-group__buttons" data-group-id="${group.id}">${items.map(action => renderActionButton(action, group.id)).join('')}</div><div class="tool-group__empty">ここにボタンをドラッグ</div></div></section>`;
      }

      function renderToolbar() {
        syncPrefsButton();
        els.toolbar.classList.toggle('is-sort-mode', state.sortMode);
        els.toolbar.innerHTML = `${state.sortMode ? `<div class="toolbar-sort-banner"><div><div class="toolbar-sort-banner__title">並べ替えモード</div><div class="toolbar-sort-banner__meta">PC はドラッグ、スマホは ↑↓ で順番を変更できます。</div></div><button type="button" id="tbResetLayout" class="toolbar-reset-btn">初期配置に戻す</button></div>` : ''}<div class="tool-groups">${state.prefs.groupOrder.map(groupId => renderGroup(GROUP_MAP.get(groupId))).join('')}</div>`;

        const keywordInput = els.toolbar.querySelector('#keywordText');
        if (keywordInput) keywordInput.value = state.keywordDraft;
        const popupInput = els.toolbar.querySelector('#popupText');
        if (popupInput) popupInput.value = state.popupDraft;

        restoreScroll();
        els.toolbar.querySelectorAll('.tool-btn').forEach(button => button.addEventListener('click', event => { if (state.sortMode) { if (event.target.closest('[data-mobile-move-kind]')) return; return; } triggerAction(button.dataset.actionId); }));
        els.toolbar.querySelectorAll('[data-mobile-move-kind]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); rememberScroll(); const kind = button.dataset.mobileMoveKind; const id = button.dataset.mobileMoveId; const delta = Number(button.dataset.mobileMoveDelta || 0); if (kind === 'group') moveGroupByDelta(id, delta); if (kind === 'action') moveActionByDelta(id, delta); renderToolbar(); }));
        els.toolbar.querySelector('#tbResetLayout')?.addEventListener('click', () => { state.prefs = clone(DEFAULT_PREFS); savePrefs(state.prefs); state.lastScrollTop = 0; renderToolbar(); });
        els.toolbar.querySelector('#imageInput')?.addEventListener('change', handleImagePicker);
        const scrollBox = getScrollBox();
        scrollBox?.addEventListener('scroll', () => state.lastScrollTop = scrollBox.scrollTop, { passive: true });
        wireDragHandlers();
        syncMobileShell();
        syncMobileNavShell();
        syncActiveButtons();
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
          const normalized = incoming.map(item => ({ id: item.id || `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, baseLessonId: item.baseLessonId || item.base_lesson_id || SAMPLE_LESSONS[0].id, title: item.title || 'Imported save', htmlContent: item.htmlContent || item.html_content || '', log: Array.isArray(item.log) ? item.log : [], createdAt: item.createdAt || item.created_at || nowIso(), updatedAt: item.updatedAt || item.updated_at || nowIso() }));
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

      function bindEvents() {
        renderLessonSelect();
        renderToolbar();
        bindTouchSelectionButton(els.mobileSelectionApplyBtn, () => applyTouchSelection(true));
        bindTouchSelectionButton(els.mobileSelectionCancelBtn, () => { window.getSelection()?.removeAllRanges(); hideMobileSelectionBar(); });

        document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
        document.querySelectorAll('[data-mobile-tool]').forEach(button => button.addEventListener('click', () => { const key = button.dataset.mobileTool || 'all'; if (state.mobileOpen && state.activeMobileTool === key) closeMobilePanel(); else openMobilePanel(key); }));
        els.mobileToolBackdrop.addEventListener('click', closeMobilePanel);
        els.mobileToolCloseBtn.addEventListener('click', closeMobilePanel);
        els.mobileNavOpenBtn.addEventListener('click', () => state.mobileNavOpen ? closeMobileNav() : openMobileNav());
        els.mobileNavCloseBtn.addEventListener('click', closeMobileNav);
        els.mobileNavDrawer.addEventListener('click', event => event.stopPropagation());
        els.mobileNavDialog.addEventListener('click', closeMobileNav);
        els.mobileNavDialog.addEventListener('cancel', event => { event.preventDefault(); closeMobileNav(); });
        els.mobileNavDialog.addEventListener('close', () => { els.mobileNavDialog.classList.remove('is-open', 'is-closing'); if (state.mobileNavOpen) { state.mobileNavOpen = false; syncMobileNavShell(); } });

        els.loadBtn.addEventListener('click', () => loadLessonById(els.lessonSelect.value));
        els.saveBtn.addEventListener('click', saveCurrentMaterial);
        els.savedSearchInput.addEventListener('input', renderSavedList);
        els.savedSortSelect.addEventListener('change', renderSavedList);
        els.savedList.addEventListener('click', handleSavedListClick);

        els.lessonContainer.addEventListener('click', handleLessonContainerClick);
        els.lessonContainer.addEventListener('mouseup', handleEditorMouseUp);
        els.lessonContainer.addEventListener('beforeinput', handleEditorBeforeInput, { capture: true });
        els.lessonContainer.addEventListener('input', () => { state.draftChangedAt = nowIso(); saveDraft(); });
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
        els.toolbarPrefsBtn.addEventListener('click', () => { captureDraftInputs(); state.sortMode = !state.sortMode; renderToolbar(); });
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
      setView('editor');
      syncEditorStatusTag();

    })();

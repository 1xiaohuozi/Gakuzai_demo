
      // ローカル完結デモで使う保存キー。
      const STORAGE_KEYS = {
        saves: 'gakuzai.demo.saves.v1',
        toolbar: 'gakuzai.toolbar.layout.v6',
        draft: 'gakuzai.demo.current.v1'
      };

      // 初期表示用の教材データ。
      // 既存挙動を崩さないため、取り込み済み文字列はこの段階ではそのまま保持する。
      const SAMPLE_LESSONS = [
        {
          id: 'lesson-1',
          title: '情報モラルとデジタル教材設計',
          html: `

                    <h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-1">練習問題</h3><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-2">1．この教科書紙面を縮小加工して授業で学習者に提示する授業資料もしくは自分のノート紙面を作ってみよう。</p><h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-3">電気回路を設計するということは，どのようなことか</h3><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-4">目的に応じた電気回路が，種々研究され定番的な回路として公開されている。電気回路の設計者は，それらの定番的な回路を組み合わせて，必要な動作を実現することになる。しかし同じ回路であっても，どの部分にどのような電気エネルギーを与えるのかは回路の目的によってさまざまである。</p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-5">　例えばLEDを光らせる回路は，LEDとLEDを流れる電流が大きくなりすぎないように電流量を調整するための電気抵抗を直列接続する回路しかない。LEDの種類や形式によって，光るために必要な印加電圧は異なる。またLEDを光らせる目的が，電源がONであることを示すためであれば数ミリアンペア程度の電流で充分であるが，TVなどの赤外線リモコンのための赤外線LEDであれば遠くまで届く強い光を出すために瞬間的に1アンペア程度の電流を流す必要がある。このため電気回路を設計する者は，目的や条件に応じて回路の電気抵抗の適正値を決めることになる。これが電気回路の設計である。</p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-6">　実際の電気回路はLEDと抵抗器一つだけのように単純なものは少なく，複数の電源や大量の抵抗器やコイル，コンデンサーなどで複雑に構成されている。電気回路を設計するためには，後述するKCL，KVLによって電流とインピーダンス，電流とインピーダンスと電圧の関係式を作り，それらの関係式を連立方程式として解く能力が必要である。</p><h2 style="margin: 0px 0px 0.5em; padding: 0px; vertical-align: baseline; font-size: 32.016px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-7">キルヒホッフの法則</h2><h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-8">キルヒホッフの電流則（KCL）</h3><p data-block-id="p1-9"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">キルヒホッフの電流則（Kirchhoff's current law : KCL）は，キルヒホッフの第一法則とも呼ばれる。これは，回路網の任意の接続点Aに着目して，Aに流れ込む電流の総和と流れ出る電流の総和が等しくなることを表している。</span></p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-10"><img src="https://www.is.kochi-u.ac.jp/~shiba_haru/gakuzai/kcl.png" width="200" data-block-id="p1-11"></p><p data-block-id="p1-12"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">流れ込む電流を&nbsp;</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">in 1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">in 2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，&nbsp;</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">in N</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">， 流れ出る電流を</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">out 1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">out 2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，&nbsp;</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">out M</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">　とすると以下となる。</span><math display="block" style="color: rgb(0, 0, 0);"><munderover><mi>∑</mi><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover><msub><mi>I</mi><mi>in j</mi></msub><mo>=</mo><munderover><mi>∑</mi><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>M</mi></munderover><msub><mi>I</mi><mi>out k</mi></msub></math><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">あるいは，流れ込む電流を＋，流れ出る電流を－として取り扱えば，以下の表現となる。</span><math display="block" style="color: rgb(0, 0, 0);"><munderover><mi>∑</mi><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover><msub><mi>I</mi><mi>in j</mi></msub><mo>+</mo><munderover><mi>∑</mi><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>M</mi></munderover><msub><mi>I</mi><mi>out k</mi></msub><mo>=</mo><mn>0</mn></math></p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-13"></p><h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-14">キルヒホッフの電圧則（KVL）</h3><p data-block-id="p1-15"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">キルヒホッフの電圧則（Kirchhoff's voltage law : KVL）は，キルヒホッフの第二法則とも呼ばれる。これは，回路網の任意の閉回路に着目して，閉回路を一周する間にある起電力の総和と電圧降下の総和が等しくなることを表している。ここで言う任意の閉回路とは，「網目のマス目の穴ひとつならどこを選んでも良い」ということになるが，それだけではなく「網目のどの糸をどのようにたどって何マス分を選んでもいいが，網目を辿って元の場所に戻る経路を一周する道のり」という意味である。</span></p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-16"><img src="https://www.is.kochi-u.ac.jp/~shiba_haru/gakuzai/kvl.png" width="400" data-block-id="p1-17"></p><p data-block-id="p1-18"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">閉回路に沿って存在する起電力を</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">V</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">V</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">V</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">N</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，閉回路に沿って存在するインピーダンスを</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">Z</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">Z</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">Z</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">M</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，各インピーダンスを流れる電流を</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">M</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">とすると，以下のように表される。</span><math display="block" style="color: rgb(0, 0, 0);"><munderover><mi>∑</mi><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover><msub><mi>V</mi><mi>j</mi></msub><mo>=</mo><munderover><mi>∑</mi><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>M</mi></munderover><msub><mi>Z</mi><mi>k</mi></msub><msub><mi>I</mi><mi>k</mi></msub></math></p>
                
    `
        },

        {
          id: 'lesson-2',
          title: '日本語読解と情報加工',
          html: `
      <h2 data-block-id="l2-1">読解における情報整理</h2>
      <p data-block-id="l2-2">文章読解において重要なのは、すべての情報を均等に処理するのではなく、重要な部分に注意を集中させることである。特に長文読解では、キーワードや主張部分を把握することが理解の鍵となる。</p>

      <p data-block-id="l2-3">例えば、難しい語句を<span style="background-color:#c8e6c9">キーワード表示</span>に変換し、必要に応じて展開できるようにすることで、学習者は自分のペースで理解を深めることができる。</p>

      <h3 data-block-id="l2-4">段階的提示の重要性</h3>
      <p data-block-id="l2-5">教材を一度にすべて提示するのではなく、段階的に提示することで、学習者の認知負荷を抑えることができる。このような設計は、特に外国語学習において有効である。</p>

      <ul>
        <li data-block-id="l2-6">初回：キーワードのみ表示</li>
        <li data-block-id="l2-7">2回目：一部詳細を追加</li>
        <li data-block-id="l2-8">最終：全文表示</li>
      </ul>

      <blockquote data-block-id="l2-9">「必要な支援を、必要な箇所に、必要なだけ与える」ことが理想的な教材設計である。</blockquote>

      <p data-block-id="l2-10">さらに、注釈ポップアップを活用することで、学習者は本文の流れを妨げずに補足情報を確認できる。このようなインタラクティブな機能は、読解効率の向上に寄与する。</p>

      <p data-block-id="l2-11">本デモでは、各段落に対して自由に加工を加え、理解支援の効果を体験できる。</p>
    `
        },

        {
          id: 'lesson-3',
          title: 'Adaptive Learning and AI Ethics',
          html: `
      <h2 data-block-id="l3-1">Adaptive Learning Interfaces</h2>
      <p data-block-id="l3-2">Adaptive learning systems dynamically adjust the presentation of content based on learner interaction. This includes hiding, emphasizing, or annotating parts of the material.</p>

      <p data-block-id="l3-3">However, such adaptability introduces new challenges. Learners must understand why certain content is hidden or highlighted in order to maintain trust in the system.</p>

      <h3 data-block-id="l3-4">Transparency and Control</h3>
      <p data-block-id="l3-5">A well-designed interface should balance automation with user control. Learners should be able to modify the material themselves, rather than passively consuming it.</p>

      <ul>
        <li data-block-id="l3-6">Visibility control (hide / reveal)</li>
        <li data-block-id="l3-7">Annotation and explanation layers</li>
        <li data-block-id="l3-8">User-driven customization</li>
      </ul>

      <blockquote data-block-id="l3-9">“Human-centered design is essential for responsible AI in education.”</blockquote>

      <p data-block-id="l3-10">This demo system allows presenters to simulate different instructional strategies by modifying the same content in real time.</p>

      <p data-block-id="l3-11">Such functionality is particularly useful in restricted environments, where server-side processing is limited and local interaction becomes critical.</p>
    `
        }
      ];

      // ツールバーのグループ定義と操作定義。
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
      const TOUCH_AUTO_ACTIONS = new Set(['color-blue', 'color-red', 'marker-yellow', 'marker-green', 'marker-pink', 'strong', 'underline', 'size-small', 'size-large']);
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
        savedList: document.getElementById('savedList'),
        savedCount: document.getElementById('savedCount'),
        savedHint: document.getElementById('savedHint'),
        savedEmpty: document.getElementById('savedEmpty'),
        savedSearchInput: document.getElementById('savedSearchInput'),
        savedSortSelect: document.getElementById('savedSortSelect'),
        editorTopActions: document.getElementById('editorTopActions'),
        savedTopActions: document.getElementById('savedTopActions'),
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
        toastWrap: document.getElementById('toastWrap'),
        keywordPopover: document.getElementById('keywordPopover'),
        importJsonBtn: document.getElementById('importJsonBtn'),
        importJsonInput: document.getElementById('importJsonInput'),
        exportAllBtn: document.getElementById('exportAllBtn'),
        mobileExportBtn: document.getElementById('mobileExportBtn'),
        resetDemoBtn: document.getElementById('resetDemoBtn'),
        editorStatusTag: document.getElementById('editorStatusTag')
      };

      // 単一 HTML アプリ全体で共有する可変状態。
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
        draftChangedAt: null
      };
      let mobileNavCloseTimer = null;

      // エディタ・保存処理・画面表示で共通利用する小さな補助関数群。
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
      function isTouchMode() { return window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0; }
      function showToast(msg, type = 'success') { const t = document.createElement('div'); t.className = `toast ${type === 'success' ? 'success' : type === 'warn' ? 'warn' : type === 'error' ? 'error' : ''}`; t.textContent = msg; els.toastWrap.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 220); }, 2600); }
      function loadSaves() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.saves) || '[]'); } catch { return []; } }
      function saveSaves(items) { localStorage.setItem(STORAGE_KEYS.saves, JSON.stringify(items)); }
      function saveDraft() { localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify({ currentLessonId: state.currentLessonId, baseLessonId: state.baseLessonId, currentSavedId: state.currentSavedId, html: els.lessonContainer.innerHTML, title: els.titleDisplay.textContent, log: state.log, draftChangedAt: state.draftChangedAt })); syncEditorStatusTag(); }
      function loadDraft() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.draft) || 'null'); } catch { return null; } }
      function clearDraft() { localStorage.removeItem(STORAGE_KEYS.draft); }
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
      function savePrefs(p) { localStorage.setItem(STORAGE_KEYS.toolbar, JSON.stringify(normalizePrefs(p))); }
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

      function renderSavedList() {
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
            <div class="sv-card__dates">元教材: <b>${esc(findLessonTitle(item.baseLessonId))}</b></div>
          </div>
          <div class="sv-card__meta">
            <span class="pill">ログ ${Array.isArray(item.log) ? item.log.length : 0} 件</span>
          </div>
        </div>
        <div class="sv-card__bottom">
          <div class="sv-card__dates">
            <div>更新: <b>${fmt(item.updatedAt)}</b></div>
            <div>作成: <b>${fmt(item.createdAt)}</b></div>
          </div>
          <div class="sv-card__actions">
            <button class="sv-btn sv-btn--ghost" type="button" data-saved-action="preview" data-id="${item.id}">プレビュー</button>
            <button class="sv-btn" type="button" data-saved-action="open" data-id="${item.id}">導入</button>
            <button class="sv-btn sv-btn--ghost" type="button" data-saved-action="export" data-id="${item.id}">書出</button>
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

      function openSavedItem(id) {
        const item = loadSaves().find(x => String(x.id) === String(id));
        if (!item) return showToast('保存済み教材が見つかりません。', 'error');
        state.currentSavedId = item.id; state.currentLessonId = item.baseLessonId; state.baseLessonId = item.baseLessonId; state.log = Array.isArray(item.log) ? item.log : [];
        els.lessonSelect.value = item.baseLessonId;
        els.titleDisplay.textContent = item.title || findLessonTitle(item.baseLessonId);
        els.lessonContainer.innerHTML = item.htmlContent || '';
        state.undoStack = [snapshot()]; state.redoStack = [];
        saveDraft();
        setView('editor');
        showToast('保存済み教材を読み込みました。');
      }

      function saveCurrentMaterial() {
        if (!state.baseLessonId) return showToast('教材が選択されていません。', 'warn');
        const existing = loadSaves().find(x => String(x.id) === String(state.currentSavedId));
        const defaultTitle = existing?.title || `${els.titleDisplay.textContent}（加工版）`;
        const title = prompt('保存する教材名を入力してください', defaultTitle);
        if (!title) return;
        const items = loadSaves();
        const now = nowIso();
        const payload = {
          id: state.currentSavedId || `saved-${Date.now()}`,
          baseLessonId: state.baseLessonId,
          title: title.trim(),
          htmlContent: els.lessonContainer.innerHTML,
          log: clone(state.log),
          createdAt: existing?.createdAt || now,
          updatedAt: now
        };
        const next = existing ? items.map(item => String(item.id) === String(payload.id) ? payload : item) : [payload, ...items];
        saveSaves(next);
        state.currentSavedId = payload.id;
        state.draftChangedAt = now;
        saveDraft();
        renderSavedList();
        showToast(existing ? '保存済み教材を更新しました。' : '教材をローカル保存しました。');
      }

      function deleteSavedItem(id) {
        if (!confirm('この保存済み教材を削除しますか？（元に戻せません）')) return;
        const next = loadSaves().filter(item => String(item.id) !== String(id));
        saveSaves(next);
        if (String(state.currentSavedId) === String(id)) state.currentSavedId = null;
        renderSavedList();
        showToast('削除しました。');
      }

      function exportSavedItem(id) { const item = loadSaves().find(x => String(x.id) === String(id)); if (!item) return; downloadJSON(`${sanitizeFileName(item.title || 'gakuzai-save')}.json`, item); showToast('JSONを書き出しました。'); }
      function sanitizeFileName(s) { return String(s).replace(/[\\/:*?"<>|]+/g, '_'); }
      function exportAll() { downloadJSON('gakuzai-local-demo-data.json', { exportedAt: nowIso(), lessons: SAMPLE_LESSONS.map(l => ({ id: l.id, title: l.title })), saves: loadSaves() }); showToast('すべてのローカルデータを書き出しました。'); }
      function resetDemo() { if (!confirm('保存済み教材・ツール並べ替え・現在のドラフトを初期化しますか？')) return; localStorage.removeItem(STORAGE_KEYS.saves); localStorage.removeItem(STORAGE_KEYS.toolbar); clearDraft(); state.prefs = clone(DEFAULT_PREFS); savePrefs(state.prefs); state.currentSavedId = null; renderToolbar(); renderSavedList(); loadLessonById(SAMPLE_LESSONS[0].id, { silent: true }); showToast('デモデータを初期化しました。', 'warn'); }

      function previewSavedItem(id) {
        const item = loadSaves().find(x => String(x.id) === String(id));
        if (!item) return;
        els.previewMeta.textContent = `${item.title} / 更新 ${fmt(item.updatedAt)}`;
        els.previewContent.innerHTML = item.htmlContent || '';
        els.previewDialogBackdrop.classList.add('is-open');
        document.body.classList.add('dialog-open');
      }
      function closePreview() { els.previewDialogBackdrop.classList.remove('is-open'); document.body.classList.remove('dialog-open'); }

      function setView(view) {
        state.currentView = view;
        const isEditor = view === 'editor';
        els.editorView.hidden = !isEditor;
        els.savedView.hidden = isEditor;
        els.editorTopActions.hidden = !isEditor;
        els.savedTopActions.hidden = isEditor;
        els.headerTitle.textContent = isEditor ? '加工教材' : '保存済み教材';
        els.headerSubtitle.textContent = isEditor
          ? 'ローカル HTML 単体で動作するデモ版です。教材読み込み、加工、保存、再編集、ツール並べ替え、スマホ表示までこの1ファイルで確認できます。'
          : 'バックエンドなしでローカル保存した教材を一覧管理できます。会議デモでは、保存・再読み込みまで含めて提示できます。';
        document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
        if (view === 'saved') renderSavedList();
        closeKeywordPopover();
        closeMobileNav();
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
    } catch {}
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
    } catch {}

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
  } catch {}
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
    } catch {}
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
      function handleTouchSelectionChange() { if (!isTouchMode()) return; if (state.touchSelectionUiLock) return; if (!state.currentAction) { hideMobileSelectionBar(); return; } const sel = getLessonSelection(); if (!sel) { if (!els.mobileSelectionBar.hidden && state.lastTouchRange) return; hideMobileSelectionBar(); return; } captureTouchRange(sel); state.lastTouchSelectionKey = getSelectionKey(sel); if (TOUCH_AUTO_ACTIONS.has(state.currentAction)) scheduleTouchAutoApply(sel); else { clearTouchApplyTimer(); showMobileSelectionBar('confirm'); } }

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

      function triggerAction(actionId) { const keywordText = els.toolbar.querySelector('#keywordText')?.value?.trim() || ''; const popupText = els.toolbar.querySelector('#popupText')?.value?.trim() || ''; handleToolbarAction(actionId, { keywordText, popupText }); captureDraftInputs(); if (isMobileLayout()) closeMobilePanel(); }
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
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const items = loadSaves();
          const incoming = Array.isArray(parsed) ? parsed : Array.isArray(parsed.saves) ? parsed.saves : [parsed];
          const normalized = incoming.map(item => ({ id: item.id || `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, baseLessonId: item.baseLessonId || item.base_lesson_id || SAMPLE_LESSONS[0].id, title: item.title || 'Imported save', htmlContent: item.htmlContent || item.html_content || '', log: Array.isArray(item.log) ? item.log : [], createdAt: item.createdAt || item.created_at || nowIso(), updatedAt: item.updatedAt || item.updated_at || nowIso() }));
          saveSaves([...normalized, ...items]);
          renderSavedList();
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
        window.addEventListener('resize', () => { if (!isMobileLayout()) { state.mobileOpen = false; state.mobileNavOpen = false; } syncMobileShell(); syncMobileNavShell(); syncKeywordPopoverToOwner(); });
        document.addEventListener('scroll', syncKeywordPopoverToOwner, true);

        els.toolbarPrefsBtn.addEventListener('click', () => { captureDraftInputs(); state.sortMode = !state.sortMode; renderToolbar(); });
        els.importJsonBtn.addEventListener('click', () => els.importJsonInput.click());
        els.importJsonInput.addEventListener('change', handleImportJsonChange);
        els.exportAllBtn.addEventListener('click', exportAll);
        els.mobileExportBtn.addEventListener('click', () => { exportAll(); closeMobileNav(); });
        els.resetDemoBtn.addEventListener('click', resetDemo);
        els.closePreviewBtn.addEventListener('click', closePreview);
        els.previewDialogBackdrop.addEventListener('click', event => { if (event.target === els.previewDialogBackdrop) closePreview(); });
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
      initFromDraft();
      renderSavedList();
      setView('editor');
      syncEditorStatusTag();

    

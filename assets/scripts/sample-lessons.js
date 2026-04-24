window.GAKUZAI_SAMPLE_LESSONS = [
        {
          id: 'lesson-1',
          title: '電気回路教材',
          html: `

                    <h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-1">練習問題</h3><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-2">1．この教科書紙面を縮小加工して授業で学習者に提示する授業資料もしくは自分のノート紙面を作ってみよう。</p><h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-3">電気回路を設計するということは，どのようなことか</h3><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-4">目的に応じた電気回路が，種々研究され定番的な回路として公開されている。電気回路の設計者は，それらの定番的な回路を組み合わせて，必要な動作を実現することになる。しかし同じ回路であっても，どの部分にどのような電気エネルギーを与えるのかは回路の目的によってさまざまである。</p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-5">　例えばLEDを光らせる回路は，LEDとLEDを流れる電流が大きくなりすぎないように電流量を調整するための電気抵抗を直列接続する回路しかない。LEDの種類や形式によって，光るために必要な印加電圧は異なる。またLEDを光らせる目的が，電源がONであることを示すためであれば数ミリアンペア程度の電流で充分であるが，TVなどの赤外線リモコンのための赤外線LEDであれば遠くまで届く強い光を出すために瞬間的に1アンペア程度の電流を流す必要がある。このため電気回路を設計する者は，目的や条件に応じて回路の電気抵抗の適正値を決めることになる。これが電気回路の設計である。</p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-6">　実際の電気回路はLEDと抵抗器一つだけのように単純なものは少なく，複数の電源や大量の抵抗器やコイル，コンデンサーなどで複雑に構成されている。電気回路を設計するためには，後述するKCL，KVLによって電流とインピーダンス，電流とインピーダンスと電圧の関係式を作り，それらの関係式を連立方程式として解く能力が必要である。</p><h2 style="margin: 0px 0px 0.5em; padding: 0px; vertical-align: baseline; font-size: 32.016px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-7">キルヒホッフの法則</h2><h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-8">キルヒホッフの電流則（KCL）</h3><p data-block-id="p1-9"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">キルヒホッフの電流則（Kirchhoff's current law : KCL）は，キルヒホッフの第一法則とも呼ばれる。これは，回路網の任意の接続点Aに着目して，Aに流れ込む電流の総和と流れ出る電流の総和が等しくなることを表している。</span></p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-10"><img src="./assets/images/kcl.png" width="200" data-block-id="p1-11"></p><p data-block-id="p1-12"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">流れ込む電流を&nbsp;</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">in 1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">in 2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，&nbsp;</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">in N</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">， 流れ出る電流を</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">out 1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">out 2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，&nbsp;</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">out M</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">　とすると以下となる。</span><math display="block" style="color: rgb(0, 0, 0);"><munderover><mi>∑</mi><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover><msub><mi>I</mi><mi>in j</mi></msub><mo>=</mo><munderover><mi>∑</mi><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>M</mi></munderover><msub><mi>I</mi><mi>out k</mi></msub></math><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">あるいは，流れ込む電流を＋，流れ出る電流を－として取り扱えば，以下の表現となる。</span><math display="block" style="color: rgb(0, 0, 0);"><munderover><mi>∑</mi><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover><msub><mi>I</mi><mi>in j</mi></msub><mo>+</mo><munderover><mi>∑</mi><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>M</mi></munderover><msub><mi>I</mi><mi>out k</mi></msub><mo>=</mo><mn>0</mn></math></p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-13"></p><h3 style="margin: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-14">キルヒホッフの電圧則（KVL）</h3><p data-block-id="p1-15"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">キルヒホッフの電圧則（Kirchhoff's voltage law : KVL）は，キルヒホッフの第二法則とも呼ばれる。これは，回路網の任意の閉回路に着目して，閉回路を一周する間にある起電力の総和と電圧降下の総和が等しくなることを表している。ここで言う任意の閉回路とは，「網目のマス目の穴ひとつならどこを選んでも良い」ということになるが，それだけではなく「網目のどの糸をどのようにたどって何マス分を選んでもいいが，網目を辿って元の場所に戻る経路を一周する道のり」という意味である。</span></p><p style="margin-bottom: 0px; padding: 0px; vertical-align: baseline; font-size: 16.0096px; color: rgb(0, 0, 0); font-family: メイリオ;" data-block-id="p1-16"><img src="./assets/images/kvl.png" width="400" data-block-id="p1-17"></p><p data-block-id="p1-18"><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">閉回路に沿って存在する起電力を</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">V</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">V</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">V</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">N</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，閉回路に沿って存在するインピーダンスを</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">Z</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">Z</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">Z</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">M</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，各インピーダンスを流れる電流を</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">1</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">2</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">，，，，</span><i style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">I</i><sub style="color: rgb(0, 0, 0); font-family: メイリオ;">M</sub><span style="color: rgb(0, 0, 0); font-family: メイリオ; font-size: 16.008px;">とすると，以下のように表される。</span><math display="block" style="color: rgb(0, 0, 0);"><munderover><mi>∑</mi><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>N</mi></munderover><msub><mi>V</mi><mi>j</mi></msub><mo>=</mo><munderover><mi>∑</mi><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>M</mi></munderover><msub><mi>Z</mi><mi>k</mi></msub><msub><mi>I</mi><mi>k</mi></msub></math></p>
                
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

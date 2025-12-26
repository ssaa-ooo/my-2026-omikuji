const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 1. ランクと出現確率（合計100）
const weightedRanks = [
    { name: "大吉", weight: 15 },
    { name: "吉",   weight: 15 },
    { name: "中吉", weight: 20 },
    { name: "小吉", weight: 20 },
    { name: "末吉", weight: 20 },
    { name: "凶",   weight: 5 },
    { name: "大凶", weight: 5 }
];

// 2. 二〇二六年の運勢サマリー
const summaries = {
    "大吉": "これまでの努力が大きな実を結ぶ、輝かしい一年。新たな挑戦はすべて追い風となります。自信を持って前へ進んでください。",
    "吉": "安定した運気に包まれ、穏やかに過ごせる一年。周囲への感謝を形にすることで、さらに運気が上昇します。",
    "中吉": "公私ともに充実した年になります。特に人間関係で実りがありそう。丁寧なコミュニケーションを心がけましょう。",
    "小吉": "大きな波乱はなく、一歩ずつ着実に成長できる年。派手さはありませんが、足元を固めるには最適な時期です。",
    "末吉": "前半は忍耐が必要ですが、後半にかけて徐々に運気が開けます。焦らず、準備を整えることに注力してください。",
    "凶": "慎重さが求められる年。無理な拡張は避け、現状維持と心身のケアを優先しましょう。誠実に過ごせば難を逃れます。",
    "大凶": "試練の年となる予感。しかし、これは飛躍に向けたデトックスの時期。古いものを手放すことで、新しい運気が入り込みます。"
};

// 3. 全11項目の詳細コメント集
const commentPool = {
    "願い事": ["時間はかかるが必ず叶う。", "驚くほど順調に進む。感謝せよ。", "今は控えめが吉。時を待て。", "他人の助けで成就する。"],
    "待ち人": ["来る。驚くような便りあり。", "遅れるが必ず来る。", "来るが期待外れのことあり。", "来ない。便りを待て。"],
    "失し物": ["出る。高い所にあり。", "遅れて見つかる。焦るな。", "出ない。諦めが肝心。", "近い所にあり。よく探せ。"],
    "旅行": ["北の方角に吉あり。", "計画をしっかり立てて行け。", "控えよ。来年が良し。", "行き先で良い出会いあり。"],
    "ビジネス": ["利益あり。自信を持って進め。", "苦労するが後に報われる。", "計画を再検討せよ。独断は禁物。", "誠実な対応が成功を呼ぶ。"],
    "学問": ["努力が実る。油断するな。", "基礎を固めよ。道が開ける。", "誘惑に勝て。集中力が鍵。", "安心して励め。結果は出る。"],
    "争い事": ["勝つ。しかし後に引くな。", "負ける。今は引くのが吉。", "話し合いで円満に解決する。", "長引く。冷静さを保て。"],
    "恋愛": ["誠実な心が縁を結ぶ。", "良い出会いあり。自分を磨け。", "焦るな。自然な流れに任せよ。", "相手を思いやる心が鍵。"],
    "縁談": ["まとまる。親類に相談せよ。", "時期を待て。焦ると損をする。", "良い話あり。前向きに考えよ。", "今は控えめに。縁が薄い。"],
    "転居": ["吉。急ぐ必要はない。", "良い場所が見つかる。北が良し。", "今は留まれ。時期ではない。", "方角を確かめよ。東が吉。"],
    "病気": ["軽んじるな。必ず治る。", "信心せよ。回復に向かう。", "長引くが安心して養生せよ。", "早期の対応が肝要なり。"]
};

module.exports = async (req, res) => {
    // URLから session_id を取得
    const { session_id } = req.query;

    if (!session_id) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    try {
        // Stripeに支払い状態を問い合わせる
        const session = await stripe.checkout.sessions.retrieve(session_id);

        // 支払いが完了(paid)していない場合はエラーを返す
        if (session.payment_status !== 'paid') {
            return res.status(403).json({ error: 'お支払いが確認できていません。' });
        }

        // --- ここからおみくじの生成ロジック ---

        // ランクの決定（重み付け抽選）
        let randomNum = Math.random() * 100;
        let selectedRank = "吉";
        for (const r of weightedRanks) {
            if (randomNum < r.weight) {
                selectedRank = r.name;
                break;
            }
            randomNum -= r.weight;
        }

        // 各カテゴリからランダムにコメントを1つずつ抽出
        let details = [];
        for (let category in commentPool) {
            const list = commentPool[category];
            const comment = list[Math.floor(Math.random() * list.length)];
            details.push({
                label: `【${category}】`,
                text: comment
            });
        }

        // 最終的な結果を返す
        res.status(200).json({
            rank: selectedRank,
            summary: summaries[selectedRank],
            details: details
        });

    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({ error: 'サーバーエラーが発生しました。' });
    }
};
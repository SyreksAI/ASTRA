/** Тематические созвездия Elara — клиентская привязка по смыслу поста */

export const CONSTELLATIONS = [
    {
        id: 'dev',
        label: 'Разработка',
        keywords: ['код', 'react', 'python', 'api', 'frontend', 'backend', 'разраб', 'программ', 'github', 'баг', 'деплой', 'js', 'typescript'],
    },
    {
        id: 'design',
        label: 'Дизайн',
        keywords: ['дизайн', 'ui', 'ux', 'фигма', 'figma', 'макет', 'типограф', 'интерфейс', 'визуал'],
    },
    {
        id: 'tech',
        label: 'Технологии',
        keywords: ['технолог', 'ai', 'ии', 'нейро', 'гаджет', 'стартап', 'инновац', 'будущ'],
    },
    {
        id: 'music',
        label: 'Музыка',
        keywords: ['музык', 'трек', 'альбом', 'плейлист', 'концерт', 'песн', 'звук', 'бит'],
    },
    {
        id: 'games',
        label: 'Игры',
        keywords: ['игр', 'гейм', 'steam', 'playstation', 'xbox', 'киберспорт', 'прохожд'],
    },
    {
        id: 'art',
        label: 'Искусство',
        keywords: ['искусств', 'картин', 'рисун', 'фотограф', 'выставк', 'творчеств', 'кино'],
    },
    {
        id: 'science',
        label: 'Наука',
        keywords: ['наук', 'космос', 'физик', 'биолог', 'исследован', 'эксперимент', 'астроном'],
    },
    {
        id: 'sport',
        label: 'Спорт',
        keywords: ['спорт', 'футбол', 'трениров', 'матч', 'чемпион', 'бег', 'фитнес'],
    },
];

export function resolveConstellation(post) {
    if (post?.constellation?.id || post?.constellation?.label) {
        const id = post.constellation.id || post.constellation_id;
        const fromList = CONSTELLATIONS.find((c) => c.id === id);
        return {
            id: id || fromList?.id,
            label: post.constellation.label || fromList?.label || id,
            keywords: fromList?.keywords || [],
        };
    }
    if (post?.constellation_id) {
        return CONSTELLATIONS.find((c) => c.id === post.constellation_id) || {
            id: post.constellation_id,
            label: post.constellation_id,
            keywords: [],
        };
    }
    const text = `${post?.content || ''} ${post?.author?.username || ''}`.toLowerCase();
    if (!text.trim()) return null;

    let best = null;
    let bestScore = 0;
    for (const c of CONSTELLATIONS) {
        let score = 0;
        for (const kw of c.keywords) {
            if (text.includes(kw)) score += 1;
        }
        if (score > bestScore) {
            bestScore = score;
            best = c;
        }
    }
    return bestScore > 0 ? best : null;
}

export function enrichPostsWithConstellations(posts = []) {
    return posts.map((post, index, list) => {
        const constellation = resolveConstellation(post);
        const prev = index > 0 ? list[index - 1] : null;
        const prevConstellation = prev ? resolveConstellation(prev) : null;
        const continuesDiscussion = Boolean(
            constellation
            && prevConstellation
            && constellation.id === prevConstellation.id
            && (post.comments_count || 0) + (prev.comments_count || 0) > 0
        );

        return {
            ...post,
            constellation,
            continuesDiscussion,
            isHotDiscussion: (post.comments_count || 0) >= 3 || (post.likes_count || 0) >= 5,
        };
    });
}

export function buildOrbitToday(posts = [], user) {
    const enriched = enrichPostsWithConstellations(posts);
    const discussions = [...enriched]
        .filter((p) => (p.comments_count || 0) > 0)
        .sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))
        .slice(0, 3)
        .map((p) => ({
            id: `d-${p.id}`,
            type: 'discussion',
            title: (p.content || '').trim().slice(0, 72) || 'Обсуждение',
            meta: p.constellation
                ? `${p.constellation.label} · ${p.comments_count} ответов`
                : `${p.comments_count} ответов`,
            postId: p.id,
            constellationId: p.constellation?.id,
        }));

    const seen = new Set();
    const people = [];
    for (const p of enriched) {
        const username = p.author?.username;
        if (!username || username === user?.username || seen.has(username)) continue;
        seen.add(username);
        people.push({
            id: `p-${username}`,
            type: 'person',
            title: p.author?.full_name || username,
            meta: p.constellation ? `интересы · ${p.constellation.label}` : `@${username}`,
            username,
            avatar: p.author?.avatar,
        });
        if (people.length >= 2) break;
    }

    const byConst = {};
    for (const p of enriched) {
        if (!p.constellation) continue;
        const id = p.constellation.id;
        if (!byConst[id]) {
            byConst[id] = { constellation: p.constellation, comments: 0, posts: 0 };
        }
        byConst[id].posts += 1;
        byConst[id].comments += p.comments_count || 0;
    }
    const activeConstellation = Object.values(byConst)
        .sort((a, b) => (b.comments + b.posts) - (a.comments + a.posts))[0];

    const constellationItem = activeConstellation
        ? [{
            id: `c-${activeConstellation.constellation.id}`,
            type: 'constellation',
            title: activeConstellation.constellation.label,
            meta: `активность · ${activeConstellation.posts} постов`,
            constellationId: activeConstellation.constellation.id,
        }]
        : [];

    return [...discussions, ...people, ...constellationItem].slice(0, 6);
}

export function buildNowHappening(posts = []) {
    const enriched = enrichPostsWithConstellations(posts);
    return [...enriched]
        .filter((p) => (p.comments_count || 0) > 0 || p.constellation)
        .sort((a, b) => {
            const score = (x) => (x.comments_count || 0) * 3 + (x.likes_count || 0);
            return score(b) - score(a);
        })
        .slice(0, 5)
        .map((p) => ({
            id: p.id,
            title: (p.content || '').trim().slice(0, 80) || 'Публикация',
            constellation: p.constellation?.label || 'Лента',
            comments: p.comments_count || 0,
            author: p.author?.full_name || p.author?.username || 'Участник',
        }));
}

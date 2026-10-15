export function groupMessages(messages) {
    const result = [];
    let buffer = [];

    const flush = () => {
        if (buffer.length === 0) return;

        if (buffer.length === 1) {
            result.push({ kind: 'single', message: buffer[0] });
            buffer = [];
            return;
        }

        result.push({
            kind: 'album',
            id: `album-${buffer[0].id}`,
            sender_id: buffer[0].sender_id,
            sender_name: buffer[0].sender_name,
            sender_username: buffer[0].sender_username,
            created_at: buffer[0].created_at,
            images: buffer.map((m) => ({
                id: m.id,
                url: m.file_url,
                spoiler: !!m.spoiler,
                text: m.text || '',
            })),
        });
        buffer = [];
    };

    for (const msg of messages) {
        const isImage = msg.type === 'image' && msg.file_url;

        if (!isImage) {
            flush();
            result.push({ kind: 'single', message: msg });
            continue;
        }

        if (buffer.length === 0) {
            buffer.push(msg);
            continue;
        }

        const prev = buffer[buffer.length - 1];
        const sameSender = prev.sender_id === msg.sender_id;
        const notTooMany = buffer.length < 10;

        // Если у фото есть album_id — сравниваем по нему
        // Если нет — по времени (2 секунды)
        let sameGroup = false;
        if (msg.album_id || prev.album_id) {
            sameGroup = msg.album_id === prev.album_id && !!msg.album_id;
        } else {
            const dt = Math.abs(new Date(msg.created_at) - new Date(prev.created_at));
            sameGroup = dt < 2_000;
        }

        if (sameSender && sameGroup && notTooMany) {
            buffer.push(msg);
        } else {
            flush();
            buffer.push(msg);
        }
    }

    flush();
    return result;
}
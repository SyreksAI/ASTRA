const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

export const POST_MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';
export const MAX_POST_MEDIA_COUNT = 10;
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_VIDEO_BYTES = 25 * 1024 * 1024;

export function isAllowedPostMediaType(type) {
    return IMAGE_TYPES.has(type) || VIDEO_TYPES.has(type);
}

export function getPostMedia(post) {
    if (!post) return [];
    if (Array.isArray(post.media) && post.media.length) {
        return post.media.filter((item) => item?.url);
    }
    if (post.image) {
        return [{ url: post.image, type: 'image' }];
    }
    return [];
}

export function createComposerMediaItem(file) {
    return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
    };
}

export function validatePostMediaFile(file) {
    if (!file) return 'Файл не выбран';
    if (!isAllowedPostMediaType(file.type)) {
        return 'Фото: JPG, PNG, WebP. Видео: MP4 или WebM';
    }
    const max = file.type.startsWith('video/') ? MAX_POST_VIDEO_BYTES : MAX_POST_IMAGE_BYTES;
    if (file.size > max) {
        return `Максимум ${max / (1024 * 1024)} МБ`;
    }
    return null;
}

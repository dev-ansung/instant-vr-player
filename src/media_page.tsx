interface VideoApiItem {
    id: string;
    name: string;
}
interface MediaItem {
    src: string;
    type: string;
    projection: string;
    title?: string;
}

(async function () {
    const videojs = (window as any).videojs;
    const player = videojs('videojs-vr-player');
    const titleElement = document.getElementById('video-title');

    const pathParts = window.location.pathname.split('/');
    const videoId = pathParts[pathParts.length - 1];

    let mediaItems: MediaItem[] = [];
    try {
        const response = await fetch('/api/videos');
        const videos: VideoApiItem[] = await response.json();

        // Find the current video name to update the UI
        const currentVideo = videos.find(v => v.id === videoId);
        if (currentVideo && titleElement) {
            titleElement.textContent = currentVideo.name;
            document.title = currentVideo.name;
        }

        mediaItems = videos.map(v => ({
            src: `/video/${v.id}`,
            type: 'video/mp4',
            projection: '180',
            title: v.name
        }));
    } catch (e) {
        console.error("Failed to load video list", e);
        if (titleElement) titleElement.textContent = "Error Loading Video";
    }

    player.src({
        src: `/video/${videoId}`,
        type: 'video/mp4'
    });

    player.mediainfo = player.mediainfo || {};
    player.mediainfo.projection = '180';

    player.vr({
        projection: '180',
        forceCardboard: true,
        enableVRHUD: true,
        enableVRGallery: true,
        mediaItems: mediaItems,
        onMediaSelect: (item: MediaItem) => {
            player.src({ src: item.src, type: 'video/mp4' });
            if (titleElement && item.title) titleElement.textContent = item.title;
        }
    });
})();
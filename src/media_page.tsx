
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
    const video = document.getElementById('videojs-vr-player') as HTMLVideoElement;

    const pathParts = window.location.pathname.split('/');
    const videoId = pathParts[pathParts.length - 1];

    video.src = `/video/${videoId}`;
    // load videojs once the video element is ready
    video.addEventListener('loadedmetadata', () => {
        const player = videojs(video, {
            controls: true,
            fill: true,
            playbackRates: [0.5, 1, 1.5, 2],
            controlBar: {
                skipButtons: { forward: 30, backward: 30 },
            },
        });
        // Initialize the VR plugin if aspect ratio is 2:1
        if (video.videoWidth / video.videoHeight === 2) {
            player.vr({
                projection: '180',
            });
        }
    });


})();
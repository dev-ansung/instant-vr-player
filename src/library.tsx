import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface Video {
    id: string;
    name: string;
}

function Library() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/videos")
            .then((res) => res.json())
            .then((data) => {
                setVideos(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load videos:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Scanning video folder...</div>;

    return (
        <div>
            <h1>Video Library</h1>
            {videos.length === 0 ? (
                <p>No MP4 files found in the /videos directory.</p>
            ) : (
                <div className="video-grid">
                    {videos.map((video) => (
                        <a
                            key={video.id}
                            href={`/player/${video.id}`}
                            className="video-card"
                        >
                            <strong>{video.name}</strong>
                            <span>ID: {video.id}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Library />);
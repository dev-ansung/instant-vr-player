import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface Video {
    id: string;
    name: string;
}

function Library() {
    const [allVideos, setAllVideos] = useState<Video[]>([]);
    const [currentPath, setCurrentPath] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/videos")
            .then((res) => res.json())
            .then((data) => {
                setAllVideos(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load videos:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Scanning video folder...</div>;

    const prefix = currentPath ? currentPath + "/" : "";
    const folders = new Set<string>();
    const files: Video[] = [];

    for (const video of allVideos) {
        if (video.name.startsWith(prefix)) {
            const remaining = video.name.slice(prefix.length);
            const slashIndex = remaining.indexOf("/");

            if (slashIndex === -1) {
                files.push({ ...video, name: remaining });
            } else {
                folders.add(remaining.slice(0, slashIndex));
            }
        }
    }

    const folderList = Array.from(folders).sort();
    files.sort((a, b) => a.name.localeCompare(b.name));
    const pathParts = currentPath ? currentPath.split("/") : [];

    return (
        <div>
            <div className="header">
                <h1>Video Library</h1>
                <div className="breadcrumbs">
                    <button onClick={() => setCurrentPath("")}>Home</button>
                    {pathParts.map((part, index) => {
                        const path = pathParts.slice(0, index + 1).join("/");
                        return (
                            <React.Fragment key={path}>
                                <span className="separator">/</span>
                                <button onClick={() => setCurrentPath(path)}>{part}</button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {allVideos.length === 0 ? (
                <p>No MP4 files found in the /videos directory.</p>
            ) : (
                <div className="list-container">
                    {folderList.map(folder => {
                        const nextPath = currentPath ? `${currentPath}/${folder}` : folder;
                        return (
                            <button
                                key={nextPath}
                                className="list-item folder"
                                onClick={() => setCurrentPath(nextPath)}
                            >
                                📁 {folder}
                            </button>
                        );
                    })}
                    {files.map(video => (
                        <a
                            key={video.id}
                            href={`/player/${video.id}`}
                            className="list-item file"
                        >
                            🎬 {video.name}
                        </a>
                    ))}
                    {folderList.length === 0 && files.length === 0 && (
                        <p>This directory is empty.</p>
                    )}
                </div>
            )}
        </div>
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Library />);
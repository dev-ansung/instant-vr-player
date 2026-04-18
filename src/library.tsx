import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface Video {
    id: string;
    name: string;
}

function Library() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

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

    const isSearching = searchQuery.trim().length > 0;
    let folderList: string[] = [];
    let files: Video[] = [];

    if (isSearching) {
        const query = searchQuery.toLowerCase();
        files = videos.filter(v => v.name.toLowerCase().includes(query));
    } else {
        const prefix = currentPath ? currentPath + "/" : "";
        const folders = new Set<string>();

        for (const video of videos) {
            if (currentPath === "" || video.name.startsWith(prefix)) {
                const remaining = video.name.slice(prefix.length);
                const slashIndex = remaining.indexOf("/");

                if (slashIndex === -1) {
                    files.push({ ...video, name: remaining });
                } else {
                    folders.add(remaining.slice(0, slashIndex));
                }
            }
        }

        folderList = Array.from(folders).sort();
        files.sort((a, b) => a.name.localeCompare(b.name));
    }

    const navigateUp = () => {
        const parts = currentPath.split("/");
        parts.pop();
        setCurrentPath(parts.join("/"));
    };

    const navigateIn = (folder: string) => {
        setCurrentPath(currentPath ? `${currentPath}/${folder}` : folder);
    };

    return (
        <div>
            <h1>{isSearching ? "Search Results" : `Directory: /${currentPath}`}</h1>
            <input
                type="text"
                className="search-input"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="explorer-list">
                {!isSearching && currentPath !== "" && (
                    <div className="list-item folder" onClick={navigateUp}>
                        <span className="icon">📁</span> ..
                    </div>
                )}

                {!isSearching && folderList.map((folder) => (
                    <div key={folder} className="list-item folder" onClick={() => navigateIn(folder)}>
                        <span className="icon">📁</span> {folder}
                    </div>
                ))}

                {files.map((video) => (
                    <a key={video.id} href={`/player/${video.id}`} className="list-item file">
                        <span className="icon">🎬</span> {video.name}
                    </a>
                ))}

                {folderList.length === 0 && files.length === 0 && (
                    <div className="list-item empty">{isSearching ? "No matches found" : "Empty directory"}</div>
                )}
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Library />);
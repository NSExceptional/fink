//
//  dl-manager.ts
//  fundl
//  
//  Created by Tanner Bennett on 2021-08-04
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import { CRClient } from './api/client';
import { Episode } from './api/model';
import * as fs from 'fs';
import { StatusUpdater, StatusUpdaterFuture } from './status.js';

export class DownloadManager {
    static shared = new DownloadManager();
    
    private downloads: Episode[] = [];
    private currentDownload: { inProgress: boolean, episode: Episode } | undefined;
    
    /** Whether or not to create folders like 'Show/Season 1/' to download into */
    useSeasonFolders = false;
    
    // Technically, there is a race condition here... currentDownload is excluded
    // from the queue, but it is not removed from the queue until 2 seconds after
    // it completes. This means that if two episodes finish downloading super fast,
    // the first episode could get downloaded twice. But for now this is fine  
    private get queue(): Episode[] {
        if (!this.currentDownload) {
            return this.downloads;
        }
        
        // Return downloads without the current download
        const idx = this.downloads.indexOf(this.currentDownload.episode);
        return [...this.downloads.slice(0, idx), ...this.downloads.slice(idx + 1)]
    }
    
    private get status(): string[] {
        const N = this.downloads.length;
        if (N) {
            const prefix = `Downloading ${N} episode(s)`;
            const suffixes = this.downloads.map(e => {
                const progress = e.progress;
                if (progress) {
                    return `${e.title}: ${progress.percent}% of ${progress.totalSize}  ${progress.currentSpeed ?? ''}`
                }
                else if (e.error) {
                    return `${e.title}: ${e.error}`;
                }
                
                return `${e.title}: pending`;
            });
            
            return [prefix, ...suffixes];
        }
        
        return ['No active downloads'];
    }
    
    private addDownloadCallbackFuture: StatusUpdaterFuture = () => {
        return this.addDownloadCallback;
    }
    
    private downloadAllCallbackFuture: StatusUpdaterFuture = () => {
        return this.downloadAllCallback;
    }
    
    addDownloadCallback: StatusUpdater = () => {};
    downloadAllCallback: StatusUpdater = () => {};
    changeDirectoryCallback: (path: string) => void = (_) => {};
    
    get currentDirectory(): string {
        return process.cwd();
    }
    
    changeDirectory(relativePath: string) {
        process.chdir(relativePath);
        this.changeDirectoryCallback(this.currentDirectory);
    }
    
    episodeIsDownloading(episode: Episode): boolean {
        return this.downloads.map(e => e.id).includes(episode.id);
    }
    
    // TODO: right now I remove failed episodes from the queue, so this logic is useless
    episodeDownloadFailed(episode: Episode): boolean {
        for (const dl of this.downloads) {
            if (dl.id == episode.id) {
                return !!dl.error;
            }
        }
        
        return false;
    }
    
    private addDownloadMetadataToEpisode(episode: Episode) {
        // The file that tracks which episodes have been downloaded
        if (!episode.archive) {
            const show = episode.seriesSlugTitle;
            const season = episode.seasonSlugTitle;
            const archive = this.useSeasonFolders ? `${show}-${season}` : show;
            episode.archive = `${archive}.txt`
                // Remove disallowed characters
                .replace(/[\\?%*:|"<>]/g, '');
        }
        
        // Folder to store episode(s) in
        if (!episode.preferredDownloadPath) {
            const path = (this.useSeasonFolders ?
                `./${episode.seriesTitle!}/Season ${episode.seasonNumber!}`
                :
                `./${episode.seriesTitle!}`
            )
            // Remove disallowed characters
            .replace(/[\\?%*:|"<>]/g, '');
        }
    }
    
    private async downloadNextEpisode(progressCallback: StatusUpdaterFuture) {
        // Are we already downloading something?
        if (this.currentDownload?.inProgress) {
            return;
        }
        
        // Dequeue episode to download, if any
        const episode = this.queue[0];
        if (!episode) {
            this.currentDownload = undefined;
            return;
        }
        
        this.currentDownload = { episode, inProgress: true };
        
        const unqueueAndStartNext = () => {
            // Remove from queue after delay (delay allows showing final status)
            setTimeout(() => {
                episode.progress = undefined;
                const idx = this.downloads.indexOf(episode);
                this.downloads.splice(idx, 1);
                
                // Update status
                progressCallback()(this.status);
            }, 4000);
            
            // Allow starting new downloads
            this.currentDownload!.inProgress = false
            
            // Download next episode from queue
            this.downloadNextEpisode(progressCallback);
        };

        // Create download folder
        fs.mkdirSync(episode.preferredDownloadPath!, { recursive: true });
        
        try {
            // Start new download
            await CRClient.shared.downloadEpisode(episode, (progress) => {
                // Update status
                episode.progress = progress;
                progressCallback()(this.status);
            });
            
            unqueueAndStartNext();
        }
        catch (e: any) {
            // Handle error
            if (e.message.includes('Traceback')) {
                // Extract the third to last line
                const lines = e.message.split('\n');
                episode.error = lines[lines.length - 3];
            }
            else {
                episode.error = e.message.replaceAll('\n', '   ');
            }
            
            episode.downloading = false;
            
            // Update status
            progressCallback()(this.status);
            // Start next download
            unqueueAndStartNext();
        }
    }
    
    async addDownload(episode: Episode) {
        this.addDownloadMetadataToEpisode(episode);
        const inQueue = this.episodeIsDownloading(episode);
        const didFail = this.episodeDownloadFailed(episode);
        
        if (!inQueue || didFail) {
            if (didFail) {
                // Clear error and try again
                delete episode.error;
            } else {
                // Enqueue download, update status
                this.downloads.push(episode);
                this.addDownloadCallback(this.status);
            }
            
            // Start downloading, if not already
            this.downloadNextEpisode(this.addDownloadCallbackFuture);
        }
    }
    
    async downloadAll(episodes: Episode[]) {
        
        // Ignore queued episodes and failed episodes
        episodes = episodes.filter(e => {
            const inQueue = this.episodeIsDownloading(e);
            const didFail = this.episodeDownloadFailed(e);
            
            return !inQueue && !didFail;
        });
        
        // Enqueue downloads, update status
        this.downloads.push(...episodes);
        this.downloadAllCallback(this.status);
        
        // Start downloading, if not already
        this.downloadNextEpisode(this.downloadAllCallbackFuture);
    }
}

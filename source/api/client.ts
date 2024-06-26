//
//  client.ts
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-14
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import { APIAuthResponse, APIError, APIResponse, BaseSeason, Episode, Season, Show, ShowSearchResponse } from './model';
import { fetch } from 'fetch-h2';
import * as qs from 'querystring';
import YoutubeDlWrap, { Progress } from 'youtube-dl-wrap';
import * as os from 'node:os';
import * as fs from 'fs';

class Endpoint {
    static readonly auth = "/auth/v1/token";
    static readonly search = "/content/v2/discover/search";
    
    static showDetails(showID: string): string {
        return `/content/v2/cms/series/${showID}`;
    }
    
    static listSeasons(showID: string): string {
        return `/content/v2/cms/series/${showID}/seasons`;
    }
    
    static listEpisodes(seasonID: string): string {
        return `/content/v2/cms/seasons/${seasonID}/episodes`;
    }
}

export class CRClient {
    static shared = new CRClient();
    
    email: string | undefined = undefined;
    password: string | undefined = undefined;
    userAgent: string | undefined = undefined;
    
    private searchAuth: {
        token: string,
        expiration: number,
    } | undefined = undefined;
    
    private readonly baseURL = "https://www.crunchyroll.com";
    private defaultParams = {
        locale: "en-US",
        preferred_audio_language: "en-US",
    };
    
    private get defaultHeaders() {
        return {
            authorization: `${this.authType} ${this.apiToken}`,
            accept: "application/json, text/plain, */*",
            "user-agent": this.userAgent ?? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        };
    }
    
    private get authExpired(): boolean {
        return !this.searchAuth || this.searchAuth.expiration < Date.now();
    }
    
    private get authType(): string {
        if (this.authExpired) {
            return "Basic";
        }
        
        return "Bearer";
    }
    
    private get apiToken(): string {
        if (this.authExpired) {
            return 'Y3Jfd2ViOg==';
        }
        
        return this.searchAuth!.token;
    }
    
    get ytdlArgs(): string[] {
        // Check if we have login args or not
        let loginArgs: string[] = [];
        if (this.email && this.email.length && this.password && this.password.length) {
            loginArgs = ['-u', this.email, '-p', this.password];
        }
        
        // https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#crunchyrollbeta-crunchyroll
        return [...loginArgs,
            '--extractor-args', 'crunchyrollbeta:format=download_hls',
            // '--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--write-subs', '--sub-lang', 'en-US',
            '--no-check-certificate',
            '--user-agent', this.userAgent ?? 'nil'
        ];
    }
    
    get ytdlPath(): string {
        if (os.platform() == 'win32') {
            return "C:\\Program Files\\yt-dlp\\yt-dlp.exe"
        } else {
            return "/usr/local/bin/yt-dlp";
        }
    }
    
    get ytdlInstalled(): boolean {
        return fs.existsSync(this.ytdlPath);
    }
    
    /** A method to recursively convert json keys from snake_case to camelCase */
    private jsonKeysToCamelCase<T>(json: T): T {
        if (json === null || typeof json !== 'object') return json;
        
        if (Array.isArray(json)) {
            return json.map(e => this.jsonKeysToCamelCase(e)) as any as T;
        }
        
        const camelCased: any = {};
        for (const key in json) {
            const value = json[key];
            const camelKey = key.replace(/_([a-z])/g, g => g[1]!.toUpperCase());
            camelCased[camelKey] = this.jsonKeysToCamelCase(value);
        }
        
        return camelCased;
    }
    
    get<T>(endpoint: string, urlParams: qs.ParsedUrlQueryInput = {}): Promise<[T]> {
        const params = { ...urlParams, ...this.defaultParams };
        const paramString = qs.stringify(params);
        
        return fetch(this.baseURL + `${endpoint}?${paramString}`, {
            method: 'GET',
            headers: this.defaultHeaders,
        })
        .then(async response => {
            if (response.status >= 400) {
                const json: APIError = await response.json();
                const code = response.status.toString();
                const reason = json.message ?? 'no error message from API';
                throw new Error(`${code}: ${reason}`);
            }
            
            const json: APIResponse<T> = await response.json();
            return this.jsonKeysToCamelCase(json.data);
        });
    }
    
    post<T>(endpoint: string, formBody: qs.ParsedUrlQueryInput = {}, headers?: {}): Promise<T> {
        const params = formBody;
        const paramString = qs.stringify(params);
        
        return fetch(this.baseURL + endpoint, {
            method: 'POST',
            headers: { ...this.defaultHeaders, ...headers },
            body: paramString
        })
        .then(async response => {
            if (response.status >= 400) {
                const json: APIError = await response.json();
                const code = response.status.toString();
                const reason = json.message ?? 'no error message from API';
                throw new Error(`${code}: ${reason}`);
            }
            
            return this.jsonKeysToCamelCase(await response.json());
        });
    }
    
    private async authenticateForSearch(): Promise<void> {
        if (this.searchAuth) return;
        
        const body = {
            grant_type: "client_id",
        };
        
        const headers = {
            "content-type": "application/x-www-form-urlencoded",
        };
        
        const auth: APIAuthResponse = await this.post(Endpoint.auth, body, headers);
        this.searchAuth = {
            token: auth.accessToken,
            expiration: Date.now() + (auth.expiresIn * 1000),
        };
        
        // Clear out searchAuth after expiration
        setTimeout(() => {
            this.searchAuth = undefined;
        }, auth.expiresIn * 1000);
    }
    
    async searchShows(query: string): Promise<Show[]> {
        if (!this.searchAuth) {
            await this.authenticateForSearch();
        }
        
        const results: ShowSearchResponse = await this.get(Endpoint.search, {
            q: qs.escape(query),
            n: 10,
            type: "series",
        });
        
        return results[0]?.items ?? [];
    }
    
    async listSeasons(show: Show): Promise<Season[]> {
        if (!this.searchAuth) {
            await this.authenticateForSearch();
        }
        
        const seasons: Season[] = await this.get(Endpoint.listSeasons(show.id));
        // Add extra metadata to each season
        seasons.forEach(s => {
            s.series = show;
            s.fsSafeTitle = s.title.replace(/[\\?%*:|"<>]/g, '');
        });
        return seasons;
    }
    
    async listEpisodes(season: Season): Promise<Episode[]> {
        if (!this.searchAuth) {
            await this.authenticateForSearch();
        }
        
        const episodes: Episode[] = await this.get(Endpoint.listEpisodes(season.id));
        // Sort episodes ascending
        episodes.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        
        // Are the episodes numbered within the series or within the season?
        const firstEpisode = episodes[0];
        if (firstEpisode && firstEpisode.sequenceNumber > 1) {
            // Offset all episode numbers so that they start at 1
            const offset = firstEpisode.sequenceNumber - 1;
            episodes.forEach(e => e.sequenceNumber -= offset);
        }
        
        // Switch locale to en-US
        episodes.forEach(e => {
            const english = e.versions.find(v => v.audioLocale == 'en-US');
            if (english) {
                e.audioLocale = english.audioLocale;
                e.identifier.replace(e.id, english.guid);
                e.id = english.guid;
            }
        });
        
        // Add extra metadata to each episode
        episodes.forEach(e => {
            e.seasonNumber = season.seasonNumber;
            e.fsSafeTitle = e.title.replace(/[\\?%*:|"<>]/g, '');
            e.fsSafeSeasonTitle = e.seasonTitle.replace(/[\\?%*:|"<>]/g, '');
            e.fsSafeSeriesTitle = e.seriesTitle.replace(/[\\?%*:|"<>]/g, '');
            
            // seasonEpisodeID is constructed like S01E01 from episode.seasonNumber and episode.sequenceNumber
            const sn = e.seasonNumber.toString();
            const en = e.sequenceNumber.toString();
            e.seasonEpisodeID = `S${sn.padStart(2, '0')}E${en.padStart(2, '0')}`;
            
            e.videoURL = `https://www.crunchyroll.com/watch/${e.id}/${e.slugTitle}`;
            e.ytdlFilename = `${e.seasonEpisodeID} ${e.fsSafeTitle}.%(ext)s`;
        });
        
        return episodes;
    }
    
    downloadEpisode(episode: Episode, progress: (progress: Progress) => void): Promise<void> {
        const requiredKeys: (keyof Episode)[] = [
            'videoURL', 'ytdlFilename', 'seasonEpisodeID', 'archive', 'fsSafeTitle'
        ];
        for (const key of requiredKeys) {
            if (!episode[key]) {
                throw new Error(`Episode missing ${key}`);
            }
        }
        
        const exe = this.ytdlPath;
        const formatArgs = ['--format', `bestvideo+bestaudio[language=${episode.audioLocale}]`];
        const args = [...this.ytdlArgs, ...formatArgs, episode.videoURL!];
        
        // Add output directory if specified
        if (episode.preferredDownloadPath) {
            args.push('-o');
            // Used to use %(title) here, but it puts the whole show title in it, bleh
            args.push(`${episode.preferredDownloadPath}/${episode.ytdlFilename}`);
            args.push('--download-archive');
            args.push(`${episode.preferredDownloadPath}/${episode.archive}`);
        }
        
        return new Promise((resolve, reject) => {
            new YoutubeDlWrap(exe).exec(args)
                .on('progress', progress)
                .on('close', resolve)
                .on('error', reject);
        });
    }
}

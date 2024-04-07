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
    
    searchAuth: {
        token: string,
        expiration: number,
    } | undefined = undefined;
    
    baseURL = "https://www.crunchyroll.com";
    defaultParams = {
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
            '--format', 'bestvideo+bestaudio[language=en-US]',
            // '--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--write-subs', '--sub-lang', 'en-US',
            '--cookies-from-browser', 'chrome',
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
        seasons.forEach(s => s.series = show);
        return seasons;
    }
    
    async listEpisodes(season: Season): Promise<Episode[]> {
        if (!this.searchAuth) {
            await this.authenticateForSearch();
        }
        
        const episodes: Episode[] = await this.get(Endpoint.listEpisodes(season.id));
        // Add extra metadata to each episode
        episodes.forEach(e => e.seasonNumber = season.seasonNumber);
        // Switch locale to en-US
        episodes.forEach(e => {
            const english = e.versions.find(v => v.audioLocale == 'en-US');
            if (english) {
                e.audioLocale = english.audioLocale;
                e.identifier.replace(e.id, english.guid);
                e.id = english.guid;
            }
        });

        return episodes;
    }
    
    downloadEpisode(episode: Episode, progress: (progress: Progress) => void): Promise<void> {
        const url = this.urlForEpisode(episode)!;
        const exe = this.ytdlPath;
        const args = [...this.ytdlArgs, url];
        // Convert 'XXXXXXX|SX|EY' into 'S0XE0Y'
        const prefix = episode.identifier.replace(/([\w\d]+)\|S(\d+)\|E(\d+)/, 'S$2E$3');
        
        // Add output directory if specified
        if (episode.preferredDownloadPath) {
            args.push('-o');
            args.push(`${episode.preferredDownloadPath}/${prefix} %(title)s.%(ext)s`);
            args.push('--download-archive');
            args.push(`${episode.preferredDownloadPath}/${episode.archive!}`);
        }
        
        return new Promise((resolve, reject) => {
            new YoutubeDlWrap(exe).exec(args)
                .on('progress', progress)
                .on('close', resolve)
                .on('error', reject);
        });
    }
    
    urlForEpisode(episode: Episode|undefined): string | undefined {
        if (!episode || !episode.seriesSlugTitle) return undefined;
        return `https://www.crunchyroll.com/watch/${episode.id}/${episode.slugTitle}`;
    }
}

//
//  client.ts
//  fink
//  
//  Created by Tanner Bennett on 2021-07-14
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import { APIError, BaseSeason, Episode, Season, Show } from './model';
import fetch from 'node-fetch';
import * as qs from 'querystring';
import YoutubeDlWrap, { Progress } from 'youtube-dl-wrap';

enum Endpoint {
    search = "/v1/shows/search",
    listShows = "",
    listSeasons = "/v2/shows/", // Takes show slug
    listEpisodes = "/v1/seasons/", // Takes season ID
}

export class FAClient {
    static shared = new FAClient();
    
    email: string | undefined = undefined;
    password: string | undefined = undefined;
    
    baseURL = "https://title-api.prd.funimationsvc.com";
    defaultParams = {
        region: 'US',
        deviceType: 'web',
        locale: 'en'
    };
    
    get ytdlArgs(): string[] {
        // Check if we have login args or not
        let loginArgs: string[] = [];
        if (this.email && this.email.length && this.password && this.password.length) {
            loginArgs = ['-u', this.email, '-p', this.password];
        }
        
        return [...loginArgs,
            '--cookies', '~/Desktop/funimation_cookies.txt',
            '--extractor-args', 'funimation:language=english',
            '--cookies-from-browser', 'chrome',
            '--no-check-certificate',
        ];
    }
    
    get<T>(endpoint: string, urlParams: qs.ParsedUrlQueryInput = {}, key?: string): Promise<T> {
        const params = { ...urlParams, ...this.defaultParams };
        const paramString = qs.stringify(params);
        
        return fetch(this.baseURL + `${endpoint}?${paramString}`, {
            method: 'GET',
        })
        .then(async response => {
            if (response.status >= 400) {
                const json: APIError = await response.json();
                const code = response.status.toString();
                const reason = json.status_message ?? 'reason';
                throw new Error(`${code}: ${reason}`);
            }
            
            const json = await response.json();
            if (key) {
                return json[key];
            }
            
            return json;
        });
    }
    
    searchShows(query: string): Promise<Show[]> {
        return this.get(Endpoint.search, { searchTerms: qs.escape(query) }, 'list');
    }
    
    listSeasons(show: Show): Promise<BaseSeason[]> {
        return this.get(Endpoint.listSeasons + show.slug, {}, 'seasons');
    }
    
    async listEpisodes(season: BaseSeason): Promise<Episode[]> {
        const episodes: Episode[] = await this.get(Endpoint.listEpisodes + season.id, {}, 'episodes');
        // // Add show slug
        // episodes.forEach(e => {
        //     e.showSlug = season.show.slug;
        // });
        
        return episodes;
    }
    
    downloadEpisode(episode: Episode, progress: (progress: Progress) => void): Promise<void> {
        const url = `https://www.funimation.com/en/shows/${episode.showSlug}/${episode.slug}`
        const args = [...this.ytdlArgs, url];
        
        return new Promise((resolve, reject) => {
            new YoutubeDlWrap('/usr/local/bin/yt-dlp').exec(args)
                .on('progress', progress)
                .on('close', resolve)
                .on('error', reject);
        });
    }
}

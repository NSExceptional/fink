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

enum Endpoint {
    search = "/v1/shows/search",
    listShows = "",
    listSeasons = "/v2/shows/", // Takes show slug
    listEpisodes = "/v1/seasons/", // Takes season ID
}

export class FAClient {
    static shared = new FAClient();
    
    baseURL = "https://title-api.prd.funimationsvc.com";
    defaultParams = {
        region: 'US',
        deviceType: 'web',
        locale: 'en'
    };
    
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
    
    listEpisodes(season: BaseSeason): Promise<Episode[]> {
        return this.get(Endpoint.listEpisodes + season.id, {}, 'episodes');
    }
}

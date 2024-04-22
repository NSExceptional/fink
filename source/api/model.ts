//
//  model.ts
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-16
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import { Progress } from 'youtube-dl-wrap';

export interface APIError {
    message?: string;
}

export interface APIResponse<T> {
    data: [T];
    meta: {};
    total: number;
}

export interface APIAuthResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    tokenType: string;
}

interface SearchResultGroup<T> {
    count: number;
    items: T[];
    type: "series" | "episode" | "music" | "top_results" | "movie_listing";
}

export interface ShowSearchResponse {
    [key: number]: SearchResultGroup<Show>;
}

interface Thing {
    id: string;
    identifier: string;
    title: string;
}

interface Slugged extends Thing {
    slugTitle: string;
}

interface Language extends Thing {
    languageCode: string;
}

interface EpisodeVersion {
    audioLocale: string;
    guid: string;
    original: boolean;
    seasonGuid: string;
}

export interface BaseShow extends Slugged {
    description: string;
    seriesMetadata: {
        audioLocales: string[];
        subtitleLocales: string[];
        tenantCategories: string[];
        episodeCount: number;
        seasonCount: number;
        seriesLaunchYear: number;
        isSubbed: boolean;
        isDubbed: boolean;
        isMature: boolean;
        isSimulcast: boolean;
    }
    // audioLocale: Language;
    // audioLocales: Language[];
    // subtitleLocales: Language[];
}

export interface Show extends BaseShow {
    episodeCount: number;
    seasonCount: number;
    seriesLaunchYear: number;
}

export interface BaseSeason extends Slugged {
    numberOfEpisodes: number;
    order: number;
    seasonNumber: number;
}

/** Custom subtype, adds reference to show */
export interface Season extends BaseSeason {
    series: Slugged;
    fsSafeTitle?: string;
}

export interface Episode extends Slugged {
    seasonId: string;
    seasonSlugTitle: string;
    seasonTitle: string;
    
    seriesId: string;
    seriesSlugTitle: string;
    seriesTitle: string;
    
    /** Usually the ordinal of the episode within the series, not the season */
    sequenceNumber: number;
    streamsLink: string;
    uploadDate: string;
    
    audioLocale: string;
    versions: EpisodeVersion[];
    
    // My additions
    seasonNumber?: number;
    fsSafeTitle?: string;
    fsSafeSeasonTitle?: string;
    fsSafeSeriesTitle?: string;
    videoURL?: string
    ytdlFilename?: string;
    downloading?: boolean;
    progress?: Progress;
    error?: string;
    
    /** i.e. S01E24 */
    seasonEpisodeID?: string;
    
    // DownloadManager metadata //
    
    /** A (relative) folder to download the episode into */
    preferredDownloadPath?: string;
    /** The `--download-archive` filename associated with this episode */
    archive?: string;
}

export interface SelectOption {
    label: string;
    value: string;
}

/** Utility class for converting model objects to SelectOptions */ 
export class Select {
    static shows(shows: Show[]): SelectOption[] {
        return shows.map(s => {
            return { label: s.title, value: s.slugTitle }
        });
    }
    
    static seasons(seasons: Season[]): SelectOption[] {
        const shouldKeepSeasonNames = !seasons.some(s => s.title.includes("Season")) && seasons.length > 1;
        return seasons.map(s => {
            let title = shouldKeepSeasonNames ? s.title : s.title
                .replace(s.series.title, '')
                .trim();
            if (!shouldKeepSeasonNames && title.length == 0) {
                title = 'Season ' + s.seasonNumber;
            }
            return { label: title, value: s.id.toString() }
        });
    }
    
    static episodes(eps: Episode[]): SelectOption[] {
        return eps.map(s => {
            // Show a * in front of queued episodes
            const name = s.downloading ? '*' + s.title : s.title;
            return { label: name, value: s.slugTitle }
        });
    }
}

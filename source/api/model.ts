//
//  model.ts
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-16
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import { Progress } from 'youtube-dl-wrap';

export interface APIError {
    status_message?: string;
}

interface Quality {
    quality: string;
    height: number;
}

interface Thing {
    id: number;
    name: string;
}

interface Slugged extends Thing {
    slug: string;
}

interface Media extends Slugged {
    type: 'tv' | 'season' | 'episode';
}

interface Language extends Thing {
    languageCode: string;
}

interface Genre extends Slugged {
    description: string;
}

export interface Show extends Media {
    seasons: BaseSeason[];
    qualities: Quality[];
    episodeCount: number;
    moviesCount: number;
    specialsCount: number;
    ovaCount: number;
    
    yearOfProduction: number;
    tagline: string;
    shortSynopsis: string;
    longSynopsis: string;
    spokenLanguages: Language[];
    subtitleLanguages: Language[];
    genres: Genre[];
}

export interface BaseSeason extends Media {
    episodeCount: number;
    order: number;
    number: number;
}

export interface Season extends BaseSeason {
    show: Slugged;
    episodes: Episode[];
}

export interface Episode extends Media {
    showId: number;
    episodeNumber: string;
    duration: number; // Seconds
    durationInMinutes: number;
    versions: string[]; // ie simulcast
    releaseDate: number; // epoch
    sequence: number;
    synopsis: string;
    mature: boolean;
    qualities: Quality[];
    downloadable: boolean;
    shortCode: string;
    isSubRequired: boolean;
    // videoList: any[];
    
    // My additions
    showSlug: string;
    downloading?: boolean;
    progress?: Progress;
    error?: string;
}

export interface SelectOption {
    label: string;
    value: string;
}

/** Utility class for converting model objects to SelectOptions */ 
export class Select {
    static shows(shows: Show[]): SelectOption[] {
        return shows.map(s => {
            return { label: s.name, value: s.slug }
        });
    }
    
    static seasons(seasons: BaseSeason[]): SelectOption[] {
        return seasons.map(s => {
            return { label: s.name, value: s.id.toString() }
        });
    }
    
    static episodes(eps: Episode[]): SelectOption[] {
        return eps.map(s => {
            // Show a * in front of queued episodes
            const name = s.downloading ? '*' + s.name : s.name;
            return { label: name, value: s.slug }
        });
    }
}

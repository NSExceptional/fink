//
//  season.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { ReactNode, useContext, useState } from 'react';
import { Page } from './page';
import { Text, useInput } from 'ink';
import { Episode, Select, SelectOption } from './api/model';
import SelectInput from 'ink-select-input';
import { CRClient } from './api/client';
import { AppContext } from './app';
import { DownloadManager } from './dl-manager';
import clipboard from 'clipboardy';
import * as fs from 'fs';

export function SeasonPage(props: React.PropsWithChildren<{}>) {
    const context = useContext(AppContext);
    const [selectedEpisode, setSelectedEpisode] = useState<Episode|undefined>(undefined);
    const [episodes, setEpisodes] = useState<Episode[]|undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    const showName = context.state.show!.title;
    const seasonName = context.state.season!.title;
    const numEpisodes = episodes?.length ?? 0;
    
    const title = `${showName} / ${seasonName} / ${numEpisodes} episode(s)`;
    
    function episodeFor(item: SelectOption): Episode | undefined {
        if (item.value == '*') return undefined;
        return episodes?.filter(e => e.slugTitle == item.value)[0];
    }
    
    function downloadAll() {
        if (!episodes) return;
        context.downloadAll(episodes);
    }
    
    // Download all episodes when user presses some key
    // useInput((input, key) => {
    //     if (input == 'a') {
    //         downloadAll();
    //     }
    // });
    
    // Keyboard shortcuts
    useInput((input, key) => {
        // Copy URL to clipboard
        if (input == 'l' && selectedEpisode) {
            clipboard.writeSync(selectedEpisode.videoURL!);
        }
        // Update filename for selected episode
        // if already downloaded with partially correct name
        else if (input == 'u') {
            // Rename selected episode, or all episodes if none selected
            const toRename = selectedEpisode ? [selectedEpisode] : (episodes ?? []);
            const count = DownloadManager.shared.updateFilenameFor(toRename);
            const label = selectedEpisode ? selectedEpisode.title : `${count} episode(s)`;
            if (count > 0) {
                context.set.status([`Updated filename for '${label}'`]);
            }
            else {
                context.set.status([`No files renamed`]);
            }
        }
    });
    
    function content(): ReactNode {
        // While loading episodes...
        if (loading) {
            return <Text>Loading...</Text>;
        }
        
        // Episodes did not load
        if (!episodes) {
            return <Text>Error loading episodes</Text>
        }
        
        // Check if any episodes are already downloading
        for (const e of episodes) {
            e.downloading = DownloadManager.shared.episodeIsDownloading(e);
        }
        
        // Add button to download all episodes
        const allItem = { label: 'Download All', value: '*' };
        const selectItems = [allItem].concat(Select.episodes(episodes));
        
        return <SelectInput limit={10} items={selectItems} onSelect={(item) => {
            // Did we select the 'All' item?
            if (item.value == '*') {
                downloadAll();
            } else {
                // Enqueue a new download
                const choice = episodeFor(item);
                if (choice && !choice.downloading) {
                    context.addDownload(choice);
                }
            }
        }}
        onHighlight={(item) => {
            setSelectedEpisode(episodeFor(item));
        }} />;
    }
    
    // Load episodes on first presentation
    if (!episodes && !loading) {
        setLoading(true);
        CRClient.shared.listEpisodes(context.state.season!)
            .then(setEpisodes)
            .then(() => setLoading(false));
    }
    
    return <Page title={title}>
        {content()}
    </Page>;
}

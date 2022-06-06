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
import { Episode, Select } from './api/model';
import SelectInput from 'ink-select-input';
import { FAClient } from './api/client';
import { AppContext } from './app';
import { DownloadManager } from './dl-manager';

export function SeasonPage(props: React.PropsWithChildren<{}>) {
    const context = useContext(AppContext);
    const [episodes, setEpisodes] = useState<Episode[]|undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    const showName = context.state.show!.name;
    const seasonName = context.state.season!.name;
    const numEpisodes = episodes?.length ?? 0;
    
    const title = `${showName} / ${seasonName} / ${numEpisodes} episode(s)`;
    
    function downloadAll() {
        if (!episodes) return;
        
        for (const e of episodes) {
            // Pull show's slug from context
            e.showSlug = context.state.show!.slug;
        }
        
        context.downloadAll(episodes);
    }
    
    // Download all episodes when user presses some key
    // useInput((input, key) => {
    //     if (input == 'a') {
    //         downloadAll();
    //     }
    // });
    
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
                const choice = episodes.filter(e => e.slug == item.value)[0];
                if (choice && !choice.downloading) {
                    // Pull show's slug from context
                    choice.showSlug = context.state.show!.slug;
                    context.addDownload(choice);
                }
            }
        }} />;
    }
    
    // Load episodes on first presentation
    if (!episodes && !loading) {
        setLoading(true);
        FAClient.shared.listEpisodes(context.state.season!)
            .then(setEpisodes)
            .then(() => setLoading(false));
    }
    
    return <Page title={title}>
        {content()}
    </Page>;
}

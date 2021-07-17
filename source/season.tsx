//
//  season.tsx
//  fink
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { ReactNode, useContext, useState } from 'react';
import { Page } from './page';
import { Text } from 'ink';
import { Episode, Select } from './api/model';
import SelectInput from 'ink-select-input';
import { FAClient } from './api/client';
import { AppContext } from './app';

export function SeasonPage(props: any) {
    const context = useContext(AppContext);
    const [episodes, setEpisodes] = useState<Episode[]|undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    const title = context.state.season!.name;
    
    function content(): ReactNode {
        // While loading episodes...
        if (loading) {
            return <Text>Loading...</Text>;
        }
        
        // Episodes did not load
        if (!episodes) {
            return <Text>Error loading episodes</Text>
        }
        
        return <SelectInput limit={10} items={Select.episodes(episodes)} onSelect={(item) => {
            const choice = episodes.filter(e => e.slug == item.value)[0];
            // context.set.episode(choice!);
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

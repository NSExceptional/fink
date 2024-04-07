//
//  show.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { ReactNode, useContext, useState } from 'react';
import { Page } from './page';
import { Episode, Season, Select, Show } from './api/model';
import { Text } from 'ink';
import SelectInput from 'ink-select-input';
import { AppContext } from './app';
import { CRClient } from './api/client.js';
import { DownloadManager } from './dl-manager.js';

export function ShowPage(props: React.PropsWithChildren<{}>) {
    const context = useContext(AppContext);
    const show: Show = context.state.show!;
    const [seasons, setSeasons] = useState<Season[]|undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    function content(): ReactNode {
        // While loading seasons...
        if (loading) {
            return <Text>Loading...</Text>;
        }
        
        // Seasons did not load
        if (!seasons) {
            return <Text>Error loading seasons</Text>
        }
        
        const selectItems = Select.seasons(seasons);
        return <SelectInput limit={10} items={Select.seasons(seasons)} onSelect={(item) => {
            const choice = seasons.filter(s => s.id.toString() == item.value)[0];
            const season = choice! as Season;
            context.set.season(season);
        }}/>
    }
    
    // Load seasons on first presentation
    if (!seasons && !loading) {
        setLoading(true);
        CRClient.shared.listSeasons(show!)
            .then(setSeasons)
            .then(() => setLoading(false));
    }
    
    return <Page title={show.title}>
        {content()}
    </Page>;
}

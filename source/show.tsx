//
//  show.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { ReactNode, useContext, useState } from 'react';
import { Page } from './page';
import { Episode, Season, Select, SelectOption, Show } from './api/model';
import { Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { AppContext } from './app';
import { CRClient } from './api/client.js';

export function ShowPage(props: React.PropsWithChildren<{}>) {
    const context = useContext(AppContext);
    const show: Show = context.state.show!;
    const [seasonIndex, setSeasonIndex] = [context.state.seasonIndex ?? 0, context.set.index.season];
    const [selectedSeason, setSelectedSeason] = [context.state.season, context.set.season];
    const [seasons, setSeasons] = [context.state.showSeasons, context.set.showSeasons];
    const [loading, setLoading] = useState(false);
    
    // Keyboard shortcuts
    useInput((input, key) => {
        // Debugging
        if (input == 'i') {
            const season = selectedSeason;
            console.log(season);
        }
    });
    
    function seasonFor(item: SelectOption): Season | undefined {
        return seasons?.filter(s => s.id == item.value)[0];
    }
    
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
        return <SelectInput limit={10} items={selectItems} initialIndex={seasonIndex} onSelect={(item) => {
            const choice = seasonFor(item)!;
            setSelectedSeason(choice);
        }}
        onHighlight={(item) => {
            setSeasonIndex(selectItems.indexOf(item));
        }}/>
    }
    
    // Load seasons on first presentation
    if (!seasons && !loading) {
        setLoading(true);
        CRClient.shared.listSeasons(show!)
            .then((seasons) => {
                setSeasons(seasons);
                setSelectedSeason(seasons[0]);
                setLoading(false);
            });
    }
    
    return <Page title={show.title}>
        {content()}
    </Page>;
}

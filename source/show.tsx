//
//  show.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { useContext } from 'react';
import { Page } from './page';
import { Season, Select, Show } from './api/model';
import SelectInput from 'ink-select-input';
import { AppContext } from './app';

export function ShowPage(props: React.PropsWithChildren<{}>) {
    const context = useContext(AppContext);
    const show = context.state.show!;
    
    return <Page title={show.name}>
        <SelectInput limit={10} items={Select.seasons(show.seasons)} onSelect={(item) => {
            const choice = show.seasons.filter(s => s.id.toString() == item.value)[0];
            const season = choice! as Season;
            season.show = show;
            
            context.set.season(season);
        }}/>
    </Page>;
}

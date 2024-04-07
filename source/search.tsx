//
//  search.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { useContext, useState } from 'react';
import { Page, Space } from './page';
import { UncontrolledTextInput } from 'ink-text-input';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { Select, Show } from './api/model';
import { FAClient } from './api/client';
import { AppContext } from './app';

interface ResultsTableProps {
    items: Show[];
    loading: boolean;
}

function Results(props: ResultsTableProps) {
    const context = useContext(AppContext);

    if (props.items.length) {
        return <SelectInput limit={10} items={Select.shows(props.items)} onSelect={ (item) => {
            const choice = props.items.filter(s => s.slugTitle == item.value)[0];
            context.set.show(choice!);
        }}/>;
    }
    
    if (props.loading) {
        return <Text>Loading...</Text>;
    }
    
    if (!context.state.query?.length) {
        return <></>;
    }
    
    return <Text>No results</Text>;
}

interface SearchProps {
    query?: string;
}

export function Search(props: React.PropsWithChildren<SearchProps>) {
    const context = useContext(AppContext);
    const query = context.state.query ?? '';
    const [results, setResults] = useState<Show[] | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    // If we searched, and there are no results, and we're NOT loading them...
    if (query.length && results == undefined && !loading) {
        setLoading(true);
        FAClient.shared.searchShows(query)
            .then(setResults)
            .catch(error => {
                console.error(error);
                setResults([]);
                setLoading(false);
            })
            .finally(() => {
                setLoading(false);
            });
    }
    
    const searchHandler = (query: string) => {
        context.set.query(query);
        setResults(undefined); // Triggers load of new results
    };

    return <Page title='Search the Catalog'>
        <Box>
            <UncontrolledTextInput
                placeholder='my hero academia'
                onSubmit={searchHandler}
                initialValue={context.state.query ?? ''} 
                // 1. onChange doesn't exist here
                // 2. Setting query would break my search logic above
                // onChange={context.set.query}
            />
        </Box>
        <Space />
        <Results items={results ?? []} loading={loading} />
    </Page>;
}

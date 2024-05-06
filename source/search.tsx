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
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { Select, Show } from './api/model';
import { CRClient } from './api/client';
import { AppContext } from './app';

interface ResultsTableProps {
    items: Show[];
    loading: boolean;
    focused?: boolean;
}

function Results(props: ResultsTableProps) {
    const context = useContext(AppContext);
    const [resultsIndex, setResultsIndex] = [context.state.resultsIndex ?? 0, context.set.index.results];
    
    if (props.items.length) {
        return (
            <SelectInput
                limit={10}
                items={Select.shows(props.items)}
                isFocused={props.focused}
                initialIndex={resultsIndex}
                onSelect={(item) => {
                    const choice = props.items.filter((s) => s.slugTitle == item.value)[0]!;
                    setResultsIndex(props.items.indexOf(choice));
                    context.set.show(choice);
                }}
            />
        );
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
    resultsFocused?: boolean;
}

export function Search(props: React.PropsWithChildren<SearchProps>) {
    const context = useContext(AppContext);
    const query = context.state.query ?? '';
    const [resultsFocused, focusResults] = useState(false);
    const [results, _setResults] = [context.state.searchResults, context.set.searchResults];
    const [loading, setLoading] = useState(false);
    
    const setResults = (results: Show[] | undefined) => {
        _setResults(results);
        focusResults((results?.length ?? 0) > 0);
    };
    
    // If we searched, and there are no results, and we're NOT loading them...
    if (query.length && results == undefined && !loading) {
        setLoading(true);
        CRClient.shared.searchShows(query)
            .then(setResults)
            .catch(error => {
                context.set.status(['Error searching:', error.message]);
                setResults([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }
    
    // Tab key navigation
    useInput((input, key) => {
        // Debugging
        if (input == 'i' && resultsFocused) {
            const appContext = context;
            console.log(appContext);
        }
        
        if (query.length && results?.length && !loading) {    
            // Tab key toggles focus between results and search input
            if (key.tab) {
                focusResults(!resultsFocused);
            }
        }
    });
    
    const searchHandler = (query: string) => {
        context.set.query(query);
    };

    return <Page title='Search the Catalog'>
        <Box>
            <UncontrolledTextInput
                focus={!resultsFocused}
                placeholder='my hero academia'
                onSubmit={searchHandler}
                initialValue={context.state.query ?? ''}
                // 1. onChange doesn't exist here
                // 2. Setting query would break my search logic above
                // onChange={context.set.query}
            />
        </Box>
        <Space />
        <Results items={results ?? []} loading={loading} focused={resultsFocused} />
    </Page>;
}

//
//  app.tsx
//  fundl
//  
//  Created by Tanner Bennett on 1985-10-26
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { useState } from 'react';
import { useInput } from 'ink';
import { Search } from './search';
import { Episode, Season, Show } from './api/model';
import { ShowPage } from './show';
import { SeasonPage } from './season';
import { Setter, VoidSetter } from './api/types';
import { DownloadManager } from './dl-manager';
import { CWDChanger } from './cd.js';

interface AppState {
    /** A message to be shown at the bottom of every page */
    status?: string[];
    /** The current search string */
    query?: string;
    /** The search results */
    searchResults?: Show[];
    /** The currently selected show */
    show?: Show;
    /** The seasons of the currently selected show */
    showSeasons?: Season[];
    /** The currently selected season */
    season?: Season;
    
    /** The last-selected index in the search results */
    resultsIndex?: number;
    /** The last-selected index in the seasons list for the selected show */
    seasonIndex?: number;
    
    /** Whether we are changing the working directory */
    cd: boolean;
    /** Current working directory, derived from DownloadManager */
    cwd: string;
}

interface IAppContext {
    state: AppState;
    addDownload: Setter<Episode>;
    downloadAll: Setter<Episode[]>;
    set: {
        status: Setter<string[]>,
        cd: Setter<boolean>;
        query: Setter<string>;
        searchResults: Setter<Show[] | undefined>;
        show: Setter<Show | undefined>;
        showSeasons: Setter<Season[] | undefined>;
        season: Setter<Season | undefined>;
        index: {
            results: Setter<number>;
            season: Setter<number>;
        }
    }
}

const EmptyAppState: AppState = { status: ['No downloads'], cd: false, cwd: '' };

export const AppContext = React.createContext<IAppContext>({
    state: EmptyAppState,
    addDownload: VoidSetter,
    downloadAll: VoidSetter,
    set: {
        status: VoidSetter,
        cd: VoidSetter,
        query: VoidSetter,
        searchResults: VoidSetter,
        show: VoidSetter,
        showSeasons: VoidSetter,
        season: VoidSetter,
        index: {
            results: VoidSetter,
            season: VoidSetter,
        },
    }
});

function App() {
    const dlmanager = DownloadManager.shared;
    const [state, _setState] = useState<AppState>(EmptyAppState);
    const setState = (newState: Partial<AppState>) => {
        _setState({ ...state, ...newState });
    }
    
    // Setup app context
    const context: IAppContext = {
        state: state,
        addDownload: (episode) => {
            dlmanager.addDownload(episode);
        },
        downloadAll: (episodes) => {
            dlmanager.downloadAll(episodes);
        },
        set: {
            status: (status) => {
                setState({ status });
            },
            cd: (flag) => {
                setState({ cd: flag })
            },
            query: (query) => {
                setState({ query, searchResults: undefined })
            },
            searchResults: (searchResults) => {
                setState({ searchResults })
            },
            show: (show) => {
                setState({ show })
            },
            showSeasons: (showSeasons) => {
                setState({ showSeasons })
            },
            season: (season) => {
                setState({ season })
            },
            index: {
                results: (resultsIndex) => {
                    setState({ resultsIndex })
                },
                season: (seasonIndex) => {
                    setState({ seasonIndex })
                }
            }
        }
    };
    
    // Update state-setters
    dlmanager.addDownloadCallback = (status) => {
        setState({ status: status });
    };
    dlmanager.downloadAllCallback = (status) => {
        setState({ status: status });
    };
    dlmanager.changeDirectoryCallback = (dir) => {
        setState({ cwd: dir });
    }
    
    // Return the page appropriate for the current state
    function getPage(): JSX.Element {
        if (state.cd) {
            return <CWDChanger />;
        }
        if (state.show) {
            if (state.season) {
                return <SeasonPage />;
            }

            return <ShowPage />;
        }

        return <Search query={state.query} />;
    }
    
    // Handle escape key press
    function goBack() {
        if (state.cd) {
            setState({ cd: false });
        }
        else if (state.show) {
            if (state.season) {
                setState({ season: undefined, seasonIndex: undefined });
            } else {
                setState({ show: undefined, showSeasons: undefined });
            }
        }
    }
    
    // Go back when user presses esc
    useInput((input, key) => {
        if (key.escape) {
            return goBack();
        }
        
        if (key.ctrl) {
            // Go up a directory
            if (input == 'u') {
                return dlmanager.changeDirectory('..');
            }
            // Change directory
            if (input == 'd') {
                return setState({ cd: true });
            }
        }
    });
    
    return <AppContext.Provider value={context}>
        {getPage()}
    </AppContext.Provider>;
}

export default App;

//
//  app.tsx
//  fink
//  
//  Created by Tanner Bennett on 1985-10-26
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { useState } from 'react';
import { useInput, Text } from 'ink';
import { Search } from './search';
import { BaseSeason, Episode, Show } from './api/model';
import { ShowPage } from './show';
import { SeasonPage } from './season';
import { Setter, VoidSetter } from './api/types';
import { DownloadManager } from './dl-manager';

interface AppState {
    /** A message to be shown at the bottom of every page */
    status?: string;
    /** The current search string */
    query?: string;
    /** The currently selected show */
    show?: Show;
    /** The currently selected season */
    season?: BaseSeason;
}

interface IAppContext {
    state: AppState;
    addDownload: Setter<Episode>;
    downloadAll: Setter<Episode[]>;
    set: {
        query: Setter<string>;
        show: Setter<Show>;
        season: Setter<BaseSeason>;
    }
}

export const AppContext = React.createContext<IAppContext>({
    state: { },
    addDownload: VoidSetter,
    downloadAll: VoidSetter,
    set: { query: VoidSetter, show: VoidSetter, season: VoidSetter }
});

function App() {
    const [state, _setState] = useState<AppState>({ status: 'No downloads' });
    const setState = (newState: Partial<AppState>) => {
        _setState({ ...state, ...newState });
    }
    
    // Setup app context
    const context: IAppContext = {
        state: state,
        addDownload: (episode) => {
            DownloadManager.shared.addDownload(episode, (status) => {
                setState({ status: status });
            });
        },
        downloadAll: (episodes) => {
            DownloadManager.shared.downloadAll(episodes, (status) => {
                setState({ status: status });
            });
        },
        set: {
            query: (string) => {
                setState({ query: string })
            },
            show: (show) => {
                setState({ show: show })
            },
            season: (season) => {
                setState({ season: season })
            }
        }
    };
    
    // Return the page appropriate for the current state
    function getPage(): JSX.Element {
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
        if (state.show) {
            if (state.season) {
                setState({ season: undefined });
            } else {
                setState({ show: undefined });
            }
        }
    }
    
    // Go back when user presses esc
    useInput((input, key) => {
        if (key.escape) {
            goBack();
        }
    });
    
    return <AppContext.Provider value={context}>
        {getPage()}
    </AppContext.Provider>;
}

export default App;

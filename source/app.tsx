//
//  app.tsx
//  fink
//  
//  Created by Tanner Bennett on 1985-10-26
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { useState } from 'react';
import { useInput } from 'ink';
import { Search } from './search';
import { BaseSeason, Show } from './api/model';
import { ShowPage } from './show';
import { SeasonPage } from './season';
import { Setter, VoidSetter } from './api/types';

interface AppState {
    /** The current search string */
    query?: string;
    /** The currently selected show */
    show?: Show;
    /** The currently selected season */
    season?: BaseSeason;
}

interface IAppContext {
    state: AppState;
    set: {
        query: Setter<string>;
        show: Setter<Show>;
        season: Setter<BaseSeason>;
    }
}

export const AppContext = React.createContext<IAppContext>({
    state: {},
    set: { query: VoidSetter, show: VoidSetter, season: VoidSetter }
});

function App() {
    const [state, _setState] = useState<AppState>({});
    const setState = (newState: Partial<AppState>) => {
        _setState({ ...state, ...newState });
    }
    
    // Setup app context
    const context: IAppContext = {
        state: state,
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

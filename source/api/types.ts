//
//  types.ts
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

export type Setter<T> = (state: T) => void;
export const VoidSetter: Setter<unknown> = (state: unknown) => { };
